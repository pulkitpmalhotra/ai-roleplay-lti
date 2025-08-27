import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { SupabaseHelper } from '../../../../lib/database-supabase';

// Simple AI roleplay engine for session creation
class SimpleRoleplayEngine {
  constructor() {
    this.db = new SupabaseHelper();
  }

  async createSession(userId, scenarioId, ltiContext = {}) {
    try {
      // Get scenario details
      const scenario = await this.db.getScenario(scenarioId);
      if (!scenario) {
        throw new Error('Scenario not found');
      }

      // Ensure user exists (create if needed)
      await this.ensureUser(userId, ltiContext);

      // Generate session token
      const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create session data
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

      // Create the session
      const session = await this.db.createSession(sessionData);
      
      // Initialize learning progress if scenario has objectives
      const objectives = scenario.learning_objectives;
      const parsedObjectives = typeof objectives === 'string' ? JSON.parse(objectives) : objectives;
      
      if (parsedObjectives && parsedObjectives.length > 0) {
        await this.db.initializeLearningProgress(session.id, parsedObjectives);
      }

      // Create initial AI message
      const initialMessage = `Hello! I'm your ${scenario.bot_character}. I'm here to help you practice ${scenario.title.toLowerCase()}. How can I assist you today?`;
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

export async function POST(request) {
  try {
    const formData = await request.formData();
    const userId = formData.get('userId');
    const scenarioId = formData.get('scenarioId');
    const contextId = formData.get('contextId');
    const resourceLinkId = formData.get('resourceLinkId');
    
    if (!userId || !scenarioId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: userId and scenarioId'
      }, { status: 400 });
    }

    const engine = new SimpleRoleplayEngine();
    const session = await engine.createSession(
      parseInt(userId), 
      parseInt(scenarioId), 
      { contextId, resourceLinkId }
    );

    // Redirect to roleplay interface
    return redirect(`/roleplay/${session.sessionToken}`);

  } catch (error) {
    console.error('Error starting roleplay session:', error);
    
    // If it's a database error, show a helpful error page
    if (error.message.includes('Scenario not found')) {
      return NextResponse.json({
        success: false,
        error: 'The selected scenario is no longer available. Please choose another scenario.'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to start roleplay session. Please try again.',
      details: error.message
    }, { status: 500 });
  }
}
