const pool = require('../config/database');

class UserStatistics {
  // Create user statistics entry
  static async create(userId) {
    const result = await pool.query(
      `INSERT INTO user_statistics (user_id, total_distance, total_time, total_calories, total_territory_area, total_running_sessions)
       VALUES ($1, 0, 0, 0, 0, 0)
       RETURNING *`,
      [userId]
    );
    return result.rows[0];
  }

  // Get statistics by user ID
  static async getByUserId(userId) {
    const result = await pool.query(
      'SELECT * FROM user_statistics WHERE user_id = $1',
      [userId]
    );
    return result.rows[0];
  }

  // Update statistics
  static async update(userId, updatedStats) {
    const result = await pool.query(
      `INSERT INTO user_statistics (
         user_id,
         total_distance,
         total_time,
         total_calories,
         total_territory_area,
         total_running_sessions,
         updated_at
       )
       VALUES ($1, $2, $3, $4, 0, 1, NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET total_distance = user_statistics.total_distance + EXCLUDED.total_distance,
           total_time = user_statistics.total_time + EXCLUDED.total_time,
           total_calories = user_statistics.total_calories + EXCLUDED.total_calories,
           total_running_sessions = user_statistics.total_running_sessions + 1,
           updated_at = NOW()
       RETURNING *`,
      [userId, updatedStats.distance * 1000, updatedStats.time, updatedStats.calories]
    );
    return result.rows[0];
  }

  // Update territory area
  static async updateTerritoryArea(userId, areaIncrease) {
    const result = await pool.query(
      `INSERT INTO user_statistics (
         user_id,
         total_distance,
         total_time,
         total_calories,
         total_territory_area,
         total_running_sessions,
         updated_at
       )
       VALUES ($1, 0, 0, 0, $2, 0, NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET total_territory_area = user_statistics.total_territory_area + EXCLUDED.total_territory_area,
           updated_at = NOW()
       RETURNING *`,
      [userId, areaIncrease]
    );
    return result.rows[0];
  }

  // Get leaderboard by total area (top users)
  static async getLeaderboardByArea(limit = 10) {
    const result = await pool.query(
      `SELECT us.*, u.username FROM user_statistics us
       JOIN users u ON us.user_id = u.id
       ORDER BY us.total_territory_area DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  // Get leaderboard by total distance (top users)
  static async getLeaderboardByDistance(limit = 10) {
    const result = await pool.query(
      `SELECT us.*, u.username FROM user_statistics us
       JOIN users u ON us.user_id = u.id
       ORDER BY us.total_distance DESC
       LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  // Get user rank by area
  static async getUserRankByArea(userId) {
    const result = await pool.query(
      `SELECT COUNT(*) as rank FROM user_statistics
       WHERE total_territory_area > (
         SELECT total_territory_area FROM user_statistics WHERE user_id = $1
       )`,
      [userId]
    );
    return result.rows[0].rank + 1;
  }

  // Get user rank by distance
  static async getUserRankByDistance(userId) {
    const result = await pool.query(
      `SELECT COUNT(*) as rank FROM user_statistics
       WHERE total_distance > (
         SELECT total_distance FROM user_statistics WHERE user_id = $1
       )`,
      [userId]
    );
    return result.rows[0].rank + 1;
  }
}

module.exports = UserStatistics;
