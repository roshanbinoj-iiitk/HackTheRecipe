// src/components/chat/ChatWindow.tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ChatWindowProps {
  onClose: () => void;
}

export default function ChatWindow({ onClose }: ChatWindowProps) {
  const [messages, setMessages] = useState<{ sender: "user" | "ai"; text: string }[]>([]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, newMessage]);

    // Simulate AI reply
    setTimeout(() => {
      setMessages((prev) => [...prev, { sender: "ai", text: "This is a mock reply." }]);
    }, 1000);

    setInput("");
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white border border-gray-300 shadow-lg rounded-lg flex flex-col z-50">
      <div className="flex justify-between items-center p-2 border-b bg-walmart-blue text-white rounded-t-lg">
        <span>Chat with AI</span>
        <button onClick={onClose} className="text-white font-bold text-lg">×</button>
      </div>

      <div className="flex-1 p-2 overflow-y-auto space-y-2 text-sm">
        {messages.map((msg, idx) => (
          <div key={idx} className={`p-2 rounded-md max-w-[80%] ${msg.sender === "user" ? "bg-walmart-blue text-white self-end ml-auto" : "bg-gray-100 text-gray-800 self-start mr-auto"}`}>
            {msg.text}
          </div>
        ))}
      </div>

      <div className="p-2 border-t flex items-center">
        <input
          type="text"
          className="flex-1 border rounded px-2 py-1 text-sm"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button className="ml-2 text-sm h-8 px-3" onClick={handleSend}>Send</Button>
      </div>
    </div>
  );
}
