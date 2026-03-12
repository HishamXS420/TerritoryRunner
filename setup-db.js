const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Automated database setup script
 * Creates database and loads schema from config/database.sql
 */
async function setupDatabase() {
  const dbConfig = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };

  const dbName = process.env.DB_NAME;

  console.log('\n🔧 Territory Running App - Database Setup\n');
  console.log(`Connecting to PostgreSQL at ${dbConfig.host}:${dbConfig.port}...`);

  try {
    // Step 1: Connect to default 'postgres' database to create new database
    const adminPool = new Pool({
      ...dbConfig,
      database: 'postgres',
    });

    console.log('✓ Connected to PostgreSQL');

    // Step 2: Check if database exists
    console.log(`\nChecking if database '${dbName}' exists...`);
    const dbExists = await adminPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (dbExists.rows.length > 0) {
      console.log('⚠ Database already exists. Dropping and recreating...');
      await adminPool.query(`DROP DATABASE IF EXISTS ${dbName}`);
    }

    // Step 3: Create database
    console.log(`Creating database '${dbName}'...`);
    await adminPool.query(`CREATE DATABASE ${dbName}`);
    console.log(`✓ Database '${dbName}' created successfully`);

    // Step 4: Close admin connection
    await adminPool.end();

    // Step 5: Connect to new database
    const appPool = new Pool({
      ...dbConfig,
      database: dbName,
    });

    console.log(`\nConnecting to '${dbName}' database...`);
    console.log('✓ Connected to application database');

    // Step 6: Read and execute schema SQL
    console.log('\nLoading database schema...');
    const schemaPath = path.join(__dirname, 'config', 'database.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found: ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Execute schema
    await appPool.query(schemaSql);
    console.log('✓ Database schema loaded successfully');

    // Step 7: Verify tables were created
    const tables = await appPool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📊 Tables created:');
    tables.rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.table_name}`);
    });

    // Step 8: Close connection
    await appPool.end();

    console.log('\n✅ Database setup completed successfully!\n');
    console.log('You can now start the application with:');
    console.log('   npm run dev\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Database setup failed:');
    console.error('   ' + error.message);
    console.error('\n📝 Troubleshooting:');
    console.error('   • Ensure PostgreSQL is running');
    console.error('   • Check .env file for correct credentials');
    console.error('   • Verify DB_USER and DB_PASSWORD are correct');
    console.error('   • Make sure DB_HOST and DB_PORT are accessible\n');
    process.exit(1);
  }
}

// Run setup
setupDatabase();
