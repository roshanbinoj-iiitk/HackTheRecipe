from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import sqlite3
from pathlib import Path
from langchain_google_genai import ChatGoogleGenerativeAI
from difflib import get_close_matches
import ast

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
    # Adjust DB path and schema as needed
    conn = sqlite3.connect("products.db")
    cursor = conn.cursor()
    cursor.execute("SELECT id, productName FROM products")
    products = cursor.fetchall()
    conn.close()
    return [{"id": pid, "productName": name} for pid, name in products]

def fuzzy_match_ingredient(ingredient, products):
    names = [p["productName"] for p in products]
    matches = get_close_matches(ingredient, names, n=3, cutoff=0.5)
    # Return dicts for matched products
    return [p for p in products if p["productName"] in matches]

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
            "Just return the list. Don't return anything else just one or two words. "
            "Just the keywords into a list of items enclosed in [ ] and each item returned in double quotes."
        )
        response = llm.invoke(prompt)
        try:
            ingredients = ast.literal_eval(response.content)
        except Exception:
            raise HTTPException(status_code=500, detail="Could not parse ingredients list from Gemini response.")

        all_products = get_all_products()
        ingredient_matches = []
        for ingredient in ingredients:
            matches = fuzzy_match_ingredient(ingredient, all_products)
            ingredient_matches.append(IngredientMatch(ingredient=ingredient, matches=matches))

        return ChatResponse(ingredients=ingredient_matches)
    except Exception as e:
        print("LangChain Gemini error:", e)
        raise HTTPException(status_code=500, detail=f"LangChain Gemini error: {e}")