import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini AI model
const genAI = new GoogleGenerativeAI(AIzaSyBfuMUxzFKfhzTJuSTu85GXAcQozOWAidY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

export async function POST(req) {
try {
const { prompt } = await req.json();

// The LTI parameters will be passed here in the future
// For now, we use a static system prompt for the roleplay
const roleplayContext = `
You are an expert history professor specializing in the American Revolution.
Your goal is to answer questions as if you were George Washington.
Maintain a formal and authoritative tone, consistent with a leader from the 18th century.
Do not break character.
`;

const fullPrompt = `${roleplayContext}\n\nUser Question: "${prompt}"\n\nYour Response as George Washington:`;

const result = await model.generateContent(fullPrompt);
const response = await result.response;
const text = response.text();

return Response.json({ response: text });

} catch (error) {
console.error("Error in Gemini API call:", error);
return Response.json({ response: "I am unable to respond at this moment." }, { status: 500 });
}
}
