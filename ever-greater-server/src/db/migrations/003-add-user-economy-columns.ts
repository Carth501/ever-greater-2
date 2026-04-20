import type { DatabaseMigration } from "./types.js";

const LEGACY_STARTING_PRINTER_SUPPLIES = 1000;

export const addUserEconomyColumnsMigration: DatabaseMigration = {
  id: 3,
  name: "add-user-economy-columns",
  statements: [
    `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS printer_supplies INTEGER NOT NULL DEFAULT ${LEGACY_STARTING_PRINTER_SUPPLIES}
    `,
    `
      ALTER TABLE users
      ALTER COLUMN printer_supplies SET DEFAULT ${LEGACY_STARTING_PRINTER_SUPPLIES}
    `,
    `
      UPDATE users
      SET printer_supplies = ${LEGACY_STARTING_PRINTER_SUPPLIES}
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
  ],
};
