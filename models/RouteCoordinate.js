const pool = require('../config/database');

class RouteCoordinate {
  // Create route coordinates
  static async create(sessionId, latitude, longitude) {
    const result = await pool.query(
      `INSERT INTO route_coordinates (running_session_id, latitude, longitude, recorded_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [sessionId, latitude, longitude]
    );
    return result.rows[0];
  }

  // Get all coordinates for a session
  static async getBySessionId(sessionId) {
    const result = await pool.query(
      `SELECT latitude, longitude FROM route_coordinates 
       WHERE running_session_id = $1 
       ORDER BY recorded_at ASC`,
      [sessionId]
    );
    return result.rows;
  }

  // Batch insert coordinates
  static async batchCreate(sessionId, coordinates) {
    const promises = coordinates.map(coord => 
      this.create(sessionId, coord[0], coord[1])
    );
    return Promise.all(promises);
  }

  // Delete coordinates for a session
  static async deleteBySessionId(sessionId) {
    const result = await pool.query(
      'DELETE FROM route_coordinates WHERE running_session_id = $1',
      [sessionId]
    );
    return result.rowCount;
  }
}

module.exports = RouteCoordinate;
