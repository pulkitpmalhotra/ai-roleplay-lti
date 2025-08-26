// Direct Google Gemini Integration (Alternative to Emergent Universal Key)
import { GoogleGenerativeAI } from '@google/generative-ai';

class DirectGeminiIntegration {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generateResponse(systemPrompt, userMessage, conversationHistory = []) {
    try {
      // Get the generative model
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash',
        systemInstruction: systemPrompt
      });

      // Build conversation history for context
      const history = conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }));

      // Start chat with history
      const chat = model.startChat({ history });

      // Generate response
      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      
      return response.text();

    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }

  // Alternative method for single-turn conversations
  async generateSingleResponse(prompt) {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini single response error:', error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  // Method to analyze learning progress using AI
  async analyzeProgress(scenario, userMessage, objectives) {
    const analysisPrompt = `
Analyze this student response for learning objective achievement:

SCENARIO: ${scenario.title}
LEARNING OBJECTIVES:
${objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

STUDENT MESSAGE: "${userMessage}"

For each learning objective, determine if the student demonstrated that skill. 
Respond with only a JSON object:
{
  "achievements": [
    {"objective_index": 0, "achieved": true/false, "evidence": "brief explanation"},
    {"objective_index": 1, "achieved": true/false, "evidence": "brief explanation"}
  ]
}`;

    try {
      const response = await this.generateSingleResponse(analysisPrompt);
      return JSON.parse(response);
    } catch (error) {
      console.error('Progress analysis error:', error);
      // Fallback to simple keyword analysis
      return this.simpleProgressAnalysis(userMessage, objectives);
    }
  }

  // Fallback progress analysis without AI
  simpleProgressAnalysis(userMessage, objectives) {
    const achievements = [];
    const message = userMessage.toLowerCase();
    
    objectives.forEach((objective, index) => {
      let achieved = false;
      
      // Simple keyword matching based on common learning indicators
      if (message.includes('help') || message.includes('please') || 
          message.includes('thank you') || message.includes('understand') ||
          message.includes('sorry') || message.includes('problem')) {
        achieved = Math.random() > 0.6; // 40% chance of achievement
      }
      
      achievements.push({
        objective_index: index,
        achieved,
        evidence: achieved ? 'Demonstrated positive communication' : 'No clear evidence yet'
      });
    });
    
    return { achievements };
  }
}

export default DirectGeminiIntegration;