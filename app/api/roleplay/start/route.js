// app/api/roleplay/start/route.js - Fixed for Supabase
import { NextResponse } from 'next/server';
import AIRoleplayEngine from '../../../../lib/ai-roleplay-engine-fixed';

export async function POST(request) {
  try {
    const { userId, scenarioId, contextId, resourceLinkId } = await request.json();
    
    if (!userId || !scenarioId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters'
      }, { status: 400 });
    }

    const engine = new AIRoleplayEngine();
    const session = await engine.createSession(
      userId, 
      scenarioId, 
      { contextId, resourceLinkId }
    );

    return NextResponse.json({
      success: true,
      sessionId: session.sessionId,
      sessionToken: session.sessionToken,
      scenario: {
        title: session.scenario.title,
        description: session.scenario.description,
        character: session.scenario.bot_character
      }
    });

  } catch (error) {
    console.error('Error starting roleplay session:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to start roleplay session'
    }, { status: 500 });
  }
}

// ============================================================================

// app/api/roleplay/chat/route.js - Fixed for Supabase
import { NextResponse } from 'next/server';
import AIRoleplayEngine from '../../../../lib/ai-roleplay-engine-fixed';
import LTIProvider from '../../../../lib/lti-provider';

export async function POST(request) {
  try {
    const { sessionToken, message } = await request.json();
    
    if (!sessionToken || !message) {
      return NextResponse.json({
        success: false,
        error: 'Missing session token or message'
      }, { status: 400 });
    }

    const engine = new AIRoleplayEngine();
    
    // Get session details
    const session = await engine.getSessionByToken(sessionToken);
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Invalid session token'
      }, { status: 404 });
    }

    // Generate AI response
    const result = await engine.generateResponse(sessionToken, message.trim());

    // Send grade passback if session is completed
    if (result.completionPercentage === 100) {
      try {
        const ltiProvider = new LTIProvider();
        console.log(`Session ${sessionToken} completed with grade: ${session.final_grade}`);
        
        // Grade passback would happen here in production:
        // await ltiProvider.sendGrade(outcomeServiceUrl, sourcedId, session.final_grade);
      } catch (gradeError) {
        console.error('Grade passback error:', gradeError);
        // Don't fail the chat response due to grading issues
      }
    }

    return NextResponse.json({
      success: true,
      response: result.response,
      progress: result.progress,
      completionPercentage: result.completionPercentage
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process message'
    }, { status: 500 });
  }
}

// ============================================================================

// app/api/roleplay/session/[sessionToken]/route.js - Fixed for Supabase
import { NextResponse } from 'next/server';
import AIRoleplayEngine from '../../../../../lib/ai-roleplay-engine-fixed';

export async function GET(request, { params }) {
  try {
    const { sessionToken } = params;
    
    if (!sessionToken) {
      return NextResponse.json({
        success: false,
        error: 'Session token required'
      }, { status: 400 });
    }

    const engine = new AIRoleplayEngine();
    const session = await engine.getSessionByToken(sessionToken);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 });
    }

    const progress = await engine.getSessionProgress(session.id);
    const completionPercentage = await engine.calculateCompletionPercentage(session.id);

    return NextResponse.json({
      success: true,
      session,
      progress,
      completionPercentage
    });

  } catch (error) {
    console.error('Session API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load session'
    }, { status: 500 });
  }
}

// ============================================================================

// app/api/roleplay/messages/[sessionToken]/route.js - Fixed for Supabase
import { NextResponse } from 'next/server';
import AIRoleplayEngine from '../../../../../lib/ai-roleplay-engine-fixed';

export async function GET(request, { params }) {
  try {
    const { sessionToken } = params;
    
    if (!sessionToken) {
      return NextResponse.json({
        success: false,
        error: 'Session token required'
      }, { status: 400 });
    }

    const engine = new AIRoleplayEngine();
    const session = await engine.getSessionByToken(sessionToken);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 });
    }

    const messages = await engine.getSessionMessages(session.id);

    return NextResponse.json({
      success: true,
      messages
    });

  } catch (error) {
    console.error('Messages API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to load messages'
    }, { status: 500 });
  }
}
