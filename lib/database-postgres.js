// PostgreSQL Database Implementation for Vercel Deployment
import { Pool } from 'pg';

let pool;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.POSTGRES_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 5, // Maximum number of connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
  }
  return pool;
}

export async function initDatabase() {
  const client = getPool();
  
  try {
    // Create tables if they don't exist
    await createTables(client);
    
    // Insert default scenario if no scenarios exist
    await insertDefaultScenario(client);
    
    console.log('Database initialized successfully');
    return client;
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

async function createTables(client) {
  // Users table
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      lti_user_id TEXT UNIQUE NOT NULL,
      name TEXT,
      email TEXT,
      role TEXT DEFAULT 'student',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Scenarios table
  await client.query(`
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
    )
  `);

  // Learning sessions table
  await client.query(`
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
    )
  `);

  // Messages table
  await client.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY,
      session_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      token_count INTEGER DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES learning_sessions (id)
    )
  `);

  // Learning progress table
  await client.query(`
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
    )
  `);

  // LTI launches table
  await client.query(`
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
    )
  `);

  // Create indexes for better performance
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_users_lti_user_id ON users (lti_user_id);
    CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON learning_sessions (user_id);
    CREATE INDEX IF NOT EXISTS idx_learning_sessions_scenario_id ON learning_sessions (scenario_id);
    CREATE INDEX IF NOT EXISTS idx_learning_sessions_session_token ON learning_sessions (session_token);
    CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages (session_id);
    CREATE INDEX IF NOT EXISTS idx_learning_progress_session_id ON learning_progress (session_id);
    CREATE INDEX IF NOT EXISTS idx_scenarios_is_active ON scenarios (is_active);
  `);
}

async function insertDefaultScenario(client) {
  // Check if any scenarios exist
  const { rows } = await client.query('SELECT COUNT(*) as count FROM scenarios');
  
  if (parseInt(rows[0].count) === 0) {
    // Insert default scenario
    await client.query(`
      INSERT INTO scenarios 
      (title, description, objective, bot_tone, bot_context, bot_character, learning_objectives)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      'Customer Service Excellence',
      'Practice handling difficult customer service situations with empathy and professionalism',
      'Learn to de-escalate conflicts, show empathy, and provide effective solutions to customer problems',
      'Professional, patient, and empathetic',
      'You are dealing with frustrated customers who have various complaints about products or services. Your goal is to help resolve their issues while maintaining a positive company image.',
      'Customer Service Representative',
      JSON.stringify([
        'Demonstrate active listening skills',
        'Show empathy and understanding',
        'Offer practical solutions',
        'De-escalate tense situations',
        'Maintain professional demeanor'
      ])
    ]);
    
    console.log('Default scenario inserted');
  }
}

export function getDatabase() {
  return getPool();
}

// Utility functions for database operations
export async function query(text, params) {
  const client = getPool();
  try {
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function getOne(text, params) {
  const result = await query(text, params);
  return result.rows[0] || null;
}

export async function getMany(text, params) {
  const result = await query(text, params);
  return result.rows;
}

// Transaction support
export async function transaction(callback) {
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}