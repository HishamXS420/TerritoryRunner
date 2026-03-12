const pool = require('./config/database');
const fs = require('fs');
const path = require('path');

/**
 * Initialize database schema
 * This script reads the database.sql file and executes all SQL commands
 */
async function initializeDatabase() {
  try {
    console.log('Starting database initialization...');

    // Read the SQL schema file
    const sqlFile = path.join(__dirname, 'config', 'database.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // Execute the SQL
    await pool.query(sql);

    console.log('✓ Database schema initialized successfully!');
    console.log('✓ All tables and indexes created.');

    // Close the connection
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('✗ Error initializing database:', error.message);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();
