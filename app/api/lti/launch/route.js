import { NextResponse } from 'next/server';

// COMPLETELY MINIMAL LTI LAUNCH - NO DATABASE IMPORTS AT ALL
// This will help us isolate if the SQLite error is coming from imports

export async function GET(request) {
  try {
    console.log('Ultra-minimal LTI GET request received');
    const { searchParams } = new URL(request.url);
    
    // Simple test launch - just redirect, no database
    if (searchParams.get('test') === 'true') {
      console.log('Test launch - redirecting to scenario selection');
      const testUrl = `/select-scenario?user_id=1&context_id=test&resource_link_id=test&source=lti_test`;
      return NextResponse.redirect(new URL(testUrl, request.url));
    }

    // Return basic info
    return NextResponse.json({ 
      success: true,
      message: 'Ultra-minimal LTI Launch endpoint is working',
      test_url: `${request.url}?test=true`,
      timestamp: new Date().toISOString(),
      environment: {
        node_env: process.env.NODE_ENV,
        vercel_url: process.env.VERCEL_URL,
        has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        has_supabase_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      }
    });
    
  } catch (error) {
    console.error('Ultra-minimal LTI GET error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'LTI endpoint error', 
      details: error.message,
      stack: error.stack.split('\n').slice(0, 5) // First 5 lines of stack
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    console.log('Ultra-minimal LTI POST request received');
    
    // Just redirect - no validation, no database
    const testUrl = `/select-scenario?user_id=1&context_id=test&resource_link_id=test&source=lti_post`;
    return NextResponse.redirect(new URL(testUrl, request.url));

  } catch (error) {
    console.error('Ultra-minimal LTI POST error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'LTI POST error', 
      details: error.message,
      stack: error.stack.split('\n').slice(0, 5)
    }, { status: 500 });
  }
}
