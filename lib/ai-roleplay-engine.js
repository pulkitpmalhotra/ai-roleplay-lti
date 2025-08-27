import GeminiAI from './ai-integration-fixed';
import { SupabaseHelper } from './database-supabase';

class AIRoleplayEngine {
  constructor() {
    this.ai = new GeminiAI();
    this.db = new SupabaseHelper();
  }

  // Create new roleplay session
  async createSession(userId, scenarioId, ltiContext = {}) {
    try {
      const scenario = await this.db.getScenario(scenarioId);
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
        total_messages: 0,
        completion_percentage: 0,
        final_grade: 0.0
      };

      const sessionResult = await this.db.createSession(sessionData);
      const sessionId = sessionResult.id;

      // Initialize learning objectives tracking
      const objectives = scenario.learning_objectives || [];
      const parsedObjectives = typeof objectives === 'string' ? JSON.parse(objectives) : objectives;
      
      if (parsedObjectives.length > 0) {
        await this.db.initializeLearningProgress(sessionId, parsedObjectives);
      }

      // Generate and save initial AI message
      try {
        const initialMessage = await this.ai.generateInitialMessage(scenario);
        await this.db.saveMessage(sessionId, 'assistant', initialMessage);
      } catch (error) {
        console.error('Error generating initial message:', error);
        // Save a fallback message
        await this.db.saveMessage(sessionId, 'assistant', 
          `Hello! I'm your ${scenario.bot_character}. I'm ready to help you practice ${scenario.title.toLowerCase()}. How can I assist you today?`
        );
      }

      return {
        sessionId,
        sessionToken,
        scenario
      };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  // Ensure user exists in database
  async ensureUser(userId, ltiContext = {}) {
    try {
      // For now, we'll create a basic user if it doesn't exist
      // In production, this would be handled by the LTI launch
      const userData = {
        lti_user_id: ltiContext.ltiUserId || `user_${userId}`,
        name: ltiContext.name || `User ${userId}`,
        email: ltiContext.email || `user${userId}@example.com`,
        role: ltiContext.role || 'student'
      };
      
      await this.db.createOrUpdateUser(userData.lti_user_id, userData);
    } catch (error) {
      console.error('Error ensuring user exists:', error);
    }
  }

  // Generate AI response for roleplay
  async generateResponse(sessionId, userMessage) {
    try {
      // Get session and scenario details
      const session = await this.db.getSessionByToken(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      const scenario = await this.db.getScenario(session.scenario_id);
      if (!scenario) {
        throw new Error('Scenario not found');
      }

      // Get conversation history
      const messages = await this.db.getSessionMessages(session.id);

      // Save user message first
      await this.db.saveMessage(session.id, 'user', userMessage);

      // Build system prompt
      const systemPrompt = this.buildSystemPrompt(scenario);

      // Generate AI response using Gemini
      const response = await this.ai.generateResponse(systemPrompt, userMessage, messages);

      // Save AI response
      await this.db.saveMessage(session.id, 'assistant', response);

      // Update session statistics
      await this.updateSessionStats(session.id);

      // Analyze learning progress using AI
      await this.analyzeLearningProgress(session.id, userMessage, response, scenario);

      return {
        response,
        progress: await this.db.getSessionProgress(session.id),
        completionPercentage: await this.calculateCompletionPercentage(session.id)
      };

    } catch (error) {
      console.error('AI roleplay error:', error);
      
      // Return fallback response
      const fallbackResponse = `I apologize, but I'm experiencing some technical difficulties. Please try again, and I'll do my best to help you with your training.`;
      
      return {
        response: fallbackResponse,
        progress: [],
        completionPercentage: 0
      };
    }
  }

  // Build system prompt for scenario
  buildSystemPrompt(scenario) {
    const objectives = scenario.learning_objectives || [];
    const parsedObjectives = typeof objectives === 'string' ? JSON.parse(objectives) : objectives;
    
    return `You are a ${scenario.bot_character} in a professional roleplay training scenario.

SCENARIO DETAILS:
- Title: ${scenario.title}
- Description: ${scenario.description}
- Learning Objective: ${scenario.objective}
- Your Character: ${scenario.bot_character}
- Tone: ${scenario.bot_tone}
- Context: ${scenario.bot_context}

LEARNING OBJECTIVES TO HELP STUDENT ACHIEVE:
${parsedObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

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

  // Update session statistics
  async updateSessionStats(sessionId) {
    try {
      const messages = await this.db.getSessionMessages(sessionId);
      await this.db.updateSession(sessionId, { total_messages: messages.length });
    } catch (error) {
      console.error('Error updating session stats:', error);
    }
  }

  // Analyze learning progress using AI
  async analyzeLearningProgress(sessionId, userMessage, aiResponse, scenario) {
    try {
      const objectives = scenario.learning_objectives || [];
      const parsedObjectives = typeof objectives === 'string' ? JSON.parse(objectives) : objectives;
      
      if (parsedObjectives.length === 0) return;

      // Use AI to analyze learning objectives
      const analysis = await this.ai.analyzeForLearningObjectives(userMessage, aiResponse, parsedObjectives);
      
      // Update database based on AI analysis
      for (let index = 0; index < analysis.length && index < parsedObjectives.length; index++) {
        const result = analysis[index];
        if (result.achieved && result.confidence > 0.7) {
          const objectiveKey = `obj_${index}`;
          await this.db.updateProgress(sessionId, objectiveKey, true, result.confidence);
        }
      }

      // Update overall completion percentage
      await this.updateCompletionPercentage(sessionId);

    } catch (error) {
      console.error('Learning progress analysis error:', error);
      
      // Fallback to simple analysis if AI fails
      await this.simpleLearningProgressAnalysis(sessionId, userMessage, scenario);
    }
  }

  // Fallback simple learning progress analysis
  async simpleLearningProgressAnalysis(sessionId, userMessage, scenario) {
    try {
      const objectives = scenario.learning_objectives || [];
      const parsedObjectives = typeof objectives === 'string' ? JSON.parse(objectives) : objectives;
      const lowerMessage = userMessage.toLowerCase();
      
      for (let index = 0; index < parsedObjectives.length; index++) {
        const objectiveKey = `obj_${index}`;
        let achieved = false;
        
        // Simple keyword matching for common scenarios
        if (lowerMessage.includes('help') || lowerMessage.includes('please') ||
            lowerMessage.includes('understand') || lowerMessage.includes('problem') ||
            lowerMessage.includes('sorry') || lowerMessage.includes('thank')) {
          achieved = Math.random() > 0.6; // 40% chance of achievement
        }
        
        if (achieved) {
          await this.db.updateProgress(sessionId, objectiveKey, true, 0.8);
        }
      }

      await this.updateCompletionPercentage(sessionId);
    } catch (error) {
      console.error('Simple learning progress analysis error:', error);
    }
  }

  // Calculate completion percentage
  async calculateCompletionPercentage(sessionId) {
    try {
      const progress = await this.db.getSessionProgress(sessionId);
      if (progress.length === 0) return 0;

      const achieved = progress.filter(p => p.achieved).length;
      return Math.round((achieved / progress.length) * 100);
    } catch (error) {
      console.error('Error calculating completion percentage:', error);
      return 0;
    }
  }

  // Update completion percentage
  async updateCompletionPercentage(sessionId) {
    try {
      const percentage = await this.calculateCompletionPercentage(sessionId);
      
      await this.db.updateSession(sessionId, { 
        completion_percentage: percentage 
      });

      // If 100% complete, mark session as completed
      if (percentage === 100) {
        await this.completeSession(sessionId);
      }
    } catch (error) {
      console.error('Error updating completion percentage:', error);
    }
  }

  // Complete session
  async completeSession(sessionId) {
    try {
      const grade = await this.calculateFinalGrade(sessionId);
      
      await this.db.updateSession(sessionId, {
        status: 'completed',
        end_time: new Date().toISOString(),
        final_grade: grade
      });
    } catch (error) {
      console.error('Error completing session:', error);
    }
  }

  // Calculate final grade
  async calculateFinalGrade(sessionId) {
    try {
      const progress = await this.db.getSessionProgress(sessionId);
      if (progress.length === 0) return 0;

      const totalScore = progress.reduce((sum, p) => sum + (p.score || 0), 0);
      return Math.round((totalScore / progress.length) * 100) / 100;
    } catch (error) {
      console.error('Error calculating final grade:', error);
      return 0;
    }
  }

  // Get session by token
  async getSessionByToken(sessionToken) {
    try {
      return await this.db.getSessionByToken(sessionToken);
    } catch (error) {
      console.error('Error getting session by token:', error);
      return null;
    }
  }

  // Get session messages
  async getSessionMessages(sessionId) {
    try {
      return await this.db.getSessionMessages(sessionId);
    } catch (error) {
      console.error('Error getting session messages:', error);
      return [];
    }
  }

  // Get session progress
  async getSessionProgress(sessionId) {
    try {
      return await this.db.getSessionProgress(sessionId);
    } catch (error) {
      console.error('Error getting session progress:', error);
      return [];
    }
  }
}

export default AIRoleplayEngine;
