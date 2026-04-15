import { RESOURCE_DB_FIELDS } from "ever-greater-shared";
import type { PoolClient } from "pg";
import { pool, STARTING_PRINTER_SUPPLIES } from "./core.js";

const SCHEMA_STATEMENTS = [
  `
    CREATE TABLE IF NOT EXISTS global_state (
      id INTEGER PRIMARY KEY,
      count INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      tickets_contributed INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS session (
      sid VARCHAR NOT NULL COLLATE "default" PRIMARY KEY,
      sess JSON NOT NULL,
      expire TIMESTAMP(6) NOT NULL
    )
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_session_expire ON session (expire)
  `,
  `
    CREATE TABLE IF NOT EXISTS ticket_withdrawals (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    ALTER TABLE ticket_withdrawals
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `,
  `
    CREATE INDEX IF NOT EXISTS idx_ticket_withdrawals_user_created ON ticket_withdrawals (user_id, created_at)
  `,
  `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS printer_supplies INTEGER NOT NULL DEFAULT ${STARTING_PRINTER_SUPPLIES}
  `,
  `
    ALTER TABLE users
    ALTER COLUMN printer_supplies SET DEFAULT ${STARTING_PRINTER_SUPPLIES}
  `,
  `
    UPDATE users
    SET printer_supplies = ${STARTING_PRINTER_SUPPLIES}
    WHERE printer_supplies IS NULL OR printer_supplies = 0
  `,
  `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS money INTEGER NOT NULL DEFAULT 0
  `,
  `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS gold INTEGER NOT NULL DEFAULT 0
  `,
  `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS autoprinters INTEGER NOT NULL DEFAULT 0
  `,
  `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS credit_value NUMERIC(10, 2) NOT NULL DEFAULT 0
  `,
  `
    ALTER TABLE users
    ALTER COLUMN credit_value SET DATA TYPE NUMERIC(10, 2) USING credit_value::NUMERIC(10, 2)
  `,
  `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS credit_generation_level INTEGER NOT NULL DEFAULT 0
  `,
  `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS credit_capacity_level INTEGER NOT NULL DEFAULT 0
  `,
  `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS auto_buy_supplies_purchased BOOLEAN NOT NULL DEFAULT FALSE
  `,
  `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS auto_buy_supplies_active BOOLEAN NOT NULL DEFAULT FALSE
  `,
  `
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  `,
] as const;

async function validateResourceMappings(client: PoolClient): Promise<void> {
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
}

async function ensureGlobalStateSeed(client: PoolClient): Promise<void> {
  const result = await client.query("SELECT COUNT(*) FROM global_state");
  const rowCount = Number.parseInt(result.rows[0].count, 10);

  if (rowCount === 0) {
    await client.query(`
      INSERT INTO global_state (id, count)
      VALUES (1, 0)
    `);
  }
}

export async function initializeDatabase(): Promise<void> {
  const client = await pool.connect();
  try {
    for (const statement of SCHEMA_STATEMENTS) {
      await client.query(statement);
    }

    await validateResourceMappings(client);
    await ensureGlobalStateSeed(client);
  } finally {
    client.release();
  }
}
