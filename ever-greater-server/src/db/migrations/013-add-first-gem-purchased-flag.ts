import type { DatabaseMigration } from "./types.js";

export const addFirstGemPurchasedFlagMigration: DatabaseMigration = {
  id: 13,
  name: "add-first-gem-purchased-flag",
  statements: [
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
  ],
};
