const { Pool } = require('pg');
require('dotenv').config();

// Initialize PostgreSQL connection pool using the DATABASE_URL environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for many managed Cloud SQL instances
  }
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to PostgreSQL Cloud SQL Database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

module.exports = pool;
