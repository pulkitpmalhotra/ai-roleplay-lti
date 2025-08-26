import { getDatabase } from '../../lib/database-mongodb';

export default async function SelectScenario({ searchParams }) {
  const userId = searchParams.user_id || '1';
  const contextId = searchParams.context_id || 'test';
  const resourceLinkId = searchParams.resource_link_id || 'test';

  let scenarios = [];
  
  try {
    const db = await getDatabase();
    const scenarioList = await db.collection('scenarios')
      .find({ is_active: true })
      .sort({ created_at: -1 })
      .toArray();
    
    scenarios = scenarioList.map(scenario => ({
      id: scenario._id.toString(),
      title: scenario.title,
      description: scenario.description,
      objective: scenario.objective,
      bot_character: scenario.bot_character,
      bot_tone: scenario.bot_tone
    }));
  } catch (error) {
    console.error('Error fetching scenarios:', error);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Choose Your Training Scenario
        </h1>
        <p className="text-gray-600">
          Select a roleplay scenario to begin your training session. Each scenario is designed 
          to help you practice specific skills with AI-powered characters.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {scenarios.map(scenario => (
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
                  <span className="badge badge-secondary">
                    {scenario.bot_tone}  
                  </span>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 mb-2">Learning Objective:</h4>
                <p className="text-sm text-gray-600">
                  {scenario.objective}
                </p>
              </div>

              <form className="w-full" action="/api/roleplay/start-session" method="post">
                <input type="hidden" name="userId" value={userId} />
                <input type="hidden" name="scenarioId" value={scenario.id} />
                <input type="hidden" name="contextId" value={contextId} />
                <input type="hidden" name="resourceLinkId" value={resourceLinkId} />
                
                <button 
                  type="submit" 
                  className="w-full btn-primary flex items-center justify-center"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Start Training
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>

      {/* How It Works */}
      <div className="mt-12 card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">
            How AI Roleplay Training Works
          </h2>
        </div>
        <div className="card-body">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <span className="text-primary-600 font-bold">1</span>
              </div>
              <h3 className="font-medium mb-2">Choose Scenario</h3>
              <p className="text-sm text-gray-600">
                Select a training scenario that matches your learning goals and skill level.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <span className="text-primary-600 font-bold">2</span>
              </div>
              <h3 className="font-medium mb-2">Practice & Learn</h3>
              <p className="text-sm text-gray-600">
                Engage in realistic conversations with AI characters powered by Google Gemini.
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <span className="text-primary-600 font-bold">3</span>
              </div>
              <h3 className="font-medium mb-2">Track Progress</h3>
              <p className="text-sm text-gray-600">
                Your progress is automatically tracked and graded based on learning objectives.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between items-center">
        <a 
          href="/" 
          className="text-primary-600 hover:text-primary-800 flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </a>
      </div>
    </div>
  );
}