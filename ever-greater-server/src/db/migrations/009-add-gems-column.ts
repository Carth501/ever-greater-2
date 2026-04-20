import type { DatabaseMigration } from "./types.js";

export const addGemsColumnMigration: DatabaseMigration = {
  id: 9,
  name: "add-gems-column",
  statements: [
    `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS gems INTEGER NOT NULL DEFAULT 0
    `,
  ],
};
