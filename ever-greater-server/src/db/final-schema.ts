export const LEGACY_STARTING_PRINTER_SUPPLIES = 1000;
export const DEFAULT_AUTO_BUY_SETTINGS =
  '{"printer_supplies":{"threshold":0,"scaleMode":"MAX","scaleValue":0}}';

export const finalSchemaBootstrapStatements = [
  `
    CREATE TABLE IF NOT EXISTS global_state (
      id INTEGER PRIMARY KEY,
      count BIGINT NOT NULL DEFAULT 0,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      tickets_contributed INTEGER NOT NULL DEFAULT 0,
      printer_supplies INTEGER NOT NULL DEFAULT ${LEGACY_STARTING_PRINTER_SUPPLIES},
      money INTEGER NOT NULL DEFAULT 0,
      gold INTEGER NOT NULL DEFAULT 0,
      gems INTEGER NOT NULL DEFAULT 0,
      autoprinters INTEGER NOT NULL DEFAULT 0,
      credit_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
      money_per_ticket_level INTEGER NOT NULL DEFAULT 0,
      credit_generation_level INTEGER NOT NULL DEFAULT 0,
      credit_capacity_level INTEGER NOT NULL DEFAULT 0,
      credit_capacity_amount_level INTEGER NOT NULL DEFAULT 0,
      ticket_batch_level INTEGER NOT NULL DEFAULT 0,
      manual_print_batch_level INTEGER NOT NULL DEFAULT 0,
      supplies_batch_level INTEGER NOT NULL DEFAULT 0,
      first_gold_purchased BOOLEAN NOT NULL DEFAULT FALSE,
      first_gem_purchased BOOLEAN NOT NULL DEFAULT FALSE,
      auto_buy_supplies_purchased BOOLEAN NOT NULL DEFAULT FALSE,
      auto_buy_supplies_active BOOLEAN NOT NULL DEFAULT FALSE,
      auto_buy_settings JSONB NOT NULL DEFAULT '${DEFAULT_AUTO_BUY_SETTINGS}'::jsonb,
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
    CREATE INDEX IF NOT EXISTS idx_ticket_withdrawals_user_created ON ticket_withdrawals (user_id, created_at)
  `,
] as const;
