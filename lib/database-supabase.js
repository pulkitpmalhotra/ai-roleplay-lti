// Supabase Database Integration for LTI Gemini Roleplay Bot
import { createClient } from '@supabase/supabase-js';

let supabase;

function getSupabaseClient() {
  if (!supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase configuration. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    
    supabase = createClient(supabaseUrl, supabaseKey);
  }
  
  return supabase;
}

export async function initDatabase() {
  const client = getSupabaseClient();
  
  try {
    // Check if tables exist, create if they don't
    await createTables(client);
    
    // Insert default scenario if no scenarios exist
    await insertDefaultScenario(client);
    
    console.log('Supabase database initialized successfully');
    return client;
  } catch (error) {
    console.error('Supabase database initialization failed:', error);
    throw error;
  }
}

async function createTables(client) {
  // Note: In Supabase, you typically create tables via the Supabase Dashboard or SQL Editor
  // But we can check if they exist and provide setup instructions
  
  try {
    // Test if scenarios table exists
    const { data, error } = await client
      .from('scenarios')
      .select('count', { count: 'exact', head: true });
    
    if (error && error.code === 'PGRST116') {
      // Table doesn't exist, provide setup instructions
      console.error(`
🚨 SUPABASE SETUP REQUIRED 🚨

Your Supabase database needs to be set up with the required tables.
Please run this SQL in your Supabase SQL Editor:

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  lti_user_id TEXT UNIQUE NOT NULL,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'student',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Scenarios table
CREATE TABLE IF NOT EXISTS scenarios (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  objective TEXT NOT NULL,
  bot_tone TEXT NOT NULL,
  bot_context TEXT NOT NULL,
  bot_character TEXT NOT NULL,
  learning_objectives TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Learning sessions table
CREATE TABLE IF NOT EXISTS learning_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  scenario_id INTEGER NOT NULL,
  lti_context_id TEXT,
  lti_resource_link_id TEXT,
  session_token TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active',
  start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_time TIMESTAMP,
  total_messages INTEGER DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,
  final_grade REAL DEFAULT 0.0,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (scenario_id) REFERENCES scenarios (id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  token_count INTEGER DEFAULT 0,
  FOREIGN KEY (session_id) REFERENCES learning_sessions (id)
);

-- Learning progress table
CREATE TABLE IF NOT EXISTS learning_progress (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL,
  objective_key TEXT NOT NULL,
  objective_description TEXT NOT NULL,
  achieved BOOLEAN DEFAULT false,
  achievement_timestamp TIMESTAMP,
  evidence_message_id INTEGER,
  score REAL DEFAULT 0.0,
  FOREIGN KEY (session_id) REFERENCES learning_sessions (id),
  FOREIGN KEY (evidence_message_id) REFERENCES messages (id)
);

-- LTI launches table
CREATE TABLE IF NOT EXISTS lti_launches (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  scenario_id INTEGER,
  context_id TEXT,
  resource_link_id TEXT,
  launch_url TEXT,
  outcome_service_url TEXT,
  result_sourcedid TEXT,
  launch_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (scenario_id) REFERENCES scenarios (id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_lti_user_id ON users (lti_user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON learning_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_scenario_id ON learning_sessions (scenario_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_session_token ON learning_sessions (session_token);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages (session_id);
CREATE INDEX IF NOT EXISTS idx_learning_progress_session_id ON learning_progress (session_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_is_active ON scenarios (is_active);

-- Enable Row Level Security (RLS) for tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lti_launches ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (adjust as needed for production)
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON scenarios FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON learning_sessions FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON learning_progress FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON lti_launches FOR ALL USING (true);

After running this SQL, restart your application.
      `);
      throw new Error('Supabase tables not found. Please set up the database schema.');
    }
    
    console.log('Supabase tables verified successfully');
  } catch (error) {
    if (error.message.includes('tables not found')) {
      throw error;
    }
    console.error('Error checking Supabase tables:', error);
  }
}

