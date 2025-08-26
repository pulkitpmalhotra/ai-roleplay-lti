import { NextResponse } from 'next/server';
import { SupabaseHelper } from '../../../../lib/database-supabase';

export async function GET() {
  try {
    const db = new SupabaseHelper();
    const scenarios = await db.getAllScenarios();
    
    return NextResponse.json({
      success: true,
      scenarios
    });
    
  } catch (error) {
    console.error('Error fetching admin scenarios:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch scenarios'
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const scenarioData = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'objective', 'botCharacter', 'botTone', 'botContext'];
    for (const field of requiredFields) {
      if (!scenarioData[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 });
      }
    }

    const db = new SupabaseHelper();
    
    const newScenario = {
      title: scenarioData.title,
      description: scenarioData.description,
      objective: scenarioData.objective,
      bot_character: scenarioData.botCharacter,
      bot_tone: scenarioData.botTone,
      bot_context: scenarioData.botContext,
      learning_objectives: JSON.stringify(scenarioData.learningObjectives || []),
      is_active: true
    };

    const result = await db.createScenario(newScenario);
    
    return NextResponse.json({
      success: true,
      scenario: result
    });
    
  } catch (error) {
    console.error('Error creating scenario:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create scenario'
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const scenarioId = searchParams.get('id');
    
    if (!scenarioId) {
      return NextResponse.json({
        success: false,
        error: 'Scenario ID is required'
      }, { status: 400 });
    }

    const updateData = await request.json();
    const db = new SupabaseHelper();
    
    const result = await db.updateScenario(scenarioId, {
      title: updateData.title,
      description: updateData.description,
      objective: updateData.objective,
      bot_character: updateData.botCharacter,
      bot_tone: updateData.botTone,
      bot_context: updateData.botContext,
      learning_objectives: JSON.stringify(updateData.learningObjectives || [])
    });
    
    return NextResponse.json({
      success: true,
      scenario: result
    });
    
  } catch (error) {
    console.error('Error updating scenario:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update scenario'
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const scenarioId = searchParams.get('id');
    
    if (!scenarioId) {
      return NextResponse.json({
        success: false,
        error: 'Scenario ID is required'
      }, { status: 400 });
    }

    const db = new SupabaseHelper();
    await db.deleteScenario(scenarioId);
    
    return NextResponse.json({
      success: true,
      message: 'Scenario deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting scenario:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to delete scenario'
    }, { status: 500 });
  }
}
