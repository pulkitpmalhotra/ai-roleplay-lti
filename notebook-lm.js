// notebook-lm.js
import React, { useState } from "react";

const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";

export default function NotebookLM() {
  const [notes, setNotes] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    setLoading(true);
    setAnswer("");
    const prompt = `You are NotebookLM, an AI-powered note assistant. Use the notes below as your knowledge base only; answer the user's question based solely on these notes.\n\nNotes:\n${notes}\n\nUser question: ${question}`;
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    });
    const data = await res.json();
    setAnswer(data.candidates?.[0]?.content?.parts?.[0]?.text || "No answer");
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 500, margin: "auto", fontFamily: "sans-serif" }}>
      <h2>NotebookLM Q&A Module</h2>
      <textarea
        style={{ width: "100%", minHeight: 100 }}
        value={notes}
        onChange={e => setNotes(e.target.value)}
        placeholder="Paste your notes or learning content here" />
      <input
        style={{ width: "100%", margin: "10px 0" }}
        value={question}
        onChange={e => setQuestion(e.target.value)}
        placeholder="Ask a question about your notes"
      />
      <button onClick={askAI} disabled={!notes || !question || loading}>Ask AI</button>
      {loading && <div>Thinking...</div>}
      {answer && <div style={{ marginTop: 10, border: "1px solid #eee", padding: 10 }}>{answer}</div>}
    </div>
  );
}
