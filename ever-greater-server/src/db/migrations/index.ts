import { finalSchemaBaselineMigration } from "./013-create-final-schema-baseline.js";
import { addFirstGoldPurchasedMigration } from "./014-add-first-gold-purchased.js";

export { type DatabaseMigration } from "./types.js";

export const databaseMigrations = [
  finalSchemaBaselineMigration,
  addFirstGoldPurchasedMigration,
] as const;
