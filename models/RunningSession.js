const pool = require('../config/database');

class RunningSession {
  // Create a new running session
  static async create(userId) {
    const result = await pool.query(
      'INSERT INTO running_sessions (user_id, start_time) VALUES ($1, NOW()) RETURNING *',
      [userId]
    );
    return result.rows[0];
  }

  // Get session by ID
  static async findById(sessionId) {
    const result = await pool.query('SELECT * FROM running_sessions WHERE id = $1', [sessionId]);
    return result.rows[0];
  }

  // Update session end time and stats
  static async updateSession(sessionId, endTime, isClosedLoop, totalDistance, totalTime, estimatedCalories) {
    const result = await pool.query(
      `UPDATE running_sessions 
       SET end_time = $2, is_closed_loop = $3, total_distance = $4, total_time = $5, estimated_calories = $6
       WHERE id = $1 
       RETURNING *`,
      [sessionId, endTime, isClosedLoop, totalDistance, totalTime, estimatedCalories]
    );
    return result.rows[0];
  }

  // Get all sessions for a user
  static async getSessionsByUserId(userId) {
    const result = await pool.query(
      'SELECT * FROM running_sessions WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  // Get recent sessions with territory info
  static async getRecentSessionsWithTerritories(userId, limit = 10) {
    const result = await pool.query(
      `SELECT rs.id, rs.start_time, rs.end_time, rs.is_closed_loop, rs.total_distance, 
              rs.total_time, rs.estimated_calories, t.id as territory_id, t.area
       FROM running_sessions rs
       LEFT JOIN territories t ON rs.id = t.running_session_id
       WHERE rs.user_id = $1
       ORDER BY rs.created_at DESC
       LIMIT $2`,
      [userId, limit]
    );
    return result.rows;
  }
}

module.exports = RunningSession;
