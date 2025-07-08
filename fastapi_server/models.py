# filepath: fastapi_server/models.py
from pydantic import BaseModel

class Product(BaseModel):
    id: str
    productName: str
    brand: str
    price: str
    discountPrice: str
    imageUrl: str
    quantity: str
    category: str
    subCategory: str
    absoluteUrl: str

class InsertProduct(BaseModel):
    productName: str
    brand: str
    price: str
    discountPrice: str
    imageUrl: str
    quantity: str
    category: str
    subCategory: str
    absoluteUrl: str