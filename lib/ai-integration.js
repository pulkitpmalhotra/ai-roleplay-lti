const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiAI {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.GOOGLE_API_KEY || process.env.EMERGENT_LLM_KEY;
    if (!this.apiKey) {
      throw new Error('Google API key is required for Gemini integration');
    }
    
    this.genAI = new GoogleGenerativeAI(this.apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  async generateResponse(systemPrompt, userMessage, conversationHistory = []) {
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
      const response = result.response;
      
      if (!response || !response.text) {
        throw new Error('No response generated from Gemini');
      }
      
      return response.text();
    } catch (error) {
      console.error('Gemini AI error:', error);
      
      // Fallback response if AI fails
      return `I apologize, but I'm having trouble responding right now. Could you please rephrase your message? I'm here to help you practice and learn.`;
    }
  }

  async analyzeForLearningObjectives(userMessage, aiResponse, objectives) {
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
      const response = result.response.text();
      
      try {
        // Try to parse the JSON response
        const analysis = JSON.parse(response.replace(/```json|```/g, '').trim());
        return Array.isArray(analysis) ? analysis : [];
      } catch (parseError) {
        console.error('Failed to parse learning objective analysis:', parseError);
        return [];
      }
    } catch (error) {
      console.error('Learning objective analysis error:', error);
      return [];
    }
  }

  async generateInitialMessage(scenario) {
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
      const response = result.response;
      
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

module.exports = GeminiAI;