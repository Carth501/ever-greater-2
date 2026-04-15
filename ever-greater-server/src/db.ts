import {
  RESOURCE_DB_FIELDS,
  ResourceAmount,
  ResourceType,
  User,
} from "ever-greater-shared";
import { Pool, PoolClient } from "pg";
import { getServerConfig } from "./config.js";

const serverConfig = getServerConfig();

/**
 * Thrown when a user attempts to withdraw global tickets beyond their personal
 * contribution-based limit within the 24-hour rolling window.
 */
export class GlobalTicketLimitExceeded extends Error {
  constructor() {
    super("Personal ticket withdrawal limit exceeded");
    this.name = "GlobalTicketLimitExceeded";
  }
}

export const STARTING_PRINTER_SUPPLIES = serverConfig.startingPrinterSupplies;

// Create PostgreSQL connection pool
export const pool = new Pool({
  connectionString: serverConfig.databaseUrl,
  max: serverConfig.dbPoolMax,
  idleTimeoutMillis: serverConfig.dbPoolIdleTimeout,
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

    // Create ticket_withdrawals table for audit log and 24h limit enforcement
    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_withdrawals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Add created_at column to ticket_withdrawals if it doesn't exist
    await client.query(`
      ALTER TABLE ticket_withdrawals 
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);

    // Create index on user_id and created_at for efficient queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_ticket_withdrawals_user_created ON ticket_withdrawals (user_id, created_at)
    `);

    // Add printer_supplies column to users table if it doesn't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS printer_supplies INTEGER NOT NULL DEFAULT ${STARTING_PRINTER_SUPPLIES}
    `);

    await client.query(`
      ALTER TABLE users
      ALTER COLUMN printer_supplies SET DEFAULT ${STARTING_PRINTER_SUPPLIES}
    `);

    await client.query(`
      UPDATE users
      SET printer_supplies = ${STARTING_PRINTER_SUPPLIES}
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

    // Add credit_value column to users table if it doesn't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS credit_value NUMERIC(10, 2) NOT NULL DEFAULT 0
    `);

    // Alter credit_value column type if it's currently INTEGER
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN credit_value SET DATA TYPE NUMERIC(10, 2) USING credit_value::NUMERIC(10, 2)
    `);

    // Add credit_generation_level column to users table if it doesn't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS credit_generation_level INTEGER NOT NULL DEFAULT 0
    `);

    // Add credit_capacity_level column to users table if it doesn't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS credit_capacity_level INTEGER NOT NULL DEFAULT 0
    `);

    // Add auto-buy unlock state columns
    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS auto_buy_supplies_purchased BOOLEAN NOT NULL DEFAULT FALSE
    `);

    await client.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS auto_buy_supplies_active BOOLEAN NOT NULL DEFAULT FALSE
    `);

    // Add created_at column to users table if it doesn't exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
}

function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

function coerceUserRowNumbersInPlace(
  userRow: Partial<
    Pick<
      User,
      | "tickets_contributed"
      | "printer_supplies"
      | "money"
      | "gold"
      | "autoprinters"
      | "credit_value"
      | "credit_generation_level"
      | "credit_capacity_level"
    >
  >,
): void {
  const numericFields = [
    "tickets_contributed",
    "printer_supplies",
    "money",
    "gold",
    "autoprinters",
    "credit_value",
    "credit_generation_level",
    "credit_capacity_level",
  ] as const;

  numericFields.forEach((field) => {
    if (field in userRow) {
      userRow[field] = toNumber(userRow[field]);
    }
  });
}

/**
 * Get user by email (includes password_hash for authentication)
 */
export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const result = await pool.query(
    "SELECT id, email, password_hash, tickets_contributed, printer_supplies, money, gold, autoprinters, credit_value, credit_generation_level, credit_capacity_level, auto_buy_supplies_purchased, auto_buy_supplies_active FROM users WHERE email = $1",
    [email],
  );
  if (!result.rows[0]) return null;
  const userRow = result.rows[0] as DbUser;
  coerceUserRowNumbersInPlace(userRow);
  const tickets_withdrawn = await getTicketsWithdrawnIn24Hours(userRow.id);
  return Object.assign(userRow, { tickets_withdrawn }) as DbUser;
}

