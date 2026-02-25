const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 10,
  idleTimeoutMillis: process.env.DB_POOL_IDLE_TIMEOUT ? parseInt(process.env.DB_POOL_IDLE_TIMEOUT) : 30000,
});

// Handle pool errors (only if pool.on exists, for testing compatibility)
if (pool.on && typeof pool.on === 'function') {
  pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
  });
}

/**
 * Initialize database schema and default data
 * Creates global_state and users tables if they don't exist
 * Inserts initial row with count=0 if table is empty
 */
async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Create global_state table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS global_state (
        id INTEGER PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create users table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        tickets_contributed INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create session table for express-session if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
    `);

    // Create index on session expiration for cleanup
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_session_expire ON session (expire)
    `);

    // Add printer_supplies column to users table if it doesn't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS printer_supplies INTEGER NOT NULL DEFAULT 100
    `);

    await client.query(`
      ALTER TABLE users
      ALTER COLUMN printer_supplies SET DEFAULT 100
    `);

    await client.query(`
      UPDATE users
      SET printer_supplies = 100
      WHERE printer_supplies IS NULL OR printer_supplies = 0
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
 * Get user by email
 * @param {string} email User email
 * @returns {Promise<object|null>} User object or null if not found
 */
async function getUserByEmail(email) {
  const result = await pool.query(
    'SELECT id, email, password_hash, tickets_contributed, printer_supplies, created_at FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

/**
 * Create a new user
 * @param {string} email User email
 * @param {string} passwordHash Hashed password
 * @returns {Promise<object>} Created user object
 */
async function createUser(email, passwordHash) {
  const result = await pool.query(
    'INSERT INTO users (email, password_hash, printer_supplies) VALUES ($1, $2, $3) RETURNING id, email, tickets_contributed, printer_supplies, created_at',
    [email, passwordHash, 100]
  );
  return result.rows[0];
}

/**
 * Update user's ticket contribution count
 * @param {number} userId User ID
 * @param {number} increment Amount to increment by (positive or negative)
 * @returns {Promise<number>} Updated tickets_contributed count
 */
async function updateUserTickets(userId, increment) {
  const result = await pool.query(
    'UPDATE users SET tickets_contributed = tickets_contributed + $1 WHERE id = $2 RETURNING tickets_contributed',
    [increment, userId]
  );
  return result.rows[0].tickets_contributed;
}

/**
 * Get user by ID
 * @param {number} userId User ID
 * @returns {Promise<object|null>} User object or null if not found
 */
async function getUserById(userId) {
  const result = await pool.query(
    'SELECT id, email, tickets_contributed, printer_supplies, created_at FROM users WHERE id = $1',
    [userId]
  );
  return result.rows[0] || null;
}

/**
 * Get user's current printer supplies count
 * @param {number} userId User ID
 * @returns {Promise<number>} Current supplies count
 */
async function getUserSupplies(userId) {
  const result = await pool.query(
    'SELECT printer_supplies FROM users WHERE id = $1',
    [userId]
  );
  if (!result.rows[0]) {
    throw new Error('User not found');
  }
  return result.rows[0].printer_supplies;
}

/**
 * Decrement user's printer supplies atomically
 * @param {number} userId User ID
 * @returns {Promise<number>} New supplies count after decrement
 * @throws {Error} If user has no supplies remaining
 */
async function decrementUserSupplies(userId) {
  const result = await pool.query(
    'UPDATE users SET printer_supplies = printer_supplies - 1 WHERE id = $1 AND printer_supplies > 0 RETURNING printer_supplies',
    [userId]
  );
  if (result.rows.length === 0) {
    throw new Error('Out of supplies');
  }
  return result.rows[0].printer_supplies;
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
  getUserByEmail,
  createUser,
  updateUserTickets,
  getUserById,
  getUserSupplies,
  decrementUserSupplies,
};
