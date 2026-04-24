import {
  DEFAULT_AUTO_BUY_SETTINGS,
  LEGACY_STARTING_PRINTER_SUPPLIES,
} from "../final-schema.js";
import type { DatabaseMigration } from "./types.js";

export const finalSchemaBaselineMigration: DatabaseMigration = {
  id: 13,
  name: "create-final-schema-baseline",
  statements: [
    `
      ALTER TABLE global_state
      ALTER COLUMN count SET DATA TYPE BIGINT USING count::BIGINT
    `,
    `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS printer_supplies INTEGER NOT NULL DEFAULT ${LEGACY_STARTING_PRINTER_SUPPLIES}
    `,
    `
      ALTER TABLE users
      ALTER COLUMN printer_supplies SET DEFAULT ${LEGACY_STARTING_PRINTER_SUPPLIES}
    `,
    `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM schema_migrations WHERE id = 3
        ) THEN
          UPDATE users
          SET printer_supplies = ${LEGACY_STARTING_PRINTER_SUPPLIES}
          WHERE printer_supplies IS NULL OR printer_supplies = 0;
        END IF;
      END $$
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
    `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS supplies_batch_level INTEGER NOT NULL DEFAULT 0
    `,
    `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS manual_print_batch_level INTEGER NOT NULL DEFAULT 0
    `,
    `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS ticket_batch_level INTEGER NOT NULL DEFAULT 0
    `,
    `
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM schema_migrations WHERE id = 8
        ) THEN
          UPDATE users
          SET
            credit_capacity_level = converted.level_count,
            credit_value = LEAST(credit_value, converted.level_count * 20)
          FROM (
            SELECT
              id,
              CEIL(GREATEST(credit_capacity_level, 0)::NUMERIC / 20)::INTEGER AS level_count
            FROM users
          ) AS converted
          WHERE users.id = converted.id;
        END IF;
      END $$
    `,
    `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS gems INTEGER NOT NULL DEFAULT 0
    `,
    `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS auto_buy_settings JSONB NOT NULL DEFAULT '${DEFAULT_AUTO_BUY_SETTINGS}'::jsonb
    `,
    `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS money_per_ticket_level INTEGER NOT NULL DEFAULT 0
    `,
    `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS credit_capacity_amount_level INTEGER NOT NULL DEFAULT 0
    `,
    `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS first_gem_purchased BOOLEAN NOT NULL DEFAULT FALSE
    `,
    `
      UPDATE users
      SET first_gem_purchased = TRUE
      WHERE gems > 0
         OR money_per_ticket_level > 0
         OR credit_capacity_amount_level > 0
    `,
    `
      ALTER TABLE ticket_withdrawals
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `,
  ],
};
