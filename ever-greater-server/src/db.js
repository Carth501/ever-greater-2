const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 10,
  idleTimeoutMillis: process.env.DB_POOL_IDLE_TIMEOUT ? parseInt(process.env.DB_POOL_IDLE_TIMEOUT) : 30000,
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

/**
 * Initialize database schema and default data
 * Creates global_state table if it doesn't exist
 * Inserts initial row with count=0 if table is empty
 */
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Create table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS global_state (
        id INTEGER PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert initial row if table is empty
    const result = await client.query('SELECT COUNT(*) FROM global_state');
    const rowCount = parseInt(result.rows[0].count);
    
    if (rowCount === 0) {
      await client.query(`
        INSERT INTO global_state (id, count)
        VALUES (1, 0)
      `);
      console.log('Database initialized with count = 0');
    } else {
      console.log('Database already initialized');
    }
  } finally {
    client.release();
  }
}

/**
 * Get the current global count from database
 * @returns {Promise<number>} Current count value
 */
async function getGlobalCount() {
  const result = await pool.query(
    'SELECT count FROM global_state WHERE id = 1'
  );
  return result.rows[0].count;
}

/**
 * Increment the global count atomically
 * @returns {Promise<number>} New count value after increment
 */
async function incrementGlobalCount() {
  const result = await pool.query(`
    UPDATE global_state 
    SET count = count + 1, updated_at = CURRENT_TIMESTAMP 
    WHERE id = 1 
    RETURNING count
  `);
  return result.rows[0].count;
}

/**
 * Close the database connection pool
 * Should be called during graceful shutdown
 */
async function closePool() {
  await pool.end();
  console.log('Database pool closed');
}

module.exports = {
  pool,
  initializeDatabase,
  getGlobalCount,
  incrementGlobalCount,
  closePool,
};
