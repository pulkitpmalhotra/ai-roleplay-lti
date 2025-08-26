const { getDatabase } = require('./database-mongodb');
const { ObjectId } = require('mongodb');

class ScenarioManager {
  async getDB() {
    return await getDatabase();
  }

  // Create new scenario
  async createScenario(scenarioData) {
    const {
      title,
      description,
      objective,
      botTone,
      botContext,
      botCharacter,
      learningObjectives
    } = scenarioData;

    const db = await this.getDB();
    
    const result = await db.collection('scenarios').insertOne({
      title,
      description,
      objective,
      bot_tone: botTone,
      bot_context: botContext,
      bot_character: botCharacter,
      learning_objectives: learningObjectives || [],
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    });

    return result.insertedId.toString();
  }

  // Get scenario by ID
  async getScenario(id) {
    const db = await this.getDB();
    const scenario = await db.collection('scenarios')
      .findOne({ _id: new ObjectId(id) });
    
    if (scenario) {
      // Convert MongoDB _id to id for compatibility
      scenario.id = scenario._id.toString();
      scenario.learningObjectives = scenario.learning_objectives || [];
    }
    
    return scenario;
  }

  // Get all scenarios
  async getAllScenarios() {
    const db = await this.getDB();
    const scenarios = await db.collection('scenarios')
      .find({})
      .sort({ created_at: -1 })
      .toArray();
    
    return scenarios.map(scenario => ({
      id: scenario._id.toString(),
      title: scenario.title,
      description: scenario.description,
      objective: scenario.objective,
      bot_character: scenario.bot_character,
      is_active: scenario.is_active,
      created_at: scenario.created_at
    }));
  }

  // Update scenario
  async updateScenario(id, scenarioData) {
    const {
      title,
      description,
      objective,
      botTone,
      botContext,
      botCharacter,
      learningObjectives
    } = scenarioData;

    const db = await this.getDB();
    
    const result = await db.collection('scenarios').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          title,
          description,
          objective,
          bot_tone: botTone,
          bot_context: botContext,
          bot_character: botCharacter,
          learning_objectives: learningObjectives || [],
          updated_at: new Date()
        }
      }
    );

    return result.modifiedCount > 0;
  }

  // Delete scenario (soft delete)
  async deleteScenario(id) {
    const db = await this.getDB();
    
    const result = await db.collection('scenarios').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          is_active: false,
          updated_at: new Date()
        }
      }
    );

    return result.modifiedCount > 0;
  }

  // Activate/deactivate scenario
  async toggleScenarioStatus(id, isActive) {
    const db = await this.getDB();
    
    const result = await db.collection('scenarios').updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          is_active: isActive,
          updated_at: new Date()
        }
      }
    );

    return result.modifiedCount > 0;
  }

  // Get scenario statistics
  async getScenarioStats(id) {
    const db = await this.getDB();
    
    const sessions = await db.collection('learning_sessions')
      .find({ scenario_id: id })
      .toArray();
    
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed').length;
    const avgCompletion = sessions.length > 0 
      ? sessions.reduce((sum, s) => sum + (s.completion_percentage || 0), 0) / sessions.length 
      : 0;
    const avgGrade = sessions.length > 0 
      ? sessions.reduce((sum, s) => sum + (s.final_grade || 0), 0) / sessions.length 
      : 0;
    const avgMessages = sessions.length > 0 
      ? sessions.reduce((sum, s) => sum + (s.total_messages || 0), 0) / sessions.length 
      : 0;

    return {
      totalSessions,
      averageCompletion: Math.round(avgCompletion),
      averageGrade: Math.round(avgGrade * 100) / 100,
      completedSessions,
      averageMessages: Math.round(avgMessages),
      completionRate: totalSessions > 0 
        ? Math.round((completedSessions / totalSessions) * 100)
        : 0
    };
  }

  // Get recent learning sessions for scenario
  async getRecentSessions(scenarioId, limit = 10) {
    const db = await this.getDB();
    
    const pipeline = [
      {
        $match: { scenario_id: scenarioId }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          user_id: 1,
          scenario_id: 1,
          status: 1,
          start_time: 1,
          end_time: 1,
          completion_percentage: 1,
          final_grade: 1,
          total_messages: 1,
          user_name: '$user.name',
          user_email: '$user.email'
        }
      },
      {
        $sort: { start_time: -1 }
      },
      {
        $limit: limit
      }
    ];

    return await db.collection('learning_sessions').aggregate(pipeline).toArray();
  }

  // Validate scenario data
  validateScenarioData(data) {
    const errors = [];

    if (!data.title || data.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long');
    }

    if (!data.description || data.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters long');
    }

    if (!data.objective || data.objective.trim().length < 10) {
      errors.push('Learning objective must be at least 10 characters long');
    }

    if (!data.botTone || data.botTone.trim().length < 3) {
      errors.push('Bot tone must be specified');
    }

    if (!data.botContext || data.botContext.trim().length < 20) {
      errors.push('Bot context must be at least 20 characters long');
    }

    if (!data.botCharacter || data.botCharacter.trim().length < 3) {
      errors.push('Bot character must be specified');
    }

    if (!data.learningObjectives || !Array.isArray(data.learningObjectives) || data.learningObjectives.length === 0) {
      errors.push('At least one learning objective must be provided');
    }

    if (data.learningObjectives && Array.isArray(data.learningObjectives)) {
      data.learningObjectives.forEach((obj, index) => {
        if (!obj || obj.trim().length < 5) {
          errors.push(`Learning objective ${index + 1} must be at least 5 characters long`);
        }
      });
    }

    return errors;
  }

  // Duplicate scenario
  async duplicateScenario(id) {
    const original = await this.getScenario(id);
    if (!original) {
      throw new Error('Original scenario not found');
    }

    const duplicateData = {
      title: `${original.title} (Copy)`,
      description: original.description,
      objective: original.objective,
      botTone: original.bot_tone,
      botContext: original.bot_context,
      botCharacter: original.bot_character,
      learningObjectives: original.learning_objectives || []
    };

    return await this.createScenario(duplicateData);
  }
}

module.exports = ScenarioManager;

module.exports = ScenarioManager;