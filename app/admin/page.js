import { redirect } from 'next/navigation';

async function getScenarios() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/scenarios', {
      cache: 'no-store'
    });
    if (!response.ok) throw new Error('Failed to fetch scenarios');
    const data = await response.json();
    return data.scenarios || [];
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return [];
  }
}

export default async function AdminPage() {
  const scenarios = await getScenarios();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage roleplay training scenarios</p>
        </div>
        <a href="/admin/create-scenario" className="btn-primary">
          Create New Scenario
        </a>
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-primary-600">{scenarios.length}</div>
            <div className="text-sm text-gray-600">Total Scenarios</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-green-600">
              {scenarios.filter(s => s.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Active Scenarios</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-blue-600">0</div>
            <div className="text-sm text-gray-600">Active Sessions</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-purple-600">0</div>
            <div className="text-sm text-gray-600">Total Completions</div>
          </div>
        </div>
      </div>

      {/* Scenarios Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">Scenarios</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Character
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {scenarios.slice(0, 10).map((scenario) => (
                <tr key={scenario.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{scenario.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {scenario.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="badge badge-info">{scenario.bot_character}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`badge ${scenario.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {scenario.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(scenario.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <span className="text-primary-600">Edit</span>
                    <span className="text-yellow-600">
                      {scenario.is_active ? 'Deactivate' : 'Activate'}
                    </span>
                    <span className="text-red-600">Delete</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="card mt-8">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">Quick Start Guide</h2>
        </div>
        <div className="card-body">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold mb-2">1. Create Scenarios</h3>
              <p className="text-sm text-gray-600">
                Define training scenarios with specific learning objectives and AI character roles.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">2. Configure LTI</h3>
              <p className="text-sm text-gray-600">
                Use the LTI launch URL in your Docebo LMS to integrate the training module.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">3. Monitor Progress</h3>
              <p className="text-sm text-gray-600">
                Track learner progress and completion rates through the admin dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}