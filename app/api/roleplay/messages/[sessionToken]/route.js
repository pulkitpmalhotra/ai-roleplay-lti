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

    const messages = engine.getSessionMessages(session.id);

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