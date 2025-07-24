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
import re
from collections import Counter

load_dotenv()

router = APIRouter(prefix="/api/chat", tags=["Chat"])

class ChatRequest(BaseModel):
    message: str

class IngredientMatch(BaseModel):
    ingredient: str
    matches: list

class ChatResponse(BaseModel):
    ingredients: list[IngredientMatch]

def get_all_products():
    products = []
    csv_path = Path(__file__).parent / "bigbasket_products.csv"
    if not csv_path.exists():
        # Fallback to same folder as chat.py
        csv_path = Path(__file__).parent / "bigbasket_products.csv"
    with open(csv_path, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            products.append({
                "id": row["ProductID"],
                "productName": row["ProductName"],
                "price": row["Price"],
                "discountPrice": row["DiscountPrice"],
                "brand": row["Brand"],
                "imageUrl": row["Image_Url"],
                "category": row["Category"],
                "subCategory": row["SubCategory"],
                "absoluteUrl": row["Absolute_Url"],
            })
    return products

def simple_tokenize(text):
    text = re.sub(r'[^\w\s]', ' ', text.lower())
    return [word for word in text.split() if len(word) > 2]

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
    ingredient_variations = synonyms.get(norm_ingredient, [norm_ingredient]) + [norm_ingredient]

    if norm_ingredient == "food coloring":
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

    exclude_keywords = [
        'ready', 'instant', 'mix', 'frozen', 'prepared', 'cooked', 'fried', 'baked','soap', 'cleaner', 'detergent',
        'curry', 'gravy', 'sauce', 'paste', 'seasoning', 'dip', 'dips',
        'snack', 'chips', 'crackers', 'biscuit', 'cookie', 'cake', 'bread',
        'burger', 'pizza', 'sandwich', 'roll', 'wrap', 'patty', 'nugget',
        'momo', 'dumpling', 'noodles', 'pasta', 'soup', 'biryani',
        'flavour', 'flavored', 'spiced', 'seasoned', 'marinated', 'pickled'
    ]

    scored_matches = []

    for product in products:
        product_name = product["productName"].strip().lower()
        brand_name = product["brand"].strip().lower() if "brand" in product else ""
        category = product["category"].strip().lower() if "category" in product else ""
        sub_category = product["subCategory"].strip().lower() if "subCategory" in product else ""

        full_text = f"{product_name} {brand_name}"
        if not any(variation in product_name for variation in ingredient_variations):
            if any(k in full_text for k in exclude_keywords) or len(product_name.split()) > 6:
                continue

        score = 0
        matched_variation = None

        for variation in ingredient_variations:
            variation_pattern = r'\b' + re.escape(variation) + r'\b'
            if variation == product_name or variation == brand_name:
                score = max(score, 100)
                matched_variation = variation
                break
            if re.search(variation_pattern, product_name):
                score = max(score, 85)
                matched_variation = variation
            elif re.search(variation_pattern, brand_name):
                score = max(score, 80)
                matched_variation = variation
            if product_name.startswith(variation + ' ') or brand_name.startswith(variation + ' '):
                score = max(score, 75)
                matched_variation = variation
            if variation in product_name:
                base_score = 70
                if len(product_name.split()) > 4:
                    base_score -= 10
                score = max(score, base_score)
                matched_variation = variation
            elif variation in brand_name:
                score = max(score, 45)
                matched_variation = variation
            if any(word.startswith(norm_ingredient) for word in product_name.split()):
                score = max(score, 60)
                matched_variation = variation

        if score > 0:
            if any(cat in category or cat in sub_category for cat in preferred_categories):
                score += 15
            similarity = calculate_text_similarity(norm_ingredient, product_name)
            score += similarity * 25
            preferred_keywords = ['fresh', 'raw', 'organic', 'pure', 'natural', 'whole']
            if any(k in full_text for k in preferred_keywords):
                score += 20
            if len(product_name.split()) <= 3:
                score += 10
            if score >= 50:
                scored_matches.append((product, score, matched_variation))

    scored_matches.sort(key=lambda x: x[1], reverse=True)
    return [match[0] for match in scored_matches[:8]] or []

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