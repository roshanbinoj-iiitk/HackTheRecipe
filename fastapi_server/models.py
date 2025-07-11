from pydantic import BaseModel

class Product(BaseModel):
    id: str
    productName: str
    brand: str
    price: str
    discountPrice: str
    imageUrl: str
    category: str
    subCategory: str
    absoluteUrl: str

    class Config:
        from_attributes = True

from sqlalchemy import Column, String, Integer
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class ProductDB(Base):
    __tablename__ = "products"
    id = Column(String, primary_key=True)
    productName = Column(String)
    brand = Column(String)
    price = Column(String)
    discountPrice = Column(String)
    imageUrl = Column(String)
    category = Column(String)
    subCategory = Column(String)
    absoluteUrl = Column(String)