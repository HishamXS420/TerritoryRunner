const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Create a new user
  static async create(username, email, password) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id, username, email',
      [username, email, hashedPassword]
    );
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const result = await pool.query('SELECT id, username, email, created_at FROM users WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Find user by username
  static async findByUsername(username) {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    return result.rows[0];
  }

  // Verify password
  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Get all users (for leaderboard)
  static async getAllUsers() {
    const result = await pool.query('SELECT id, username, created_at FROM users');
    return result.rows;
  }
}

module.exports = User;
