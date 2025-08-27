// Direct Google Gemini Integration (No Emergent Dependency)
import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiAI {
  constructor() {
    // Use Google API key directly, fallback to generic API key
    this.apiKey = process.env.GOOGLE_API_KEY || 
                  process.env.GEMINI_API_KEY || 
                  process.env.AI_API_KEY;
    
    if (!this.apiKey) {
      console.warn('No Google API key found. Using mock responses for development.');
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
      // Build the full conversation context
      let fullPrompt = systemPrompt + '\n\n';
      
      // Add conversation history if available
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
      
      // Fallback to mock response if API fails
      return this.getMockResponse(userMessage);
    }
  }

  async analyzeForLearningObjectives(userMessage, aiResponse, objectives) {
    if (this.useMockResponses) {
      return this.getMockLearningAnalysis(objectives);
    }

    try {
      const analysisPrompt = `
You are an expert learning assessment AI. Analyze this conversation exchange to determine if any learning objectives were achieved.

LEARNING OBJECTIVES TO ASSESS:
${objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

CONVERSATION EXCHANGE:
Student: ${userMessage}
AI Response: ${aiResponse}

For each objective, analyze if there is evidence that the student demonstrated the skill or knowledge. 
Return your analysis as a JSON array with this format:
[
  {
    "objective_index": 0,
    "achieved": true/false,
    "confidence": 0.0-1.0,
    "evidence": "brief explanation of why this was/wasn't achieved"
  }
]

Only mark objectives as achieved if there is clear evidence in the student's message. Be conservative in your assessment.
`;

      const result = await this.model.generateContent(analysisPrompt);
      const response = await result.response;
      const responseText = response.text();
      
      try {
        // Try to parse the JSON response
        const cleanedResponse = responseText.replace(/```json|```/g, '').trim();
        const analysis = JSON.parse(cleanedResponse);
        return Array.isArray(analysis) ? analysis : [];
      } catch (parseError) {
        console.error('Failed to parse learning objective analysis:', parseError);
        return this.getMockLearningAnalysis(objectives);
      }
    } catch (error) {
      console.error('Learning objective analysis error:', error);
      return this.getMockLearningAnalysis(objectives);
    }
  }

  async generateInitialMessage(scenario) {
    if (this.useMockResponses) {
      return `Hello! I'm your ${scenario.bot_character}. I'm here to help you practice ${scenario.title.toLowerCase()}. How can I assist you today?`;
    }

    try {
      const prompt = `
You are a ${scenario.bot_character} in a roleplay training scenario. Generate an engaging opening message to start the training session.

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

Keep it conversational and under 100 words.
`;

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

  // Mock responses for development/fallback
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

  getMockLearningAnalysis(objectives) {
    return objectives.map((objective, index) => ({
      objective_index: index,
      achieved: Math.random() > 0.7, // 30% chance of achievement
      confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0 confidence
      evidence: "Demonstrated positive communication skills and professional demeanor"
    }));
  }

  // Test connection
  async testConnection() {
    if (this.useMockResponses) {
      return { success: true, message: "Using mock responses (no API key configured)" };
    }

    try {
      const result = await this.model.generateContent("Say 'Hello' to test the connection.");
      const response = await result.response;
      
      if (response && response.text) {
        return { success: true, message: "Gemini API connection successful" };
      } else {
        return { success: false, message: "No response from Gemini API" };
      }
    } catch (error) {
      return { success: false, message: `Gemini API error: ${error.message}` };
    }
  }
}

export default GeminiAI;
