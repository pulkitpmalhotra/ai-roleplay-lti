const Database = require('better-sqlite3');
const path = require('path');

let db;

function initDatabase() {
  if (db) return db;
  
  const dbPath = path.join(process.cwd(), 'database.sqlite');
  db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create tables
  createTables();
  
  return db;
}

function createTables() {
  // Scenarios table - Admin-configured roleplay scenarios
  db.exec(`
    CREATE TABLE IF NOT EXISTS scenarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      objective TEXT NOT NULL,
      bot_tone TEXT NOT NULL,
      bot_context TEXT NOT NULL,
      bot_character TEXT NOT NULL,
      learning_objectives TEXT NOT NULL, -- JSON array of objectives
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT 1
    )
  `);

  // Users table - LTI users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lti_user_id TEXT UNIQUE NOT NULL,
      name TEXT,
      email TEXT,
      role TEXT DEFAULT 'student', -- student, instructor, admin
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Learning sessions table - Individual roleplay sessions
  db.exec(`
    CREATE TABLE IF NOT EXISTS learning_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      scenario_id INTEGER NOT NULL,
      lti_context_id TEXT,
      lti_resource_link_id TEXT,
      session_token TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'active', -- active, completed, abandoned
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME,
      total_messages INTEGER DEFAULT 0,
      completion_percentage INTEGER DEFAULT 0,
      final_grade REAL DEFAULT 0.0,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (scenario_id) REFERENCES scenarios (id)
    )
  `);

  // Messages table - Conversation history
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      role TEXT NOT NULL, -- user, assistant
      content TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      token_count INTEGER DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES learning_sessions (id)
    )
  `);

  // Learning progress table - Track objective achievements
  db.exec(`
    CREATE TABLE IF NOT EXISTS learning_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      objective_key TEXT NOT NULL,
      objective_description TEXT NOT NULL,
      achieved BOOLEAN DEFAULT 0,
      achievement_timestamp DATETIME,
      evidence_message_id INTEGER,
      score REAL DEFAULT 0.0,
      FOREIGN KEY (session_id) REFERENCES learning_sessions (id),
      FOREIGN KEY (evidence_message_id) REFERENCES messages (id)
    )
  `);

  // LTI launches table - Track LTI launch attempts and outcomes
  db.exec(`
    CREATE TABLE IF NOT EXISTS lti_launches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      scenario_id INTEGER,
      context_id TEXT,
      resource_link_id TEXT,
      launch_url TEXT,
      outcome_service_url TEXT,
      result_sourcedid TEXT,
      launch_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      success BOOLEAN DEFAULT 1,
      error_message TEXT,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (scenario_id) REFERENCES scenarios (id)
    )
  `);

  // Insert default scenario for testing
  const defaultScenario = db.prepare(`
    INSERT OR IGNORE INTO scenarios 
    (title, description, objective, bot_tone, bot_context, bot_character, learning_objectives)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  defaultScenario.run(
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
  );
}

function getDatabase() {
  if (!db) {
    return initDatabase();
  }
  return db;
}

module.exports = {
  initDatabase,
  getDatabase
};