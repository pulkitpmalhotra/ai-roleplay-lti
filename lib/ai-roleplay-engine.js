const GeminiAI = require('./ai-integration');
const { getDatabase } = require('./database-mongodb');
const { ObjectId } = require('mongodb');

class AIRoleplayEngine {
  constructor() {
    this.ai = new GeminiAI();
  }

  async getDB() {
    return await getDatabase();
  }

  // Create new roleplay session
  async createSession(userId, scenarioId, ltiContext = {}) {
    const db = await this.getDB();
    const scenario = await this.getScenario(scenarioId);
    if (!scenario) {
      throw new Error('Scenario not found');
    }

    // Ensure user exists
    await this.ensureUser(userId, ltiContext);

    // Create learning session record
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const sessionData = {
      user_id: userId,
      scenario_id: scenarioId,
      lti_context_id: ltiContext.contextId || 'demo',
      lti_resource_link_id: ltiContext.resourceLinkId || 'demo',
      session_token: sessionToken,
      status: 'active',
      start_time: new Date(),
      total_messages: 0,
      completion_percentage: 0,
      final_grade: 0.0
    };

    const result = await db.collection('learning_sessions').insertOne(sessionData);
    const sessionId = result.insertedId.toString();

    // Initialize learning objectives tracking
    const objectives = scenario.learning_objectives || [];
    const progressData = objectives.map((objective, index) => ({
      session_id: new ObjectId(sessionId),
      objective_key: `obj_${index}`,
      objective_description: objective,
      achieved: false,
      score: 0.0,
      created_at: new Date()
    }));

    if (progressData.length > 0) {
      await db.collection('learning_progress').insertMany(progressData);
    }

    // Generate and save initial AI message
    try {
      const initialMessage = await this.ai.generateInitialMessage(scenario);
      await this.saveMessage(sessionId, 'assistant', initialMessage);
    } catch (error) {
      console.error('Error generating initial message:', error);
      // Save a fallback message
      await this.saveMessage(sessionId, 'assistant', `Hello! I'm your ${scenario.bot_character}. I'm ready to help you practice ${scenario.title.toLowerCase()}. How can I assist you today?`);
    }

    return {
      sessionId,
      sessionToken,
      scenario
    };
  }

  // Ensure user exists in database
  async ensureUser(userId, ltiContext = {}) {
    try {
      const db = await this.getDB();
      const existingUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });
      
