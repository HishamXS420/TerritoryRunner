const pool = require('../config/database');

class Territory {
  // Create a new territory
  static async create(userId, sessionId, polygonCoords, area, centerLat, centerLon) {
    const result = await pool.query(
      `INSERT INTO territories (user_id, running_session_id, polygon_coords, area, center_lat, center_lon)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, sessionId, JSON.stringify(polygonCoords), area, centerLat, centerLon]
    );
    return result.rows[0];
  }

  // Get all territories
  static async getAll() {
    const result = await pool.query(
      `SELECT t.*, u.username FROM territories t
       JOIN users u ON t.user_id = u.id
       ORDER BY t.created_at DESC`
    );
    return result.rows;
  }

  // Get territories by user ID
  static async getByUserId(userId) {
    const result = await pool.query(
      'SELECT * FROM territories WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  // Get territory by ID
  static async findById(territoryId) {
    const result = await pool.query(
      'SELECT * FROM territories WHERE id = $1',
      [territoryId]
    );
    return result.rows[0];
  }

  // Update territory owner (when taken over)
  static async updateOwner(territoryId, newUserId) {
    const result = await pool.query(
      'UPDATE territories SET user_id = $2 WHERE id = $1 RETURNING *',
      [territoryId, newUserId]
    );
    return result.rows[0];
  }

  // Update territory polygon (when overlap occurs)
  static async updatePolygon(territoryId, newPolygonCoords, newArea) {
    const result = await pool.query(
      `UPDATE territories SET polygon_coords = $2, area = $3 WHERE id = $1 RETURNING *`,
      [territoryId, JSON.stringify(newPolygonCoords), newArea]
    );
    return result.rows[0];
  }

  // Delete territory
  static async delete(territoryId) {
    const result = await pool.query(
      'DELETE FROM territories WHERE id = $1',
      [territoryId]
    );
    return result.rowCount;
  }

  // Get territories within a bounding box
  static async getTerritoriresInBounds(minLat, maxLat, minLon, maxLon) {
    const result = await pool.query(
      `SELECT t.*, u.username FROM territories t
       JOIN users u ON t.user_id = u.id
       WHERE center_lat BETWEEN $1 AND $2
       AND center_lon BETWEEN $3 AND $4`,
      [minLat, maxLat, minLon, maxLon]
    );
    return result.rows;
  }
}

module.exports = Territory;
