import type { DatabaseMigration } from "./types.js";

export const addFirstGoldPurchasedMigration: DatabaseMigration = {
  id: 14,
  name: "add-first-gold-purchased",
  statements: [
    `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS first_gold_purchased BOOLEAN NOT NULL DEFAULT FALSE
    `,
    `
      UPDATE users
      SET first_gold_purchased = TRUE
      WHERE gold > 0
         OR ticket_batch_level > 0
         OR manual_print_batch_level > 0
         OR supplies_batch_level > 0
         OR credit_generation_level > 0
         OR credit_capacity_amount_level > 0
         OR auto_buy_supplies_purchased = TRUE
    `,
  ],
};
