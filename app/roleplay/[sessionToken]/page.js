'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

export default function RoleplayPage() {
  const { sessionToken } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [progress, setProgress] = useState([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (sessionToken) {
      loadSession();
      loadMessages();
    }
  }, [sessionToken]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSession = async () => {
    try {
      const response = await fetch(`/api/roleplay/session/${sessionToken}`);
      if (!response.ok) throw new Error('Session not found');
      
      const data = await response.json();
      setSession(data.session);
      setProgress(data.progress);
      setCompletionPercentage(data.completionPercentage);
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await fetch(`/api/roleplay/messages/${sessionToken}`);
      if (!response.ok) throw new Error('Failed to load messages');
      
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // Add user message immediately
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const response = await fetch('/api/roleplay/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken,
          message: userMessage
        })
      });

      if (!response.ok) throw new Error('Failed to get response');
      
      const data = await response.json();
      
      // Add AI response
      const aiMessage = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, aiMessage]);

      // Update progress
      if (data.progress) {
        setProgress(data.progress);
        setCompletionPercentage(data.completionPercentage);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant',
        content: 'I apologize, but I\'m having trouble responding right now. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const achievedObjectives = progress.filter(p => p.achieved).length;
  const totalObjectives = progress.length;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Main Chat Interface */}
        <div className="lg:col-span-3">
          <div className="card">
            {/* Chat Header */}
            <div className="card-header">
              <div className="flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{session.scenario_title}</h1>
                  <p className="text-sm text-gray-600 mt-1">Training with {session.scenario?.bot_character || 'AI Assistant'}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary-600">{completionPercentage}%</div>
                  <div className="text-xs text-gray-500">Complete</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary-600 h-full transition-all duration-300 ease-out"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  <p className="mb-2">Welcome to your roleplay training session!</p>
                  <p className="text-sm">Start the conversation by typing a message below.</p>
                </div>
              )}
              
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-primary-100' : 'text-gray-500'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 max-w-xs lg:max-w-md px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="border-t border-gray-200 p-4">
              <form onSubmit={sendMessage} className="flex space-x-4">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 form-input"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Progress Sidebar */}
        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Learning Progress</h2>
            </div>
            <div className="card-body">
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-primary-600 mb-1">
                  {achievedObjectives}/{totalObjectives}
                </div>
                <div className="text-sm text-gray-600">Objectives Achieved</div>
              </div>

              <div className="space-y-3">
                {progress.map((objective, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${
                      objective.achieved 
                        ? 'bg-green-100 text-green-600' 
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {objective.achieved ? (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <span className="text-xs font-medium">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${objective.achieved ? 'text-gray-900' : 'text-gray-600'}`}>
                        {objective.objective_description}
                      </p>
                      {objective.achieved && objective.achievement_timestamp && (
                        <p className="text-xs text-green-600 mt-1">
                          ✓ Achieved {new Date(objective.achievement_timestamp).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {completionPercentage === 100 && (
                <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-center">
                    <div className="text-green-600 mb-2">
                      <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <h3 className="font-medium text-green-900 mb-1">Training Complete!</h3>
                    <p className="text-sm text-green-700">You've successfully achieved all learning objectives.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Session Info */}
          <div className="card mt-6">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Session Info</h3>
            </div>
            <div className="card-body space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Messages:</span>
                <span className="font-medium">{session.total_messages || messages.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Started:</span>
                <span className="font-medium">
                  {new Date(session.start_time).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className={`font-medium ${
                  session.status === 'completed' ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {session.status === 'completed' ? 'Completed' : 'In Progress'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}