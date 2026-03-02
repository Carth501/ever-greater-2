import {
  RESOURCE_DB_FIELDS,
  ResourceAmount,
  ResourceType,
  User,
} from "ever-greater-shared";
import { Pool, PoolClient } from "pg";

// Create PostgreSQL connection pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 10,
  idleTimeoutMillis: process.env.DB_POOL_IDLE_TIMEOUT
    ? parseInt(process.env.DB_POOL_IDLE_TIMEOUT)
    : 30000,
});

// Handle pool errors (only if pool.on exists, for testing compatibility)
if (pool.on && typeof pool.on === "function") {
  pool.on("error", (err: Error) => {
    console.error("Unexpected error on idle client", err);
  });
}

/**
 * Initialize database schema and default data
 * Creates global_state and users tables if they don't exist
 * Inserts initial row with count=0 if table is empty
 */
export async function initializeDatabase(): Promise<void> {
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

    // Validate shared resource mapping against users table columns
    const columnsResult = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`,
    );
    const existingColumns = new Set(
      columnsResult.rows.map((row: { column_name: string }) => row.column_name),
    );

    for (const mappedField of Object.values(RESOURCE_DB_FIELDS)) {
      if (!existingColumns.has(mappedField)) {
        throw new Error(
          `Resource mapping validation failed: users.${mappedField} does not exist`,
        );
      }
    }

    // Insert initial row if table is empty
    const result = await client.query("SELECT COUNT(*) FROM global_state");
    const rowCount = parseInt(result.rows[0].count);

    if (rowCount === 0) {
      await client.query(`
        INSERT INTO global_state (id, count)
        VALUES (1, 0)
      `);
      console.log("Database initialized with count = 0");
    } else {
      console.log("Database already initialized");
    }
  } finally {
    client.release();
  }
}

/**
 * Get the current global count from database
 */
export async function getGlobalCount(): Promise<number> {
  const result = await pool.query(
    "SELECT count FROM global_state WHERE id = 1",
  );
  return result.rows[0].count;
}

/**
 * Increment the global count atomically
 */
export async function incrementGlobalCount(): Promise<number> {
  const result = await pool.query(`
    UPDATE global_state 
    SET count = count + 1, updated_at = CURRENT_TIMESTAMP 
    WHERE id = 1 
    RETURNING count
  `);
  return result.rows[0].count;
}

interface DbUser extends User {
  password_hash: string;
  created_at: Date;
}

/**
 * Get user by email (includes password_hash for authentication)
 */
export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const result = await pool.query(
    "SELECT id, email, password_hash, tickets_contributed, printer_supplies, money, gold, autoprinters, created_at FROM users WHERE email = $1",
    [email],
  );
  return result.rows[0] || null;
}

/**
 * Create a new user
 */
export async function createUser(
  email: string,
  passwordHash: string,
): Promise<User> {
  const result = await pool.query(
    "INSERT INTO users (email, password_hash, printer_supplies, money, gold, autoprinters) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, tickets_contributed, printer_supplies, money, gold, autoprinters",
    [email, passwordHash, 100, 0, 0, 0],
  );
  return result.rows[0];
}

/**
 * Get user by ID (excludes password_hash)
 */
export async function getUserById(userId: number): Promise<User | null> {
  const result = await pool.query(
    "SELECT id, email, tickets_contributed, printer_supplies, money, gold, autoprinters FROM users WHERE id = $1",
    [userId],
  );
  return result.rows[0] || null;
}

/**
 * Execute a resource transaction atomically
 * Deducts costs and adds gains in a single database operation
 * Uses optimistic locking to ensure user has sufficient resources
 */
export async function executeResourceTransaction(
  userId: number,
  cost: ResourceAmount,
  gain: ResourceAmount,
  client?: PoolClient,
): Promise<User> {
  const dbClient = client || pool;

  // Build SET clause for the UPDATE
  const setClauses: string[] = [];
  const values: (number | string)[] = [];
  let paramCount = 1;

  // Add cost deductions to SET clause
  for (const [resourceTypeStr, amount] of Object.entries(cost)) {
    if (amount === undefined) {
      continue;
    }
    const resourceType = resourceTypeStr as ResourceType;
    const dbField = RESOURCE_DB_FIELDS[resourceType];
    setClauses.push(`${dbField} = ${dbField} - $${paramCount}`);
    values.push(amount);
    paramCount++;
  }

  // Add gain increments to SET clause
  for (const [resourceTypeStr, amount] of Object.entries(gain)) {
    if (amount === undefined) {
      continue;
    }
    const resourceType = resourceTypeStr as ResourceType;
    const dbField = RESOURCE_DB_FIELDS[resourceType];
    setClauses.push(`${dbField} = ${dbField} + $${paramCount}`);
    values.push(amount);
    paramCount++;
  }

  // Build WHERE clause for affordability checks
  const whereClauses: string[] = [`id = $${paramCount}`];
  values.push(userId);
  paramCount++;

  for (const [resourceTypeStr, amount] of Object.entries(cost)) {
    if (amount === undefined) {
      continue;
    }
    const resourceType = resourceTypeStr as ResourceType;
    const dbField = RESOURCE_DB_FIELDS[resourceType];
    whereClauses.push(`${dbField} >= $${paramCount}`);
    values.push(amount);
    paramCount++;
  }

  // Execute the transaction
  const query = `
    UPDATE users 
    SET ${setClauses.join(", ")}
    WHERE ${whereClauses.join(" AND ")}
    RETURNING id, email, tickets_contributed, printer_supplies, money, gold, autoprinters
  `;

  const result = await dbClient.query(query, values);

  if (result.rows.length === 0) {
    throw new Error("Insufficient resources or user not found");
  }

  return result.rows[0];
}

/**
 * Process all autoprinters for all users atomically
 * Each user prints min(autoprinters, printer_supplies) tickets
 * Updates supplies, money, tickets_contributed for users and global_state count
 */
export async function processAutoprinters(): Promise<{
  totalTickets: number;
  newGlobalCount: number | null;
}> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

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
    const totalTickets = usersResult.rows.reduce(
      (sum: number, row: { tickets_printed: number }) =>
        sum + row.tickets_printed,
      0,
    );

    // Update global count if any tickets were printed
    let newGlobalCount: number | null = null;
    if (totalTickets > 0) {
      const globalResult = await client.query(
        "UPDATE global_state SET count = count + $1, updated_at = CURRENT_TIMESTAMP WHERE id = 1 RETURNING count",
        [totalTickets],
      );
      newGlobalCount = globalResult.rows[0].count;
    }

    await client.query("COMMIT");
    return { totalTickets, newGlobalCount };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Close the database connection pool
 * Should be called during graceful shutdown
 */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log("Database pool closed");
}
