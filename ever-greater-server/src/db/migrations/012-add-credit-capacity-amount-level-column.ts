import type { DatabaseMigration } from "./types.js";

export const addCreditCapacityAmountLevelColumnMigration: DatabaseMigration = {
  id: 12,
  name: "add-credit-capacity-amount-level-column",
  statements: [
    `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS credit_capacity_amount_level INTEGER NOT NULL DEFAULT 0
    `,
  ],
};
