import { closePool, initializeDatabase, pool } from "./db.js";
import { assertDestructiveCommandAllowed } from "./db-script-utils.js";

async function runResetCommand(): Promise<void> {
  try {
    assertDestructiveCommandAllowed("db:reset");

    await pool.query("DROP SCHEMA IF EXISTS public CASCADE");
    await pool.query("CREATE SCHEMA public");
    await pool.query("GRANT ALL ON SCHEMA public TO PUBLIC");

    await initializeDatabase();
    console.log("Database reset and migrations completed successfully");
  } catch (error) {
    console.error("Failed to reset database:", error);
    process.exitCode = 1;
  } finally {
    try {
      await closePool();
    } catch (error) {
      console.error("Failed to close database pool after reset:", error);
      process.exitCode = 1;
    }
  }
}

void runResetCommand();
