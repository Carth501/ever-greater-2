import { addCreditAndAutoBuyColumnsMigration } from "./004-add-credit-and-auto-buy-columns.js";
import { addTicketWithdrawalsMigration } from "./002-add-ticket-withdrawals.js";
import { addUserEconomyColumnsMigration } from "./003-add-user-economy-columns.js";
import { createCoreTablesMigration } from "./001-create-core-tables.js";

export { type DatabaseMigration } from "./types.js";

export const databaseMigrations = [
  createCoreTablesMigration,
  addTicketWithdrawalsMigration,
  addUserEconomyColumnsMigration,
  addCreditAndAutoBuyColumnsMigration,
] as const;
