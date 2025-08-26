import Link from 'next/link';
import { getDatabase } from '../../lib/database';

async function getScenarios() {
  try {
    // Direct database access for better performance and build compatibility
    const db = getDatabase();
    
    const stmt = db.prepare(`
      SELECT id, title, description, objective, bot_character, bot_tone, created_at
      FROM scenarios 
      WHERE is_active = 1 
      ORDER BY created_at DESC
    `);
    
    const scenarios = stmt.all();
    return scenarios || [];
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return [];
  }
}

async function ensureTestUser(userId) {
  if (!userId || userId === 'demo') {
    try {
      const db = getDatabase();
      
      // Create or get demo user
      const userStmt = db.prepare(`
        INSERT OR IGNORE INTO users (lti_user_id, name, email, role)
        VALUES (?, ?, ?, ?)
      `);
      
      userStmt.run('demo_user', 'Demo Student', 'demo@example.com', 'student');
      
      // Get the user ID
      const getUserStmt = db.prepare('SELECT id FROM users WHERE lti_user_id = ?');
      const user = getUserStmt.get('demo_user');
      
      return user ? user.id : 1;
    } catch (error) {
      console.error('Error creating demo user:', error);
      return 1;
    }
  }
  return userId;
}

export default async function SelectScenarioPage({ searchParams }) {
  const scenarios = await getScenarios();
  const userId = await ensureTestUser(searchParams.user_id);
  const contextId = searchParams.context_id || 'demo_context';
  const resourceLinkId = searchParams.resource_link_id || 'demo_resource';
  const isDemo = searchParams.user_id === 'demo' || !searchParams.user_id;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Choose Your Training Scenario
        </h1>
        <p className="text-gray-600">
          Select a roleplay scenario to begin your training session. Each scenario is designed to help you practice specific skills with AI-powered characters.
        </p>
      </div>

      {/* Demo Mode Banner */}
      {isDemo && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Demo Mode Active
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>You are in demo mode. In production, this would be launched from your LMS course. All conversations are saved and tracked for demonstration purposes.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {scenarios.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No scenarios available</h3>
          <p className="text-gray-500 mb-4">There are currently no active training scenarios.</p>
          {isDemo && (
            <Link href="/admin" className="btn-primary">
              Go to Admin Dashboard
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => (
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
                  <p className="text-sm text-gray-600">{scenario.objective}</p>
                </div>

                <form action="/api/roleplay/start-session" method="post" className="w-full">
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
      )}

      {/* Instructions */}
      <div className="mt-12 card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">How AI Roleplay Training Works</h2>
        </div>
        <div className="card-body">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <span className="text-primary-600 font-bold">1</span>
              </div>
              <h3 className="font-medium mb-2">Choose Scenario</h3>
              <p className="text-sm text-gray-600">Select a training scenario that matches your learning goals and skill level.</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <span className="text-primary-600 font-bold">2</span>
              </div>
              <h3 className="font-medium mb-2">Practice & Learn</h3>
              <p className="text-sm text-gray-600">Engage in realistic conversations with AI characters powered by Google Gemini.</p>
            </div>
            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <span className="text-primary-600 font-bold">3</span>
              </div>
              <h3 className="font-medium mb-2">Track Progress</h3>
              <p className="text-sm text-gray-600">Your progress is automatically tracked and graded based on learning objectives.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between items-center">
        <Link href="/" className="text-primary-600 hover:text-primary-800 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
        
        {isDemo && (
          <Link href="/admin" className="btn-secondary">
            Admin Dashboard
          </Link>
        )}
      </div>
    </div>
  );
}