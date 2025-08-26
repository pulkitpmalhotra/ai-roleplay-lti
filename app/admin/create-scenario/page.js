'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CreateScenarioPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    objective: '',
    botTone: '',
    botContext: '',
    botCharacter: '',
    learningObjectives: ['']
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleObjectiveChange = (index, value) => {
    const newObjectives = [...formData.learningObjectives];
    newObjectives[index] = value;
    setFormData(prev => ({
      ...prev,
      learningObjectives: newObjectives
    }));
  };

  const addObjective = () => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: [...prev.learningObjectives, '']
    }));
  };

  const removeObjective = (index) => {
    if (formData.learningObjectives.length > 1) {
      const newObjectives = formData.learningObjectives.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        learningObjectives: newObjectives
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      const response = await fetch('/api/admin/scenarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        router.push('/admin?created=true');
      } else {
        setErrors(data.errors || [data.error || 'Failed to create scenario']);
      }
    } catch (error) {
      console.error('Error creating scenario:', error);
      setErrors(['Failed to create scenario. Please try again.']);
    } finally {
      setLoading(false);
    }
  };

  const presetScenarios = [
    {
      title: 'Customer Service Excellence',
      description: 'Practice handling difficult customer service situations with empathy and professionalism',
      objective: 'Learn to de-escalate conflicts, show empathy, and provide effective solutions to customer problems',
      botTone: 'Professional, patient, and empathetic',
      botContext: 'You are dealing with frustrated customers who have various complaints about products or services. Your goal is to help resolve their issues while maintaining a positive company image.',
      botCharacter: 'Customer Service Representative',
      learningObjectives: [
        'Demonstrate active listening skills',
        'Show empathy and understanding',
        'Offer practical solutions',
        'De-escalate tense situations',
        'Maintain professional demeanor'
      ]
    },
    {
      title: 'Sales Negotiation Mastery',
      description: 'Master the art of sales negotiation and closing deals effectively',
      objective: 'Develop skills in persuasion, objection handling, and closing techniques',
      botTone: 'Skeptical but professional, budget-conscious',
      botContext: 'You are a potential customer who is interested but has concerns about price, value, and commitment. You will present realistic objections and challenges.',
      botCharacter: 'Potential Customer',
      learningObjectives: [
        'Handle price objections effectively',
        'Demonstrate product value',
        'Build rapport and trust',
        'Use closing techniques',
        'Follow up appropriately'
      ]
    },
    {
      title: 'Leadership Communication',
      description: 'Practice effective leadership communication and team motivation',
      objective: 'Develop skills in inspiring teams, giving feedback, and managing difficult conversations',
      botTone: 'Varied - sometimes motivated, sometimes challenging or defensive',
      botContext: 'You are a team member who may have performance issues, concerns, or need motivation. You will respond realistically to different leadership approaches.',
      botCharacter: 'Team Member',
      learningObjectives: [
        'Provide constructive feedback',
        'Motivate and inspire',
        'Address performance issues',
        'Listen actively to concerns',
        'Delegate effectively'
      ]
    }
  ];

  const loadPreset = (preset) => {
    setFormData(preset);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link href="/admin" className="text-primary-600 hover:text-primary-800 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Admin
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Create New Scenario</h1>
        <p className="text-gray-600 mt-2">Design a new AI roleplay training scenario for your learners</p>
      </div>

      {/* Preset Scenarios */}
      <div className="card mb-8">
        <div className="card-header">
          <h2 className="text-lg font-semibold text-gray-900">Quick Start Templates</h2>
        </div>
        <div className="card-body">
          <div className="grid md:grid-cols-3 gap-4">
            {presetScenarios.map((preset, index) => (
              <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <h3 className="font-medium text-gray-900 mb-2">{preset.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{preset.description}</p>
                <button
                  type="button"
                  onClick={() => loadPreset(preset)}
                  className="btn-secondary text-sm w-full"
                >
                  Use This Template
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Please fix the following errors:
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
          </div>
          <div className="card-body space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Scenario Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., Customer Service Excellence"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="form-textarea"
                placeholder="Brief description of what this scenario teaches..."
                required
              />
            </div>

            <div>
              <label htmlFor="objective" className="block text-sm font-medium text-gray-700 mb-2">
                Learning Objective *
              </label>
              <textarea
                id="objective"
                name="objective"
                value={formData.objective}
                onChange={handleInputChange}
                rows={2}
                className="form-textarea"
                placeholder="What should students learn from this scenario?"
                required
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">AI Character Configuration</h2>
          </div>
          <div className="card-body space-y-6">
            <div>
              <label htmlFor="botCharacter" className="block text-sm font-medium text-gray-700 mb-2">
                Character Role *
              </label>
              <input
                type="text"
                id="botCharacter"
                name="botCharacter"
                value={formData.botCharacter}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., Customer Service Representative, Angry Customer, Team Member"
                required
              />
            </div>

            <div>
              <label htmlFor="botTone" className="block text-sm font-medium text-gray-700 mb-2">
                Character Tone *
              </label>
              <input
                type="text"
                id="botTone"
                name="botTone"
                value={formData.botTone}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., Professional and patient, Frustrated but reasonable, Skeptical"
                required
              />
            </div>

            <div>
              <label htmlFor="botContext" className="block text-sm font-medium text-gray-700 mb-2">
                Character Context & Background *
              </label>
              <textarea
                id="botContext"
                name="botContext"
                value={formData.botContext}
                onChange={handleInputChange}
                rows={4}
                className="form-textarea"
                placeholder="Describe the character's situation, background, and what they're trying to achieve..."
                required
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-lg font-semibold text-gray-900">Learning Objectives</h2>
          </div>
          <div className="card-body">
            <p className="text-sm text-gray-600 mb-4">
              Define specific skills or behaviors that students should demonstrate during the roleplay.
            </p>
            
            <div className="space-y-3">
              {formData.learningObjectives.map((objective, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={objective}
                      onChange={(e) => handleObjectiveChange(index, e.target.value)}
                      className="form-input"
                      placeholder={`Learning objective ${index + 1}...`}
                      required
                    />
                  </div>
                  {formData.learningObjectives.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeObjective(index)}
                      className="text-red-600 hover:text-red-800 p-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            <button
              type="button"
              onClick={addObjective}
              className="mt-3 btn-secondary text-sm"
            >
              + Add Learning Objective
            </button>
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Link href="/admin" className="btn-secondary">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create Scenario'}
          </button>
        </div>
      </form>
    </div>
  );
}