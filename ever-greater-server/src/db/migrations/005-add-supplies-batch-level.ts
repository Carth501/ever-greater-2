import type { DatabaseMigration } from "./types.js";

export const addSuppliesBatchLevelMigration: DatabaseMigration = {
  id: 5,
  name: "add-supplies-batch-level",
  statements: [
    `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS supplies_batch_level INTEGER NOT NULL DEFAULT 0
    `,
  ],
};
