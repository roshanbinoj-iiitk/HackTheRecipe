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

load_dotenv()  # Load environment variables from .env

router = APIRouter(prefix="/api/chat", tags=["Chat"])

class ChatRequest(BaseModel):
    message: str

class IngredientMatch(BaseModel):
    ingredient: str
    matches: list  # List of dicts with product_id and productName

class ChatResponse(BaseModel):
    ingredients: list[IngredientMatch]

def get_all_products():
    products = []
    csv_path = Path(__file__).parent.parent / "attached_assets" / "bigbasket_products.csv"
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
    """Simple tokenization without external libraries"""
    # Remove punctuation and split
    text = re.sub(r'[^\w\s]', ' ', text.lower())
    return [word for word in text.split() if len(word) > 2]

def get_ingredient_synonyms():
    """Common ingredient synonyms and variations"""
    return {
        'chicken': ['chicken', 'poultry', 'hen', 'broiler'],
        'onion': ['onion', 'pyaz', 'kanda'],
        'tomato': ['tomato', 'tamatar'],
        'potato': ['potato', 'aloo', 'batata'],
        'rice': ['rice', 'chawal', 'basmati', 'jasmine'],
        'oil': ['oil', 'tel', 'cooking oil'],
        'salt': ['salt', 'namak', 'sea salt', 'rock salt'],
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
        'pepper': ['pepper', 'kali mirch', 'black pepper']
    }

def calculate_text_similarity(text1, text2):
    """Calculate similarity between two texts using token overlap"""
    tokens1 = set(simple_tokenize(text1))
    tokens2 = set(simple_tokenize(text2))
    
    if not tokens1 or not tokens2:
        return 0
    
    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    
    # Jaccard similarity
    return len(intersection) / len(union) if union else 0

def smart_ingredient_matching(ingredient, products):
    """Improved ingredient matching with better logic"""
    norm_ingredient = ingredient.strip().lower()
    synonyms = get_ingredient_synonyms()
    
    # Get all possible variations of the ingredient
    ingredient_variations = synonyms.get(norm_ingredient, [norm_ingredient])
    ingredient_variations.append(norm_ingredient)
    
    # Categories that usually contain raw ingredients
    preferred_categories = [
        'fruits', 'vegetables', 'meat', 'seafood', 'dairy', 'grains', 'spices',
        'oil', 'condiments', 'bakery', 'fresh produce', 'protein', 'staples'
    ]
    
    # Exclude processed/prepared foods
    exclude_keywords = [
        'ready', 'instant', 'mix', 'frozen', 'prepared', 'cooked', 'fried', 'baked',
        'curry', 'masala', 'gravy', 'sauce', 'paste', 'powder', 'seasoning',
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
        
        # Skip processed foods
        full_text = f"{product_name} {brand_name}"
        if any(keyword in full_text for keyword in exclude_keywords):
            continue
        
        score = 0
        matched_variation = None
        
        # Check each ingredient variation
        for variation in ingredient_variations:
            # 1. Exact match (highest priority)
            if variation == product_name or variation == brand_name:
                score = max(score, 100)
                matched_variation = variation
                break
            
            # 2. Exact word boundary match
            variation_pattern = r'\b' + re.escape(variation) + r'\b'
            if re.search(variation_pattern, product_name):
                score = max(score, 85)
                matched_variation = variation
            elif re.search(variation_pattern, brand_name):
                score = max(score, 80)
                matched_variation = variation
            
            # 3. Starts with ingredient
            if product_name.startswith(variation + ' ') or brand_name.startswith(variation + ' '):
                score = max(score, 75)
                matched_variation = variation
            
            # 4. Contains ingredient (but penalize long product names)
            if variation in product_name:
                base_score = 50
                # Penalize if product name is too long (likely processed)
                word_count = len(product_name.split())
                if word_count > 5:
                    base_score -= 20
                score = max(score, base_score)
                matched_variation = variation
            elif variation in brand_name:
                score = max(score, 45)
                matched_variation = variation
        
        if score > 0:
            # 5. Category bonus
            if any(cat in category or cat in sub_category for cat in preferred_categories):
                score += 15
            
            # 6. Text similarity bonus
            similarity = calculate_text_similarity(norm_ingredient, product_name)
            score += similarity * 30
            
            # 7. Preferred keywords bonus
            preferred_keywords = ['fresh', 'raw', 'organic', 'pure', 'natural', 'whole']
            if any(keyword in full_text for keyword in preferred_keywords):
                score += 20
            
            # 8. Simple product name bonus (less likely to be processed)
            if len(product_name.split()) <= 3:
                score += 10
            
            # Only include matches with reasonable scores
            if score >= 30:
                scored_matches.append((product, score, matched_variation))
    
    # Sort by score descending
    scored_matches.sort(key=lambda x: x[1], reverse=True)
    
    # Return top 8 matches
    return [match[0] for match in scored_matches[:8]]

@router.post("", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not set")
    try:
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            google_api_key=api_key,
            temperature=0,
        )
        prompt = (
            f"List the ingredients needed to make {request.message}. "
            "For each item, only include it if it is a real food ingredient. "
            "If something is not a food item, return the string 'not a food item' instead of its name. "
            "Return the result as a list of items enclosed in [ ] and each item in double quotes. "
            "Also most importantly, exclude water as an ingredient. "
            "Use basic ingredient names (e.g., 'chicken' not 'chicken breast', 'onion' not 'red onion'). "
            "Do not return anything else."
        )

        response = llm.invoke(prompt)
        try:
            ingredients = ast.literal_eval(response.content)
        except Exception:
            raise HTTPException(status_code=500, detail="Could not parse ingredients list from Gemini response.")

        all_products = get_all_products()
        ingredient_matches = []
        for ingredient in ingredients:
            if isinstance(ingredient, str) and ingredient.strip().lower() != "not a food item":
                matches = smart_ingredient_matching(ingredient, all_products)
                ingredient_matches.append(IngredientMatch(ingredient=ingredient, matches=matches))
        return ChatResponse(ingredients=ingredient_matches)
    except Exception as e:
        print("LangChain Gemini error:", e)
        raise HTTPException(status_code=500, detail=f"LangChain Gemini error: {e}")