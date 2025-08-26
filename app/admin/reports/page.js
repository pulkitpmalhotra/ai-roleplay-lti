import { getDatabase } from '../../../lib/database-mongodb';

async function getReportsData() {
  try {
    const db = await getDatabase();
    
    // Get scenario statistics
    const scenarios = await db.collection('scenarios')
      .find({ is_active: true })
      .toArray();
    
    const scenarioStats = [];
    for (const scenario of scenarios) {
      const sessions = await db.collection('learning_sessions')
        .find({ scenario_id: scenario._id.toString() })
        .toArray();
      
      const completedSessions = sessions.filter(s => s.status === 'completed');
      const avgCompletion = sessions.length > 0 
        ? sessions.reduce((sum, s) => sum + (s.completion_percentage || 0), 0) / sessions.length 
        : 0;
      const avgGrade = completedSessions.length > 0
        ? completedSessions.reduce((sum, s) => sum + (s.final_grade || 0), 0) / completedSessions.length
        : 0;
        
      scenarioStats.push({
        id: scenario._id.toString(),
        title: scenario.title,
        totalSessions: sessions.length,
        completedSessions: completedSessions.length,
        completionRate: sessions.length > 0 ? Math.round((completedSessions.length / sessions.length) * 100) : 0,
        averageCompletion: Math.round(avgCompletion),
        averageGrade: Math.round(avgGrade * 100) / 100
      });
    }
    
    // Get overall statistics
    const totalUsers = await db.collection('users').countDocuments();
    const totalSessions = await db.collection('learning_sessions').countDocuments();
    const totalCompleted = await db.collection('learning_sessions').countDocuments({ status: 'completed' });
    const overallCompletionRate = totalSessions > 0 ? Math.round((totalCompleted / totalSessions) * 100) : 0;
    
    return {
      scenarioStats,
      overallStats: {
        totalUsers,
        totalSessions,
        totalCompleted,
        overallCompletionRate
      }
    };
  } catch (error) {
    console.error('Error fetching reports data:', error);
    return {
      scenarioStats: [],
      overallStats: {
        totalUsers: 0,
        totalSessions: 0,
        totalCompleted: 0,
        overallCompletionRate: 0
      }
    };
  }
}

export default async function ReportsPage() {
  const { scenarioStats, overallStats } = await getReportsData();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics & Reports</h1>
        <p className="text-gray-600">Monitor learning progress and scenario performance</p>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card text-center">
          <div className="card-body">
            <div className="text-3xl font-bold text-blue-600 mb-1">{overallStats.totalUsers}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
        </div>
        
        <div className="card text-center">
          <div className="card-body">
            <div className="text-3xl font-bold text-green-600 mb-1">{overallStats.totalSessions}</div>
            <div className="text-sm text-gray-600">Total Sessions</div>
          </div>
        </div>
        
        <div className="card text-center">
          <div className="card-body">
            <div className="text-3xl font-bold text-purple-600 mb-1">{overallStats.totalCompleted}</div>
            <div className="text-sm text-gray-600">Completed Sessions</div>
          </div>
        </div>
        
        <div className="card text-center">
          <div className="card-body">
            <div className="text-3xl font-bold text-orange-600 mb-1">{overallStats.overallCompletionRate}%</div>
            <div className="text-sm text-gray-600">Completion Rate</div>
          </div>
        </div>
      </div>

      {/* Scenario Performance */}
      <div className="card mb-8">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Scenario Performance</h2>
        </div>
        <div className="card-body">
          {scenarioStats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No scenario data available.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scenario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sessions</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Grade</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {scenarioStats.map(stat => (
                    <tr key={stat.id}>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">{stat.title}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">{stat.totalSessions}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{stat.completedSessions}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${stat.completionRate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-900">{stat.completionRate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">{stat.averageCompletion}%</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          stat.averageGrade >= 0.8 ? 'bg-green-100 text-green-800' :
                          stat.averageGrade >= 0.6 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {stat.averageGrade.toFixed(2)}
                        </span>
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
      <div className="card">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Export Reports</h2>
        </div>
        <div className="card-body">
          <div className="grid md:grid-cols-3 gap-4">
            <button className="btn-secondary text-center">
              <svg className="w-5 h-5 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>Export CSV</div>
            </button>
            
            <button className="btn-secondary text-center">
              <svg className="w-5 h-5 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div>Generate PDF</div>
            </button>
            
            <button className="btn-secondary text-center">
              <svg className="w-5 h-5 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2v0a2 2 0 01-2-2v-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
              </svg>
              <div>Email Report</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}