import { useState } from "react";
import { Heart, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import type { Product } from "../../../shared/schema"; // Import shared Product type

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({
  product,
  onAddToCart,
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const { toast } = useToast();
  const price = parseFloat(product.price);
  const discountPrice = parseFloat(product.discountPrice);
  const hasDiscount = price !== discountPrice;
  const discountPercent = hasDiscount
    ? Math.round(((price - discountPrice) / price) * 100)
    : 0;

  const handleImageError = () => {
    setImageError(true);
  };

  const handleAddToCart = () => {
    onAddToCart(product);
    if (!product._id) {
      toast({
        title: "Error",
        description: "Product ID is missing.",
        duration: 2000,
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Added to cart",
      description: `${product.productName} has been added to your cart.`,
      duration: 2000,
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
      <div className="relative overflow-hidden">
        {imageError ? (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <ShoppingCart size={32} />
              <p className="text-xs mt-2">Image not available</p>
            </div>
          </div>
        ) : (
          <img
            src={product.imageUrl}
            alt={product.productName}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={handleImageError}
          />
        )}

        {hasDiscount && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white hover:bg-red-500">
            {discountPercent}% OFF
          </Badge>
        )}

        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            className="bg-white text-gray-600 hover:text-red-500 p-2 rounded-full shadow-md"
          >
            <Heart size={16} />
          </Button>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-2">
          <Badge
            variant="outline"
            className="text-walmart-blue border-walmart-blue"
          >
            {product.brand}
          </Badge>
        </div>

        <h3
          className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 min-h-[2.5rem]"
          title={product.productName}
        >
          {product.productName}
        </h3>

        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-gray-500">{product.quantity}</span>
          <Badge variant="secondary" className="text-xs">
            {product.category}
          </Badge>
        </div>

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              ₹{discountPrice}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-500 line-through">
                ₹{price}
              </span>
            )}
          </div>
        </div>

        <Button
          className="w-full bg-walmart-blue text-white hover:bg-walmart-dark-blue font-medium text-sm"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="mr-2" size={16} />
          Add to Cart
        </Button>
      </div>
    </div>
  );
}
