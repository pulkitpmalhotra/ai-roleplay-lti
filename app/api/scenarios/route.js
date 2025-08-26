import { NextResponse } from 'next/server';
import { getDatabase } from '../../../lib/database';

export async function GET() {
  try {
    const db = getDatabase();
    
    const stmt = db.prepare(`
      SELECT id, title, description, objective, bot_character, bot_tone, created_at
      FROM scenarios 
      WHERE is_active = 1 
      ORDER BY created_at DESC
    `);
    
    const scenarios = stmt.all();
    
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