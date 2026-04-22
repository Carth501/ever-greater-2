import type { DatabaseMigration } from "./types.js";

export const addMoneyPerTicketLevelColumnMigration: DatabaseMigration = {
  id: 11,
  name: "add-money-per-ticket-level-column",
  statements: [
    `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS money_per_ticket_level INTEGER NOT NULL DEFAULT 0
    `,
  ],
};
