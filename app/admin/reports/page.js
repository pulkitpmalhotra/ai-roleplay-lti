import Link from 'next/link';
import { getDatabase } from '../../../lib/database';

async function getReportData() {
  try {
    const db = getDatabase();
    
    // Overall statistics
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalSessions = db.prepare('SELECT COUNT(*) as count FROM learning_sessions').get().count;
    const completedSessions = db.prepare('SELECT COUNT(*) as count FROM learning_sessions WHERE status = "completed"').get().count;
    const totalScenarios = db.prepare('SELECT COUNT(*) as count FROM scenarios WHERE is_active = 1').get().count;
    
    // Completion rate by scenario
    const scenarioStats = db.prepare(`
      SELECT s.title, s.id,
             COUNT(ls.id) as total_sessions,
             COUNT(CASE WHEN ls.status = 'completed' THEN 1 END) as completed_sessions,
             AVG(ls.completion_percentage) as avg_completion,
             AVG(ls.final_grade) as avg_grade
      FROM scenarios s
      LEFT JOIN learning_sessions ls ON s.id = ls.scenario_id
      WHERE s.is_active = 1
      GROUP BY s.id, s.title
      ORDER BY total_sessions DESC
    `).all();
    
    // Recent activity
    const recentSessions = db.prepare(`
      SELECT ls.*, u.name as user_name, s.title as scenario_title
      FROM learning_sessions ls
      JOIN users u ON ls.user_id = u.id
      JOIN scenarios s ON ls.scenario_id = s.id
      ORDER BY ls.start_time DESC
      LIMIT 10
    `).all();
    
    // Activity by day (last 30 days)
    const dailyActivity = db.prepare(`
      SELECT DATE(start_time) as date, 
             COUNT(*) as sessions,
             COUNT(DISTINCT user_id) as unique_users
      FROM learning_sessions 
      WHERE start_time > datetime('now', '-30 days')
      GROUP BY DATE(start_time)
      ORDER BY date DESC
    `).all();
    
    // Top performing users
    const topUsers = db.prepare(`
      SELECT u.name, u.email,
             COUNT(ls.id) as total_sessions,
             COUNT(CASE WHEN ls.status = 'completed' THEN 1 END) as completed_sessions,
             AVG(ls.completion_percentage) as avg_completion,
             AVG(ls.final_grade) as avg_grade
      FROM users u
      JOIN learning_sessions ls ON u.id = ls.user_id
      GROUP BY u.id
      HAVING total_sessions > 0
      ORDER BY avg_completion DESC, completed_sessions DESC
      LIMIT 10
    `).all();
    
    return {
      overview: {
        totalUsers,
        totalSessions,
        completedSessions,
        totalScenarios,
        completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
      },
      scenarioStats,
      recentSessions,
      dailyActivity,
      topUsers
    };
  } catch (error) {
    console.error('Error fetching report data:', error);
    return {
      overview: { totalUsers: 0, totalSessions: 0, completedSessions: 0, totalScenarios: 0, completionRate: 0 },
      scenarioStats: [],
      recentSessions: [],
      dailyActivity: [],
      topUsers: []
    };
  }
}

export default async function ReportsPage() {
  const data = await getReportData();

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
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-600 mt-2">Comprehensive insights into training performance and user engagement</p>
          </div>
          <div className="text-sm text-gray-500">
            Generated: {new Date().toLocaleString()}
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid md:grid-cols-5 gap-6 mb-8">
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-primary-600">{data.overview.totalUsers}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-blue-600">{data.overview.totalSessions}</div>
            <div className="text-sm text-gray-600">Total Sessions</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-green-600">{data.overview.completedSessions}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-purple-600">{data.overview.completionRate}%</div>
            <div className="text-sm text-gray-600">Success Rate</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body text-center">
            <div className="text-2xl font-bold text-orange-600">{data.overview.totalScenarios}</div>
            <div className="text-sm text-gray-600">Active Scenarios</div>
          </div>
        </div>
      </div>

      {/* Scenario Performance */}
      <div className="card mb-8">
        <div className="card-header">
          <h2 className="text-xl font-semibold text-gray-900">Scenario Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scenario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sessions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg. Grade
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.scenarioStats.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    No scenario data available yet
                  </td>
                </tr>
              ) : (
                data.scenarioStats.map((scenario) => {
                  const completionRate = scenario.total_sessions > 0 
                    ? Math.round((scenario.completed_sessions / scenario.total_sessions) * 100) 
                    : 0;
                  
                  return (
                    <tr key={scenario.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{scenario.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {scenario.total_sessions || 0} 
                          <span className="text-gray-500 ml-1">
                            ({scenario.completed_sessions || 0} completed)
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`badge ${
                            completionRate >= 80 ? 'badge-success' :
                            completionRate >= 60 ? 'badge-warning' : 'badge-danger'
                          }`}>
                            {completionRate}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-900">
                            {Math.round(scenario.avg_completion || 0)}%
                          </div>
                          <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-primary-600 h-2 rounded-full" 
                              style={{ width: `${Math.round(scenario.avg_completion || 0)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {scenario.avg_grade ? (scenario.avg_grade * 100).toFixed(1) : '0.0'}%
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Activity & Top Users */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Recent Sessions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          </div>
          <div className="card-body">
            {data.recentSessions.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {data.recentSessions.map((session) => (
                  <div key={session.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{session.user_name}</div>
                      <div className="text-xs text-gray-500">{session.scenario_title}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xs badge ${
                        session.status === 'completed' ? 'badge-success' : 'badge-warning'
                      }`}>
                        {session.status}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(session.start_time).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Performers */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Top Performers</h3>
          </div>
          <div className="card-body">
            {data.topUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No user data available</p>
            ) : (
              <div className="space-y-3">
                {data.topUsers.map((user, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        index === 2 ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">
                          {user.total_sessions} sessions, {user.completed_sessions} completed
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {Math.round(user.avg_completion || 0)}%
                      </div>
                      <div className="text-xs text-gray-500">
                        Grade: {((user.avg_grade || 0) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Daily Activity Chart (Simple Table for now) */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Daily Activity (Last 30 Days)</h3>
        </div>
        <div className="card-body">
          {data.dailyActivity.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No activity data for the last 30 days</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sessions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unique Users
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.dailyActivity.slice(0, 10).map((day) => (
                    <tr key={day.date} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(day.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {day.sessions}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {day.unique_users}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, (day.sessions / Math.max(...data.dailyActivity.map(d => d.sessions))) * 100)}%` 
                            }}
                          ></div>
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

      {/* Export Options */}
      <div className="card mt-8">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Export Options</h3>
        </div>
        <div className="card-body">
          <div className="grid md:grid-cols-3 gap-4">
            <button className="btn-secondary text-left p-4">
              <div className="font-medium">User Activity Report</div>
              <div className="text-sm text-gray-600 mt-1">Export detailed user engagement metrics</div>
            </button>
            <button className="btn-secondary text-left p-4">
              <div className="font-medium">Scenario Performance</div>
              <div className="text-sm text-gray-600 mt-1">Export scenario completion and effectiveness data</div>
            </button>
            <button className="btn-secondary text-left p-4">
              <div className="font-medium">Learning Outcomes</div>
              <div className="text-sm text-gray-600 mt-1">Export learning objective achievement data</div>
            </button>
          </div>
          <div className="mt-4 text-sm text-gray-500">
            Note: Export functionality requires additional implementation for production use.
          </div>
        </div>
      </div>
    </div>
  );
}