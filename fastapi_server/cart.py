from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from storage import storage

router = APIRouter(prefix="/api/cart", tags=["Cart"])

class CartItemRequest(BaseModel):
    product_id: str
    quantity: int

@router.get("")
def get_cart():
    items = storage.get_cart_items()
    # Always return a list, even if empty
    return items if isinstance(items, list) else []

@router.post("")
def add_to_cart(item: CartItemRequest):
    try:
        storage.add_to_cart(item.product_id, item.quantity)
        # Return the updated cart as a list
        items = storage.get_cart_items()
        return items if isinstance(items, list) else []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("")
def update_cart(item: CartItemRequest):
    try:
        storage.update_cart_item(item.product_id, item.quantity)
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{product_id}")
def remove_from_cart(product_id: str):
    try:
        storage.remove_from_cart(product_id)
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))