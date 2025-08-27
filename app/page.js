import { SupabaseHelper } from '../lib/database-supabase';

export default async function Home() {
  let scenarios = [];
  
  try {
    // Direct database access instead of HTTP API call
    const db = new SupabaseHelper();
    const scenarioList = await db.getAllScenarios();
    
    scenarios = scenarioList
      .filter(scenario => scenario.is_active)
      .slice(0, 3)
      .map(scenario => ({
        id: scenario.id,
        title: scenario.title,
        description: scenario.description,
        bot_character: scenario.bot_character,
        created_at: scenario.created_at
      }));
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    // Provide fallback scenarios for build time
    scenarios = [
      {
        id: 1,
        title: 'Customer Service Excellence',
        description: 'Practice handling difficult customer service situations with empathy and professionalism',
        bot_character: 'Customer Service Representative',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        title: 'Sales Negotiation Training',
        description: 'Master the art of sales negotiation and closing deals effectively',
        bot_character: 'Potential Customer',
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        title: 'Leadership Communication',
        description: 'Practice effective leadership communication and team motivation',
        bot_character: 'Team Member',
        created_at: new Date().toISOString()
      }
    ];
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          AI Roleplay Training
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Practice real-world scenarios with AI-powered roleplay training. Designed for integration with LMS platforms like Docebo and Cornerstone, powered by Google Gemini 2.0 Flash for cost-effective, scalable learning experiences.
        </p>
        <div className="flex justify-center space-x-4">
          <a 
            href="/api/lti/launch?test=true"
            className="btn-primary text-lg px-8 py-3"
          >
            Try Demo
          </a>
          <a 
            href="/admin"
            className="btn-secondary text-lg px-8 py-3"
          >
            Admin Dashboard
          </a>
        </div>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="card text-center">
          <div className="card-body">
            <div className="bg-primary-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">AI-Powered Conversations</h3>
            <p className="text-gray-600">Engage in realistic roleplay scenarios with AI characters powered by Google Gemini 2.0 Flash</p>
          </div>
        </div>

        <div className="card text-center">
          <div className="card-body">
            <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
            <p className="text-gray-600">Real-time tracking of learning objectives with automated grading and LMS integration</p>
          </div>
        </div>

        <div className="card text-center">
          <div className="card-body">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Admin Configurable</h3>
            <p className="text-gray-600">Create custom scenarios with specific characters, objectives, and learning goals</p>
          </div>
        </div>
      </div>

      {/* Available Scenarios */}
      <div className="mb-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Available Training Scenarios</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map(scenario => (
            <div key={scenario.id} className="card">
              <div className="card-body">
                <h3 className="text-xl font-semibold mb-2">{scenario.title}</h3>
                <p className="text-gray-600 text-sm mb-3">{scenario.description}</p>
                <div className="flex items-center justify-between">
                  <span className="badge badge-info">{scenario.bot_character}</span>
                  <span className="text-xs text-gray-500">
                    {scenario.created_at ? new Date(scenario.created_at).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-6">
          <a href="/api/lti/launch?test=true" className="btn-primary">
            View All Scenarios
          </a>
        </div>
      </div>

      {/* LTI Integration Information */}
      <div className="card mb-16">
        <div className="card-header">
          <h2 className="text-2xl font-semibold text-gray-900">LTI Integration for Learning Management Systems</h2>
        </div>
        <div className="card-body">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">LTI Configuration</h3>
              <div className="space-y-2 font-mono text-sm bg-gray-50 p-4 rounded">
                <div><strong>Launch URL:</strong> {process.env.NEXT_PUBLIC_APP_URL || 'https://your-app-name.vercel.app'}/api/lti/launch</div>
                <div><strong>LTI Version:</strong> 1.1 & 1.3 Compatible</div>
                <div><strong>Privacy:</strong> Name, Email, Role</div>
                <div><strong>Features:</strong> Grade Passback, Deep Linking</div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Supported LMS Platforms</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Docebo LMS
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Cornerstone OnDemand
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Canvas LMS
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Any LTI 1.1/1.3 compatible platform
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Technology Information */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">AI Technology</h3>
          </div>
          <div className="card-body">
            <ul className="space-y-2 text-sm">
              <li><strong>Model:</strong> Google Gemini 2.0 Flash</li>
              <li><strong>Pricing:</strong> Cost-optimized for scaling</li>
              <li><strong>Response Time:</strong> Fast concurrent handling</li>
              <li><strong>Context:</strong> Multi-turn conversations</li>
              <li><strong>Assessment:</strong> AI-powered objective tracking</li>
            </ul>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">System Features</h3>
          </div>
          <div className="card-body">
            <ul className="space-y-2 text-sm">
              <li><strong>Database:</strong> Supabase with real-time features</li>
              <li><strong>Frontend:</strong> Next.js 14 with Tailwind CSS</li>
              <li><strong>Security:</strong> JWT tokens and LTI validation</li>
              <li><strong>Scalability:</strong> Optimized for multiple users</li>
              <li><strong>Integration:</strong> Multi-platform LMS compatible</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
