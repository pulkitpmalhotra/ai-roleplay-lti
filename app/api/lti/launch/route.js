import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  
  if (searchParams.get('test') === 'true') {
    const testUrl = `/select-scenario?user_id=1&context_id=test`;
    return NextResponse.redirect(new URL(testUrl, request.url));
  }

  return NextResponse.json({ 
    message: 'LTI Launch Working',
    test_url: `${request.url}?test=true`
  });
}

export async function POST(request) {
  const testUrl = `/select-scenario?user_id=1&context_id=test`;
  return NextResponse.redirect(new URL(testUrl, request.url));
}
