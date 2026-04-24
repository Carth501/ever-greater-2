import "dotenv/config";
import { assertRequiredEnvironment, getServerConfig } from "./config.js";
import { assertDestructiveCommandAllowed } from "./db-script-utils.js";

async function runResetCommand(): Promise<void> {
  const serverConfig = getServerConfig();

  try {
    assertRequiredEnvironment(serverConfig);
    assertDestructiveCommandAllowed("db:reset");

    const { getPool, initializeDatabase } = await import("./db.js");
    const pool = getPool();

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
      const { closePool } = await import("./db.js");
      await closePool();
    } catch (error) {
      console.error("Failed to close database pool after reset:", error);
      process.exitCode = 1;
    }
  }
}

void runResetCommand();
