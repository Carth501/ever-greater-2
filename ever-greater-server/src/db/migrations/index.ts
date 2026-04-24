import { finalSchemaBaselineMigration } from "./013-create-final-schema-baseline.js";

export { type DatabaseMigration } from "./types.js";

export const databaseMigrations = [finalSchemaBaselineMigration] as const;
