import Link from 'next/link';
import { getDatabase } from '../../../lib/database';

async function getSessions() {
  try {
    const db = getDatabase();
    
    const stmt = db.prepare(`
      SELECT ls.*, 
             u.name as user_name, 
             u.email as user_email,
             s.title as scenario_title,
             s.bot_character,
             COUNT(m.id) as message_count
      FROM learning_sessions ls
      JOIN users u ON ls.user_id = u.id
      JOIN scenarios s ON ls.scenario_id = s.id
      LEFT JOIN messages m ON ls.id = m.session_id
      GROUP BY ls.id
      ORDER BY ls.start_time DESC
    `);
    
    return stmt.all();
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
}

async function getSessionStats() {
  try {
    const db = getDatabase();
    
    const activeSessions = db.prepare('SELECT COUNT(*) as count FROM learning_sessions WHERE status = "active"').get().count;
    const completedSessions = db.prepare('SELECT COUNT(*) as count FROM learning_sessions WHERE status = "completed"').get().count;
    const abandonedSessions = db.prepare('SELECT COUNT(*) as count FROM learning_sessions WHERE status = "abandoned"').get().count;
    const totalSessions = db.prepare('SELECT COUNT(*) as count FROM learning_sessions').get().count;
    
    const avgCompletion = db.prepare('SELECT AVG(completion_percentage) as avg FROM learning_sessions').get().avg || 0;
    const avgGrade = db.prepare('SELECT AVG(final_grade) as avg FROM learning_sessions WHERE final_grade > 0').get().avg || 0;
    
    return {
      activeSessions,
      completedSessions,
      abandonedSessions,
      totalSessions,
      avgCompletion: Math.round(avgCompletion),
      avgGrade: Math.round(avgGrade * 100)
    };
  } catch (error) {
    console.error('Error fetching session stats:', error);
    return {
      activeSessions: 0,
      completedSessions: 0,
      abandonedSessions: 0,
      totalSessions: 0,
      avgCompletion: 0,
      avgGrade: 0
    };
  }
}

export default async function SessionsPage() {
  const sessions = await getSessions();
  const stats = await getSessionStats();

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
            <h1 className="text-3xl font-bold text-gray-900">Session Management</h1>
            <p className="text-gray-600 mt-2">Monitor and manage all training sessions</p>
          </div>
          <div className="flex space-x-3">
            <Link href="/admin/reports" className="btn-secondary">
              View Reports
            </Link>
          </div>
        </div>
      </div>

      {/* Session Statistics */}
      <div className="grid md:grid-cols-6 gap-6 mb-8">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-primary-600">{stats.totalSessions}</div>
            <div className="text-sm text-gray-600">Total Sessions</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.activeSessions}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completedSessions}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.abandonedSessions}</div>
            <div className="text-sm text-gray-600">Abandoned</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.avgCompletion}%</div>
            <div className="text-sm text-gray-600">Avg Completion</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.avgGrade}%</div>
            <div className="text-sm text-gray-600">Avg Grade</div>
          </div>
        </div>
      </div>

      {/* Sessions Table */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">All Sessions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scenario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Messages
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Started
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    <div className="text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions yet</h3>
                      <p className="mt-1 text-sm text-gray-500">Sessions will appear here when users start training.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {session.user_name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {session.user_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {session.scenario_title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {session.bot_character}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${
                        session.status === 'completed' ? 'badge-success' :
                        session.status === 'active' ? 'badge-warning' :
                        'badge-danger'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {session.completion_percentage || 0}%
                        </div>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full" 
                            style={{ width: `${session.completion_percentage || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.message_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>
                        {new Date(session.start_time).toLocaleDateString()}
                      </div>
                      <div className="text-xs">
                        {new Date(session.start_time).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      {session.status === 'active' && (
                        <Link 
                          href={`/roleplay/${session.session_token}`} 
                          className="text-blue-600 hover:text-blue-900"
                          target="_blank"
                        >
                          View Live
                        </Link>
                      )}
                      <Link 
                        href={`/admin/sessions/${session.id}`} 
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Activity Summary */}
      <div className="mt-8 grid md:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="card-body">
            <div className="space-y-3">
              {sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {session.user_name} - {session.scenario_title}
                    </div>
                    <div className="text-xs text-gray-500">
                      {session.message_count} messages, {session.completion_percentage}% complete
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs badge ${
                      session.status === 'completed' ? 'badge-success' :
                      session.status === 'active' ? 'badge-warning' : 'badge-danger'
                    }`}>
                      {session.status}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(session.start_time).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
              {sessions.length === 0 && (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              )}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Performance Summary</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Completion Rate:</span>
                  <span className="font-medium">
                    {stats.totalSessions > 0 
                      ? Math.round((stats.completedSessions / stats.totalSessions) * 100)
                      : 0
                    }%
                  </span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ 
                      width: `${stats.totalSessions > 0 
                        ? Math.round((stats.completedSessions / stats.totalSessions) * 100)
                        : 0
                      }%` 
                    }}
                  ></div>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Average Progress:</span>
                  <span className="font-medium">{stats.avgCompletion}%</span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-primary-600 h-2 rounded-full" 
                    style={{ width: `${stats.avgCompletion}%` }}
                  ></div>
                </div>
              </div>

              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sessions today:</span>
                  <span className="font-medium">
                    {sessions.filter(s => {
                      const today = new Date().toDateString();
                      return new Date(s.start_time).toDateString() === today;
                    }).length}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-600">Sessions this week:</span>
                  <span className="font-medium">
                    {sessions.filter(s => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return new Date(s.start_time) > weekAgo;
                    }).length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}