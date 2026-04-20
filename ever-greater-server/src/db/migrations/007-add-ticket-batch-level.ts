import type { DatabaseMigration } from "./types.js";

export const addTicketBatchLevelMigration: DatabaseMigration = {
  id: 7,
  name: "add-ticket-batch-level",
  statements: [
    `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS ticket_batch_level INTEGER NOT NULL DEFAULT 0
    `,
  ],
};
