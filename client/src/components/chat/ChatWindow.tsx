import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
// @ts-ignore
import type { Product } from "../../../shared/schema";

interface ChatWindowProps {
  onClose: () => void;
  addToCart?: (product: Product, quantity?: number) => void; // Now expects full product
  products: Product[]; // New prop
}

interface IngredientMatch {
  ingredient: string;
  matches: {
    id: string;
    productName: string;
    price: string;
    quantity: string;
  }[];
}

export default function ChatWindow({
  onClose,
  addToCart,
  products,
}: ChatWindowProps) {
  const { toast } = useToast();
  const [messages, setMessages] = useState<
    { sender: "user" | "ai"; text: string }[]
  >([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages([{ sender: "ai", text: "What do you want to make today?" }]);
    }, 500); // 2 seconds delay
    return () => clearTimeout(timer);
  }, []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  // For ingredient confirmation flow
  const [ingredientMatches, setIngredientMatches] = useState<IngredientMatch[]>(
    []
  );
  const [currentIngredientIdx, setCurrentIngredientIdx] = useState(0);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { sender: "user" as const, text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput(""); // Clear input immediately when user sends message
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input }),
      });
      if (!res.ok) throw new Error("Failed to get reply");
      const data = await res.json();

      // If backend returns ingredients for confirmation
      if (data.ingredients && Array.isArray(data.ingredients)) {
        setIngredientMatches(data.ingredients);
        setCurrentIngredientIdx(0);
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: "Let's confirm your ingredients one by one!" },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: data.reply || "No reply." },
        ]);
      }
    } catch (err) {
      const errorMessage = "Sorry, I couldn't process your request.";
      setMessages((prev) => [...prev, { sender: "ai", text: errorMessage }]);

      // After 500ms, show the recovery message
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { sender: "ai", text: "What do you want to make today?" },
        ]);
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  // Ingredient confirmation UI
  if (
    ingredientMatches.length > 0 &&
    currentIngredientIdx < ingredientMatches.length
  ) {
    const ing = ingredientMatches[currentIngredientIdx];
    return (
      <div className="fixed bottom-4 right-4 w-[40rem] h-[42rem] bg-white border border-gray-300 shadow-lg rounded-lg flex flex-col z-50">
        <div className="flex justify-between items-center p-2 border-b bg-walmart-blue text-white rounded-t-lg">
          <span>Ingredient Confirmation</span>
          <button onClick={onClose} className="text-white font-bold text-lg">
            ×
          </button>
        </div>
        <div className="flex-1 p-2 overflow-y-auto space-y-2 text-sm flex flex-col">
          {/* Show chat history above ingredient confirmation */}
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`p-2 rounded-md max-w-[80%] ${
                msg.sender === "user"
                  ? "bg-walmart-blue text-white self-end ml-auto"
                  : "bg-gray-100 text-gray-800 self-start mr-auto"
              }`}
            >
              {msg.text}
            </div>
          ))}
          {/* Ingredient confirmation content below */}
          <div className="mb-2 font-semibold">
            Ingredient:{" "}
            <span className="text-walmart-blue">{ing.ingredient}</span>
          </div>
          {ing.matches.length === 0 && (
            <div className="text-gray-500">No close product matches found.</div>
          )}
          <ul>
            {ing.matches.map((match) => {
              const product = products.find(
                (p) => p._id === match.id || p.id === match.id
              );
              // Try different possible image field names
              const imageUrl =
                product?.image ||
                product?.imageUrl ||
                product?.img ||
                product?.picture;

              return (
                <li
                  key={match.id}
                  className="mb-3 flex items-center space-x-3 border-b pb-3"
                >
                  {/* Image first */}
                  <div className="flex-shrink-0">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={match.productName}
                        className="w-20 h-20 object-cover rounded-md border shadow-sm"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.src =
                            "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yOCAzMkMzMC4yMDkxIDMyIDMyIDMwLjIwOTEgMzIgMjhDMzIgMjUuNzkwOSAzMC4yMDkxIDI0IDI4IDI0QzI1Ljc5MDkgMjQgMjQgMjUuNzkwOSAyNCAyOCMyNCAzMC4yMDkxIDI1Ljc5MDkgMzIgMjggMzJaIiBmaWxsPSIjOUI5QjlCIi8+CjxwYXRoIGQ9Ik0yMCA0NEw2MCA0NEw1MiAzNkw0NCA0NEwyOCAyOEwyMCA0NFoiIGZpbGw9IiM5QjlCOUIiLz4KPC9zdmc+";
                          target.className =
                            "w-20 h-20 object-cover rounded-md border bg-gray-100";
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-md border flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Product details */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm leading-tight mb-1 text-gray-900">
                      {match.productName}
                    </h4>
                    <div className="text-xs text-gray-600 mb-2">
                      <span className="font-medium">₹{match.price}</span>
                      <span className="mx-1">•</span>
                      <span>{match.quantity}</span>
                    </div>
                    <Button
                      size="sm"
                      className="text-xs px-3 py-1 h-7"
                      onClick={() => {
                        if (addToCart && product) {
                          addToCart(product, 1);
                          toast({
                            title: "Added to cart",
                            description: `${product.productName} has been added to your cart.`,
                            duration: 2000,
                          });
                        }
                        setCurrentIngredientIdx((idx) => idx + 1);
                      }}
                    >
                      Add to Cart
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
          <Button
            variant="secondary"
            className="mt-2"
            onClick={() => setCurrentIngredientIdx((idx) => idx + 1)}
          >
            Skip
          </Button>
        </div>
      </div>
    );
  }

  // All ingredients processed
  if (
    ingredientMatches.length > 0 &&
    currentIngredientIdx >= ingredientMatches.length
  ) {
    return (
      <div className="fixed bottom-4 right-4 w-[40rem] h-[42rem] bg-white border border-gray-300 shadow-lg rounded-lg flex flex-col z-50">
        <div className="flex justify-between items-center p-2 border-b bg-walmart-blue text-white rounded-t-lg">
          <span>Chat with AI</span>
          <button onClick={onClose} className="text-white font-bold text-lg">
            ×
          </button>
        </div>
        <div className="flex-1 p-2 flex flex-col items-center justify-center">
          <div className="text-green-600 font-semibold mb-2">
            All ingredients processed!
          </div>
          <Button
            onClick={() => {
              setIngredientMatches([]);
              setCurrentIngredientIdx(0);
              setMessages([]);
              setTimeout(() => {
                setMessages([
                  { sender: "ai", text: "What do you want to make today?" },
                ]);
              }, 500);
            }}
          >
            Start Over
          </Button>
        </div>
      </div>
    );
  }

  // Default chat UI
  return (
    <div className="fixed bottom-4 right-4 w-[40rem] h-[42rem] bg-white border border-gray-300 shadow-lg rounded-lg flex flex-col z-50">
      <div className="flex justify-between items-center p-2 border-b bg-walmart-blue text-white rounded-t-lg">
        <span>Chat with AI</span>
        <button onClick={onClose} className="text-white font-bold text-lg">
          ×
        </button>
      </div>
      <div className="flex-1 p-2 overflow-y-auto space-y-2 text-sm flex flex-col">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-md max-w-[80%] ${
              msg.sender === "user"
                ? "bg-walmart-blue text-white self-end ml-auto"
                : "bg-gray-100 text-gray-800 self-start mr-auto"
            }`}
          >
            {msg.text}
          </div>
        ))}
        {loading && (
          <div className="p-2 rounded-md bg-gray-100 text-gray-800 self-start mr-auto">
            Thinking...
          </div>
        )}
      </div>
      <div className="p-2 border-t flex items-center">
        <input
          type="text"
          className="flex-1 border rounded px-2 py-1 text-sm"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={loading}
        />
        <Button
          className="ml-2 text-sm h-8 px-3"
          onClick={handleSend}
          disabled={loading}
        >
          Send
        </Button>
      </div>
    </div>
  );
}
