import { NextResponse } from 'next/server';
import ScenarioManager from '../../../../../lib/scenario-manager';

const scenarioManager = new ScenarioManager();

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const scenario = scenarioManager.getScenario(parseInt(id));
    
    if (!scenario) {
      return NextResponse.json({
        success: false,
        error: 'Scenario not found'
      }, { status: 404 });
    }

    const stats = scenarioManager.getScenarioStats(parseInt(id));
    
    return NextResponse.json({
      success: true,
      scenario,
      stats
    });
    
  } catch (error) {
    console.error('Error fetching scenario:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch scenario'
    }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();
    
    // Validate scenario data
    const errors = scenarioManager.validateScenarioData(data);
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        errors
      }, { status: 400 });
    }

    const updated = scenarioManager.updateScenario(parseInt(id), data);
    
    if (!updated) {
      return NextResponse.json({
        success: false,
        error: 'Scenario not found or update failed'
      }, { status: 404 });
    }
    
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

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const deleted = scenarioManager.deleteScenario(parseInt(id));
    
    if (!deleted) {
      return NextResponse.json({
        success: false,
        error: 'Scenario not found'
      }, { status: 404 });
    }
    
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