async function insertDefaultScenario(client) {
  try {
    // Check if any scenarios exist
    const { data: scenarios, error } = await client
      .from('scenarios')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error checking scenarios:', error);
      return;
    }
    
    if (!scenarios || scenarios.length === 0) {
      // Insert default scenario
      const { error: insertError } = await client
        .from('scenarios')
        .insert({
          title: 'Customer Service Excellence',
          description: 'Practice handling difficult customer service situations with empathy and professionalism',
          objective: 'Learn to de-escalate conflicts, show empathy, and provide effective solutions to customer problems',
          bot_tone: 'Professional, patient, and empathetic',
          bot_context: 'You are dealing with frustrated customers who have various complaints about products or services. Your goal is to help resolve their issues while maintaining a positive company image.',
          bot_character: 'Customer Service Representative',
          learning_objectives: JSON.stringify([
            'Demonstrate active listening skills',
            'Show empathy and understanding',
            'Offer practical solutions',
            'De-escalate tense situations',
            'Maintain professional demeanor'
          ]),
          is_active: true
        });
      
      if (insertError) {
        console.error('Error inserting default scenario:', insertError);
      } else {
        console.log('Default scenario inserted successfully');
      }
    }
  } catch (error) {
    console.error('Error in insertDefaultScenario:', error);
  }
}

export function getDatabase() {
  return getSupabaseClient();
}

// Supabase-specific helper functions
export class SupabaseHelper {
  constructor() {
    this.client = getSupabaseClient();
  }

  // Scenarios
  async getAllScenarios() {
    const { data, error } = await this.client
      .from('scenarios')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  async getScenario(id) {
    const { data, error } = await this.client
      .from('scenarios')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async createScenario(scenarioData) {
    const { data, error } = await this.client
      .from('scenarios')
      .insert(scenarioData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateScenario(id, scenarioData) {
    const { data, error } = await this.client
      .from('scenarios')
      .update({ ...scenarioData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async deleteScenario(id) {
    const { error } = await this.client
      .from('scenarios')
      .update({ is_active: false })
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }

  // Users
  async createOrUpdateUser(ltiUserId, userData) {
    const { data, error } = await this.client
      .from('users')
      .upsert({ lti_user_id: ltiUserId, ...userData })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getUser(ltiUserId) {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('lti_user_id', ltiUserId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // Learning Sessions
  async createSession(sessionData) {
    const { data, error } = await this.client
      .from('learning_sessions')
      .insert(sessionData)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getSessionByToken(sessionToken) {
    const { data, error } = await this.client
      .from('learning_sessions')
      .select(`
        *,
        scenarios (title, description, bot_character)
      `)
      .eq('session_token', sessionToken)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateSession(sessionId, updates) {
    const { data, error } = await this.client
      .from('learning_sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Messages
  async saveMessage(sessionId, role, content, tokenCount = 0) {
    const { data, error } = await this.client
      .from('messages')
      .insert({
        session_id: sessionId,
        role,
        content,
        token_count: tokenCount
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getSessionMessages(sessionId) {
    const { data, error } = await this.client
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('timestamp', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  // Learning Progress
  async initializeLearningProgress(sessionId, objectives) {
    const progressData = objectives.map((objective, index) => ({
      session_id: sessionId,
      objective_key: `obj_${index}`,
      objective_description: objective,
      achieved: false,
      score: 0.0
    }));

    const { data, error } = await this.client
      .from('learning_progress')
      .insert(progressData)
      .select();
    
    if (error) throw error;
    return data;
  }

  async getSessionProgress(sessionId) {
    const { data, error } = await this.client
      .from('learning_progress')
      .select('*')
      .eq('session_id', sessionId)
      .order('objective_key', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  async updateProgress(sessionId, objectiveKey, achieved, score = 1.0) {
    const { data, error } = await this.client
      .from('learning_progress')
      .update({
        achieved,
        score,
        achievement_timestamp: achieved ? new Date().toISOString() : null
      })
      .eq('session_id', sessionId)
      .eq('objective_key', objectiveKey)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  // Statistics and Analytics
  async getScenarioStats(scenarioId) {
    const { data: sessions, error: sessionsError } = await this.client
      .from('learning_sessions')
      .select('*')
      .eq('scenario_id', scenarioId);

    if (sessionsError) throw sessionsError;

    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const avgCompletion = sessions.length ? 
      sessions.reduce((sum, s) => sum + s.completion_percentage, 0) / sessions.length : 0;
    const avgGrade = sessions.length ? 
      sessions.reduce((sum, s) => sum + s.final_grade, 0) / sessions.length : 0;

    return {
      totalSessions,
      completedSessions,
      completionRate: totalSessions ? Math.round((completedSessions / totalSessions) * 100) : 0,
      averageCompletion: Math.round(avgCompletion),
      averageGrade: Math.round(avgGrade * 100) / 100
    };
  }
}

export default SupabaseHelper;