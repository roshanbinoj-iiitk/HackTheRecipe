import { useState } from "react";
import { Search, User, ShoppingCart } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onSearch: (query: string) => void;
  searchQuery: string;
  cartCount: number;
  onCartClick: () => void;
}

export default function Header({ onSearch, searchQuery, cartCount, onCartClick }: HeaderProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearchQuery);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    onSearch(value); // Real-time search
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="text-2xl font-bold text-walmart-blue">
              <ShoppingCart className="inline mr-2" size={28} />
              Walmart
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <form onSubmit={handleSearch} className="relative">
              <Input
                type="text"
                value={localSearchQuery}
                onChange={handleInputChange}
                placeholder="Search for products, brands and more..."
                className="w-full pl-10 pr-4 bg-gray-50 border-gray-300 focus:border-walmart-blue focus:ring-2 focus:ring-walmart-blue focus:ring-opacity-20"
              />
              <Search className="absolute left-3 top-3 text-gray-400" size={16} />
            </form>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-walmart-blue">
              <User size={20} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-gray-600 hover:text-walmart-blue relative"
              onClick={onCartClick}
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-walmart-yellow text-walmart-dark-blue text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
