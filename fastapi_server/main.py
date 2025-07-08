# filepath: fastapi_server/main.py
from fastapi import FastAPI, HTTPException, Query
from typing import List
from models import Product, InsertProduct
from storage import storage

app = FastAPI()

@app.get("/api/products", response_model=List[Product])
def get_all_products():
    return storage.get_all_products()

@app.get("/api/products/search", response_model=List[Product])
def search_products(q: str = Query(...)):
    return storage.search_products(q)

@app.get("/api/products/category/{category}", response_model=List[Product])
def get_products_by_category(category: str):
    return storage.get_products_by_category(category)

@app.post("/api/products", response_model=Product)
def create_product(product: InsertProduct):
    return storage.create_product(product)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)