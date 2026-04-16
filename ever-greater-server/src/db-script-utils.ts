import "dotenv/config";
import { mkdir } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { assertRequiredEnvironment, getServerConfig } from "./config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function getRequiredServerConfig() {
  const serverConfig = getServerConfig();
  assertRequiredEnvironment(serverConfig);
  return serverConfig;
}

export function hasCliFlag(flag: string): boolean {
  return process.argv.slice(2).includes(flag);
}

export function getCliOption(name: string): string | undefined {
  const flagName = `--${name}`;
  const args = process.argv.slice(2);

  for (let index = 0; index < args.length; index++) {
    const argument = args[index];

    if (argument === flagName) {
      return args[index + 1];
    }

    if (argument.startsWith(`${flagName}=`)) {
      return argument.slice(flagName.length + 1);
    }
  }

  return undefined;
}

export function assertDestructiveCommandAllowed(commandName: string): void {
  const serverConfig = getRequiredServerConfig();

  if (serverConfig.nodeEnv === "production") {
    throw new Error(`${commandName} is disabled when NODE_ENV=production.`);
  }

  if (!hasCliFlag("--force")) {
    throw new Error(
      `${commandName} is destructive. Re-run with --force to continue.`,
    );
  }
}

export function assertSeedCommandAllowed(): void {
  const serverConfig = getRequiredServerConfig();

  if (serverConfig.nodeEnv === "production" && !hasCliFlag("--force")) {
    throw new Error(
      "db:seed is disabled when NODE_ENV=production unless you pass --force.",
    );
  }
}

export function getServerRootPath(): string {
  return path.resolve(__dirname, "..");
}

export function getDefaultBackupPath(): string {
  const timestamp = new Date()
    .toISOString()
    .replace(/:/g, "-")
    .replace(/\.\d{3}Z$/, "Z")
    .replace("T", "-");

  return path.resolve(
    getServerRootPath(),
    "backups",
    `ever-greater-${timestamp}.sql`,
  );
}

export function resolveBackupPath(outputPath: string | undefined): string {
  if (!outputPath) {
    return getDefaultBackupPath();
  }

  if (path.isAbsolute(outputPath)) {
    return outputPath;
  }

  return path.resolve(getServerRootPath(), outputPath);
}

export async function ensureParentDirectory(filePath: string): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
}
