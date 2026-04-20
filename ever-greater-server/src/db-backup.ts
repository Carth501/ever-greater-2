import { spawn } from "child_process";
import {
  getRequiredServerConfig,
  getCliOption,
  ensureParentDirectory,
  resolveBackupPath,
} from "./db-script-utils.js";

async function runBackupCommand(): Promise<void> {
  try {
    const serverConfig = getRequiredServerConfig();
    const outputPath = resolveBackupPath(getCliOption("output"));

    await ensureParentDirectory(outputPath);

    await new Promise<void>((resolve, reject) => {
      const backupProcess = spawn(
        "pg_dump",
        [
          "--format=plain",
          "--no-owner",
          "--no-privileges",
          "--file",
          outputPath,
          serverConfig.databaseUrl as string,
        ],
        {
          stdio: "inherit",
        },
      );

      backupProcess.on("error", (error) => {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          reject(
            new Error(
              "pg_dump was not found on PATH. Install PostgreSQL client tools or add them to PATH before running db:backup.",
            ),
          );
          return;
        }

        reject(error);
      });

      backupProcess.on("exit", (code) => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(new Error(`pg_dump exited with code ${code ?? "unknown"}`));
      });
    });

    console.log(`Database backup written to ${outputPath}`);
  } catch (error) {
    console.error("Failed to create database backup:", error);
    process.exitCode = 1;
  }
}

void runBackupCommand();
