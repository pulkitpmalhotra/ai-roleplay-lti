import { NextResponse } from 'next/server';
import { SupabaseHelper } from '../../../../lib/database-supabase';
import LTIProvider from '../../../../lib/lti-provider';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const params = {};
    
    // Convert FormData to regular object
    for (const [key, value] of formData.entries()) {
      params[key] = value;
    }

    console.log('LTI Launch Parameters:', params);

    const ltiProvider = new LTIProvider();
    let validLaunch = false;
    let userInfo = null;

    // Try LTI 1.3 first (JWT token)
    if (params.id_token) {
      console.log('Attempting LTI 1.3 validation...');
      const decodedToken = ltiProvider.validateLTI13Launch(params.id_token);
      if (decodedToken) {
        validLaunch = true;
        userInfo = ltiProvider.extractUserInfo(decodedToken);
        console.log('LTI 1.3 validation successful');
      }
    }

    // Fallback to LTI 1.1 (OAuth signature)
    if (!validLaunch && params.oauth_signature) {
      console.log('Attempting LTI 1.1 validation...');
      const url = `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}/api/lti/launch`;
      validLaunch = ltiProvider.validateLTI11Launch(
        params, 
        params.oauth_signature, 
        'POST', 
        url
      );
      
      if (validLaunch) {
        userInfo = ltiProvider.extractUserInfo(params);
        console.log('LTI 1.1 validation successful');
      }
    }

    if (!validLaunch) {
      console.error('LTI launch validation failed');
      return NextResponse.json({ 
        error: 'Invalid LTI launch' 
      }, { status: 401 });
    }

    // Store or update user information using Supabase
    const db = new SupabaseHelper();
    const user = await db.createOrUpdateUser(userInfo.ltiUserId, {
      name: userInfo.name,
      email: userInfo.email,
      role: userInfo.role
    });

    const userId = user.id;

    // For admin users, redirect to admin dashboard
    if (userInfo.role === 'admin' || userInfo.role === 'instructor') {
      const adminUrl = `/admin?user_id=${userId}&context_id=${userInfo.contextId}`;
      return NextResponse.redirect(new URL(adminUrl, request.url));
    }

    // For students, show scenario selection
    const studentUrl = `/select-scenario?user_id=${userId}&context_id=${userInfo.contextId}&resource_link_id=${userInfo.resourceLinkId}`;
    return NextResponse.redirect(new URL(studentUrl, request.url));

  } catch (error) {
    console.error('LTI launch error:', error);
    return NextResponse.json({ 
      error: 'LTI launch failed', 
      details: error.message 
    }, { status: 500 });
  }
}

// Handle GET requests for testing
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Simple test launch for development
    if (searchParams.get('test') === 'true') {
      const testUrl = `/select-scenario?user_id=1&context_id=test&resource_link_id=test`;
      return NextResponse.redirect(new URL(testUrl, request.url));
    }

    return NextResponse.json({ 
      message: 'LTI Launch endpoint. Use POST for actual launches.',
      test_url: `${request.url}?test=true`,
      supported_versions: ['LTI 1.1', 'LTI 1.3'],
      configuration: {
        launch_url: `${process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL}/api/lti/launch`,
        version: 'LTI 1.1 & 1.3 Compatible',
        privacy: 'Name, Email, Role',
        features: 'Grade Passback, Deep Linking'
      }
    });
  } catch (error) {
    console.error('LTI GET error:', error);
    return NextResponse.json({ 
      error: 'LTI endpoint error', 
      details: error.message 
    }, { status: 500 });
  }
}
