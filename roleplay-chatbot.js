// roleplay-chatbot.js
import React, { useState } from "react";

const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";

export default function RoleplayChatbot() {
  const [messages, setMessages] = useState([{ role: "ai", content: "You are a tough customer. Render your sales roleplay in vivid dialogue. Start the conversation." }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    setLoading(true);
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=" + GEMINI_API_KEY, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: newMessages.map(({ role, content }) => ({ role, parts: [{ text: content }] })) }),
    });
    const data = await response.json();
    const aiReply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    setMessages([...newMessages, { role: "ai", content: aiReply }]);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 500, margin: "auto", fontFamily: "sans-serif" }}>
      <h2>Roleplay Chatbot (Gemini)</h2>
      <div style={{ minHeight: 200, border: "1px solid #eee", padding: 10, marginBottom: 10 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ color: msg.role === "ai" ? "blue" : "black", margin: "5px 0" }}>
            <b>{msg.role === "ai" ? "AI" : "You"}: </b>{msg.content}
          </div>
        ))}
        {loading && <div>AI is typing...</div>}
      </div>
      <input style={{ width: "80%" }} value={input} onChange={e => setInput(e.target.value)} disabled={loading} onKeyDown={e => e.key === "Enter" && sendMessage()} />
      <button onClick={sendMessage} disabled={loading || !input}>Send</button>
    </div>
  );
}