/**
 * Get total tickets withdrawn by user in past 24 hours
 */
export async function getTicketsWithdrawnIn24Hours(
  userId: number,
  client?: PoolClient,
): Promise<number> {
  const dbClient = client || pool;
  const result = await dbClient.query(
    "SELECT COALESCE(SUM(amount), 0) as total FROM ticket_withdrawals WHERE user_id = $1 AND created_at > NOW() - INTERVAL '24 hours'",
    [userId],
  );
  return toNumber(result.rows[0]?.total);
}

/**
 * Record a global ticket withdrawal for a user
 */
export async function recordTicketWithdrawal(
  userId: number,
  amount: number,
  client?: PoolClient,
): Promise<void> {
  const dbClient = client || pool;
  await dbClient.query(
    "INSERT INTO ticket_withdrawals (user_id, amount) VALUES ($1, $2)",
    [userId, amount],
  );
}

/**
 * Clean up ticket withdrawal records older than 24 hours
 */
export async function cleanupOldTicketWithdrawals(): Promise<number> {
  const result = await pool.query(
    "DELETE FROM ticket_withdrawals WHERE created_at < NOW() - INTERVAL '24 hours'",
  );
  return result.rowCount || 0;
}

/**
 * Augment a user with their 24-hour ticket withdrawal total
 */
export async function enrichUserWithWithdrawals(
  user: User,
  client?: PoolClient,
): Promise<User> {
  const tickets_withdrawn = await getTicketsWithdrawnIn24Hours(user.id, client);
  return { ...user, tickets_withdrawn } as User;
}

/**
 * Create a new user
 */
export async function createUser(
  email: string,
  passwordHash: string,
): Promise<User> {
  const result = await pool.query(
    "INSERT INTO users (email, password_hash, printer_supplies, money, gold, autoprinters, credit_value, credit_generation_level, credit_capacity_level, auto_buy_supplies_purchased, auto_buy_supplies_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING id, email, tickets_contributed, printer_supplies, money, gold, autoprinters, credit_value, credit_generation_level, credit_capacity_level, auto_buy_supplies_purchased, auto_buy_supplies_active",
    [
      email,
      passwordHash,
      STARTING_PRINTER_SUPPLIES,
      0,
      0,
      0,
      0,
      0,
      0,
      false,
      false,
    ],
  );
  const userRow = result.rows[0] as User;
  coerceUserRowNumbersInPlace(userRow);
  const tickets_withdrawn = await getTicketsWithdrawnIn24Hours(userRow.id);
  return Object.assign(userRow, { tickets_withdrawn }) as User;
}

/**
 * Get user by ID (excludes password_hash)
 */
export async function getUserById(userId: number): Promise<User | null> {
  const result = await pool.query(
    "SELECT id, email, tickets_contributed, printer_supplies, money, gold, autoprinters, credit_value, credit_generation_level, credit_capacity_level, auto_buy_supplies_purchased, auto_buy_supplies_active FROM users WHERE id = $1",
    [userId],
  );
  if (!result.rows[0]) return null;
  const userRow = result.rows[0] as User;
  coerceUserRowNumbersInPlace(userRow);
  const tickets_withdrawn = await getTicketsWithdrawnIn24Hours(userRow.id);
  return Object.assign(userRow, { tickets_withdrawn }) as User;
}

/**
 * Execute a resource transaction atomically
 * Deducts costs and adds gains in a single database operation
 * Uses optimistic locking to ensure user has sufficient resources
 * Handles special case of GLOBAL_TICKETS cost by deducting from global_state.count
 */
