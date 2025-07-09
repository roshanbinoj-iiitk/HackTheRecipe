import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ChatWindowProps {
  onClose: () => void;
}

export default function ChatWindow({ onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<
    { sender: "user" | "ai"; text: string }[]
  >([{ sender: "ai", text: "What do you want to make today?" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { sender: "user", text: input };
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
      setMessages((prev) => [...prev, { sender: "ai", text: data.reply }]);
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
