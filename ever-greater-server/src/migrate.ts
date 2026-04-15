import "dotenv/config";
import { assertRequiredEnvironment, getServerConfig } from "./config.js";
import { closePool, initializeDatabase } from "./db.js";

async function runMigrationCommand(): Promise<void> {
  try {
    const serverConfig = getServerConfig();
    assertRequiredEnvironment(serverConfig);

    await initializeDatabase();
    console.log("Database migrations applied successfully");
  } catch (error) {
    console.error("Failed to apply database migrations:", error);
    process.exitCode = 1;
  } finally {
    try {
      await closePool();
    } catch (error) {
      console.error("Failed to close database pool after migration:", error);
      process.exitCode = 1;
    }
  }
}

void runMigrationCommand();
