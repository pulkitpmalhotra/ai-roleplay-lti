import { NextResponse } from 'next/server';
import ScenarioManager from '../../../../lib/scenario-manager';

const scenarioManager = new ScenarioManager();

export async function GET() {
  try {
    const scenarios = scenarioManager.getAllScenarios();
    
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
    const data = await request.json();
    
    // Validate scenario data
    const errors = scenarioManager.validateScenarioData(data);
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        errors
      }, { status: 400 });
    }

    const scenarioId = scenarioManager.createScenario(data);
    
    return NextResponse.json({
      success: true,
      scenarioId,
      message: 'Scenario created successfully'
    });
    
  } catch (error) {
    console.error('Error creating scenario:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create scenario'
    }, { status: 500 });
  }
}