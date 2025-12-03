import { useState } from "react";
import './ChatGPT.css';

function ChatGPT() {
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = { role: "user", content: message };
    setChatHistory([...chatHistory, userMessage]);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://192.168.100.11:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const data = await response.json();
      const aiMessage = { role: "ai", content: data.reply };

      setChatHistory((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      alert("Error connecting to AI server");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="coral-chat-container">
      <h2 className="coral-chat-title">Coral IVRS-AI Chat</h2>

      <div className="coral-chat-window">
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`coral-chat-message ${msg.role === "user" ? "coral-user" : "coral-ai"}`}
          >
            {msg.content}
          </div>
        ))}
        {loading && <p className="coral-loading">AI is typing...</p>}
      </div>

      <textarea
        className="coral-chat-input"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        rows={3}
        placeholder="Type your message..."
      />

      <button className="coral-chat-send" onClick={sendMessage}>
        Send
      </button>
    </div>
  );
}

export default ChatGPT;
