from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import sqlite3
from pathlib import Path
from langchain_google_genai import ChatGoogleGenerativeAI
from difflib import get_close_matches
import ast
import csv
from collections import Counter
from preprocess import (
    simple_tokenize,
    normalize_text,
    resolve_ingredient_key,
    get_token_frequency,
    token_rarity,
)

load_dotenv()

router = APIRouter(prefix="/api/chat", tags=["Chat"])

class ChatRequest(BaseModel):
    message: str

class ProductMatch(BaseModel):
    id: str
    productName: str
    price: str
    discountPrice: str
    brand: str
    imageUrl: str
    category: str
    subCategory: str
    absoluteUrl: str

class IngredientMatch(BaseModel):
    ingredient: str
    matches: list[ProductMatch]

class ChatResponse(BaseModel):
    ingredients: list[IngredientMatch]

_PRODUCTS_CACHE = None
_TOKEN_FREQ = None
_MAX_TOKEN_FREQ = 1

def get_all_products():
    global _PRODUCTS_CACHE
    global _TOKEN_FREQ
    global _MAX_TOKEN_FREQ
    if _PRODUCTS_CACHE is not None:
        return _PRODUCTS_CACHE
    products = []
    csv_path = Path(__file__).parent / "bigbasket_products.csv"
    if not csv_path.exists():
        # Fallback to same folder as chat.py
        csv_path = Path(__file__).parent / "bigbasket_products.csv"
    with open(csv_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            product_name = (row.get("ProductName") or "").strip()
            brand_name = (row.get("Brand") or "").strip()
            name_tokens = simple_tokenize(product_name)
            brand_tokens = simple_tokenize(brand_name)
            normalized_name = " ".join(name_tokens)
            products.append({
                "id": row["ProductID"],
                "productName": product_name,
                "price": row["Price"],
                "discountPrice": row["DiscountPrice"],
                "brand": brand_name,
                "imageUrl": row["Image_Url"],
                "category": row["Category"],
                "subCategory": row["SubCategory"],
                "absoluteUrl": row["Absolute_Url"],
                "normalizedName": normalized_name,
                "nameTokens": name_tokens,
                "brandTokens": brand_tokens,
            })
    _PRODUCTS_CACHE = products
    _TOKEN_FREQ, _MAX_TOKEN_FREQ = get_token_frequency(products)
    return products


def get_ingredient_synonyms():
    return {
        'chicken': ['chicken', 'poultry', 'hen', 'broiler', 'fresh boneless chicken breast', 'fresh boneless chicken thigh', 'breast', 'thigh'],
        'onion': ['onion', 'pyaz', 'kanda'],
        'tomato': ['tomato', 'tamatar'],
        'potato': ['potato', 'aloo', 'batata'],
        'rice': ['rice', 'chawal', 'basmati rice', 'jasmine'],
        'oil': ['oil', 'tel', 'cooking oil'],
        'salt': ['salt', 'namak', 'sea salt', 'rock salt', 'iodised'],
        'sugar': ['sugar', 'cheeni', 'shakkar'],
        'milk': ['milk', 'doodh', 'dairy'],
        'butter': ['butter', 'makhan'],
        'flour': ['flour', 'maida', 'atta', 'wheat flour'],
        'paneer': ['paneer', 'cottage cheese'],
        'yogurt': ['yogurt', 'curd', 'dahi'],
        'ginger': ['ginger', 'adrak'],
        'garlic': ['garlic', 'lahsun'],
        'cumin': ['cumin', 'jeera'],
        'turmeric': ['turmeric', 'haldi'],
        'coriander': ['coriander', 'dhania'],
        'pepper': ['pepper', 'kali mirch', 'black pepper'],
        'cilantro': ['cilantro'],
        'chili powder': ['chili powder', 'red chili powder','chilli powder'],
        'garam masala': ['garam masala', 'garam'],
        'fenugreek leaves': ['fenugreek leaves', 'kasuri methi','methi'],
        'food coloring': ['food color', 'colouring', 'coloring', 'artificial colour', 'artificial color', 'edible color', 'edible dye', 'natural color', 'food colour - red', 'food colour - blue', 'food colour - green'],
        'green chili': ['green chili', 'hari mirch', 'green chilli', 'green chilies', 'green chilly'],
        'red chili powder': ['red chili powder', 'red chili', 'lal mirch', 'red chilies', 'red chilly']
    }

def calculate_text_similarity(text1, text2):
    tokens1 = set(simple_tokenize(text1))
    tokens2 = set(simple_tokenize(text2))
    if not tokens1 or not tokens2:
        return 0
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    return len(intersection) / len(union) if union else 0

def smart_ingredient_matching(ingredient, products):
    norm_ingredient = ingredient.strip().lower()
    synonyms = get_ingredient_synonyms()
    canonical_key = resolve_ingredient_key(norm_ingredient, synonyms)
    ingredient_variations = synonyms.get(canonical_key, [canonical_key]) + [norm_ingredient, canonical_key]
    ingredient_variations = list(dict.fromkeys([v for v in ingredient_variations if v]))
    normalized_ingredient = normalize_text(norm_ingredient) or norm_ingredient

    if canonical_key == "food coloring":
        def has_coloring(term):
            term = term.lower()
            bad_phrases = ['no artificial colour', 'no artificial color', 'no added color', 'no added colour',
                           'without artificial colour', 'without artificial color']
            if any(bad in term for bad in bad_phrases):
                return False
            return any(color in term for color in ['food colour', 'food color', 'edible colour', 'edible color'])

        matches = [p for p in products if has_coloring(p["productName"])]
        return matches[:8]

    preferred_categories = [
        'fruits', 'vegetables', 'meat', 'seafood', 'dairy', 'grains', 'spices',
        'oil', 'condiments', 'bakery', 'fresh produce', 'protein', 'staples'
    ]

    ingredient_category_hints = {
        'chicken': ['meat', 'poultry', 'protein'],
        'onion': ['vegetables', 'fresh produce'],
        'tomato': ['vegetables', 'fresh produce'],
        'potato': ['vegetables', 'fresh produce'],
        'rice': ['grains', 'staples'],
        'oil': ['oil', 'staples'],
        'salt': ['spices', 'staples'],
        'sugar': ['staples'],
        'milk': ['dairy'],
        'butter': ['dairy'],
        'flour': ['bakery', 'grains', 'staples'],
        'paneer': ['dairy'],
        'yogurt': ['dairy'],
        'ginger': ['spices', 'vegetables'],
        'garlic': ['spices', 'vegetables'],
        'cumin': ['spices'],
        'turmeric': ['spices'],
        'coriander': ['spices'],
        'pepper': ['spices'],
        'chili powder': ['spices'],
        'garam masala': ['spices'],
        'fenugreek leaves': ['spices'],
        'green chili': ['spices'],
        'red chili powder': ['spices'],
    }

    exclude_keywords = [
        'ready', 'instant', 'mix', 'frozen', 'prepared', 'cooked', 'fried', 'baked','soap', 'cleaner', 'detergent',
        'curry', 'gravy', 'sauce', 'paste', 'seasoning', 'dip', 'dips',
        'snack', 'chips', 'crackers', 'biscuit', 'cookie', 'cake', 'bread',
        'burger', 'pizza', 'sandwich', 'roll', 'wrap', 'patty', 'nugget',
        'momo', 'dumpling', 'noodles', 'pasta', 'soup', 'biryani',
        'flavour', 'flavored', 'spiced', 'seasoned', 'marinated', 'pickled'
    ]

    scored_matches = []
    token_freq = _TOKEN_FREQ or Counter()
    max_freq = _MAX_TOKEN_FREQ or 1

    for product in products:
        product_name = product["productName"].strip().lower()
        brand_name = product["brand"].strip().lower() if "brand" in product else ""
        category = product["category"].strip().lower() if "category" in product else ""
        sub_category = product["subCategory"].strip().lower() if "subCategory" in product else ""
        normalized_name = product.get("normalizedName") or normalize_text(product_name)
        name_tokens = product.get("nameTokens") or simple_tokenize(product_name)
        brand_tokens = product.get("brandTokens") or simple_tokenize(brand_name)
        name_token_set = set(name_tokens)
        brand_token_set = set(brand_tokens)
        normalized_brand = " ".join(brand_tokens)
        normalized_full = f"{normalized_name} {normalized_brand}".strip()

        score = 0
        matched_variation = None

        for variation in ingredient_variations:
            variation_norm = variation.strip().lower()
            variation_tokens = simple_tokenize(variation_norm)
            if not variation_tokens:
                continue
            variation_phrase = " ".join(variation_tokens)

            if variation_norm == product_name or variation_norm == brand_name:
                score = max(score, 100)
                matched_variation = variation_norm
                break

            if variation_phrase and variation_phrase == normalized_name:
                score = max(score, 90)
                matched_variation = variation_norm
            elif variation_phrase and variation_phrase in normalized_name:
                score = max(score, 85)
                matched_variation = variation_norm
            elif variation_phrase and variation_phrase in normalized_brand:
                score = max(score, 75)
                matched_variation = variation_norm

            overlap = set(variation_tokens).intersection(name_token_set)
            if overlap:
                rarity_bonus = sum(token_rarity(t, token_freq, max_freq) for t in overlap) * 15
                score = max(score, 70 + rarity_bonus)
                matched_variation = variation_norm

            overlap_brand = set(variation_tokens).intersection(brand_token_set)
            if overlap_brand:
                rarity_bonus = sum(token_rarity(t, token_freq, max_freq) for t in overlap_brand) * 10
                score = max(score, 50 + rarity_bonus)
                matched_variation = variation_norm

            if len(variation_tokens) == 1 and any(token.startswith(variation_tokens[0]) for token in name_token_set):
                score = max(score, 60)
                matched_variation = variation_norm

        if score > 0:
            if any(cat in category or cat in sub_category for cat in preferred_categories):
                score += 15
            category_hints = ingredient_category_hints.get(canonical_key, [])
            if category_hints:
                if any(h in category or h in sub_category for h in category_hints):
                    score += 15
                elif category or sub_category:
                    score -= 10
            similarity = calculate_text_similarity(normalized_ingredient, normalized_name)
            score += similarity * 25
            preferred_keywords = ['fresh', 'raw', 'organic', 'pure', 'natural', 'whole']
            if any(k in normalized_full for k in preferred_keywords):
                score += 20
            if any(k in normalized_full for k in exclude_keywords):
                score -= 20
            if len(name_tokens) > 6:
                score -= 8
            if len(name_tokens) <= 3:
                score += 10
            if score >= 50:
                scored_matches.append((product, score, matched_variation))

    scored_matches.sort(key=lambda x: x[1], reverse=True)
    if scored_matches:
        return [match[0] for match in scored_matches[:8]]

    normalized_names = {p.get("normalizedName") or normalize_text(p.get("productName", "")) for p in products}
    close_names = get_close_matches(normalized_ingredient, list(normalized_names), n=8, cutoff=0.78)
    if close_names:
        close_set = set(close_names)
        return [p for p in products if (p.get("normalizedName") or normalize_text(p.get("productName", ""))) in close_set][:8]
    return []

def get_db_connection():
    db_path = Path(__file__).parent / "products.db"
    conn = sqlite3.connect(db_path)
    return conn

def create_cache_table():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS ingredient_cache (
            dish_name TEXT PRIMARY KEY,
            ingredients TEXT
        )
    """)
    conn.commit()
    conn.close()

def get_cached_ingredients(dish_name):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT ingredients FROM ingredient_cache WHERE dish_name = ?", (dish_name,))
    row = cursor.fetchone()
    conn.close()
    if row:
        try:
            return ast.literal_eval(row[0])
        except Exception:
            return None
    return None

def set_cached_ingredients(dish_name, ingredients):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT OR REPLACE INTO ingredient_cache (dish_name, ingredients) VALUES (?, ?)",
        (dish_name, str(ingredients))
    )
    conn.commit()
    conn.close()

# Ensure cache table exists at startup
create_cache_table()

@router.post("", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not set")
    try:
        normalized_message = request.message.strip().lower()
        # Check cache first
        ingredients = get_cached_ingredients(normalized_message)
        if ingredients is None:
            llm = ChatGoogleGenerativeAI(
                model="gemini-2.5-flash",
                google_api_key=api_key,
                temperature=0,
            )
            prompt = (
                f"Analyze the following request: '{request.message}'. "
                "If this is asking for ingredients to make a food item, recipe, dish, or any edible item, "
                "then list the ingredients needed as a list of items enclosed in [ ] with each item in double quotes. "
                "For each ingredient, only include it if it is a real food ingredient. "
                "Exclude water as an ingredient and use basic ingredient names (e.g., 'chicken' not 'chicken breast'). "
                "However, if the request is NOT about food, cooking, recipes, or any edible items "
                "(e.g., if it's about objects, places, people, abstract concepts, non-edible items, etc.), "
                "then respond with exactly: 'NON_FOOD_ITEM_DETECTED'. "
                "Do not return anything else in either case."
            )

            response = llm.invoke(prompt)
            response_content = response.content.strip()
            
            # Check if LLM detected a non-food item
            if response_content == "NON_FOOD_ITEM_DETECTED":
                raise HTTPException(status_code=400, detail="Not a food item")
            
            try:
                ingredients = ast.literal_eval(response_content)
            except Exception:
                raise HTTPException(status_code=500, detail="Could not parse ingredients list from Gemini response.")

            # Store in cache
            set_cached_ingredients(normalized_message, ingredients)

        all_products = get_all_products()
        ingredient_matches = []
        for ingredient in ingredients:
            if isinstance(ingredient, str) and ingredient.strip().lower() != "not a food item":
                matches = smart_ingredient_matching(ingredient, all_products)
                ingredient_matches.append(IngredientMatch(ingredient=ingredient, matches=matches))
        return ChatResponse(ingredients=ingredient_matches)
    except HTTPException:
        raise  # Re-raise HTTP exceptions (including our "Not a food item" error)
    except Exception as e:
        print("LangChain Gemini error:", e)
        raise HTTPException(status_code=500, detail=f"LangChain Gemini\u00a0error:\u00a0{e}")