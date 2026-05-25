import { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE } from "@/lib/apiBase";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
// @ts-ignore
import type { Product } from "../../../shared/schema";

interface ChatWindowProps {
  onClose: () => void;
  addToCart?: (product: Product, quantity?: number) => void; // Now expects full product
  demoMessage?: string;
  demoAutoSend?: boolean;
  demoAutoAddFirst?: boolean;
}

interface IngredientMatch {
  ingredient: string;
  matches: Product[];
}

export default function ChatWindow({
  onClose,
  addToCart,
  demoMessage,
  demoAutoSend,
  demoAutoAddFirst,
}: ChatWindowProps) {
  const autoAddDone = useRef(false);
  const autoAddTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const AUTO_ADD_DELAY_MS = 1100;
  const DEMO_POINTER_SCALE = 1.5;
  const DEMO_POINTER_TIP_X = 10;
  const DEMO_POINTER_TIP_Y = 6;
  const demoPointerOffsetX = DEMO_POINTER_TIP_X * (1 - DEMO_POINTER_SCALE);
  const demoPointerOffsetY = DEMO_POINTER_TIP_Y * (1 - DEMO_POINTER_SCALE);
  const { toast } = useToast();
  const [messages, setMessages] = useState<
    { sender: "user" | "ai"; text: string }[]
  >([]);
  const [hasAutoSent, setHasAutoSent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMessages((prev) =>
        prev.length > 0
          ? prev
          : [{ sender: "ai", text: "What do you want to make today?" }]
      );
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

  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || loading) return;

      const userMessage = { sender: "user" as const, text: message };
      setMessages((prev) => [...prev, userMessage]);
      setInput(""); // Clear input immediately when user sends message
      setLoading(true);

      try {
        const res = await fetch(`${API_BASE}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message }),
        });

        let data;
        let errorMessage = "Sorry, I couldn't process your request.";

        if (res.ok) {
          data = await res.json();
        } else {
          // Try to extract error message from backend
          try {
            const errData = await res.json();
            errorMessage = errData.detail || errorMessage;
          } catch {
            errorMessage = (await res.text()) || errorMessage;
          }
          throw new Error(errorMessage);
        }

        // If backend returns ingredients for confirmation
        if (data.ingredients && Array.isArray(data.ingredients)) {
          setIngredientMatches(data.ingredients);
          setCurrentIngredientIdx(0);
          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: "Let's confirm your ingredients one by one!",
            },
          ]);
        } else {
          setMessages((prev) => [
            ...prev,
            { sender: "ai", text: data.reply || "No reply." },
          ]);
        }
      } catch (err) {
        const errorMessage =
          err?.message || "Sorry, I couldn't process your request.";
        setMessages((prev) => [...prev, { sender: "ai", text: errorMessage }]);
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { sender: "ai", text: "What do you want to make today?" },
          ]);
        }, 500);
      } finally {
        setLoading(false);
      }
    },
    [loading]
  );

  const handleSend = () => {
    void sendMessage(input);
  };

  useEffect(() => {
    setHasAutoSent(false);
  }, [demoMessage]);

  useEffect(() => {
    autoAddDone.current = false;
    if (autoAddTimer.current) {
      clearTimeout(autoAddTimer.current);
      autoAddTimer.current = null;
    }
  }, [demoMessage, demoAutoAddFirst]);

  useEffect(() => {
    if (!demoAutoSend || !demoMessage || hasAutoSent || loading) {
      return;
    }

    const timer = setTimeout(() => {
      setHasAutoSent(true);
      void sendMessage(demoMessage);
    }, 600);

    return () => clearTimeout(timer);
  }, [demoAutoSend, demoMessage, hasAutoSent, loading, sendMessage]);

  useEffect(() => {
    if (!demoAutoAddFirst) {
      return;
    }

    if (ingredientMatches.length === 0) {
      return;
    }

    if (currentIngredientIdx !== 0) {
      return;
    }

    if (autoAddDone.current) {
      return;
    }

    const currentIngredient = ingredientMatches[currentIngredientIdx];
    const firstMatch = currentIngredient.matches?.[0];

    autoAddDone.current = true;
    autoAddTimer.current = setTimeout(() => {
      if (firstMatch && addToCart) {
        addToCart(firstMatch, 1);
        toast({
          title: "Added to cart",
          description: `${firstMatch.productName} has been added to your cart.`,
          duration: 2000,
        });
      }
      setCurrentIngredientIdx((idx) => idx + 1);
      autoAddTimer.current = null;
    }, AUTO_ADD_DELAY_MS);

    return () => {
      if (autoAddTimer.current) {
        clearTimeout(autoAddTimer.current);
        autoAddTimer.current = null;
      }
    };
  }, [
    demoAutoAddFirst,
    ingredientMatches,
    currentIngredientIdx,
    addToCart,
    toast,
  ]);

  // Ingredient confirmation UI
  if (
    ingredientMatches.length > 0 &&
    currentIngredientIdx < ingredientMatches.length
  ) {
    const ing = ingredientMatches[currentIngredientIdx];
    const showDemoPointer =
      demoAutoAddFirst && currentIngredientIdx === 0 && ing.matches.length > 0;
    return (
      <div className="fixed bottom-4 right-4 w-[40rem] h-[42rem] bg-white border border-gray-300 shadow-lg rounded-lg flex flex-col z-50">
        {showDemoPointer && (
          <style>{`
            @keyframes demo-pointer-move {
              0% { transform: translate(-24px, -8px) scale(0.9); opacity: 0; }
              25% { opacity: 1; }
              100% { transform: translate(0, 0) scale(1); opacity: 1; }
            }
            @keyframes demo-pointer-click {
              0%, 70% { transform: scale(0.2); opacity: 0; }
              80% { transform: scale(1); opacity: 0.7; }
              100% { transform: scale(1.4); opacity: 0; }
            }
          `}</style>
        )}
        <div className="flex justify-between items-center p-2 border-b bg-walmart-blue text-white rounded-t-lg">
          <span>Ingredient Confirmation</span>
          <button onClick={onClose} className="text-white font-bold text-lg">
            ×
          </button>
        </div>
        <div className="flex-1 p-2 overflow-y-auto space-y-2 text-sm flex flex-col">
          {showDemoPointer && (
            <div className="text-xs text-walmart-blue font-medium">
              Auto-adding for demo
            </div>
          )}
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
            {ing.matches.map((match, matchIndex) => {
              const imageUrl = match.imageUrl;
              const displayPrice = match.discountPrice || match.price;
              const showPointerHere = showDemoPointer && matchIndex === 0;

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
                      <span className="font-medium">₹{displayPrice}</span>
                      <span className="mx-1">•</span>
                      <span>{match.brand}</span>
                    </div>
                    <Button
                      size="sm"
                      className="text-xs px-3 py-1 h-7 relative"
                      onClick={() => {
                        if (addToCart) {
                          addToCart(match, 1);
                          toast({
                            title: "Added to cart",
                            description: `${match.productName} has been added to your cart.`,
                            duration: 2000,
                          });
                        }
                        setCurrentIngredientIdx((idx) => idx + 1);
                      }}
                    >
                      {showPointerHere && (
                        <span className="absolute left-14 top-1/2 pointer-events-none">
                          <span className="block -translate-y-1/2">
                            <span
                              className="block"
                              style={{
                                animation:
                                  "demo-pointer-move 1.2s ease-in-out infinite",
                                willChange: "transform, opacity",
                              }}
                            >
                              <span
                                className="relative inline-block"
                                style={{
                                  transform: `translate(${demoPointerOffsetX}px, ${demoPointerOffsetY}px) scale(${DEMO_POINTER_SCALE})`,
                                  transformOrigin: "0 0",
                                }}
                              >
                                <svg
                                  width="48"
                                  height="48"
                                  viewBox="0 0 48 48"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                  style={{ display: "block" }}
                                >
                                  <path
                                    d="M10 6L38 24L24 26L18 40L10 6Z"
                                    fill="#ffffff"
                                    stroke="#facc15"
                                    strokeWidth="3"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                                <span
                                  className="absolute left-40 top-40 h-32 w-32 rounded-full border border-walmart-yellow"
                                  style={{
                                    animation:
                                      "demo-pointer-click 1.2s ease-in-out infinite",
                                  }}
                                />
                              </span>
                            </span>
                          </span>
                        </span>
                      )}
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
