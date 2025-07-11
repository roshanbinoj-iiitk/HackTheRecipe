import csv
from sqlalchemy import create_engine, text
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
        self.create_cart_table()

    def load_csv_data(self):
        session = SessionLocal()
        try:
            # Only load if table is empty
            if session.query(ProductDB).first():
                return
            with open('../attached_assets/bigbasket_products.csv', newline='', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                products = [
                    ProductDB(
                        id=row['ProductID'],
                        productName=row['ProductName'],
                        brand=row['Brand'],
                        price=row['Price'],
                        discountPrice=row['DiscountPrice'],
                        imageUrl=row['Image_Url'],
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
        
    def create_cart_table(self):
        with SessionLocal() as session:
            session.execute(text("""
                CREATE TABLE IF NOT EXISTS cart (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    product_id TEXT,
                    quantity INTEGER,
                    FOREIGN KEY(product_id) REFERENCES products(id)
                )
            """))
            session.commit()
    
    from sqlalchemy import text

    def add_to_cart(self, product_id: str, quantity: int):
        with SessionLocal() as session:
            # Check if item already in cart
            result = session.execute(
                text("SELECT quantity FROM cart WHERE product_id = :product_id"),
                {"product_id": product_id}
            ).fetchone()
            if result:
                # Update quantity
                session.execute(
                    text("UPDATE cart SET quantity = quantity + :quantity WHERE product_id = :product_id"),
                    {"product_id": product_id, "quantity": quantity}
                )
            else:
                # Insert new item
                session.execute(
                    text("INSERT INTO cart (product_id, quantity) VALUES (:product_id, :quantity)"),
                    {"product_id": product_id, "quantity": quantity}
                )
            session.commit()
    
    def get_cart_items(self):
        with SessionLocal() as session:
            result = session.execute(text("""
                SELECT cart.product_id, cart.quantity, products.productName, products.price, products.discountPrice, products.brand, products.imageUrl
                FROM cart
                JOIN products ON cart.product_id = products.id
            """))
            return [
                {
                    "product": {
                        "_id": row[0],
                        "productName": row[2],
                        "price": row[3],
                        "discountPrice": row[4] if row[4] is not None else row[3],
                        "brand": row[5],
                        "imageUrl": row[6],
                    },
                    "quantity": row[1],
                }
                for row in result.fetchall()
            ]
        
    def update_cart_item(self, product_id: str, quantity: int):
        with SessionLocal() as session:
            session.execute(
                text("UPDATE cart SET quantity = :quantity WHERE product_id = :product_id"),
                {"product_id": product_id, "quantity": quantity}
            )
            session.commit()

    def remove_from_cart(self, product_id: str):
        with SessionLocal() as session:
            session.execute(
                text("DELETE FROM cart WHERE product_id = :product_id"),
                {"product_id": product_id}
            )
            session.commit()

storage = DBStorage()