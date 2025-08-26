import { NextResponse } from 'next/server';
import { initDatabase } from '../../../../lib/database-mongodb';
import LTIProvider from '../../../../lib/lti-provider';
import { redirect } from 'next/navigation';

// Initialize database on startup
initDatabase();

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
      const url = `${process.env.APP_URL}/api/lti/launch`;
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

    // Store or update user information using MongoDB
    const db = await require('../../../../lib/database-mongodb').getDatabase();
    
    const result = await db.collection('users').findOneAndUpdate(
      { lti_user_id: userInfo.ltiUserId },
      { 
        $set: {
          name: userInfo.name,
          email: userInfo.email,
          role: userInfo.role,
          updated_at: new Date()
        },
        $setOnInsert: { 
          created_at: new Date() 
        }
      },
      { upsert: true, returnDocument: 'after' }
    );

    const userId = result.value._id.toString();

    // Log LTI launch
    await db.collection('lti_launches').insertOne({
      user_id: userId,
      context_id: userInfo.contextId,
      resource_link_id: userInfo.resourceLinkId,
      launch_url: request.url,
      outcome_service_url: params.lis_outcome_service_url,
      result_sourcedid: params.lis_result_sourcedid,
      launch_timestamp: new Date(),
      success: true
    });

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
  const { searchParams } = new URL(request.url);
  
  // Simple test launch for development
  if (searchParams.get('test') === 'true') {
    return NextResponse.redirect(new URL('/select-scenario?user_id=1&context_id=test&resource_link_id=test', request.url));
  }

  return NextResponse.json({ 
    message: 'LTI Launch endpoint. Use POST for actual launches.',
    test_url: `${request.url}?test=true`
  });
}