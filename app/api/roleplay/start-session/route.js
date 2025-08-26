import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import AIRoleplayEngine from '../../../../lib/ai-roleplay-engine';

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
        error: 'Missing required parameters'
      }, { status: 400 });
    }

    const engine = new AIRoleplayEngine();
    const session = await engine.createSession(
      parseInt(userId), 
      parseInt(scenarioId), 
      { contextId, resourceLinkId }
    );

    // Redirect to roleplay interface
    return redirect(`/roleplay/${session.sessionToken}`);

  } catch (error) {
    console.error('Error starting roleplay session:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to start roleplay session'
    }, { status: 500 });
  }
}