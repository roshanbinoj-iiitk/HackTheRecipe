import os
from fastapi import FastAPI, HTTPException, Query
from typing import List
from models import Product, PaginatedProducts
from storage import storage
from fastapi.middleware.cors import CORSMiddleware
from chat import router as chat_router
from cart import router as cart_router
from fastapi.responses import FileResponse

app = FastAPI()

# ✅ Updated CORS: allow only configured frontend origins
raw_origins = os.getenv("ALLOWED_ORIGINS", "")
allowed_origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

if not allowed_origins:
    allowed_origins = [
        "http://localhost:5173",
        "https://hack-the-recipe.vercel.app",
        "https://hack-the-recipe-61a1pos4n-roshanbinoj-iiitks-projects.vercel.app",
        "https://fastest-ruby.vercel.app",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
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

@app.get("/api/products", response_model=PaginatedProducts)
def get_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    q: str | None = None,
    category: str | None = None,
    sort: str | None = None,
):
    items, total = storage.get_products_page(
        page=page,
        page_size=page_size,
        q=q,
        category=category,
        sort=sort,
    )
    return PaginatedProducts(
        items=[Product.model_validate(p) for p in items],
        page=page,
        pageSize=page_size,
        total=total,
        hasMore=page * page_size < total,
    )

@app.get("/api/products/search", response_model=PaginatedProducts)
def search_products(
    q: str = Query(...),
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    sort: str | None = None,
):
    items, total = storage.get_products_page(
        page=page,
        page_size=page_size,
        q=q,
        sort=sort,
    )
    return PaginatedProducts(
        items=[Product.model_validate(p) for p in items],
        page=page,
        pageSize=page_size,
        total=total,
        hasMore=page * page_size < total,
    )

@app.get("/api/products/category/{category}", response_model=PaginatedProducts)
def get_products_by_category(
    category: str,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    q: str | None = None,
    sort: str | None = None,
):
    items, total = storage.get_products_page(
        page=page,
        page_size=page_size,
        q=q,
        category=category,
        sort=sort,
    )
    return PaginatedProducts(
        items=[Product.model_validate(p) for p in items],
        page=page,
        pageSize=page_size,
        total=total,
        hasMore=page * page_size < total,
    )

@app.get("/api/products/categories", response_model=List[str])
def get_product_categories():
    return storage.get_categories()

# @app.post("/api/products", response_model=ProductDB)
# def create_product(product: InsertProduct):
#     return storage.create_product(product)
