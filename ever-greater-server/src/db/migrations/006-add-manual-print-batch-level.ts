import type { DatabaseMigration } from "./types.js";

export const addManualPrintBatchLevelMigration: DatabaseMigration = {
  id: 6,
  name: "add-manual-print-batch-level",
  statements: [
    `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS manual_print_batch_level INTEGER NOT NULL DEFAULT 0
    `,
  ],
};
