import { NextResponse } from 'next/server';
import AIRoleplayEngine from '../../../../lib/ai-roleplay-engine';

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