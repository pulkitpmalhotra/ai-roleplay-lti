import { getDatabase } from '../../../lib/database-mongodb';

async function getUsers() {
  try {
    const db = await getDatabase();
    
    const users = await db.collection('users')
      .find({})
      .sort({ created_at: -1 })
      .toArray();
    
    const usersWithStats = [];
    for (const user of users) {
      // Get session statistics for each user
      const sessions = await db.collection('learning_sessions')
        .find({ user_id: user._id.toString() })
        .toArray();
      
      const completedSessions = sessions.filter(s => s.status === 'completed');
      const activeSessions = sessions.filter(s => s.status === 'active');
      const avgGrade = completedSessions.length > 0
        ? completedSessions.reduce((sum, s) => sum + (s.final_grade || 0), 0) / completedSessions.length
        : 0;
      
      usersWithStats.push({
        id: user._id.toString(),
        lti_user_id: user.lti_user_id,
        name: user.name || 'Unknown',
        email: user.email || '',
        role: user.role || 'student',
        created_at: user.created_at,
        totalSessions: sessions.length,
        completedSessions: completedSessions.length,
        activeSessions: activeSessions.length,
        averageGrade: Math.round(avgGrade * 100) / 100
      });
    }
    
    return usersWithStats;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}

export default async function UsersPage() {
  const users = await getUsers();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Manage users and view their learning progress</p>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card text-center">
          <div className="card-body">
            <div className="text-3xl font-bold text-blue-600 mb-1">{users.length}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
        </div>
        
        <div className="card text-center">
          <div className="card-body">
            <div className="text-3xl font-bold text-green-600 mb-1">
              {users.filter(u => u.role === 'student').length}
            </div>
            <div className="text-sm text-gray-600">Students</div>
          </div>
        </div>
        
        <div className="card text-center">
          <div className="card-body">
            <div className="text-3xl font-bold text-purple-600 mb-1">
              {users.filter(u => u.role === 'instructor' || u.role === 'admin').length}
            </div>
            <div className="text-sm text-gray-600">Instructors/Admins</div>
          </div>
        </div>
        
        <div className="card text-center">
          <div className="card-body">
            <div className="text-3xl font-bold text-orange-600 mb-1">
              {users.filter(u => u.activeSessions > 0).length}
            </div>
            <div className="text-sm text-gray-600">Active Users</div>
          </div>
        </div>
      </div>

      {/* User List */}
      <div className="card">
        <div className="card-header flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
          <div className="flex space-x-2">
            <button className="btn-secondary text-sm">Export CSV</button>
            <button className="btn-primary text-sm">+ Add User</button>
          </div>
        </div>
        <div className="card-body">
          {users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Grade</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(user => (
                    <tr key={user.id}>
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">ID: {user.lti_user_id}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.role === 'admin' ? 'bg-red-100 text-red-800' :
                          user.role === 'instructor' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">{user.totalSessions}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{user.completedSessions}</td>
                      <td className="px-4 py-4">
                        {user.averageGrade > 0 ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.averageGrade >= 0.8 ? 'bg-green-100 text-green-800' :
                            user.averageGrade >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {(user.averageGrade * 100).toFixed(0)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.activeSessions > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.activeSessions > 0 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">View</button>
                          <button className="text-green-600 hover:text-green-900">Edit</button>
                          <button className="text-red-600 hover:text-red-900">Block</button>
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

      {/* User Actions */}
      <div className="grid md:grid-cols-3 gap-6 mt-8">
        <div className="card">
          <div className="card-body text-center">
            <svg className="w-8 h-8 text-blue-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
            </svg>
            <h3 className="font-medium text-gray-900 mb-2">Bulk Import</h3>
            <p className="text-sm text-gray-600 mb-4">Import users from CSV file</p>
            <button className="btn-secondary text-sm">Import Users</button>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <svg className="w-8 h-8 text-green-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="font-medium text-gray-900 mb-2">User Reports</h3>
            <p className="text-sm text-gray-600 mb-4">Generate detailed user reports</p>
            <button className="btn-secondary text-sm">Generate Report</button>
          </div>
        </div>

        <div className="card">
          <div className="card-body text-center">
            <svg className="w-8 h-8 text-purple-600 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="font-medium text-gray-900 mb-2">User Settings</h3>
            <p className="text-sm text-gray-600 mb-4">Configure user permissions</p>
            <button className="btn-secondary text-sm">Manage Settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}