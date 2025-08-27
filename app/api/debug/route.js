import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const debugInfo = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      vercel_url: process.env.VERCEL_URL,
      app_url: process.env.APP_URL,
      next_public_app_url: process.env.NEXT_PUBLIC_APP_URL,
      supabase_configured: {
        url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        url_length: process.env.NEXT_PUBLIC_SUPABASE_URL?.length || 0,
        key_length: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0
      },
      other_env: {
        google_api_key: !!process.env.GOOGLE_API_KEY,
        lti_secret: !!process.env.LTI_SECRET,
        jwt_secret: !!process.env.JWT_SECRET
      }
    };

    // Test Supabase connection
    try {
      const { SupabaseHelper } = await import('../../../lib/database-supabase');
      const db = new SupabaseHelper();
      debugInfo.supabase_test = "Import successful";
      
      // Try to get scenarios
      try {
        const scenarios = await db.getAllScenarios();
        debugInfo.supabase_connection = `Success - ${scenarios.length} scenarios found`;
        debugInfo.scenarios_preview = scenarios.slice(0, 2).map(s => ({
          id: s.id,
          title: s.title,
          is_active: s.is_active
        }));
      } catch (dbError) {
        debugInfo.supabase_connection = `Database query failed: ${dbError.message}`;
      }
    } catch (importError) {
      debugInfo.supabase_test = `Import failed: ${importError.message}`;
    }

    return NextResponse.json({
      success: true,
      debug: debugInfo
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
