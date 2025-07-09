import { useState, useEffect } from "react";
import type { Product } from "@shared/schema";

export interface CartItem {
  product: any; // expects an object with _id and discountPrice
  quantity: number;
}

export function useCart() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Fetch cart from backend on mount
  useEffect(() => {
    fetch("http://localhost:8000/api/cart")
      .then((res) => res.json())
      .then((data) => {
        setCartItems(Array.isArray(data) ? data : []);
      });
  }, []);

  const addToCart = async (product: Product, quantity: number = 1) => {
    if (!product || typeof product !== "object" || !product._id) {
      console.error("Product object is missing or invalid:", product);
      return;
    }
    const productId = product._id;
    await fetch("http://localhost:8000/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    const res = await fetch("http://localhost:8000/api/cart");
    const data = await res.json();
    setCartItems(Array.isArray(data) ? data : []);
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!productId || typeof productId !== "string") {
      console.error("Product ID is missing or invalid:", productId);
      return;
    }
    await fetch("http://localhost:8000/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    const res = await fetch("http://localhost:8000/api/cart");
    const data = await res.json();
    setCartItems(Array.isArray(data) ? data : []);
  };

  const removeFromCart = async (productId: string) => {
    if (!productId || typeof productId !== "string") {
      console.error("Product ID is missing or invalid:", productId);
      return;
    }
    await fetch(`http://localhost:8000/api/cart/${productId}`, {
      method: "DELETE",
    });
    const res = await fetch("http://localhost:8000/api/cart");
    const data = await res.json();
    setCartItems(Array.isArray(data) ? data : []);
  };

  const clearCart = async () => {
    // Remove all items one by one
    await Promise.all(
      cartItems.map((item) => removeFromCart(item.product._id))
    );
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.product.discountPrice);
      return total + price * item.quantity;
    }, 0);
  };

  const getCartCount = () => {
    return Array.isArray(cartItems)
      ? cartItems.reduce((count, item) => count + item.quantity, 0)
      : 0;
  };

  return {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartTotal,
    getCartCount,
  };
}
