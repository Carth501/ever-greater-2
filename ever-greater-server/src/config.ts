import { z } from "zod";

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const DEFAULT_PORT = 4000;
const DEFAULT_DB_POOL_MAX = 10;
const DEFAULT_DB_POOL_IDLE_TIMEOUT = 30000;
const DEFAULT_STARTING_PRINTER_SUPPLIES = 1000;

const rawEnvironmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).optional(),
  PORT: z.coerce.number().int().positive().optional(),
  DATABASE_URL: z.string().trim().min(1).optional(),
  DB_POOL_MAX: z.coerce.number().int().positive().optional(),
  DB_POOL_IDLE_TIMEOUT: z.coerce.number().int().nonnegative().optional(),
  CLIENT_URL: z.string().optional(),
  STARTING_PRINTER_SUPPLIES: z.coerce.number().int().nonnegative().optional(),
  SESSION_SECRET: z.string().trim().min(1).optional(),
});

type RawEnvironment = z.infer<typeof rawEnvironmentSchema>;

export type ServerConfig = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  databaseUrl?: string;
  dbPoolMax: number;
  dbPoolIdleTimeout: number;
  allowedOrigins: string[];
  startingPrinterSupplies: number;
  sessionSecret?: string;
};

function normalizeOptionalEnvironmentValue(
  value: string | undefined,
): string | undefined {
  if (!value || value === "undefined" || value === "null") {
    return undefined;
  }

  return value;
}

function parseRawEnvironment(): RawEnvironment {
  const rawEnvironmentResult = rawEnvironmentSchema.safeParse({
    NODE_ENV: normalizeOptionalEnvironmentValue(process.env.NODE_ENV),
    PORT: normalizeOptionalEnvironmentValue(process.env.PORT),
    DATABASE_URL: normalizeOptionalEnvironmentValue(process.env.DATABASE_URL),
    DB_POOL_MAX: normalizeOptionalEnvironmentValue(process.env.DB_POOL_MAX),
    DB_POOL_IDLE_TIMEOUT: normalizeOptionalEnvironmentValue(
      process.env.DB_POOL_IDLE_TIMEOUT,
    ),
    CLIENT_URL: normalizeOptionalEnvironmentValue(process.env.CLIENT_URL),
    STARTING_PRINTER_SUPPLIES: normalizeOptionalEnvironmentValue(
      process.env.STARTING_PRINTER_SUPPLIES,
    ),
    SESSION_SECRET: normalizeOptionalEnvironmentValue(
      process.env.SESSION_SECRET,
    ),
  });

  if (!rawEnvironmentResult.success) {
    const issues = rawEnvironmentResult.error.issues
      .map((issue) => {
        const fieldName = issue.path.join(".") || "environment";
        return `${fieldName}: ${issue.message}`;
      })
      .join("; ");

    throw new Error(`Invalid server environment configuration: ${issues}`);
  }

  return rawEnvironmentResult.data;
}

function parseAllowedOrigins(configuredOrigins?: string): string[] {
  const parsedOrigins = (configuredOrigins || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return parsedOrigins.length > 0 ? parsedOrigins : DEFAULT_ALLOWED_ORIGINS;
}

export function getServerConfig(): ServerConfig {
  const rawEnvironment = parseRawEnvironment();

  return {
    nodeEnv: rawEnvironment.NODE_ENV ?? "development",
    port: rawEnvironment.PORT ?? DEFAULT_PORT,
    databaseUrl: rawEnvironment.DATABASE_URL,
    dbPoolMax: rawEnvironment.DB_POOL_MAX ?? DEFAULT_DB_POOL_MAX,
    dbPoolIdleTimeout:
      rawEnvironment.DB_POOL_IDLE_TIMEOUT ?? DEFAULT_DB_POOL_IDLE_TIMEOUT,
    allowedOrigins: parseAllowedOrigins(rawEnvironment.CLIENT_URL),
    startingPrinterSupplies:
      rawEnvironment.STARTING_PRINTER_SUPPLIES ??
      DEFAULT_STARTING_PRINTER_SUPPLIES,
    sessionSecret: rawEnvironment.SESSION_SECRET,
  };
}

export function assertRequiredEnvironment(
  serverConfig: ServerConfig = getServerConfig(),
): void {
  if (!serverConfig.databaseUrl) {
    throw new Error("DATABASE_URL must be configured");
  }

  if (serverConfig.nodeEnv === "production" && !serverConfig.sessionSecret) {
    throw new Error("SESSION_SECRET must be configured in production");
  }
}
