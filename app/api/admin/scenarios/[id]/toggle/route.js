import { NextResponse } from 'next/server';
import ScenarioManager from '../../../../../../lib/scenario-manager';

const scenarioManager = new ScenarioManager();

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { isActive } = await request.json();
    
    const updated = scenarioManager.toggleScenarioStatus(parseInt(id), isActive);
    
    if (!updated) {
      return NextResponse.json({
        success: false,
        error: 'Scenario not found'
      }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: `Scenario ${isActive ? 'activated' : 'deactivated'} successfully`
    });
    
  } catch (error) {
    console.error('Error toggling scenario status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update scenario status'
    }, { status: 500 });
  }
}