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

    // Add money column to users table if it doesn't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS money INTEGER NOT NULL DEFAULT 0
    `);

    // Add gold column to users table if it doesn't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS gold INTEGER NOT NULL DEFAULT 0
    `);

    // Add autoprinters column to users table if it doesn't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS autoprinters INTEGER NOT NULL DEFAULT 0
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
    'SELECT id, email, password_hash, tickets_contributed, printer_supplies, money, gold, autoprinters, created_at FROM users WHERE email = $1',
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
    'INSERT INTO users (email, password_hash, printer_supplies, money, gold, autoprinters) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, tickets_contributed, printer_supplies, money, gold, autoprinters, created_at',
    [email, passwordHash, 100, 0, 0, 0]
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
    'SELECT id, email, tickets_contributed, printer_supplies, money, gold, autoprinters, created_at FROM users WHERE id = $1',
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
 * Increment user's money by a certain amount
 * @param {number} userId User ID
 * @param {number} amount Amount to increment by
 * @returns {Promise<number>} New money count after increment
 */
async function incrementUserMoney(userId, amount = 1) {
  const result = await pool.query(
    'UPDATE users SET money = money + $1 WHERE id = $2 RETURNING money',
    [amount, userId]
  );
  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
  return result.rows[0].money;
}

/**
 * Decrement user's money and increment supplies atomically
 * @param {number} userId User ID
 * @param {number} moneyCost Cost in money
 * @param {number} suppliesGain Amount of supplies to gain
 * @returns {Promise<object>} Object with new money and printer_supplies counts
 * @throws {Error} If user has insufficient money
 */
async function buySupplies(userId, moneyCost, suppliesGain) {
  const result = await pool.query(
    'UPDATE users SET money = money - $1, printer_supplies = printer_supplies + $2 WHERE id = $3 AND money >= $1 RETURNING money, printer_supplies',
    [moneyCost, suppliesGain, userId]
  );
  if (result.rows.length === 0) {
    throw new Error('Insufficient money');
  }
  return result.rows[0];
}

/**
 * Decrement user's money and increment gold atomically
 * @param {number} userId User ID
 * @param {number} moneyCost Cost in money
 * @param {number} goldQuantity Amount of gold to gain
 * @returns {Promise<object>} Object with new money and gold counts
 * @throws {Error} If user has insufficient money
 */
async function buyGold(userId, moneyCost, goldQuantity) {
  const result = await pool.query(
    'UPDATE users SET money = money - $1, gold = gold + $2 WHERE id = $3 AND money >= $1 RETURNING money, gold',
    [moneyCost, goldQuantity, userId]
  );
  if (result.rows.length === 0) {
    throw new Error('Insufficient money');
  }
  return result.rows[0];
}

/**
 * Buy an autoprinter with gold
 * Cost formula: 3 * (current_autoprinters + 1)^2
 * @param {number} userId User ID
 * @returns {Promise<object>} Object with new gold and autoprinters counts
 * @throws {Error} If user has insufficient gold
 */
async function buyAutoprinter(userId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get current autoprinter count
    const userResult = await client.query(
      'SELECT autoprinters, gold FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const currentAutoprinters = userResult.rows[0].autoprinters;
    const currentGold = userResult.rows[0].gold;
    
    // Calculate cost: 2 * (autoprinters + 1)^1.2
    const goldCost = 2 * Math.floor(Math.pow(currentAutoprinters + 1, 1.2));

    // Check if user has enough gold
    if (currentGold < goldCost) {
      throw new Error('Insufficient gold');
    }

    // Purchase autoprinter
    const result = await client.query(
      'UPDATE users SET gold = gold - $1, autoprinters = autoprinters + 1 WHERE id = $2 RETURNING gold, autoprinters',
      [goldCost, userId]
    );

    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Process all autoprinters for all users atomically
 * Each user prints min(autoprinters, printer_supplies) tickets
 * Updates supplies, money, tickets_contributed for users and global_state count
 * @returns {Promise<object>} Object with totalTickets processed and newGlobalCount
 */
async function processAutoprinters() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Process all users with autoprinters and supplies in a single UPDATE
    const usersResult = await client.query(`
      UPDATE users 
      SET 
        printer_supplies = printer_supplies - LEAST(autoprinters, printer_supplies),
        money = money + LEAST(autoprinters, printer_supplies),
        tickets_contributed = tickets_contributed + LEAST(autoprinters, printer_supplies)
      WHERE autoprinters > 0 AND printer_supplies > 0
      RETURNING LEAST(autoprinters, printer_supplies) as tickets_printed
    `);

    // Calculate total tickets printed
    const totalTickets = usersResult.rows.reduce((sum, row) => sum + row.tickets_printed, 0);

    // Update global count if any tickets were printed
    let newGlobalCount = null;
    if (totalTickets > 0) {
      const globalResult = await client.query(
        'UPDATE global_state SET count = count + $1, updated_at = CURRENT_TIMESTAMP WHERE id = 1 RETURNING count',
        [totalTickets]
      );
      newGlobalCount = globalResult.rows[0].count;
    }

    await client.query('COMMIT');
    return { totalTickets, newGlobalCount };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
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
  incrementUserMoney,
  buySupplies,
  buyGold,
  buyAutoprinter,
  processAutoprinters,
};
