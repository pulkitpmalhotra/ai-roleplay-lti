// =============================================================================
// lib/roleplay-engine-supabase.js - Clean roleplay engine using only Supabase
// =============================================================================

import GeminiAI from './ai-integration-supabase';
import { SupabaseHelper } from './database-supabase';

class SimpleRoleplayEngine {
  constructor() {
    this.ai = new GeminiAI();
    this.db = new SupabaseHelper();
  }

  async createSession(userId, scenarioId, ltiContext = {}) {
    try {
      const scenario = await this.db.getScenario(scenarioId);
      if (!scenario) {
        throw new Error('Scenario not found');
      }

      await this.ensureUser(userId, ltiContext);

      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const sessionData = {
        user_id: parseInt(userId),
        scenario_id: parseInt(scenarioId),
        lti_context_id: ltiContext.contextId || 'demo',
        lti_resource_link_id: ltiContext.resourceLinkId || 'demo',
        session_token: sessionToken,
        status: 'active',
        total_messages: 0,
        completion_percentage: 0,
        final_grade: 0.0
      };

      const session = await this.db.createSession(sessionData);
      
      const objectives = scenario.learning_objectives;
      const parsedObjectives = typeof objectives === 'string' ? JSON.parse(objectives) : objectives;
      
      if (parsedObjectives && parsedObjectives.length > 0) {
        await this.db.initializeLearningProgress(session.id, parsedObjectives);
      }

      const initialMessage = await this.ai.generateInitialMessage(scenario);
      await this.db.saveMessage(session.id, 'assistant', initialMessage);

      return {
        sessionId: session.id,
        sessionToken: sessionToken,
        scenario
      };
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async ensureUser(userId, ltiContext = {}) {
    try {
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
}

export default SimpleRoleplayEngine;
