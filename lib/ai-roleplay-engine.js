const EmergentAI = require('./ai-integration');
const { getDatabase } = require('./database');

class AIRoleplayEngine {
  constructor() {
    this.apiKey = process.env.EMERGENT_LLM_KEY;
    this.db = getDatabase();
  }

  // Create new roleplay session
  async createSession(userId, scenarioId, ltiContext) {
    const scenario = this.getScenario(scenarioId);
    if (!scenario) {
      throw new Error('Scenario not found');
    }

    // Create learning session record
    const sessionStmt = this.db.prepare(`
      INSERT INTO learning_sessions 
      (user_id, scenario_id, lti_context_id, lti_resource_link_id, session_token)
      VALUES (?, ?, ?, ?, ?)
    `);

    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const result = sessionStmt.run(
      userId,
      scenarioId,
      ltiContext.contextId,
      ltiContext.resourceLinkId,
      sessionToken
    );

    const sessionId = result.lastInsertRowid;

    // Initialize learning objectives tracking
    const objectives = JSON.parse(scenario.learning_objectives);
    const progressStmt = this.db.prepare(`
      INSERT INTO learning_progress 
      (session_id, objective_key, objective_description)
      VALUES (?, ?, ?)
    `);

    objectives.forEach((objective, index) => {
      progressStmt.run(sessionId, `obj_${index}`, objective);
    });

    return {
      sessionId,
      sessionToken,
      scenario
    };
  }

  // Get scenario by ID
  getScenario(scenarioId) {
    const stmt = this.db.prepare('SELECT * FROM scenarios WHERE id = ? AND is_active = 1');
    return stmt.get(scenarioId);
  }

  // Get all active scenarios
  getAllScenarios() {
    const stmt = this.db.prepare('SELECT * FROM scenarios WHERE is_active = 1 ORDER BY created_at DESC');
    return stmt.all();
  }

  // Generate AI response for roleplay
  async generateResponse(sessionId, userMessage) {
    try {
      // Get session and scenario details
      const session = this.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const scenario = this.getScenario(session.scenario_id);
      if (!scenario) {
        throw new Error('Scenario not found');
      }

      // Get conversation history
      const messages = this.getSessionMessages(sessionId);

      // Save user message
      this.saveMessage(sessionId, 'user', userMessage);

      // Build conversation context
      let conversationContext = '';
      if (messages.length > 0) {
        conversationContext = messages.map(msg => 
          `${msg.role === 'user' ? 'Student' : scenario.bot_character}: ${msg.content}`
        ).join('\n');
      }

      // Create user message with context
      const fullPrompt = conversationContext 
        ? `Previous conversation:\n${conversationContext}\n\nStudent: ${userMessage}`
        : `Student: ${userMessage}`;

      // For now, return a simple mock response until AI integration is fully working
      const response = `Hello! I'm your ${scenario.bot_character}. I understand you said: "${userMessage}". I'm here to help you practice customer service skills. How can I assist you today?`;

      // Save AI response
      this.saveMessage(sessionId, 'assistant', response);

      // Update session statistics
      this.updateSessionStats(sessionId);

      // Analyze learning progress
      await this.analyzeLearningProgress(sessionId, userMessage, response, scenario);

      return {
        response,
        progress: this.getSessionProgress(sessionId),
        completionPercentage: this.calculateCompletionPercentage(sessionId)
      };

    } catch (error) {
      console.error('AI roleplay error:', error);
      throw new Error('Failed to generate roleplay response');
    }
  }

  // Build system prompt for scenario
  buildSystemPrompt(scenario) {
    return `You are a ${scenario.bot_character} in a roleplay training scenario.

SCENARIO DETAILS:
- Title: ${scenario.title}
- Description: ${scenario.description}
- Learning Objective: ${scenario.objective}
- Your Character: ${scenario.bot_character}
- Tone: ${scenario.bot_tone}
- Context: ${scenario.bot_context}

LEARNING OBJECTIVES TO HELP STUDENT ACHIEVE:
${JSON.parse(scenario.learning_objectives).map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

INSTRUCTIONS:
1. Stay completely in character as ${scenario.bot_character}
2. Maintain a ${scenario.bot_tone} tone throughout the conversation
3. Create realistic, challenging scenarios that help students practice the learning objectives
4. Provide constructive feedback when students demonstrate good skills
5. Gradually escalate difficulty to help students grow
6. Keep responses conversational and engaging
7. Don't break character or mention that you're an AI
8. Focus on helping students achieve the learning objectives through practice

IMPORTANT: Respond only as ${scenario.bot_character}. Do not provide meta-commentary or break character.`;
  }

