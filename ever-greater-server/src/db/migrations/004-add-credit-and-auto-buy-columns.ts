import type { DatabaseMigration } from "./types.js";

export const addCreditAndAutoBuyColumnsMigration: DatabaseMigration = {
  id: 4,
  name: "add-credit-and-auto-buy-columns",
  statements: [
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
  ],
};
