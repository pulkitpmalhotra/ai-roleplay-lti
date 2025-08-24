// quiz-generator.js
import React, { useState } from "react";

const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY";

export default function QuizGenerator() {
  const [topic, setTopic] = useState("");
  const [quiz, setQuiz] = useState([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({});

  const generateQuiz = async () => {
    setLoading(true);
    setQuiz([]);
    setAnswers({});
    const prompt = `Create a 3-question multiple-choice quiz on the topic: "${topic}". Provide the questions, 4 options each (A-D), and indicate the correct answer.`;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
    });
    const data = await response.json();
    const quizText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    // Parse AI quiz (very basic parser, good for pilot)
    const lines = quizText.split("\n").filter(Boolean);
    let questions = [], q = null;
    lines.forEach(line => {
      if (/^\d+\./.test(line)) {
        if (q) questions.push(q);
        q = { question: line, options: [], answer: "" };
      } else if (/^[A-D]\)/.test(line)) {
        q?.options.push(line);
      } else if (/^Answer:/i.test(line)) {
        q.answer = line.replace(/^Answer:/i, "").trim();
      }
    });
    if (q) questions.push(q);
    setQuiz(questions);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 500, margin: "auto", fontFamily: "sans-serif" }}>
      <h2>Gemini Intelligent Quiz</h2>
      <input
        style={{ width: "70%" }}
        value={topic}
        onChange={e => setTopic(e.target.value)}
        placeholder="Enter topic (e.g., Sales Tactics)"
        disabled={loading}
      />
      <button onClick={generateQuiz} disabled={!topic || loading}>Generate Quiz</button>
      {quiz.map((q, i) => (
        <div key={i} style={{ border: "1px solid #eee", padding: 10, marginTop: 10 }}>
          <div><b>{q.question}</b></div>
          {q.options.map((opt, j) => (
            <div key={j}>
              <input
                type="radio"
                name={`q${i}`}
                value={opt}
                checked={answers[i] === opt}
                onChange={() => setAnswers({ ...answers, [i]: opt })}
              /> {opt}
            </div>
          ))}
          {answers[i] && (
            <div style={{ color: answers[i].includes(q.answer) ? "green" : "red" }}>
              {answers[i].includes(q.answer) ? "Correct!" : `Incorrect, correct answer: ${q.answer}`}
            </div>
          )}
        </div>
      ))}
      {loading && <div>Generating...</div>}
    </div>
  );
}
