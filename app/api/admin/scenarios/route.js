import { NextResponse } from 'next/server';
import { getDatabase } from '../../../../lib/database-mongodb';
import { ObjectId } from 'mongodb';

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
      bot_context: scenario.bot_context,
      learning_objectives: scenario.learning_objectives,
      created_at: scenario.created_at,
      updated_at: scenario.updated_at,
      is_active: scenario.is_active
    }));
    
    return NextResponse.json({
      success: true,
      scenarios: formattedScenarios
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
    const requiredFields = ['title', 'description', 'objective', 'bot_character', 'bot_tone', 'bot_context'];
    for (const field of requiredFields) {
      if (!scenarioData[field]) {
        return NextResponse.json({
          success: false,
          error: `Missing required field: ${field}`
        }, { status: 400 });
      }
    }

    const db = await getDatabase();
    
    const newScenario = {
      ...scenarioData,
      learning_objectives: scenarioData.learning_objectives || [],
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true
    };

    const result = await db.collection('scenarios').insertOne(newScenario);
    
    return NextResponse.json({
      success: true,
      scenario: {
        id: result.insertedId.toString(),
        ...newScenario
      }
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
    const db = await getDatabase();
    
    await db.collection('scenarios').updateOne(
      { _id: new ObjectId(scenarioId) },
      { 
        $set: { 
          ...updateData, 
          updated_at: new Date() 
        } 
      }
    );
    
    return NextResponse.json({
      success: true,
      message: 'Scenario updated successfully'
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

    const db = await getDatabase();
    
    // Soft delete - mark as inactive
    await db.collection('scenarios').updateOne(
      { _id: new ObjectId(scenarioId) },
      { $set: { is_active: false, updated_at: new Date() } }
    );
    
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