import type { User } from "ever-greater-shared";
import type { PoolClient } from "pg";
import {
  coerceUserRowNumbersInPlace,
  type DbUser,
  pool,
  STARTING_PRINTER_SUPPLIES,
  toNumber,
  USER_AUTH_SELECT_COLUMNS,
  USER_SELECT_COLUMNS,
} from "./core.js";

type QueryClient = PoolClient | typeof pool;

export async function getGlobalCount(client?: PoolClient): Promise<number> {
  const dbClient: QueryClient = client ?? pool;
  const result = await dbClient.query(
    "SELECT count FROM global_state WHERE id = 1",
  );
  return result.rows[0].count;
}

export async function incrementGlobalCount(
  amount = 1,
  client?: PoolClient,
): Promise<number> {
  const dbClient: QueryClient = client ?? pool;
  const result = await dbClient.query(
    `
    UPDATE global_state
    SET count = count + $1, updated_at = CURRENT_TIMESTAMP
    WHERE id = 1
    RETURNING count
  `,
    [amount],
  );
  return result.rows[0].count;
}

export async function getTicketsWithdrawnIn24Hours(
  userId: number,
  client?: PoolClient,
): Promise<number> {
  const dbClient: QueryClient = client ?? pool;
  const result = await dbClient.query(
    "SELECT COALESCE(SUM(amount), 0) as total FROM ticket_withdrawals WHERE user_id = $1 AND created_at > NOW() - INTERVAL '24 hours'",
    [userId],
  );
  return toNumber(result.rows[0]?.total);
}

export async function recordTicketWithdrawal(
  userId: number,
  amount: number,
  client?: PoolClient,
): Promise<void> {
  const dbClient: QueryClient = client ?? pool;
  await dbClient.query(
    "INSERT INTO ticket_withdrawals (user_id, amount) VALUES ($1, $2)",
    [userId, amount],
  );
}

export async function cleanupOldTicketWithdrawals(): Promise<number> {
  const result = await pool.query(
    "DELETE FROM ticket_withdrawals WHERE created_at < NOW() - INTERVAL '24 hours'",
  );
  return result.rowCount || 0;
}

export async function hydrateUserWithWithdrawals<T extends User | DbUser>(
  userRow: T,
  client?: PoolClient,
): Promise<T> {
  coerceUserRowNumbersInPlace(userRow);
  const tickets_withdrawn = await getTicketsWithdrawnIn24Hours(
    userRow.id,
    client,
  );
  return Object.assign(userRow, { tickets_withdrawn }) as T;
}

export async function enrichUserWithWithdrawals(
  user: User,
  client?: PoolClient,
): Promise<User> {
  return hydrateUserWithWithdrawals({ ...user }, client);
}

export async function getUserByEmail(email: string): Promise<DbUser | null> {
  const result = await pool.query(
    `SELECT ${USER_AUTH_SELECT_COLUMNS} FROM users WHERE email = $1`,
    [email],
  );

  if (!result.rows[0]) {
    return null;
  }

  return hydrateUserWithWithdrawals(result.rows[0] as DbUser);
}

export async function createUser(
  email: string,
  passwordHash: string,
): Promise<User> {
  const result = await pool.query(
    `INSERT INTO users (email, password_hash, printer_supplies, money, gold, autoprinters, credit_value, credit_generation_level, credit_capacity_level, supplies_batch_level, auto_buy_supplies_purchased, auto_buy_supplies_active) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING ${USER_SELECT_COLUMNS}`,
    [
      email,
      passwordHash,
      STARTING_PRINTER_SUPPLIES,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      false,
      false,
    ],
  );

  return hydrateUserWithWithdrawals(result.rows[0] as User);
}

export async function getUserById(
  userId: number,
  client?: PoolClient,
): Promise<User | null> {
  const dbClient: QueryClient = client ?? pool;
  const result = await dbClient.query(
    `SELECT ${USER_SELECT_COLUMNS} FROM users WHERE id = $1`,
    [userId],
  );

  if (!result.rows[0]) {
    return null;
  }

  return hydrateUserWithWithdrawals(result.rows[0] as User, client);
}

export async function purchaseAutoBuySupplies(
  userId: number,
  goldCost: number,
  client?: PoolClient,
): Promise<User> {
  const dbClient: QueryClient = client ?? pool;
  const result = await dbClient.query(
    `
      UPDATE users
      SET
        gold = gold - $1,
        auto_buy_supplies_purchased = TRUE,
        auto_buy_supplies_active = TRUE
      WHERE id = $2
        AND gold >= $1
        AND auto_buy_supplies_purchased = FALSE
      RETURNING ${USER_SELECT_COLUMNS}
    `,
    [goldCost, userId],
  );

  if (!result.rows[0]) {
    throw new Error("Auto-buy supplies already unlocked or insufficient gold");
  }

  return hydrateUserWithWithdrawals(result.rows[0] as User, client);
}

export async function setAutoBuySuppliesActive(
  userId: number,
  active: boolean,
  client?: PoolClient,
): Promise<User> {
  const dbClient: QueryClient = client ?? pool;
  const result = await dbClient.query(
    `
      UPDATE users
      SET auto_buy_supplies_active = $1
      WHERE id = $2 AND auto_buy_supplies_purchased = TRUE
      RETURNING ${USER_SELECT_COLUMNS}
    `,
    [active, userId],
  );

  if (!result.rows[0]) {
    throw new Error("Auto-buy supplies not unlocked");
  }

  return hydrateUserWithWithdrawals(result.rows[0] as User, client);
}
