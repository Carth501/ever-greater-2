import { normalizeAutoBuySettings, User } from "ever-greater-shared";
import { Pool, type PoolClient } from "pg";
import { getServerConfig } from "../config.js";

const serverConfig = getServerConfig();

const USER_RESOURCE_COLUMNS = [
  "tickets_contributed",
  "printer_supplies",
  "money",
  "gold",
  "gems",
  "autoprinters",
  "credit_value",
  "money_per_ticket_level",
  "credit_generation_level",
  "credit_capacity_level",
  "credit_capacity_amount_level",
  "ticket_batch_level",
  "manual_print_batch_level",
  "supplies_batch_level",
  "first_gem_purchased",
  "auto_buy_supplies_purchased",
  "auto_buy_supplies_active",
  "auto_buy_settings",
] as const;

const USER_NUMERIC_FIELDS = [
  "tickets_contributed",
  "printer_supplies",
  "money",
  "gold",
  "gems",
  "autoprinters",
  "credit_value",
  "money_per_ticket_level",
  "credit_generation_level",
  "credit_capacity_level",
  "credit_capacity_amount_level",
  "ticket_batch_level",
  "manual_print_batch_level",
  "supplies_batch_level",
] as const;

type CoercibleUserRow = Partial<
  Pick<User, (typeof USER_NUMERIC_FIELDS)[number] | "auto_buy_settings">
>;

export type DbUser = User & {
  password_hash: string;
};

export const USER_SELECT_COLUMNS = [
  "id",
  "email",
  ...USER_RESOURCE_COLUMNS,
].join(", ");

export const USER_AUTH_SELECT_COLUMNS = [
  "id",
  "email",
  "password_hash",
  ...USER_RESOURCE_COLUMNS,
].join(", ");

/**
 * Thrown when a user attempts to withdraw global tickets beyond their personal
 * contribution-based limit within the 24-hour rolling window.
 */
export class GlobalTicketLimitExceeded extends Error {
  constructor() {
    super("Personal ticket withdrawal limit exceeded");
    this.name = "GlobalTicketLimitExceeded";
  }
}

export const STARTING_PRINTER_SUPPLIES = serverConfig.startingPrinterSupplies;

export const pool = new Pool({
  connectionString: serverConfig.databaseUrl,
  max: serverConfig.dbPoolMax,
  idleTimeoutMillis: serverConfig.dbPoolIdleTimeout,
});

if (pool.on && typeof pool.on === "function") {
  pool.on("error", (err: Error) => {
    console.error("Unexpected error on idle client", err);
  });
}

export function toNumber(value: unknown): number {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function coerceUserRowNumbersInPlace(userRow: CoercibleUserRow): void {
  USER_NUMERIC_FIELDS.forEach((field) => {
    if (field in userRow) {
      userRow[field] = toNumber(userRow[field]);
    }
  });

  if ("auto_buy_settings" in userRow) {
    userRow.auto_buy_settings = normalizeAutoBuySettings(
      userRow.auto_buy_settings,
    );
  }
}

export async function withPoolClient<T>(
  run: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    return await run(client);
  } finally {
    client.release();
  }
}

export async function withTransaction<T>(
  run: (client: PoolClient) => Promise<T>,
): Promise<T> {
  return withPoolClient(async (client) => {
    await client.query("BEGIN");
    try {
      const result = await run(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK").catch(() => undefined);
      throw error;
    }
  });
}

export async function closePool(): Promise<void> {
  await pool.end();
  console.log("Database pool closed");
}
