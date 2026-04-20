import type { DatabaseMigration } from "./types.js";

export const addTicketWithdrawalsMigration: DatabaseMigration = {
  id: 2,
  name: "add-ticket-withdrawals",
  statements: [
    `
      CREATE TABLE IF NOT EXISTS ticket_withdrawals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `,
    `
      ALTER TABLE ticket_withdrawals
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `,
    `
      CREATE INDEX IF NOT EXISTS idx_ticket_withdrawals_user_created ON ticket_withdrawals (user_id, created_at)
    `,
  ],
};
