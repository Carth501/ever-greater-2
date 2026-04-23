import { createCoreTablesMigration } from "./001-create-core-tables.js";
import { addTicketWithdrawalsMigration } from "./002-add-ticket-withdrawals.js";
import { addUserEconomyColumnsMigration } from "./003-add-user-economy-columns.js";
import { addCreditAndAutoBuyColumnsMigration } from "./004-add-credit-and-auto-buy-columns.js";
import { addSuppliesBatchLevelMigration } from "./005-add-supplies-batch-level.js";
import { addManualPrintBatchLevelMigration } from "./006-add-manual-print-batch-level.js";
import { addTicketBatchLevelMigration } from "./007-add-ticket-batch-level.js";
import { normalizeCreditCapacityLevelMigration } from "./008-normalize-credit-capacity-level.js";
import { addGemsColumnMigration } from "./009-add-gems-column.js";
import { addAutoBuySettingsColumnMigration } from "./010-add-auto-buy-settings-column.js";
import { addMoneyPerTicketLevelColumnMigration } from "./011-add-money-per-ticket-level-column.js";
import { addCreditCapacityAmountLevelColumnMigration } from "./012-add-credit-capacity-amount-level-column.js";

export { type DatabaseMigration } from "./types.js";

export const databaseMigrations = [
  createCoreTablesMigration,
  addTicketWithdrawalsMigration,
  addUserEconomyColumnsMigration,
  addCreditAndAutoBuyColumnsMigration,
  addSuppliesBatchLevelMigration,
  addManualPrintBatchLevelMigration,
  addTicketBatchLevelMigration,
  normalizeCreditCapacityLevelMigration,
  addGemsColumnMigration,
  addAutoBuySettingsColumnMigration,
  addMoneyPerTicketLevelColumnMigration,
  addCreditCapacityAmountLevelColumnMigration,
] as const;
