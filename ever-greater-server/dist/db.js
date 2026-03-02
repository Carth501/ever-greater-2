"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.closePool = exports.updateAllUsersCreditValues = exports.processAutoprinters = exports.executeResourceTransaction = exports.getUserById = exports.createUser = exports.getUserByEmail = exports.incrementGlobalCount = exports.getGlobalCount = exports.initializeDatabase = exports.pool = void 0;
const ever_greater_shared_1 = require("ever-greater-shared");
const pg_1 = require("pg");
exports.pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    max: process.env.DB_POOL_MAX ? parseInt(process.env.DB_POOL_MAX) : 10,
    idleTimeoutMillis: process.env.DB_POOL_IDLE_TIMEOUT
        ? parseInt(process.env.DB_POOL_IDLE_TIMEOUT)
        : 30000,
});
if (exports.pool.on && typeof exports.pool.on === "function") {
    exports.pool.on("error", (err) => {
        console.error("Unexpected error on idle client", err);
    });
}
async function initializeDatabase() {
    const client = await exports.pool.connect();
    try {
        await client.query(`
      CREATE TABLE IF NOT EXISTS global_state (
        id INTEGER PRIMARY KEY,
        count INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        tickets_contributed INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
        await client.query(`
      CREATE TABLE IF NOT EXISTS session (
        sid VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      )
    `);
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_session_expire ON session (expire)
    `);
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
        await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS money INTEGER NOT NULL DEFAULT 0
    `);
        await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS gold INTEGER NOT NULL DEFAULT 0
    `);
        await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS autoprinters INTEGER NOT NULL DEFAULT 0
    `);
        await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS credit_value INTEGER NOT NULL DEFAULT 0
    `);
        await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS credit_generation_level INTEGER NOT NULL DEFAULT 0
    `);
        await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS credit_capacity_level INTEGER NOT NULL DEFAULT 0
    `);
        const columnsResult = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'users'`);
        const existingColumns = new Set(columnsResult.rows.map((row) => row.column_name));
        for (const mappedField of Object.values(ever_greater_shared_1.RESOURCE_DB_FIELDS)) {
            if (!existingColumns.has(mappedField)) {
                throw new Error(`Resource mapping validation failed: users.${mappedField} does not exist`);
            }
        }
        const result = await client.query("SELECT COUNT(*) FROM global_state");
        const rowCount = parseInt(result.rows[0].count);
        if (rowCount === 0) {
            await client.query(`
        INSERT INTO global_state (id, count)
        VALUES (1, 0)
      `);
            console.log("Database initialized with count = 0");
        }
        else {
            console.log("Database already initialized");
        }
    }
    finally {
        client.release();
    }
}
exports.initializeDatabase = initializeDatabase;
async function getGlobalCount() {
    const result = await exports.pool.query("SELECT count FROM global_state WHERE id = 1");
    return result.rows[0].count;
}
exports.getGlobalCount = getGlobalCount;
async function incrementGlobalCount() {
    const result = await exports.pool.query(`
    UPDATE global_state 
    SET count = count + 1, updated_at = CURRENT_TIMESTAMP 
    WHERE id = 1 
    RETURNING count
  `);
    return result.rows[0].count;
}
exports.incrementGlobalCount = incrementGlobalCount;
async function getUserByEmail(email) {
    const result = await exports.pool.query("SELECT id, email, password_hash, tickets_contributed, printer_supplies, money, gold, autoprinters, credit_value, credit_generation_level, credit_capacity_level, created_at FROM users WHERE email = $1", [email]);
    return result.rows[0] || null;
}
exports.getUserByEmail = getUserByEmail;
async function createUser(email, passwordHash) {
    const result = await exports.pool.query("INSERT INTO users (email, password_hash, printer_supplies, money, gold, autoprinters, credit_value, credit_generation_level, credit_capacity_level) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, email, tickets_contributed, printer_supplies, money, gold, autoprinters, credit_value, credit_generation_level, credit_capacity_level", [email, passwordHash, 100, 0, 0, 0, 0, 0, 0]);
    return result.rows[0];
}
exports.createUser = createUser;
async function getUserById(userId) {
    const result = await exports.pool.query("SELECT id, email, tickets_contributed, printer_supplies, money, gold, autoprinters, credit_value, credit_generation_level, credit_capacity_level FROM users WHERE id = $1", [userId]);
    return result.rows[0] || null;
}
exports.getUserById = getUserById;
async function executeResourceTransaction(userId, cost, gain, client) {
    const useTransaction = !client;
    let dbClient;
    let txClient = null;
    try {
        if (useTransaction) {
            txClient = await exports.pool.connect();
            dbClient = txClient;
            await dbClient.query("BEGIN");
        }
        else {
            dbClient = client;
        }
        const globalTicketCost = cost[ever_greater_shared_1.ResourceType.GLOBAL_TICKETS];
        if (globalTicketCost !== undefined && globalTicketCost > 0) {
            const globalResult = await dbClient.query(`UPDATE global_state 
         SET count = count - $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = 1 AND count >= $1 
         RETURNING count`, [globalTicketCost]);
            if (globalResult.rows.length === 0) {
                throw new Error("Insufficient global tickets");
            }
        }
        const userCost = { ...cost };
        delete userCost[ever_greater_shared_1.ResourceType.GLOBAL_TICKETS];
        const setClauses = [];
        const values = [];
        let paramCount = 1;
        for (const [resourceTypeStr, amount] of Object.entries(userCost)) {
            if (amount === undefined) {
                continue;
            }
            const resourceType = resourceTypeStr;
            const dbField = ever_greater_shared_1.RESOURCE_DB_FIELDS[resourceType];
            if (!dbField) {
                continue;
            }
            setClauses.push(`${dbField} = ${dbField} - $${paramCount}`);
            values.push(amount);
            paramCount++;
        }
        for (const [resourceTypeStr, amount] of Object.entries(gain)) {
            if (amount === undefined) {
                continue;
            }
            const resourceType = resourceTypeStr;
            const dbField = ever_greater_shared_1.RESOURCE_DB_FIELDS[resourceType];
            if (!dbField) {
                continue;
            }
            setClauses.push(`${dbField} = ${dbField} + $${paramCount}`);
            values.push(amount);
            paramCount++;
        }
        const whereClauses = [`id = $${paramCount}`];
        values.push(userId);
        paramCount++;
        for (const [resourceTypeStr, amount] of Object.entries(userCost)) {
            if (amount === undefined) {
                continue;
            }
            const resourceType = resourceTypeStr;
            const dbField = ever_greater_shared_1.RESOURCE_DB_FIELDS[resourceType];
            if (!dbField) {
                continue;
            }
            whereClauses.push(`${dbField} >= $${paramCount}`);
            values.push(amount);
            paramCount++;
        }
        const query = `
      UPDATE users 
      SET ${setClauses.join(", ")}
      WHERE ${whereClauses.join(" AND ")}
      RETURNING id, email, tickets_contributed, printer_supplies, money, gold, autoprinters, credit_value, credit_generation_level, credit_capacity_level
    `;
        const result = await dbClient.query(query, values);
        if (result.rows.length === 0) {
            throw new Error("Insufficient resources or user not found");
        }
        if (useTransaction && txClient) {
            await txClient.query("COMMIT");
        }
        return result.rows[0];
    }
    catch (error) {
        if (useTransaction && txClient) {
            await txClient.query("ROLLBACK").catch(() => {
            });
        }
        throw error;
    }
    finally {
        if (useTransaction && txClient) {
            txClient.release();
        }
    }
}
exports.executeResourceTransaction = executeResourceTransaction;
async function processAutoprinters() {
    const client = await exports.pool.connect();
    try {
        await client.query("BEGIN");
        const usersResult = await client.query(`
      UPDATE users 
      SET 
        printer_supplies = printer_supplies - LEAST(autoprinters, printer_supplies),
        money = money + LEAST(autoprinters, printer_supplies),
        tickets_contributed = tickets_contributed + LEAST(autoprinters, printer_supplies)
      WHERE autoprinters > 0 AND printer_supplies > 0
      RETURNING LEAST(autoprinters, printer_supplies) as tickets_printed
    `);
        const totalTickets = usersResult.rows.reduce((sum, row) => sum + row.tickets_printed, 0);
        let newGlobalCount = null;
        if (totalTickets > 0) {
            const globalResult = await client.query("UPDATE global_state SET count = count + $1, updated_at = CURRENT_TIMESTAMP WHERE id = 1 RETURNING count", [totalTickets]);
            newGlobalCount = globalResult.rows[0].count;
        }
        await client.query("COMMIT");
        return { totalTickets, newGlobalCount };
    }
    catch (error) {
        await client.query("ROLLBACK");
        throw error;
    }
    finally {
        client.release();
    }
}
exports.processAutoprinters = processAutoprinters;
async function updateAllUsersCreditValues() {
    const client = await exports.pool.connect();
    try {
        await client.query(`
      UPDATE users
      SET credit_value = LEAST(
        credit_value + FLOOR(credit_generation_level * 10)::INTEGER / 100,
        credit_capacity_level
      )
      WHERE credit_generation_level > 0 OR credit_value < credit_capacity_level
    `);
    }
    finally {
        client.release();
    }
}
exports.updateAllUsersCreditValues = updateAllUsersCreditValues;
async function closePool() {
    await exports.pool.end();
    console.log("Database pool closed");
}
exports.closePool = closePool;
//# sourceMappingURL=db.js.map