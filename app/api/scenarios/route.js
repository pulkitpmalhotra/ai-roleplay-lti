import { NextResponse } from 'next/server';
import { getDatabase } from '../../../lib/database-mongodb';

export async function GET() {
  try {
    const db = await getDatabase();
    
    const scenarios = await db.collection('scenarios')
      .find({ is_active: true })
      .sort({ created_at: -1 })
      .toArray();
    
    // Convert MongoDB _id to id for client compatibility
    const formattedScenarios = scenarios.map(scenario => ({
      id: scenario._id.toString(),
      title: scenario.title,
      description: scenario.description,
      objective: scenario.objective,
      bot_character: scenario.bot_character,
      bot_tone: scenario.bot_tone,
      created_at: scenario.created_at
    }));
    
    return NextResponse.json({
      success: true,
      scenarios: formattedScenarios
    });
    
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch scenarios'
    }, { status: 500 });
  }
}