  // Get session details
  getSession(sessionId) {
    const stmt = this.db.prepare('SELECT * FROM learning_sessions WHERE id = ?');
    return stmt.get(sessionId);
  }

  // Get session messages
  getSessionMessages(sessionId) {
    const stmt = this.db.prepare(`
      SELECT * FROM messages 
      WHERE session_id = ? 
      ORDER BY timestamp ASC
    `);
    return stmt.all(sessionId);
  }

  // Save message to database
  saveMessage(sessionId, role, content) {
    const stmt = this.db.prepare(`
      INSERT INTO messages (session_id, role, content, token_count)
      VALUES (?, ?, ?, ?)
    `);
    
    const tokenCount = this.estimateTokens(content);
    stmt.run(sessionId, role, content, tokenCount);
  }

  // Update session statistics
  updateSessionStats(sessionId) {
    const messageCount = this.db.prepare(`
      SELECT COUNT(*) as count FROM messages WHERE session_id = ?
    `).get(sessionId).count;

    const stmt = this.db.prepare(`
      UPDATE learning_sessions 
      SET total_messages = ?
      WHERE id = ?
    `);
    
    stmt.run(messageCount, sessionId);
  }

  // Analyze learning progress using AI
  async analyzeLearningProgress(sessionId, userMessage, aiResponse, scenario) {
    try {
      // Simplified learning progress analysis for demo
      const objectives = JSON.parse(scenario.learning_objectives);

      // Simple keyword-based analysis for demo
      objectives.forEach((objective, index) => {
        const objectiveKey = `obj_${index}`;
        let achieved = false;
        
        // Simple keyword matching for demo
        if (userMessage.toLowerCase().includes('help') || 
            userMessage.toLowerCase().includes('please') ||
            userMessage.toLowerCase().includes('problem')) {
          achieved = Math.random() > 0.7; // Random achievement for demo
        }
        
        if (achieved) {
          const updateStmt = this.db.prepare(`
            UPDATE learning_progress 
            SET achieved = 1, achievement_timestamp = CURRENT_TIMESTAMP, score = 1.0
            WHERE session_id = ? AND objective_key = ?
          `);
          updateStmt.run(sessionId, objectiveKey);
        }
      });

      // Update overall completion percentage
      this.updateCompletionPercentage(sessionId);

    } catch (error) {
      console.error('Learning progress analysis error:', error);
    }
  }

  // Get session progress
  getSessionProgress(sessionId) {
    const stmt = this.db.prepare(`
      SELECT * FROM learning_progress 
      WHERE session_id = ? 
      ORDER BY objective_key
    `);
    return stmt.all(sessionId);
  }

  // Calculate completion percentage
  calculateCompletionPercentage(sessionId) {
    const progress = this.getSessionProgress(sessionId);
    if (progress.length === 0) return 0;

    const achieved = progress.filter(p => p.achieved).length;
    return Math.round((achieved / progress.length) * 100);
  }

  // Update completion percentage
  updateCompletionPercentage(sessionId) {
    const percentage = this.calculateCompletionPercentage(sessionId);
    
    const stmt = this.db.prepare(`
      UPDATE learning_sessions 
      SET completion_percentage = ?
      WHERE id = ?
    `);
    
    stmt.run(percentage, sessionId);

    // If 100% complete, mark session as completed
    if (percentage === 100) {
      this.completeSession(sessionId);
    }
  }

  // Complete session
  completeSession(sessionId) {
    const stmt = this.db.prepare(`
      UPDATE learning_sessions 
      SET status = 'completed', end_time = CURRENT_TIMESTAMP, final_grade = ?
      WHERE id = ?
    `);

    const grade = this.calculateFinalGrade(sessionId);
    stmt.run(grade, sessionId);
  }

  // Calculate final grade
  calculateFinalGrade(sessionId) {
    const progress = this.getSessionProgress(sessionId);
    if (progress.length === 0) return 0;

    const totalScore = progress.reduce((sum, p) => sum + (p.score || 0), 0);
    return Math.round((totalScore / progress.length) * 100) / 100;
  }

  // Estimate token count (rough approximation)
  estimateTokens(text) {
    return Math.ceil(text.split(/\s+/).length * 1.3);
  }

  // Get session by token
  getSessionByToken(sessionToken) {
    const stmt = this.db.prepare(`
      SELECT ls.*, s.title as scenario_title, s.description as scenario_description
      FROM learning_sessions ls
      JOIN scenarios s ON ls.scenario_id = s.id
      WHERE ls.session_token = ?
    `);
    return stmt.get(sessionToken);
  }
}

module.exports = AIRoleplayEngine;