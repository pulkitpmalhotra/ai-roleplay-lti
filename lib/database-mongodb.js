// MongoDB Database Implementation for Emergent Platform
import { MongoClient } from 'mongodb';

let client;
let db;

async function connectMongoDB() {
  if (client && db) {
    return { client, db };
  }

  const mongoUrl = process.env.MONGO_URL || process.env.MONGODB_URI;
  
  if (!mongoUrl) {
    throw new Error('MongoDB connection string not found. Please set MONGO_URL or MONGODB_URI environment variable.');
  }

  try {
    client = new MongoClient(mongoUrl);
    await client.connect();
    db = client.db(); // Use default database from connection string
    
    console.log('Connected to MongoDB successfully');
    return { client, db };
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
}

export async function initDatabase() {
  try {
    const { db } = await connectMongoDB();
    
    // Create collections if they don't exist and set up indexes
    await createCollections(db);
    
    // Insert default scenario if no scenarios exist
    await insertDefaultScenario(db);
    
    console.log('MongoDB database initialized successfully');
    return db;
  } catch (error) {
    console.error('MongoDB database initialization failed:', error);
    throw error;
  }
}

async function createCollections(db) {
  // Create collections and indexes
  const collections = ['scenarios', 'users', 'learning_sessions', 'messages', 'learning_progress', 'lti_launches'];
  
  for (const collectionName of collections) {
    const collection = db.collection(collectionName);
    
    // Create indexes based on collection type
    switch (collectionName) {
      case 'users':
        await collection.createIndex({ lti_user_id: 1 }, { unique: true });
        break;
      case 'learning_sessions':
        await collection.createIndex({ session_token: 1 }, { unique: true });
        await collection.createIndex({ user_id: 1 });
        await collection.createIndex({ scenario_id: 1 });
        break;
      case 'messages':
        await collection.createIndex({ session_id: 1 });
        await collection.createIndex({ timestamp: 1 });
        break;
      case 'learning_progress':
        await collection.createIndex({ session_id: 1 });
        break;
      case 'scenarios':
        await collection.createIndex({ is_active: 1 });
        break;
    }
  }
}

async function insertDefaultScenario(db) {
  const scenarios = db.collection('scenarios');
  
  // Check if any scenarios exist
  const count = await scenarios.countDocuments();
  
  if (count === 0) {
    // Insert default scenario
    await scenarios.insertOne({
      title: 'Customer Service Excellence',
      description: 'Practice handling difficult customer service situations with empathy and professionalism',
      objective: 'Learn to de-escalate conflicts, show empathy, and provide effective solutions to customer problems',
      bot_tone: 'Professional, patient, and empathetic',
      bot_context: 'You are dealing with frustrated customers who have various complaints about products or services. Your goal is to help resolve their issues while maintaining a positive company image.',
      bot_character: 'Customer Service Representative',
      learning_objectives: [
        'Demonstrate active listening skills',
        'Show empathy and understanding',
        'Offer practical solutions',
        'De-escalate tense situations',
        'Maintain professional demeanor'
      ],
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true
    });
    
    console.log('Default scenario inserted');
  }
}

export async function getDatabase() {
  try {
    const { db } = await connectMongoDB();
    return db;
  } catch (error) {
    console.error('Error getting database:', error);
    throw error;
  }
}

// MongoDB-specific helper functions
export class MongoDBHelper {
  constructor() {
    this.db = null;
  }

  async getDB() {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  // Scenarios
  async getAllScenarios() {
    const db = await this.getDB();
    return await db.collection('scenarios')
      .find({ is_active: true })
      .sort({ created_at: -1 })
      .toArray();
  }

  async getScenario(id) {
    const db = await this.getDB();
    const { ObjectId } = require('mongodb');
    return await db.collection('scenarios')
      .findOne({ _id: new ObjectId(id), is_active: true });
  }

  async createScenario(scenarioData) {
    const db = await this.getDB();
    const result = await db.collection('scenarios').insertOne({
      ...scenarioData,
      created_at: new Date(),
      updated_at: new Date(),
      is_active: true
    });
    return { id: result.insertedId, ...scenarioData };
  }

  async updateScenario(id, scenarioData) {
    const db = await this.getDB();
    const { ObjectId } = require('mongodb');
    await db.collection('scenarios').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          ...scenarioData, 
          updated_at: new Date() 
        } 
      }
    );
    return { id, ...scenarioData };
  }

  async deleteScenario(id) {
    const db = await this.getDB();
    const { ObjectId } = require('mongodb');
    await db.collection('scenarios').updateOne(
      { _id: new ObjectId(id) },
      { $set: { is_active: false } }
    );
    return true;
  }

  // Users
  async createOrUpdateUser(ltiUserId, userData) {
    const db = await this.getDB();
    const result = await db.collection('users').findOneAndUpdate(
      { lti_user_id: ltiUserId },
      { 
        $set: { 
          ...userData,
          updated_at: new Date()
        },
        $setOnInsert: { 
          created_at: new Date() 
        }
      },
      { upsert: true, returnDocument: 'after' }
    );
    return result.value;
  }

  async getUser(ltiUserId) {
    const db = await this.getDB();
    return await db.collection('users').findOne({ lti_user_id: ltiUserId });
  }

  // Learning Sessions
  async createSession(sessionData) {
    const db = await this.getDB();
    const result = await db.collection('learning_sessions').insertOne({
      ...sessionData,
      start_time: new Date(),
      total_messages: 0,
      completion_percentage: 0,
      final_grade: 0.0,
      status: 'active'
    });
    return { id: result.insertedId, ...sessionData };
  }

  async getSessionByToken(sessionToken) {
    const db = await this.getDB();
    return await db.collection('learning_sessions').findOne({ session_token: sessionToken });
  }

  async updateSession(sessionId, updates) {
    const db = await this.getDB();
    const { ObjectId } = require('mongodb');
    await db.collection('learning_sessions').updateOne(
      { _id: new ObjectId(sessionId) },
      { $set: updates }
    );
    return { id: sessionId, ...updates };
  }

  // Messages
  async saveMessage(sessionId, role, content, tokenCount = 0) {
    const db = await this.getDB();
    const { ObjectId } = require('mongodb');
    const result = await db.collection('messages').insertOne({
      session_id: new ObjectId(sessionId),
      role,
      content,
      token_count: tokenCount,
      timestamp: new Date()
    });
    return { id: result.insertedId, session_id: sessionId, role, content, token_count: tokenCount };
  }

  async getSessionMessages(sessionId) {
    const db = await this.getDB();
    const { ObjectId } = require('mongodb');
    return await db.collection('messages')
      .find({ session_id: new ObjectId(sessionId) })
      .sort({ timestamp: 1 })
      .toArray();
  }

  // Learning Progress
  async initializeLearningProgress(sessionId, objectives) {
    const db = await this.getDB();
    const { ObjectId } = require('mongodb');
    
    const progressData = objectives.map((objective, index) => ({
      session_id: new ObjectId(sessionId),
      objective_key: `obj_${index}`,
      objective_description: objective,
      achieved: false,
      score: 0.0,
      created_at: new Date()
    }));

    const result = await db.collection('learning_progress').insertMany(progressData);
    return progressData.map((item, index) => ({ id: result.insertedIds[index], ...item }));
  }

  async getSessionProgress(sessionId) {
    const db = await this.getDB();
    const { ObjectId } = require('mongodb');
    return await db.collection('learning_progress')
      .find({ session_id: new ObjectId(sessionId) })
      .sort({ objective_key: 1 })
      .toArray();
  }

  async updateProgress(sessionId, objectiveKey, achieved, score = 1.0) {
    const db = await this.getDB();
    const { ObjectId } = require('mongodb');
    await db.collection('learning_progress').updateOne(
      { session_id: new ObjectId(sessionId), objective_key: objectiveKey },
      { 
        $set: {
          achieved,
          score,
          achievement_timestamp: achieved ? new Date() : null
        }
      }
    );
    return { sessionId, objectiveKey, achieved, score };
  }

  // Statistics and Analytics
  async getScenarioStats(scenarioId) {
    const db = await this.getDB();
    const { ObjectId } = require('mongodb');
    
    const sessions = await db.collection('learning_sessions')
      .find({ scenario_id: new ObjectId(scenarioId) })
      .toArray();

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

export default MongoDBHelper;