export async function executeResourceTransaction(
  userId: number,
  cost: ResourceAmount,
  gain: ResourceAmount,
  client?: PoolClient,
): Promise<User> {
  const useTransaction = !client;
  let dbClient: PoolClient | typeof pool;
  let txClient: PoolClient | null = null;

  try {
    if (useTransaction) {
      // Get a client from the pool for transaction
      txClient = await pool.connect();
      dbClient = txClient;
      await dbClient.query("BEGIN");
    } else {
      dbClient = client;
    }

    // Check if this operation costs global tickets
    const globalTicketCost = cost[ResourceType.GLOBAL_TICKETS];
    if (globalTicketCost !== undefined && globalTicketCost > 0) {
      // Fetch user's tickets_contributed to enforce personal limit
      const userCheck = await dbClient.query(
        "SELECT tickets_contributed FROM users WHERE id = $1",
        [userId],
      );
      if (userCheck.rows.length === 0) {
        throw new Error("User not found");
      }
      const userContributed = userCheck.rows[0].tickets_contributed;
      const personalLimit = Number(userContributed) * 1.0; // modifier currently hardcoded to 1.0

      // Get 24-hour withdrawal total
      const withdrawnIn24h = await getTicketsWithdrawnIn24Hours(
        userId,
        dbClient,
      );
      const projectedWithdrawal =
        Number(withdrawnIn24h) + Number(globalTicketCost);

      if (projectedWithdrawal > personalLimit) {
        if (useTransaction && txClient) {
          await txClient.query("ROLLBACK");
          txClient.release();
          txClient = null;
        }
        throw new GlobalTicketLimitExceeded();
      }

      // Validate and deduct from global_state atomically
      const globalResult = await dbClient.query(
        `UPDATE global_state 
         SET count = count - $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = 1 AND count >= $1 
         RETURNING count`,
        [globalTicketCost],
      );

      if (globalResult.rows.length === 0) {
        throw new Error("Insufficient global tickets");
      }
    }

    // Separate global ticket cost from other costs for user update
    const userCost = { ...cost };
    delete userCost[ResourceType.GLOBAL_TICKETS];

    // Build SET clause for the UPDATE
    const setClauses: string[] = [];
    const values: (number | string)[] = [];
    let paramCount = 1;

    // Add cost deductions to SET clause (excluding global tickets already handled)
    for (const [resourceTypeStr, amount] of Object.entries(userCost)) {
      if (amount === undefined) {
        continue;
      }
      const resourceType = resourceTypeStr as ResourceType;
      const dbField = RESOURCE_DB_FIELDS[resourceType];
      if (!dbField) {
        // Skip resources that don't have a user database mapping
        continue;
      }
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
      if (!dbField) {
        // Skip resources that don't have a user database mapping
        continue;
      }
      setClauses.push(`${dbField} = ${dbField} + $${paramCount}`);
      values.push(amount);
      paramCount++;
    }

    // Build WHERE clause for affordability checks
    const whereClauses: string[] = [`id = $${paramCount}`];
    values.push(userId);
    paramCount++;

    for (const [resourceTypeStr, amount] of Object.entries(userCost)) {
      if (amount === undefined) {
        continue;
      }
      const resourceType = resourceTypeStr as ResourceType;
      const dbField = RESOURCE_DB_FIELDS[resourceType];
      if (!dbField) {
        // Skip resources that don't have a user database mapping
        continue;
      }
      whereClauses.push(`${dbField} >= $${paramCount}`);
      values.push(amount);
      paramCount++;
    }

    // Execute the transaction
    const query = `
      UPDATE users 
      SET ${setClauses.join(", ")}
      WHERE ${whereClauses.join(" AND ")}
      RETURNING id, email, tickets_contributed, printer_supplies, money, gold, autoprinters, credit_value, credit_generation_level, credit_capacity_level, auto_buy_supplies_purchased, auto_buy_supplies_active
    `;

    const result = await dbClient.query(query, values);

    if (result.rows.length === 0) {
      throw new Error("Insufficient resources or user not found");
    }

    // Record withdrawal if global tickets were spent
    if (globalTicketCost !== undefined && globalTicketCost > 0) {
      await recordTicketWithdrawal(userId, globalTicketCost, dbClient);
    }

    if (useTransaction && txClient) {
      await txClient.query("COMMIT");
    }

    const userRow = result.rows[0] as User;
    coerceUserRowNumbersInPlace(userRow);
    // Enrich with current withdrawal total for this transaction
    const tickets_withdrawn = await getTicketsWithdrawnIn24Hours(userId);
    return Object.assign(userRow, { tickets_withdrawn }) as User;
  } catch (error) {
    if (useTransaction && txClient) {
      await txClient.query("ROLLBACK").catch(() => {
        // Ignore rollback errors
      });
    }
    throw error;
  } finally {
    if (useTransaction && txClient) {
      txClient.release();
    }
  }
}

