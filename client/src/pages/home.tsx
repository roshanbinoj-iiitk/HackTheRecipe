import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import ProductCard from "@/components/product-card";
import CartSidebar from "@/components/cart-sidebar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import type { Product } from "@shared/schema";

// Accept cart and addToCart as props from App
interface HomeProps {
  searchQuery: string;
  cartItems: any[];
  addToCart: (productId: string, quantity?: number) => void;
}

export default function Home({ searchQuery, cartItems, addToCart }: HomeProps) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortOption, setSortOption] = useState("name");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const productsPerPage = 50;

  // Fetch products using react-query
  const {
    data: products = [],
    isLoading,
    error,
  } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Get unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category))).sort();
  }, [products]);

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      const matchesSearch =
        product.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        !selectedCategory || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    // Sort products
    filtered.sort((a, b) => {
      switch (sortOption) {
        case "price-low":
          return parseFloat(a.discountPrice) - parseFloat(b.discountPrice);
        case "price-high":
          return parseFloat(b.discountPrice) - parseFloat(a.discountPrice);
        case "discount":
          const discountA =
            (parseFloat(a.price) - parseFloat(a.discountPrice)) /
            parseFloat(a.price);
          const discountB =
            (parseFloat(b.price) - parseFloat(b.discountPrice)) /
            parseFloat(b.price);
          return discountB - discountA;
        default:
          return a.productName.localeCompare(b.productName);
      }
    });

    return filtered;
  }, [products, searchQuery, selectedCategory, sortOption]);

  // Pagination
  const paginatedProducts = useMemo(() => {
    const startIndex = 0;
    const endIndex = currentPage * productsPerPage;
    return filteredAndSortedProducts.slice(startIndex, endIndex);
  }, [filteredAndSortedProducts, currentPage]);

  const hasMoreProducts =
    currentPage * productsPerPage < filteredAndSortedProducts.length;

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === "all" ? "" : category);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: string) => {
    setSortOption(sort);
    setCurrentPage(1);
  };

  const loadMoreProducts = () => {
    setCurrentPage((prev) => prev + 1);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Error loading products
          </h2>
          <p className="text-gray-600">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats and Filters Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl font-bold text-gray-900">
              Fresh Groceries & Daily Essentials
            </h1>
            <p className="text-gray-600 mt-1">
              {isLoading
                ? "Loading products..."
                : filteredAndSortedProducts.length === 0
                ? "No products found"
                : `Showing ${paginatedProducts.length} of ${filteredAndSortedProducts.length} products`}
            </p>
          </div>

          <div className="flex items-center space-x-4">
            <Select
              value={selectedCategory || "all"}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortOption} onValueChange={handleSortChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Sort by Name</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="discount">Best Discount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg p-4">
                <Skeleton className="w-full h-48 mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-8 w-full" />
              </div>
            ))}
          </div>
        )}

        {/* No Results State */}
        {!isLoading && filteredAndSortedProducts.length === 0 && (
          <div className="text-center py-12">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No products found
            </h3>
            <p className="text-gray-600">
              Try adjusting your search or filters
            </p>
          </div>
        )}

        {/* Product Grid */}
        {!isLoading && paginatedProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product._id || product.id}
                product={product}
                onAddToCart={(id, qty) => addToCart(id, qty)}
              />
            ))}
          </div>
        )}

        {/* Load More Button */}
        {!isLoading && hasMoreProducts && (
          <div className="text-center mt-8">
            <Button
              onClick={loadMoreProducts}
              className="bg-walmart-blue text-white hover:bg-walmart-dark-blue px-6 py-3 font-medium"
            >
              Load More Products
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* ...footer content unchanged... */}
        </div>
      </footer>

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        // You may need to pass updateQuantity, removeFromCart, clearCart, getCartTotal as props from App if you want to keep cart state in App
      />
    </div>
  );
}
