const { Pool } = require('pg');
require('dotenv').config();

const dbHost = process.env.DB_HOST;
const useSsl = process.env.DB_SSL === 'true' || (typeof dbHost === 'string' && dbHost.includes('render.com'));

const pool = new Pool({
  host: dbHost,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = pool;
