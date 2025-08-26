import { getDatabase } from '../../lib/database-mongodb';
import Link from 'next/link';

async function getStats() {
  try {
    const db = await getDatabase();
    
    const totalScenariosResult = await db.collection('scenarios').countDocuments({ is_active: true });
    const activeScenariosResult = await db.collection('scenarios').countDocuments({ is_active: true });
    const totalUsersResult = await db.collection('users').countDocuments();
    const activeSessionsResult = await db.collection('learning_sessions').countDocuments({ status: 'active' });
    const completedSessionsResult = await db.collection('learning_sessions').countDocuments({ status: 'completed' });
    
    return {
      totalScenarios: totalScenariosResult,
      activeScenarios: activeScenariosResult,
      totalUsers: totalUsersResult,
      activeSessions: activeSessionsResult,
      completedSessions: completedSessionsResult
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      totalScenarios: 0,
      activeScenarios: 0,
      totalUsers: 0,
      activeSessions: 0,
      completedSessions: 0
    };
  }
}

async function getScenarios() {
  try {
    const db = await getDatabase();
    const scenarios = await db.collection('scenarios')
      .find({ is_active: true })
      .sort({ created_at: -1 })
      .limit(10)
      .toArray();
    
    return scenarios.map(scenario => ({
      id: scenario._id.toString(),
      title: scenario.title,
      description: scenario.description,
      bot_character: scenario.bot_character,
      created_at: scenario.created_at,
      is_active: scenario.is_active
    }));
  } catch (error) {
    console.error('Error fetching scenarios:', error);
    return [];
  }
}

export default async function AdminDashboard() {
  const stats = await getStats();
  const scenarios = await getScenarios();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
        <p className="text-gray-600">Manage roleplay training scenarios and monitor progress</p>
        
        <div className="mt-4 flex space-x-4">
          <Link href="/admin/create-scenario" className="btn-primary">
            Create New Scenario
          </Link>
          <Link href="/admin/users" className="btn-secondary">
            Manage Users
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="card text-center">
          <div className="card-body">
            <div className="text-3xl font-bold text-blue-600 mb-1">{stats.totalScenarios}</div>
            <div className="text-sm text-gray-600">Total Scenarios</div>
          </div>
        </div>
        
        <div className="card text-center">
          <div className="card-body">
            <div className="text-3xl font-bold text-green-600 mb-1">{stats.activeScenarios}</div>
            <div className="text-sm text-gray-600">Active Scenarios</div>
          </div>
        </div>
        
        <div className="card text-center">
          <div className="card-body">
            <div className="text-3xl font-bold text-blue-600 mb-1">{stats.activeSessions}</div>
            <div className="text-sm text-gray-600">Active Sessions</div>
          </div>
        </div>
        
        <div className="card text-center">
          <div className="card-body">
            <div className="text-3xl font-bold text-purple-600 mb-1">{stats.completedSessions}</div>
            <div className="text-sm text-gray-600">Completed Sessions</div>
          </div>
        </div>
        
        <div className="card text-center">
          <div className="card-body">
            <div className="text-3xl font-bold text-orange-600 mb-1">{stats.totalUsers}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Link href="/admin/reports" className="card hover:shadow-md transition-shadow">
          <div className="card-body text-center">
            <div className="bg-blue-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Analytics & Reports</h3>
            <p className="text-sm text-gray-600">View detailed performance analytics and generate reports</p>
          </div>
        </Link>

        <Link href="/admin/sessions" className="card hover:shadow-md transition-shadow">
          <div className="card-body text-center">
            <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Active Sessions</h3>
            <p className="text-sm text-gray-600">Monitor and manage ongoing training sessions</p>
          </div>
        </Link>

        <Link href="/api/lti/launch?test=true" className="card hover:shadow-md transition-shadow">
          <div className="card-body text-center">
            <div className="bg-purple-100 rounded-full p-3 w-12 h-12 mx-auto mb-3 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1a3 3 0 015.83 1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-medium text-gray-900 mb-2">Test Demo Mode</h3>
            <p className="text-sm text-gray-600">Test the student experience without LTI launch</p>
          </div>
        </Link>
      </div>

      {/* Scenario Management */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">Scenario Management</h2>
          <Link href="/admin/create-scenario" className="btn-primary text-sm">
            + New Scenario
          </Link>
        </div>
        <div className="card-body">
          {scenarios.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No scenarios found.</p>
              <Link href="/admin/create-scenario" className="btn-primary">
                Create Your First Scenario
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scenario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Character</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scenarios.map(scenario => (
                    <tr key={scenario.id}>
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{scenario.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{scenario.description}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-blue-600">{scenario.bot_character}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          scenario.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {scenario.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {scenario.created_at ? new Date(scenario.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">Edit</button>
                          <button className="text-red-600 hover:text-red-900">Deactivate</button>
                          <button className="text-green-600 hover:text-green-900">Stats</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}