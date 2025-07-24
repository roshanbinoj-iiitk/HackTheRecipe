from fastapi import FastAPI, HTTPException, Query
from typing import List
from models import Product, ProductDB
from storage import storage
from fastapi.middleware.cors import CORSMiddleware
from chat import router as chat_router
from cart import router as cart_router
from fastapi.responses import FileResponse

app = FastAPI()

# ✅ Updated CORS: allow only the frontend origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","https://hack-the-recipe-61a1pos4n-roshanbinoj-iiitks-projects.vercel.app","https://hack-the-recipe.vercel.app","https://fastest-ruby.vercel.app/"],  # Your frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.get("/")
def root():
    return {"message": "HackTheRecipe API is running"}

@app.get("/favicon.ico")
def favicon():
    # Optionally, serve a favicon file if you have one
    return FileResponse("favicon.ico", media_type="image/x-icon")

app.include_router(chat_router)

app.include_router(cart_router)

@app.get("/api/products", response_model=List[Product])
def get_all_products():
    return [Product.model_validate(p) for p in storage.get_all_products()]

@app.get("/api/products/search", response_model=List[Product])
def search_products(q: str = Query(...)):
    return [Product.model_validate(p) for p in storage.search_products(q)]

@app.get("/api/products/category/{category}", response_model=List[Product])
def get_products_by_category(category: str):
    return [Product.model_validate(p) for p in storage.get_products_by_category(category)]

# @app.post("/api/products", response_model=ProductDB)
# def create_product(product: InsertProduct):
#     return storage.create_product(product)
