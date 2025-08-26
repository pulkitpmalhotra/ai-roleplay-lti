'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AdminPage() {
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingScenario, setEditingScenario] = useState(null);
  const searchParams = useSearchParams();

  const userId = searchParams.get('user_id');
  const contextId = searchParams.get('context_id');

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const response = await fetch('/api/admin/scenarios');
      if (!response.ok) throw new Error('Failed to fetch scenarios');
      
      const data = await response.json();
      setScenarios(data.scenarios || []);
    } catch (error) {
      console.error('Error fetching scenarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteScenario = async (id) => {
    if (!confirm('Are you sure you want to delete this scenario?')) return;

    try {
      const response = await fetch(`/api/admin/scenarios/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete scenario');
      
      fetchScenarios(); // Refresh list
    } catch (error) {
      console.error('Error deleting scenario:', error);
      alert('Failed to delete scenario');
    }
  };

  const toggleScenarioStatus = async (id, isActive) => {
    try {
      const response = await fetch(`/api/admin/scenarios/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive })
      });

      if (!response.ok) throw new Error('Failed to update scenario');
      
      fetchScenarios(); // Refresh list
    } catch (error) {
      console.error('Error updating scenario:', error);
      alert('Failed to update scenario');
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
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage roleplay training scenarios</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn-primary"
        >
          Create New Scenario
        </button>
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
              {scenarios.map((scenario) => (
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
                    <button
                      onClick={() => setEditingScenario(scenario)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => toggleScenarioStatus(scenario.id, scenario.is_active)}
                      className={`${scenario.is_active ? 'text-yellow-600 hover:text-yellow-900' : 'text-green-600 hover:text-green-900'}`}
                    >
                      {scenario.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteScenario(scenario.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Scenario Modal */}
      {(showCreateForm || editingScenario) && (
        <ScenarioForm
          scenario={editingScenario}
          onClose={() => {
            setShowCreateForm(false);
            setEditingScenario(null);
          }}
          onSave={() => {
            setShowCreateForm(false);
            setEditingScenario(null);
            fetchScenarios();
          }}
        />
      )}
    </div>
  );
}

function ScenarioForm({ scenario, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: scenario?.title || '',
    description: scenario?.description || '',
    objective: scenario?.objective || '',
    botTone: scenario?.bot_tone || '',
    botContext: scenario?.bot_context || '',
    botCharacter: scenario?.bot_character || '',
    learningObjectives: scenario?.learning_objectives ? JSON.parse(scenario.learning_objectives) : ['']
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleObjectiveChange = (index, value) => {
    const newObjectives = [...formData.learningObjectives];
    newObjectives[index] = value;
    setFormData(prev => ({ ...prev, learningObjectives: newObjectives }));
  };

  const addObjective = () => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: [...prev.learningObjectives, '']
    }));
  };

  const removeObjective = (index) => {
    const newObjectives = formData.learningObjectives.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, learningObjectives: newObjectives }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      const url = scenario 
        ? `/api/admin/scenarios/${scenario.id}`
        : '/api/admin/scenarios';
      
      const method = scenario ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors(data.errors || [data.error || 'Failed to save scenario']);
        return;
      }

      onSave();
    } catch (error) {
      console.error('Error saving scenario:', error);
      setErrors(['Failed to save scenario']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                {scenario ? 'Edit Scenario' : 'Create New Scenario'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="card-body space-y-6">
            {errors.length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="text-red-700">
                  <ul className="list-disc list-inside space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scenario Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bot Character *
                </label>
                <input
                  type="text"
                  value={formData.botCharacter}
                  onChange={(e) => handleInputChange('botCharacter', e.target.value)}
                  placeholder="e.g., Customer Service Representative"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="form-textarea"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learning Objective *
              </label>
              <textarea
                value={formData.objective}
                onChange={(e) => handleInputChange('objective', e.target.value)}
                rows={2}
                className="form-textarea"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bot Tone *
                </label>
                <input
                  type="text"
                  value={formData.botTone}
                  onChange={(e) => handleInputChange('botTone', e.target.value)}
                  placeholder="e.g., Professional, patient, empathetic"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Bot Context *
              </label>
              <textarea
                value={formData.botContext}
                onChange={(e) => handleInputChange('botContext', e.target.value)}
                rows={4}
                placeholder="Describe the situation and context the bot should be in..."
                className="form-textarea"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learning Objectives *
              </label>
              <div className="space-y-2">
                {formData.learningObjectives.map((objective, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={objective}
                      onChange={(e) => handleObjectiveChange(index, e.target.value)}
                      placeholder={`Learning objective ${index + 1}`}
                      className="form-input flex-1"
                      required
                    />
                    {formData.learningObjectives.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeObjective(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addObjective}
                  className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                >
                  + Add Another Objective
                </button>
              </div>
            </div>
          </div>

          <div className="card-header border-t">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : (scenario ? 'Update Scenario' : 'Create Scenario')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}