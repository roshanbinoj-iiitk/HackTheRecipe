from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
from dotenv import load_dotenv
import sqlite3
from pathlib import Path

from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()  # Load environment variables from .env

router = APIRouter(prefix="/api/chat", tags=["Chat"])

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

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
        # Prompt the LLM to return ingredients for the user's dish
                # Prompt the LLM to return ingredients for the user's dish
        prompt = f"List the ingredients needed to make {request.message}. Just return the list. Don't return anything else just one or two words. Just the keywords into a list of items enclosed in [ ] and each item returned in double quotes."
        response = llm.invoke(prompt)
        ingredients_list = response.content  # Store the output in a Python variable
        print("Ingredients list:", ingredients_list)  # Debugging output
        return ChatResponse(reply=ingredients_list)
    except Exception as e:
        print("LangChain Gemini error:", e)
        raise HTTPException(status_code=500, detail=f"LangChain Gemini error: {e}")