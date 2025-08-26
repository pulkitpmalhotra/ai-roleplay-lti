import Link from 'next/link';

async function getScenarios() {
  try {
    // Always use localhost for server-side rendering during build
    const baseUrl = 'http://localhost:3000';
        
    const response = await fetch(`${baseUrl}/api/scenarios`, {
      cache: 'no-store'
    });
    if (!response.ok) {
      console.error('Failed to fetch scenarios:', response.status, response.statusText);
      return [];
    }
    const data = await response.json();
    return data.scenarios || [];
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return [];
  }
}

export default async function SelectScenarioPage({ searchParams }) {
  const scenarios = await getScenarios();
  const userId = searchParams.user_id;
  const contextId = searchParams.context_id;
  const resourceLinkId = searchParams.resource_link_id;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Choose Your Training Scenario
        </h1>
        <p className="text-gray-600">
          Select a roleplay scenario to begin your training session. Each scenario is designed to help you practice specific skills.
        </p>
      </div>

      {scenarios.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No scenarios available</h3>
          <p className="text-gray-500">Contact your administrator to add training scenarios.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.slice(0, 6).map((scenario) => (
            <div key={scenario.id} className="card hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {scenario.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {scenario.description}
                  </p>
                  <div className="flex items-center mb-3">
                    <span className="badge badge-info mr-2">
                      {scenario.bot_character}
                    </span>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Learning Objective:</h4>
                  <p className="text-sm text-gray-600">{scenario.objective}</p>
                </div>

                <form action="/api/roleplay/start-session" method="post" className="w-full">
                  <input type="hidden" name="userId" value={userId} />
                  <input type="hidden" name="scenarioId" value={scenario.id} />
                  <input type="hidden" name="contextId" value={contextId} />
                  <input type="hidden" name="resourceLinkId" value={resourceLinkId} />
                  <button
                    type="submit"
                    className="w-full btn-primary"
                  >
                    Start Training
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-12 card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">How It Works</h2>
        </div>
        <div className="card-body">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <span className="text-primary-600 font-bold">1</span>
              </div>
              <h3 className="font-medium mb-2">Choose Scenario</h3>
              <p className="text-sm text-gray-600">Select a training scenario that matches your learning goals.</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <span className="text-primary-600 font-bold">2</span>
              </div>
              <h3 className="font-medium mb-2">Practice & Learn</h3>
              <p className="text-sm text-gray-600">Engage in realistic conversations with AI characters.</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <span className="text-primary-600 font-bold">3</span>
              </div>
              <h3 className="font-medium mb-2">Track Progress</h3>
              <p className="text-sm text-gray-600">Your progress is automatically tracked and graded.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Test/Demo Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">Demo Mode Active</h3>
        <p className="text-blue-700 text-sm">
          You are currently in demo mode. In production, this page would be launched from your Docebo LMS course.
        </p>
        <div className="mt-3 text-xs text-blue-600">
          <p>User ID: {userId} | Context: {contextId} | Resource: {resourceLinkId}</p>
        </div>
      </div>
    </div>
  );
}