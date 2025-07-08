# filepath: fastapi_server/storage.py
import csv
from typing import List
from models import Product, InsertProduct

class MemStorage:
    def __init__(self):
        self.products = {}
        self.current_id = 1
        self.load_csv_data()

    def load_csv_data(self):
        try:
            with open('../attached_assets/BigBasket.csv', newline='', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                for row in reader:
                    product = Product(
                        id=row['ProductID'],
                        productName=row['ProductName'],
                        brand=row['Brand'],
                        price=row['Price'],
                        discountPrice=row['DiscountPrice'],
                        imageUrl=row['Image_Url'],
                        quantity=row['Quantity'],
                        category=row['Category'],
                        subCategory=row['SubCategory'],
                        absoluteUrl=row['Absolute_Url'],
                    )
                    self.products[product.id] = product  # <-- Add this line
        except Exception as e:
            print("Error loading CSV:", e)
            self.products = {}

    def get_all_products(self) -> List[Product]:
        return list(self.products.values())

    def search_products(self, query: str) -> List[Product]:
        query = query.lower()
        return [
            p for p in self.products.values()
            if query in p.productName.lower() or query in p.brand.lower() or query in p.category.lower()
        ]

    def get_products_by_category(self, category: str) -> List[Product]:
        return [p for p in self.products.values() if p.category == category]

    def create_product(self, insert_product: InsertProduct) -> Product:
        product = Product(_id=str(self.current_id), **insert_product.dict())
        self.products[product._id] = product
        self.current_id += 1
        return product

storage = MemStorage()