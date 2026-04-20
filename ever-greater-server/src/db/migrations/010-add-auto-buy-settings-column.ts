import type { DatabaseMigration } from "./types.js";

export const addAutoBuySettingsColumnMigration: DatabaseMigration = {
  id: 10,
  name: "add-auto-buy-settings-column",
  statements: [
    `
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS auto_buy_settings JSONB NOT NULL DEFAULT '{"printer_supplies":{"threshold":0,"scaleMode":"MAX","scaleValue":0}}'::jsonb
    `,
  ],
};
