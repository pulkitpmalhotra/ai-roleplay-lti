'use client'; // Required for Next.js 13+ App Router to use hooks

import { useState } from 'react';

export default function ChatPage() {
const [messages, setMessages] = useState([]);
const [input, setInput] = useState('');

const handleSendMessage = async (e) => {
e.preventDefault();
if (!input.trim()) return;

// Add user's message to the chat
const userMessage = { role: 'user', text: input };
setMessages((prevMessages) => [...prevMessages, userMessage]);

// Send message to our backend and get the AI response
try {
const response = await fetch('/api/chat', {
method: 'POST',
headers: { 'Content-Type': 'application/json' },
body: JSON.stringify({ prompt: input }),
});

const data = await response.json();

// Add AI's message to the chat
const aiMessage = { role: 'ai', text: data.response };
setMessages((prevMessages) => [...prevMessages, aiMessage]);

} catch (error) {
console.error("Failed to fetch AI response:", error);
const errorMessage = { role: 'ai', text: 'Sorry, I ran into an error.' };
setMessages((prevMessages) => [...prevMessages, errorMessage]);
}

setInput(''); // Clear the input field
};

return (
<div style={{ fontFamily: 'sans-serif', maxWidth: '600px', margin: 'auto', padding: '20px' }}>
<h1>AI Roleplay Chatbot</h1>
<div style={{ border: '1px solid #ccc', height: '400px', overflowY: 'scroll', padding: '10px', marginBottom: '10px' }}>
{messages.map((msg, index) => (
<div key={index} style={{ textAlign: msg.role === 'user' ? 'right' : 'left', margin: '5px 0' }}>
<p style={{
display: 'inline-block',
padding: '8px 12px',
borderRadius: '10px',
backgroundColor: msg.role === 'user' ? '#007bff' : '#e9ecef',
color: msg.role === 'user' ? 'white' : 'black'
}}>
{msg.text}
</p>
</div>
))}
</div>
<form onSubmit={handleSendMessage} style={{ display: 'flex' }}>
<input
type="text"
value={input}
onChange={(e) => setInput(e.target.value)}
style={{ flexGrow: 1, padding: '10px', border: '1px solid #ccc' }}
placeholder="Type your message..."
/>
<button type="submit" style={{ padding: '10px 15px', border: 'none', backgroundColor: '#007bff', color: 'white' }}>
Send
</button>
</form>
</div>
);
}
