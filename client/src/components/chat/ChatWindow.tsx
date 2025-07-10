import { useState } from "react";
import { Button } from "@/components/ui/button";
// @ts-ignore
import type { Product } from "../../../shared/schema";

interface ChatWindowProps {
  onClose: () => void;
  addToCart?: (product: Product, quantity?: number) => void; // Now expects full product
  products: Product[]; // New prop
}

interface IngredientMatch {
  ingredient: string;
  matches: { id: string; productName: string }[];
}

export default function ChatWindow({
  onClose,
  addToCart,
  products,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<
    { sender: "user" | "ai"; text: string }[]
  >([{ sender: "ai", text: "What do you want to make today?" }]);
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
    setLoading(true);

    try {
      const res = await fetch("http://localhost:8000/api/chat", {
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
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "Sorry, I couldn't process your request." },
      ]);
    } finally {
      setLoading(false);
      setInput("");
    }
  };

  // Ingredient confirmation UI
  if (
    ingredientMatches.length > 0 &&
    currentIngredientIdx < ingredientMatches.length
  ) {
    const ing = ingredientMatches[currentIngredientIdx];
    return (
      <div className="fixed bottom-4 right-4 w-80 h-96 bg-white border border-gray-300 shadow-lg rounded-lg flex flex-col z-50">
        <div className="flex justify-between items-center p-2 border-b bg-walmart-blue text-white rounded-t-lg">
          <span>Ingredient Confirmation</span>
          <button onClick={onClose} className="text-white font-bold text-lg">
            ×
          </button>
        </div>
        <div className="flex-1 p-2 overflow-y-auto space-y-2 text-sm flex flex-col">
          <div className="mb-2 font-semibold">
            Ingredient:{" "}
            <span className="text-walmart-blue">{ing.ingredient}</span>
          </div>
          {ing.matches.length === 0 && (
            <div className="text-gray-500">No close product matches found.</div>
          )}
          <ul>
            {ing.matches.map((match) => (
              <li
                key={match.id}
                className="mb-2 flex items-center justify-between"
              >
                <span>{match.productName}</span>
                <Button
                  size="sm"
                  onClick={() => {
                    const product = products.find(
                      (p) => p._id === match.id || p.id === match.id
                    );
                    if (addToCart && product) addToCart(product, 1);
                    setCurrentIngredientIdx((idx) => idx + 1);
                  }}
                >
                  Add to Cart
                </Button>
              </li>
            ))}
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
      <div className="fixed bottom-4 right-4 w-80 h-96 bg-white border border-gray-300 shadow-lg rounded-lg flex flex-col z-50">
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
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white border border-gray-300 shadow-lg rounded-lg flex flex-col z-50">
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
