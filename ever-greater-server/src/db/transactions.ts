import {
  RESOURCE_DB_FIELDS,
  ResourceAmount,
  ResourceType,
  User,
} from "ever-greater-shared";
import type { PoolClient } from "pg";
import {
  coerceUserRowNumbersInPlace,
  GlobalTicketLimitExceeded,
  pool,
  USER_SELECT_COLUMNS,
} from "./core.js";
import {
  getTicketsWithdrawnIn24Hours,
  hydrateUserWithWithdrawals,
  recordTicketWithdrawal,
} from "./users.js";

export async function executeResourceTransaction(
  userId: number,
  cost: ResourceAmount,
  gain: ResourceAmount,
  client?: PoolClient,
): Promise<User> {
  const useTransaction = !client;
  let dbClient: PoolClient | typeof pool;
  let txClient: PoolClient | null = null;

  try {
    if (useTransaction) {
      txClient = await pool.connect();
      dbClient = txClient;
      await dbClient.query("BEGIN");
    } else {
      dbClient = client;
    }

    const globalTicketCost = cost[ResourceType.GLOBAL_TICKETS];
    if (globalTicketCost !== undefined && globalTicketCost > 0) {
      const userCheck = await dbClient.query(
        "SELECT tickets_contributed FROM users WHERE id = $1",
        [userId],
      );
      if (userCheck.rows.length === 0) {
        throw new Error("User not found");
      }

      const userContributed = userCheck.rows[0].tickets_contributed;
      const personalLimit = Number(userContributed) * 1.0;
      const withdrawnIn24h = await getTicketsWithdrawnIn24Hours(
        userId,
        dbClient,
      );
      const projectedWithdrawal =
        Number(withdrawnIn24h) + Number(globalTicketCost);

      if (projectedWithdrawal > personalLimit) {
        if (useTransaction && txClient) {
          await txClient.query("ROLLBACK");
          txClient.release();
          txClient = null;
        }
        throw new GlobalTicketLimitExceeded();
      }

      const globalResult = await dbClient.query(
        `UPDATE global_state
         SET count = count - $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = 1 AND count >= $1
         RETURNING count`,
        [globalTicketCost],
      );

      if (globalResult.rows.length === 0) {
        throw new Error("Insufficient global tickets");
      }
    }

    const userCost = { ...cost };
    delete userCost[ResourceType.GLOBAL_TICKETS];

    const setClauses: string[] = [];
    const values: (number | string)[] = [];
    let paramCount = 1;

    for (const [resourceTypeStr, amount] of Object.entries(userCost)) {
      if (amount === undefined) {
        continue;
      }
      const resourceType = resourceTypeStr as ResourceType;
      const dbField = RESOURCE_DB_FIELDS[resourceType];
      if (!dbField) {
        continue;
      }
      setClauses.push(`${dbField} = ${dbField} - $${paramCount}`);
      values.push(amount);
      paramCount++;
    }

    for (const [resourceTypeStr, amount] of Object.entries(gain)) {
      if (amount === undefined) {
        continue;
      }
      const resourceType = resourceTypeStr as ResourceType;
      const dbField = RESOURCE_DB_FIELDS[resourceType];
      if (!dbField) {
        continue;
      }
      setClauses.push(`${dbField} = ${dbField} + $${paramCount}`);
      values.push(amount);
      paramCount++;
    }

    const whereClauses: string[] = [`id = $${paramCount}`];
    values.push(userId);
    paramCount++;

    for (const [resourceTypeStr, amount] of Object.entries(userCost)) {
      if (amount === undefined) {
        continue;
      }
      const resourceType = resourceTypeStr as ResourceType;
      const dbField = RESOURCE_DB_FIELDS[resourceType];
      if (!dbField) {
        continue;
      }
      whereClauses.push(`${dbField} >= $${paramCount}`);
      values.push(amount);
      paramCount++;
    }

    const query = `
      UPDATE users
      SET ${setClauses.join(", ")}
      WHERE ${whereClauses.join(" AND ")}
      RETURNING ${USER_SELECT_COLUMNS}
    `;

    const result = await dbClient.query(query, values);

    if (result.rows.length === 0) {
      throw new Error("Insufficient resources or user not found");
    }

    if (globalTicketCost !== undefined && globalTicketCost > 0) {
      await recordTicketWithdrawal(userId, globalTicketCost, dbClient);
    }

    if (useTransaction && txClient) {
      await txClient.query("COMMIT");
    }

    coerceUserRowNumbersInPlace(result.rows[0] as User);
    return hydrateUserWithWithdrawals(result.rows[0] as User);
  } catch (error) {
    if (useTransaction && txClient) {
      await txClient.query("ROLLBACK").catch(() => {
        // Ignore rollback errors.
      });
    }
    throw error;
  } finally {
    if (useTransaction && txClient) {
      txClient.release();
    }
  }
}

export async function processAutoprinters(): Promise<{
  totalTickets: number;
  newGlobalCount: number | null;
}> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(`
      UPDATE users
      SET
        gold = gold - 1,
        printer_supplies = printer_supplies + 200
      WHERE
        auto_buy_supplies_active = TRUE
        AND auto_buy_supplies_purchased = TRUE
        AND printer_supplies < autoprinters
        AND autoprinters > 0
        AND gold >= 1
    `);

    const usersResult = await client.query(`
      UPDATE users
      SET
        printer_supplies = printer_supplies - LEAST(autoprinters, printer_supplies),
        money = money + LEAST(autoprinters, printer_supplies),
        tickets_contributed = tickets_contributed + LEAST(autoprinters, printer_supplies)
      WHERE autoprinters > 0 AND printer_supplies > 0
      RETURNING LEAST(autoprinters, printer_supplies) as tickets_printed
    `);

    const totalTickets = usersResult.rows.reduce(
      (sum: number, row: { tickets_printed: number }) =>
        sum + row.tickets_printed,
      0,
    );

    let newGlobalCount: number | null = null;
    if (totalTickets > 0) {
      const globalResult = await client.query(
        "UPDATE global_state SET count = count + $1, updated_at = CURRENT_TIMESTAMP WHERE id = 1 RETURNING count",
        [totalTickets],
      );
      newGlobalCount = globalResult.rows[0].count;
    }

    await client.query("COMMIT");
    return { totalTickets, newGlobalCount };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateAllUsersCreditValues(): Promise<number> {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      UPDATE users
      SET credit_value = LEAST(
        credit_value + credit_generation_level / 10.0,
        credit_capacity_level
      )
      WHERE credit_generation_level > 0 OR credit_value < credit_capacity_level
    `);
    return result.rowCount || 0;
  } finally {
    client.release();
  }
}
