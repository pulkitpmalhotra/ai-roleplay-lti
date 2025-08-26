'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function SelectScenarioPage() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const router = useRouter();

  const userId = searchParams.get('user_id');
  const contextId = searchParams.get('context_id');
  const resourceLinkId = searchParams.get('resource_link_id');

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const response = await fetch('/api/scenarios');
      if (!response.ok) throw new Error('Failed to fetch scenarios');
      
      const data = await response.json();
      setScenarios(data.scenarios || []);
    } catch (err) {
      setError('Failed to load scenarios');
      console.error('Error fetching scenarios:', err);
    } finally {
      setLoading(false);
    }
  };

  const startScenario = async (scenarioId) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/roleplay/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          scenarioId,
          contextId,
          resourceLinkId
        })
      });

      if (!response.ok) throw new Error('Failed to start scenario');
      
      const data = await response.json();
      
      // Redirect to roleplay interface
      router.push(`/roleplay/${data.sessionToken}`);
      
    } catch (err) {
      setError('Failed to start scenario');
      console.error('Error starting scenario:', err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
          <p className="font-medium">Error</p>
          <p>{error}</p>
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
          <p className="text-gray-500">Contact your administrator to add training scenarios.</p>
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
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Learning Objective:</h4>
                  <p className="text-sm text-gray-600">{scenario.objective}</p>
                </div>

                <button
                  onClick={() => startScenario(scenario.id)}
                  disabled={loading}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Starting...' : 'Start Training'}
                </button>
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
    </div>
  );
}