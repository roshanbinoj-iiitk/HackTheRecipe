// import { Switch, Route } from "wouter";
// import { queryClient } from "./lib/queryClient";
// import { QueryClientProvider } from "@tanstack/react-query";
// import { Toaster } from "@/components/ui/toaster";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import Home from "@/pages/home";
// import NotFound from "@/pages/not-found";

// function Router() {
//   return (
//     <Switch>
//       <Route path="/" component={Home} />
//       <Route component={NotFound} />
//     </Switch>
//   );
// }

// function App() {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <TooltipProvider>
//         <Toaster />
//         <Router />
//       </TooltipProvider>
//     </QueryClientProvider>
//   );
// }

// export default App;
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import Header from "@/components/header";
import { useCart } from "@/hooks/use-cart";
import { useState } from "react";

function App() {
  const cart = useCart();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Example: handle search and cart sidebar logic
  const handleSearch = (query: string) => setSearchQuery(query);
  const handleCartClick = () => setIsCartOpen((prev) => !prev);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Header
          onSearch={handleSearch}
          searchQuery={searchQuery}
          cartCount={cart.getCartCount()}
          onCartClick={handleCartClick}
          addToCart={cart.addToCart}
        />
        <Switch>
          <Route
            path="/"
            component={() => (
              <Home
                searchQuery={searchQuery}
                cartItems={cart.cartItems}
                addToCart={cart.addToCart}
              />
            )}
          />
          <Route component={NotFound} />
        </Switch>
        {/* You can add your CartSidebar here if needed */}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
