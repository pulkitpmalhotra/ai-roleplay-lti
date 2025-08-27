// lib/ai-integration-supabase.js - Clean AI integration for Gemini
import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiAI {
  constructor() {
    this.apiKey = process.env.GOOGLE_API_KEY || 
                  process.env.GEMINI_API_KEY || 
                  process.env.AI_API_KEY;
    
    if (!this.apiKey) {
      console.warn('No Google API key found. Using mock responses.');
      this.useMockResponses = true;
      return;
    }
    
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    this.useMockResponses = false;
  }

  async generateResponse(systemPrompt, userMessage, conversationHistory = []) {
    if (this.useMockResponses) {
      return this.getMockResponse(userMessage);
    }

    try {
      let fullPrompt = systemPrompt + '\n\n';
      
      if (conversationHistory.length > 0) {
        fullPrompt += 'CONVERSATION HISTORY:\n';
        conversationHistory.forEach(msg => {
          const speaker = msg.role === 'user' ? 'Student' : 'Character';
          fullPrompt += `${speaker}: ${msg.content}\n`;
        });
        fullPrompt += '\n';
      }
      
      fullPrompt += `Current Student Message: ${userMessage}\n\nPlease respond as the character:`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      
      if (!response || !response.text) {
        throw new Error('No response generated from Gemini');
      }
      
      return response.text();
    } catch (error) {
      console.error('Gemini AI error:', error);
      return this.getMockResponse(userMessage);
    }
  }

  getMockResponse(userMessage) {
    const responses = [
      "Thank you for reaching out. I understand your concern and I'm here to help you find a solution. Can you tell me more about the specific issue you're experiencing?",
      "I appreciate you bringing this to my attention. Let me work with you to resolve this matter. What would be the most helpful way I can assist you today?",
      "I can see this situation is important to you, and I want to make sure we address it properly. Could you provide me with some additional details?",
      "I'm glad you contacted us about this. Finding the right solution is my priority. Let me ask a few questions to better understand your needs.",
      "Thank you for your patience. I'm committed to helping you resolve this issue. What specific outcome would be most valuable for you?"
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  }

  async generateInitialMessage(scenario) {
    if (this.useMockResponses) {
      return `Hello! I'm your ${scenario.bot_character}. I'm here to help you practice ${scenario.title.toLowerCase()}. How can I assist you today?`;
    }

    try {
      const prompt = `You are a ${scenario.bot_character} in a roleplay training scenario. Generate an engaging opening message to start the training session.

SCENARIO DETAILS:
- Title: ${scenario.title}
- Description: ${scenario.description}  
- Your Character: ${scenario.bot_character}
- Tone: ${scenario.bot_tone}
- Context: ${scenario.bot_context}

Generate a natural, engaging opening message that:
1. Stays in character as ${scenario.bot_character}
2. Sets up the training scenario naturally
3. Invites the student to begin practicing
4. Uses a ${scenario.bot_tone} tone

Keep it conversational and under 100 words.`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      
      if (!response || !response.text) {
        return `Hello! I'm your ${scenario.bot_character}. I'm here to help you practice ${scenario.title.toLowerCase()}. How can I assist you today?`;
      }
      
      return response.text();
    } catch (error) {
      console.error('Initial message generation error:', error);
      return `Hello! I'm your ${scenario.bot_character}. I'm here to help you practice ${scenario.title.toLowerCase()}. How can I assist you today?`;
    }
  }
}

export default GeminiAI;
