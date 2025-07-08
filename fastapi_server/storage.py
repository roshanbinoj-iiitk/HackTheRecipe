import csv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import ProductDB, Base
from typing import List

DATABASE_URL = "sqlite:///./products.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base.metadata.create_all(bind=engine)

class DBStorage:
    def __init__(self):
        self.load_csv_data()

    def load_csv_data(self):
        session = SessionLocal()
        try:
            # Only load if table is empty
            if session.query(ProductDB).first():
                return
            with open('../attached_assets/BigBasket.csv', newline='', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                products = [
                    ProductDB(
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
                    for row in reader
                ]
                session.bulk_save_objects(products)
                session.commit()
        except Exception as e:
            print("Error loading CSV:", e)
        finally:
            session.close()

    def get_all_products(self) -> List[ProductDB]:
        with SessionLocal() as session:
            return session.query(ProductDB).all()

    def search_products(self, query: str) -> List[ProductDB]:
        with SessionLocal() as session:
            like_query = f"%{query.lower()}%"
            return session.query(ProductDB).filter(
                ProductDB.productName.ilike(like_query) |
                ProductDB.brand.ilike(like_query) |
                ProductDB.category.ilike(like_query)
            ).all()

    def get_products_by_category(self, category: str) -> List[ProductDB]:
        with SessionLocal() as session:
            return session.query(ProductDB).filter(ProductDB.category == category).all()

    def create_product(self, product_data) -> ProductDB:
        with SessionLocal() as session:
            product = ProductDB(**product_data)
            session.add(product)
            session.commit()
            session.refresh(product)
            return product

storage = DBStorage()