/**
 * Unlock auto-buy supplies in the same statement that charges gold.
 * This ensures the feature is only unlocked once and never revoked.
 */
export async function purchaseAutoBuySupplies(
  userId: number,
  goldCost: number,
): Promise<User> {
  const result = await pool.query(
    `
      UPDATE users
      SET
        gold = gold - $1,
        auto_buy_supplies_purchased = TRUE,
        auto_buy_supplies_active = TRUE
      WHERE id = $2
        AND gold >= $1
        AND auto_buy_supplies_purchased = FALSE
      RETURNING id, email, tickets_contributed, printer_supplies, money, gold, autoprinters, credit_value, credit_generation_level, credit_capacity_level, auto_buy_supplies_purchased, auto_buy_supplies_active
    `,
    [goldCost, userId],
  );

  if (!result.rows[0]) {
    throw new Error("Auto-buy supplies already unlocked or insufficient gold");
  }

  const userRow = result.rows[0] as User;
  coerceUserRowNumbersInPlace(userRow);
  const tickets_withdrawn = await getTicketsWithdrawnIn24Hours(userId);
  return Object.assign(userRow, { tickets_withdrawn }) as User;
}

/**
 * Toggle auto-buy supplies active state after unlock.
 */
export async function setAutoBuySuppliesActive(
  userId: number,
  active: boolean,
): Promise<User> {
  const result = await pool.query(
    `
      UPDATE users
      SET auto_buy_supplies_active = $1
      WHERE id = $2 AND auto_buy_supplies_purchased = TRUE
      RETURNING id, email, tickets_contributed, printer_supplies, money, gold, autoprinters, credit_value, credit_generation_level, credit_capacity_level, auto_buy_supplies_purchased, auto_buy_supplies_active
    `,
    [active, userId],
  );

  if (!result.rows[0]) {
    throw new Error("Auto-buy supplies not unlocked");
  }

  const userRow = result.rows[0] as User;
  coerceUserRowNumbersInPlace(userRow);
  const tickets_withdrawn = await getTicketsWithdrawnIn24Hours(userId);
  return Object.assign(userRow, { tickets_withdrawn }) as User;
}

/**
 * Process all autoprinters for all users atomically.
 * 1. Auto-buy supplies for users with auto-buy active who have no supplies
 * 2. Print tickets for all users with supplies
 * 3. Update global count
 *
 * This ensures the auto-buy system is respected while maintaining atomicity
 * for potentially thousands of users.
 */
export async function processAutoprinters(): Promise<{
  totalTickets: number;
  newGlobalCount: number | null;
}> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Step 1: Auto-buy supplies for users with active auto-buy who have less supplies than autoprinters
    // Matches BUY_SUPPLIES operation: costs 1 gold, gains 200 supplies
    await client.query(`
      UPDATE users
      SET 
        gold = gold - 1,
        printer_supplies = printer_supplies + 200
      WHERE 
        auto_buy_supplies_active = TRUE
        AND auto_buy_supplies_purchased = TRUE
        AND printer_supplies < autoprinters
        AND autoprinters > 0
        AND gold >= 1
    `);

    // Step 2: Process all users with autoprinters and supplies
    // Each user prints min(autoprinters, printer_supplies) tickets
    // Matches PRINT_TICKET operation scaled: costs supplies, gains money + tickets_contributed
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

    // Step 3: Update global count if any tickets were printed
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
 * Update all users' credit values based on their generation level and capacity.
 * Adds (generation_level / 10) to each user's credit_value, capped by capacity_level.
 * This atomic operation should be called once per second.
 *
 * Formula: credit_value = MIN(credit_value + credit_generation_level / 10, credit_capacity_level)
 * @returns Number of users updated
 */
export async function updateAllUsersCreditValues(): Promise<number> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      UPDATE users
      SET credit_value = LEAST(
        credit_value + credit_generation_level / 10.0, 
        credit_capacity_level
      )
      WHERE credit_generation_level > 0 OR credit_value < credit_capacity_level
    `);
    return result.rowCount || 0;
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
