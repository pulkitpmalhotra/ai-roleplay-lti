import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    console.log('LTI POST request received');
    
    const formData = await request.formData();
    const params = {};
    
    // Convert FormData to regular object
    for (const [key, value] of formData.entries()) {
      params[key] = value;
    }

    console.log('LTI Launch Parameters:', Object.keys(params));

    // For now, just redirect to scenario selection without validation
    const studentUrl = `/select-scenario?user_id=1&context_id=test&resource_link_id=test`;
    return NextResponse.redirect(new URL(studentUrl, request.url));

  } catch (error) {
    console.error('LTI launch error:', error);
    return NextResponse.json({ 
      error: 'LTI launch failed', 
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}

// Handle GET requests for testing
export async function GET(request) {
  try {
    console.log('LTI GET request received');
    const { searchParams } = new URL(request.url);
    
    // Simple test launch for development
    if (searchParams.get('test') === 'true') {
      console.log('Test launch requested - redirecting to scenario selection');
      const testUrl = `/select-scenario?user_id=1&context_id=test&resource_link_id=test`;
      return NextResponse.redirect(new URL(testUrl, request.url));
    }

    return NextResponse.json({ 
      success: true,
      message: 'LTI Launch endpoint is working',
      test_url: `${request.url}?test=true`,
      timestamp: new Date().toISOString(),
      configuration: {
        launch_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'https://your-app.vercel.app'}/api/lti/launch`,
        version: 'LTI 1.1 & 1.3 Compatible',
        privacy: 'Name, Email, Role',
        features: 'Grade Passback, Deep Linking'
      }
    });
  } catch (error) {
    console.error('LTI GET error:', error);
    return NextResponse.json({ 
      error: 'LTI endpoint error', 
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
