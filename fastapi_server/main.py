from fastapi import FastAPI, HTTPException, Query
from typing import List
from models import Product, ProductDB
from storage import storage

app = FastAPI()

@app.get("/api/products", response_model=List[Product])
def get_all_products():
    return [Product.from_orm(p) for p in storage.get_all_products()]

@app.get("/api/products/search", response_model=List[Product])
def search_products(q: str = Query(...)):
    return [Product.from_orm(p) for p in storage.search_products(q)]

@app.get("/api/products/category/{category}", response_model=List[Product])
def get_products_by_category(category: str):
    return [Product.from_orm(p) for p in storage.get_products_by_category(category)]
# @app.post("/api/products", response_model=ProductDB)
# def create_product(product: InsertProduct):
#     return storage.create_product(product)

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)