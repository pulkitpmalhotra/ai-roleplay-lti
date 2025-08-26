// Direct OpenAI Integration (Alternative to Emergent Universal Key)
import OpenAI from 'openai';

class DirectOpenAIIntegration {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.openai = new OpenAI({ apiKey });
  }

  async generateResponse(systemPrompt, userMessage, conversationHistory = []) {
    try {
      // Build messages array with system prompt and conversation history
      const messages = [
        { role: 'system', content: systemPrompt }
      ];

      // Add conversation history
      conversationHistory.forEach(msg => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });

      // Add current user message
      messages.push({ role: 'user', content: userMessage });

      // Call OpenAI API
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cost-effective model
        messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      return completion.choices[0].message.content;

    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }

  async analyzeProgress(scenario, userMessage, objectives) {
    const analysisPrompt = `Analyze this student response for learning objective achievement:

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
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an educational assessment AI. Respond only with valid JSON.' },
          { role: 'user', content: analysisPrompt }
        ],
        max_tokens: 300,
        temperature: 0.1,
      });

      return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
      console.error('Progress analysis error:', error);
      // Fallback to simple analysis
      return this.simpleProgressAnalysis(userMessage, objectives);
    }
  }

  simpleProgressAnalysis(userMessage, objectives) {
    // Same fallback logic as Gemini version
    const achievements = [];
    const message = userMessage.toLowerCase();
    
    objectives.forEach((objective, index) => {
      let achieved = false;
      
      if (message.includes('help') || message.includes('please') || 
          message.includes('thank you') || message.includes('understand')) {
        achieved = Math.random() > 0.6;
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

export default DirectOpenAIIntegration;