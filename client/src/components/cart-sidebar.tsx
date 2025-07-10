import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { CartItem } from "@/hooks/use-cart";

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  cartTotal: number;
}

export default function CartSidebar({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  cartTotal,
}: CartSidebarProps) {
  if (cartItems.length === 0) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingBag size={20} />
              Your Cart
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center h-[50%] text-center">
            <ShoppingBag size={64} className="text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-gray-500 mb-4">Add some products to get started!</p>
            <Button onClick={onClose} className="bg-walmart-blue hover:bg-walmart-dark-blue">
              Continue Shopping
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag size={20} />
              Your Cart ({cartItems.length} items)
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearCart}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 size={16} />
              Clear All
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {cartItems.map((item) => (
            <div key={item.product._id} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg">
              <img
                src={item.product.imageUrl}
                alt={item.product.productName}
                className="w-16 h-16 object-cover rounded-md"
                onError={(e) => {
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjY0IiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAzMkgxNkwyMCA0MEgyOEwzMiAzMkg0MEwzNiAyNEgyOEwyNCAzMloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
                }}
              />
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 line-clamp-2">
                  {item.product.productName}
                </h4>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {item.product.brand}
                  </Badge>
                  <span className="text-xs text-gray-500">{item.product.quantity}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-lg font-bold text-gray-900">
                    ₹{item.product.discountPrice}
                  </span>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                              if (item.quantity > 1) onUpdateQuantity(item.product._id!, item.quantity - 1);
                              }}
                      className="h-8 w-8 p-0"
                    >
                      <Minus size={12} />
                    </Button>
                    <span className="text-sm font-medium w-8 text-center">
                      {item.quantity}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdateQuantity(item.product._id!, item.quantity + 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus size={12} />
                    </Button>
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveItem(item.product._id!)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
              >
                <X size={16} />
              </Button>
            </div>
          ))}
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <div className="flex items-center justify-between text-lg font-semibold">
            <span>Total:</span>
            <span>₹{cartTotal.toFixed(2)}</span>
          </div>

          <div className="space-y-2">
            <Button className="w-full bg-walmart-blue hover:bg-walmart-dark-blue text-white font-medium">
              Proceed to Checkout
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={onClose}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}