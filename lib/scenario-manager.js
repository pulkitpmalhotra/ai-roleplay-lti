const { getDatabase } = require('./database');

class ScenarioManager {
  constructor() {
    this.db = getDatabase();
  }

  // Create new scenario
  createScenario(scenarioData) {
    const {
      title,
      description,
      objective,
      botTone,
      botContext,
      botCharacter,
      learningObjectives
    } = scenarioData;

    const stmt = this.db.prepare(`
      INSERT INTO scenarios 
      (title, description, objective, bot_tone, bot_context, bot_character, learning_objectives)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      title,
      description,
      objective,
      botTone,
      botContext,
      botCharacter,
      JSON.stringify(learningObjectives)
    );

    return result.lastInsertRowid;
  }

  // Get scenario by ID
  getScenario(id) {
    const stmt = this.db.prepare(`
      SELECT *, json_extract(learning_objectives, '$') as objectives_json
      FROM scenarios 
      WHERE id = ?
    `);
    
    const scenario = stmt.get(id);
    if (scenario) {
      scenario.learningObjectives = JSON.parse(scenario.learning_objectives);
    }
    
    return scenario;
  }

  // Get all scenarios
  getAllScenarios() {
    const stmt = this.db.prepare(`
      SELECT id, title, description, objective, bot_character, is_active, created_at
      FROM scenarios 
      ORDER BY created_at DESC
    `);
    
    return stmt.all();
  }

  // Update scenario
  updateScenario(id, scenarioData) {
    const {
      title,
      description,
      objective,
      botTone,
      botContext,
      botCharacter,
      learningObjectives
    } = scenarioData;

    const stmt = this.db.prepare(`
      UPDATE scenarios 
      SET title = ?, description = ?, objective = ?, bot_tone = ?, 
          bot_context = ?, bot_character = ?, learning_objectives = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(
      title,
      description,
      objective,
      botTone,
      botContext,
      botCharacter,
      JSON.stringify(learningObjectives),
      id
    );

    return result.changes > 0;
  }

  // Delete scenario (soft delete)
  deleteScenario(id) {
    const stmt = this.db.prepare(`
      UPDATE scenarios 
      SET is_active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Activate/deactivate scenario
  toggleScenarioStatus(id, isActive) {
    const stmt = this.db.prepare(`
      UPDATE scenarios 
      SET is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = stmt.run(isActive ? 1 : 0, id);
    return result.changes > 0;
  }

  // Get scenario statistics
  getScenarioStats(id) {
    const sessionStmt = this.db.prepare(`
      SELECT 
        COUNT(*) as total_sessions,
        AVG(completion_percentage) as avg_completion,
        AVG(final_grade) as avg_grade,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions
      FROM learning_sessions 
      WHERE scenario_id = ?
    `);

    const messageStmt = this.db.prepare(`
      SELECT AVG(total_messages) as avg_messages
      FROM learning_sessions 
      WHERE scenario_id = ? AND total_messages > 0
    `);

    const stats = sessionStmt.get(id) || {};
    const messageStats = messageStmt.get(id) || {};

    return {
      totalSessions: stats.total_sessions || 0,
      averageCompletion: Math.round(stats.avg_completion || 0),
      averageGrade: Math.round((stats.avg_grade || 0) * 100) / 100,
      completedSessions: stats.completed_sessions || 0,
      averageMessages: Math.round(messageStats.avg_messages || 0),
      completionRate: stats.total_sessions > 0 
        ? Math.round((stats.completed_sessions / stats.total_sessions) * 100)
        : 0
    };
  }

  // Get recent learning sessions for scenario
  getRecentSessions(scenarioId, limit = 10) {
    const stmt = this.db.prepare(`
      SELECT 
        ls.*,
        u.name as user_name,
        u.email as user_email
      FROM learning_sessions ls
      LEFT JOIN users u ON ls.user_id = u.id
      WHERE ls.scenario_id = ?
      ORDER BY ls.start_time DESC
      LIMIT ?
    `);

    return stmt.all(scenarioId, limit);
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
  duplicateScenario(id) {
    const original = this.getScenario(id);
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
      learningObjectives: original.learningObjectives
    };

    return this.createScenario(duplicateData);
  }
}

module.exports = ScenarioManager;