import { NextResponse } from 'next/server';
import { SupabaseHelper } from '../../../lib/database-supabase';

export async function GET() {
  try {
    const db = new SupabaseHelper();
    const scenarios = await db.getAllScenarios();
    
    return NextResponse.json({
      success: true,
      scenarios
    });
    
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch scenarios'
    }, { status: 500 });
  }
}