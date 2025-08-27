import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Scenarios API called');
    
    // First try Supabase
    let scenarios = [];
    let source = 'fallback';
    
    try {
      console.log('Attempting Supabase connection...');
      const { SupabaseHelper } = await import('../../../lib/database-supabase');
      const db = new SupabaseHelper();
      scenarios = await db.getAllScenarios();
      source = 'supabase';
      console.log(`Supabase success: ${scenarios.length} scenarios`);
    } catch (dbError) {
      console.error('Supabase failed:', dbError.message);
      
      // Use fallback scenarios
      scenarios = [
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
        },
        {
          id: 3,
          title: 'Leadership Communication',
          description: 'Practice effective leadership communication and team motivation',
          objective: 'Develop skills in inspiring teams, giving feedback, and managing difficult conversations',
          bot_character: 'Team Member',
          bot_tone: 'Varied - sometimes motivated, sometimes challenging or defensive',
          bot_context: 'You are a team member who may have performance issues, concerns, or need motivation.',
          learning_objectives: JSON.stringify([
            'Provide constructive feedback',
            'Motivate and inspire',
            'Address performance issues',
            'Listen actively to concerns',
            'Delegate effectively'
          ]),
          is_active: true,
          created_at: new Date().toISOString()
        }
      ];
      console.log('Using fallback scenarios');
    }
    
    return NextResponse.json({
      success: true,
      scenarios,
      source,
      count: scenarios.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Scenarios API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch scenarios',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
