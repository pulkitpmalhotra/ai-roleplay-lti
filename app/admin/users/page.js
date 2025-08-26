import Link from 'next/link';
import { getDatabase } from '../../../lib/database';

async function getUsers() {
  try {
    const db = getDatabase();
    
    const stmt = db.prepare(`
      SELECT u.*, 
             COUNT(DISTINCT ls.id) as total_sessions,
             COUNT(CASE WHEN ls.status = 'completed' THEN 1 END) as completed_sessions,
             AVG(ls.completion_percentage) as avg_completion,
             MAX(ls.start_time) as last_activity
      FROM users u
      LEFT JOIN learning_sessions ls ON u.id = ls.user_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    
    return stmt.all();
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

async function getUserStats() {
  try {
    const db = getDatabase();
    
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const activeUsers = db.prepare(`
      SELECT COUNT(DISTINCT user_id) as count 
      FROM learning_sessions 
      WHERE start_time > datetime('now', '-30 days')
    `).get().count;
    const studentsCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "student"').get().count;
    const instructorsCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = "instructor"').get().count;
    
    return {
      totalUsers,
      activeUsers,
      studentsCount,
      instructorsCount
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      totalUsers: 0,
      activeUsers: 0,
      studentsCount: 0,
      instructorsCount: 0
    };
  }
}

export default async function UsersPage() {
  const users = await getUsers();
  const stats = await getUserStats();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link href="/admin" className="text-primary-600 hover:text-primary-800 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Admin
          </Link>
        </div>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">Monitor user activity and manage user accounts</p>
          </div>
          <div className="flex space-x-3">
            <Link href="/admin/reports" className="btn-secondary">
              View Reports
            </Link>
          </div>
        </div>
      </div>

      {/* User Statistics */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-primary-600">{stats.totalUsers}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
            <div className="text-sm text-gray-600">Active (30 days)</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.studentsCount}</div>
            <div className="text-sm text-gray-600">Students</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.instructorsCount}</div>
            <div className="text-sm text-gray-600">Instructors</div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Activity
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-5.197a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No users yet</h3>
                      <p className="mt-1 text-sm text-gray-500">Users will appear here when they launch the training.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email || user.lti_user_id}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${
                        user.role === 'instructor' || user.role === 'admin' 
                          ? 'badge-info' 
                          : 'badge-secondary'
                      }`}>
                        {user.role || 'student'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center">
                        <span className="font-medium">{user.total_sessions || 0}</span>
                        <span className="text-gray-500 ml-1">
                          ({user.completed_sessions || 0} completed)
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {user.total_sessions > 0 
                              ? `${Math.round(user.avg_completion || 0)}%`
                              : 'N/A'
                            }
                          </div>
                          {user.total_sessions > 0 && (
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                              <div 
                                className="bg-primary-600 h-1.5 rounded-full" 
                                style={{ width: `${Math.round(user.avg_completion || 0)}%` }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.last_activity 
                        ? new Date(user.last_activity).toLocaleDateString() 
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <Link 
                        href={`/admin/users/${user.id}`} 
                        className="text-primary-600 hover:text-primary-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">User Activity Overview</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">New users (last 7 days):</span>
                <span className="font-medium">
                  {users.filter(u => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(u.created_at) > weekAgo;
                  }).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Users with sessions:</span>
                <span className="font-medium">
                  {users.filter(u => (u.total_sessions || 0) > 0).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Users who completed training:</span>
                <span className="font-medium">
                  {users.filter(u => (u.completed_sessions || 0) > 0).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Engagement Metrics</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average sessions per user:</span>
                <span className="font-medium">
                  {users.length > 0 
                    ? (users.reduce((sum, u) => sum + (u.total_sessions || 0), 0) / users.length).toFixed(1)
                    : '0'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Average completion rate:</span>
                <span className="font-medium">
                  {users.length > 0
                    ? Math.round(users.reduce((sum, u) => sum + (u.avg_completion || 0), 0) / users.length)
                    : 0
                  }%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Users active in last 30 days:</span>
                <span className="font-medium">{stats.activeUsers}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}