      if (!existingUser) {
        // Create a basic user record if it doesn't exist
        const userData = {
          lti_user_id: ltiContext.ltiUserId || `user_${userId}`,
          name: ltiContext.name || `User ${userId}`,
          email: ltiContext.email || `user${userId}@example.com`,
          role: ltiContext.role || 'student',
          created_at: new Date()
        };
        
        await db.collection('users').insertOne(userData);
      }
    } catch (error) {
      console.error('Error ensuring user exists:', error);
    }
  }

  // Get scenario by ID
  async getScenario(scenarioId) {
    const db = await this.getDB();
    return await db.collection('scenarios').findOne({ 
      _id: new ObjectId(scenarioId), 
      is_active: true 
    });
  }

  // Get all active scenarios
  async getAllScenarios() {
    const db = await this.getDB();
    return await db.collection('scenarios')
      .find({ is_active: true })
      .sort({ created_at: -1 })
      .toArray();
  }

  // Generate AI response for roleplay
  async generateResponse(sessionId, userMessage) {
    try {
      // Get session and scenario details
      const session = await this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const scenario = await this.getScenario(session.scenario_id);
      if (!scenario) {
        throw new Error('Scenario not found');
      }

      // Get conversation history
      const messages = await this.getSessionMessages(sessionId);

      // Save user message first
      await this.saveMessage(sessionId, 'user', userMessage);

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(scenario);

      // Generate AI response using Gemini
      const response = await this.ai.generateResponse(systemPrompt, userMessage, messages);

      // Save AI response
      await this.saveMessage(sessionId, 'assistant', response);

      // Update session statistics
      await this.updateSessionStats(sessionId);

      // Analyze learning progress using AI
      await this.analyzeLearningProgress(sessionId, userMessage, response, scenario);

      return {
        response,
        progress: await this.getSessionProgress(sessionId),
        completionPercentage: await this.calculateCompletionPercentage(sessionId)
      };

    } catch (error) {
      console.error('AI roleplay error:', error);
      
      // Save user message even if AI fails
      try {
        await this.saveMessage(sessionId, 'user', userMessage);
        const fallbackResponse = `I apologize, but I'm experiencing some technical difficulties. Please try again, and I'll do my best to help you with your training.`;
        await this.saveMessage(sessionId, 'assistant', fallbackResponse);
        
        return {
          response: fallbackResponse,
          progress: await this.getSessionProgress(sessionId),
          completionPercentage: await this.calculateCompletionPercentage(sessionId)
        };
      } catch (saveError) {
        console.error('Error saving fallback message:', saveError);
        throw new Error('Failed to process message');
      }
    }
  }

  // Build system prompt for scenario
  buildSystemPrompt(scenario) {
    const objectives = scenario.learning_objectives || [];
    
    return `You are a ${scenario.bot_character} in a professional roleplay training scenario.

SCENARIO DETAILS:
- Title: ${scenario.title}
- Description: ${scenario.description}
- Learning Objective: ${scenario.objective}
- Your Character: ${scenario.bot_character}
- Tone: ${scenario.bot_tone}
- Context: ${scenario.bot_context}

LEARNING OBJECTIVES TO HELP STUDENT ACHIEVE:
${objectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

INSTRUCTIONS:
1. Stay completely in character as ${scenario.bot_character}
2. Maintain a ${scenario.bot_tone} tone throughout the conversation
3. Create realistic, challenging scenarios that help students practice the learning objectives
4. Provide constructive feedback when students demonstrate good skills
5. Gradually escalate difficulty to help students grow
6. Keep responses conversational and engaging (2-4 sentences typical)
7. Don't break character or mention that you're an AI
8. Focus on helping students achieve the learning objectives through practice
9. Be encouraging but realistic in your responses
10. Challenge students appropriately to help them improve

IMPORTANT: Respond only as ${scenario.bot_character}. Do not provide meta-commentary or break character. Keep responses natural and conversational.`;
  }

  // Get session details
  async getSession(sessionId) {
    const db = await this.getDB();
    return await db.collection('learning_sessions').findOne({ _id: new ObjectId(sessionId) });
  }

  // Get session messages
  async getSessionMessages(sessionId) {
    const db = await this.getDB();
    return await db.collection('messages')
      .find({ session_id: new ObjectId(sessionId) })
      .sort({ timestamp: 1 })
      .toArray();
  }

  // Save message to database
  async saveMessage(sessionId, role, content) {
    const db = await this.getDB();
    const tokenCount = this.estimateTokens(content);
    
    await db.collection('messages').insertOne({
      session_id: new ObjectId(sessionId),
      role,
      content,
      token_count: tokenCount,
      timestamp: new Date()
    });
  }

  // Update session statistics
  async updateSessionStats(sessionId) {
    const db = await this.getDB();
    const messageCount = await db.collection('messages')
      .countDocuments({ session_id: new ObjectId(sessionId) });

    await db.collection('learning_sessions').updateOne(
      { _id: new ObjectId(sessionId) },
      { $set: { total_messages: messageCount } }
    );
  }

  // Estimate token count (rough approximation)
  estimateTokens(text) {
    return Math.ceil(text.split(/\s+/).length * 1.3);
  }

  // Get session by token
  async getSessionByToken(sessionToken) {
    const db = await this.getDB();
    const pipeline = [
      {
        $match: { session_token: sessionToken }
      },
      {
        $lookup: {
          from: 'scenarios',
          localField: 'scenario_id',
          foreignField: '_id',
          as: 'scenario'
        }
      },
      {
        $unwind: '$scenario'
      }
    ];
    
    const result = await db.collection('learning_sessions').aggregate(pipeline).toArray();
    return result[0] || null;
  }
}

module.exports = AIRoleplayEngine;

module.exports = AIRoleplayEngine;