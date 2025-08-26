import { NextResponse } from 'next/server';
import AIRoleplayEngine from '../../../../lib/ai-roleplay-engine';
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
    const session = engine.getSessionByToken(sessionToken);
    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Invalid session token'
      }, { status: 404 });
    }

    // Generate AI response
    const result = await engine.generateResponse(session.id, message.trim());

    // Send grade passback if session is completed
    if (result.completionPercentage === 100) {
      try {
        const ltiProvider = new LTIProvider();
        // Note: In production, you would get these from the LTI launch parameters
        // For now, we'll log that grading would happen here
        console.log(`Session ${session.id} completed with grade: ${session.final_grade}`);
        
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