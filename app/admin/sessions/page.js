import { getDatabase } from '../../../lib/database-mongodb';

async function getActiveSessions() {
  try {
    const db = await getDatabase();
    
    // Get active sessions with user and scenario information
    const sessions = await db.collection('learning_sessions')
      .find({ status: { $in: ['active', 'paused'] } })
      .sort({ start_time: -1 })
      .toArray();
    
    const sessionsWithDetails = [];
    for (const session of sessions) {
      // Get user information
      const user = await db.collection('users').findOne({ _id: session.user_id });
      
      // Get scenario information  
      const scenario = await db.collection('scenarios').findOne({ _id: session.scenario_id });
      
      sessionsWithDetails.push({
        id: session._id.toString(),
        session_token: session.session_token,
        user_name: user?.name || 'Unknown User',
        user_email: user?.email || '',
        scenario_title: scenario?.title || 'Unknown Scenario',
        status: session.status,
        start_time: session.start_time,
        total_messages: session.total_messages || 0,
        completion_percentage: session.completion_percentage || 0,
        final_grade: session.final_grade || 0,
        lti_context_id: session.lti_context_id
      });
    }
    
    return sessionsWithDetails;
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    return [];
  }
}

async function getRecentCompletedSessions() {
  try {
    const db = await getDatabase();
    
    const sessions = await db.collection('learning_sessions')
      .find({ status: 'completed' })
      .sort({ end_time: -1 })
      .limit(10)
      .toArray();
    
    const sessionsWithDetails = [];
    for (const session of sessions) {
      const user = await db.collection('users').findOne({ _id: session.user_id });
      const scenario = await db.collection('scenarios').findOne({ _id: session.scenario_id });
      
      sessionsWithDetails.push({
        id: session._id.toString(),
        user_name: user?.name || 'Unknown User',
        user_email: user?.email || '',
        scenario_title: scenario?.title || 'Unknown Scenario',
        completion_percentage: session.completion_percentage || 0,
        final_grade: session.final_grade || 0,
        end_time: session.end_time,
        total_messages: session.total_messages || 0
      });
    }
    
    return sessionsWithDetails;
  } catch (error) {
    console.error('Error fetching completed sessions:', error);
    return [];
  }
}

export default async function SessionsPage() {
  const activeSessions = await getActiveSessions();
  const completedSessions = await getRecentCompletedSessions();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Session Management</h1>
        <p className="text-gray-600">Monitor and manage learning sessions</p>
      </div>

      {/* Active Sessions */}
      <div className="card mb-8">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Active Sessions ({activeSessions.length})</h2>
        </div>
        <div className="card-body">
          {activeSessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No active sessions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scenario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Started</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {activeSessions.map(session => (
                    <tr key={session.id}>
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{session.user_name}</div>
                          <div className="text-sm text-gray-500">{session.user_email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">{session.scenario_title}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          session.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {session.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${session.completion_percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{session.completion_percentage}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">{session.total_messages}</td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {session.start_time ? new Date(session.start_time).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">View</button>
                          <button className="text-yellow-600 hover:text-yellow-900">Pause</button>
                          <button className="text-red-600 hover:text-red-900">End</button>
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

      {/* Recent Completed Sessions */}
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Recently Completed Sessions</h2>
        </div>
        <div className="card-body">
          {completedSessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No completed sessions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scenario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Messages</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {completedSessions.map(session => (
                    <tr key={session.id}>
                      <td className="px-4 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{session.user_name}</div>
                          <div className="text-sm text-gray-500">{session.user_email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">{session.scenario_title}</div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-gray-900">{session.completion_percentage}%</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          session.final_grade >= 0.8 ? 'bg-green-100 text-green-800' :
                          session.final_grade >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {(session.final_grade * 100).toFixed(0)}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">{session.total_messages}</td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {session.end_time ? new Date(session.end_time).toLocaleString() : 'N/A'}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-900">View</button>
                          <button className="text-green-600 hover:text-green-900">Report</button>
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