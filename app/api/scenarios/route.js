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
    
    // Return fallback scenarios if database fails
    const fallbackScenarios = [
      {
        id: 1,
        title: 'Customer Service Excellence',
        description: 'Practice handling difficult customer service situations with empathy and professionalism',
        objective: 'Learn to de-escalate conflicts, show empathy, and provide effective solutions to customer problems',
        bot_character: 'Customer Service Representative',
        bot_tone: 'Professional, patient, and empathetic',
        bot_context: 'You are dealing with frustrated customers who have various complaints about products or services.',
        learning_objectives: JSON.stringify([
          'Demonstrate active listening skills',
          'Show empathy and understanding',
          'Offer practical solutions',
          'De-escalate tense situations',
          'Maintain professional demeanor'
        ]),
        is_active: true,
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Sales Negotiation Training',
        description: 'Master the art of sales negotiation and closing deals effectively',
        objective: 'Develop skills in persuasion, objection handling, and closing techniques',
        bot_character: 'Potential Customer',
        bot_tone: 'Skeptical but professional, budget-conscious',
        bot_context: 'You are a potential customer who is interested but has concerns about price, value, and commitment.',
        learning_objectives: JSON.stringify([
          'Handle price objections effectively',
          'Demonstrate product value',
          'Build rapport and trust',
          'Use closing techniques',
          'Follow up appropriately'
        ]),
        is_active: true,
        created_at: new Date().toISOString()
      }
    ];
    
    return NextResponse.json({
      success: true,
      scenarios: fallbackScenarios,
      note: 'Using fallback data - database connection failed'
    });
  }
}
