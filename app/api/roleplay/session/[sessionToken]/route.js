import { NextResponse } from 'next/server';
import AIRoleplayEngine from '../../../../../lib/ai-roleplay-engine';

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
    const session = engine.getSessionByToken(sessionToken);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Session not found'
      }, { status: 404 });
    }

    const progress = engine.getSessionProgress(session.id);
    const completionPercentage = engine.calculateCompletionPercentage(session.id);

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