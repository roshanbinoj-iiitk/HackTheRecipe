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
    # Adjusted for new CSV format, no quantity column
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

def fuzzy_match_ingredient(ingredient, products):
    # Normalize ingredient and product names for better matching
    norm_ingredient = ingredient.strip().lower()
    raw_keywords = ["raw", "fresh", "whole", "meat", "fillet", "breast", "leg", "drumstick", "cut", "pieces"]
    exclude_keywords = ["momo", "soup", "curry", "masala", "gravy", "ready", "instant", "mix", "frozen", "nugget", "burger", "patty", "stick", "roll", "tikka", "kebab", "fried", "biryani", "pizza", "sandwich", "pack", "meal", "snack", "chowmein", "chilli", "samosa", "popcorn", "ball", "spring", "dumpling", "momo"]
    matches = []
    for p in products:
        pname = p["productName"].strip().lower()
        brand = p["brand"].strip().lower() if "brand" in p else ""
        # Match ingredient in productName or brand
        if norm_ingredient in pname or norm_ingredient in brand:
            # Exclude prepared/processed foods
            if not any(kw in pname for kw in exclude_keywords):
                # Prefer raw/fresh/meat/fillet etc, or if ingredient is exactly the product name
                if any(kw in pname for kw in raw_keywords) or norm_ingredient == pname or norm_ingredient == brand:
                    matches.append(p)
    return matches

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
                matches = fuzzy_match_ingredient(ingredient, all_products)
                ingredient_matches.append(IngredientMatch(ingredient=ingredient, matches=matches))
        return ChatResponse(ingredients=ingredient_matches)
    except Exception as e:
        print("LangChain Gemini error:", e)
        raise HTTPException(status_code=500, detail=f"LangChain Gemini error: {e}")