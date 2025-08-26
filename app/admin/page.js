import Link from 'next/link';
import { getDatabase } from '../../lib/database';

async function getScenarios() {
  try {
    // Direct database access for better performance and build compatibility
    const db = getDatabase();
    
    const stmt = db.prepare(`
      SELECT id, title, description, objective, bot_character, bot_tone, is_active, created_at
      FROM scenarios 
      ORDER BY created_at DESC
    `);
    
    const scenarios = stmt.all();
    return scenarios || [];
  } catch (error) {
    console.error('Error fetching admin scenarios:', error);
    return [];
  }
}

async function getStats() {
  try {
    const db = getDatabase();
    
    // Get scenario count
    const scenarioCount = db.prepare('SELECT COUNT(*) as count FROM scenarios').get().count;
    const activeScenarios = db.prepare('SELECT COUNT(*) as count FROM scenarios WHERE is_active = 1').get().count;
    
    // Get session stats
    const activeSessions = db.prepare('SELECT COUNT(*) as count FROM learning_sessions WHERE status = "active"').get().count;
    const completedSessions = db.prepare('SELECT COUNT(*) as count FROM learning_sessions WHERE status = "completed"').get().count;
    
    // Get user count
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    
    return {
      totalScenarios: scenarioCount,
      activeScenarios,
      activeSessions,
      completedSessions,
      totalUsers: userCount
    };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return {
      totalScenarios: 0,
      activeScenarios: 0,
      activeSessions: 0,
      completedSessions: 0,
      totalUsers: 0
    };
  }
}

export default async function AdminPage() {
  const scenarios = await getScenarios();
  const stats = await getStats();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage roleplay training scenarios and monitor progress</p>
        </div>
        <div className="flex space-x-3">
          <Link href="/admin/create-scenario" className="btn-primary">
            Create New Scenario
          </Link>
          <Link href="/admin/users" className="btn-secondary">
            Manage Users
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-5 gap-6 mb-8">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-primary-600">{stats.totalScenarios}</div>
            <div className="text-sm text-gray-600">Total Scenarios</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-green-600">{stats.activeScenarios}</div>
            <div className="text-sm text-gray-600">Active Scenarios</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.activeSessions}</div>
            <div className="text-sm text-gray-600">Active Sessions</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.completedSessions}</div>
            <div className="text-sm text-gray-600">Completed Sessions</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.totalUsers}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Link href="/admin/reports" className="card hover:shadow-lg transition-shadow">
          <div className="card-body text-center">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Analytics & Reports</h3>
            <p className="text-gray-600 text-sm">View detailed performance analytics and generate reports</p>
          </div>
        </Link>

        <Link href="/admin/sessions" className="card hover:shadow-lg transition-shadow">
          <div className="card-body text-center">
            <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Active Sessions</h3>
            <p className="text-gray-600 text-sm">Monitor and manage ongoing training sessions</p>
          </div>
        </Link>

        <Link href="/?test=true" className="card hover:shadow-lg transition-shadow">
          <div className="card-body text-center">
            <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1a3 3 0 015.996 0H16a3 3 0 013 3v3a3 3 0 01-3 3H8a3 3 0 01-3-3v-3a3 3 0 013-3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Test Demo Mode</h3>
            <p className="text-gray-600 text-sm">Test the student experience without LTI launch</p>
          </div>
        </Link>
      </div>

      {/* Scenarios Table */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Scenario Management</h2>
          <Link href="/admin/create-scenario" className="btn-primary text-sm">
            + New Scenario
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scenario
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
              {scenarios.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No scenarios</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by creating a new training scenario.</p>
                      <div className="mt-6">
                        <Link href="/admin/create-scenario" className="btn-primary">
                          Create New Scenario
                        </Link>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                scenarios.map((scenario) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <Link href={`/admin/scenarios/${scenario.id}`} className="text-primary-600 hover:text-primary-900">
                        Edit
                      </Link>
                      <button className="text-yellow-600 hover:text-yellow-900">
                        {scenario.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                      <Link href={`/admin/scenarios/${scenario.id}/stats`} className="text-blue-600 hover:text-blue-900">
                        Stats
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* LTI Configuration Info */}
      <div className="card mt-8">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">LTI Integration Setup</h2>
        </div>
        <div className="card-body">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">Configuration Details</h3>
              <div className="space-y-2 font-mono text-sm bg-gray-50 p-4 rounded">
                <div><strong>Launch URL:</strong> {process.env.APP_URL || 'https://your-domain.com'}/api/lti/launch</div>
                <div><strong>LTI Version:</strong> 1.1 & 1.3 Compatible</div>
                <div><strong>Privacy:</strong> Name, Email, Role</div>
                <div><strong>Features:</strong> Grade Passback, Deep Linking</div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-3">Test Links</h3>
              <div className="space-y-2">
                <div>
                  <Link href="/api/lti/launch?test=true" className="btn-secondary text-sm">
                    Test Student Launch
                  </Link>
                </div>
                <div>
                  <Link href="/select-scenario?user_id=demo&context_id=demo&resource_link_id=demo" className="btn-secondary text-sm">
                    Demo Mode
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}