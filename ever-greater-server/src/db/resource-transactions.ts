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
  USER_SELECT_COLUMNS,
  withTransaction,
} from "./core.js";
import {
  getTicketsWithdrawnIn24Hours,
  hydrateUserWithWithdrawals,
  recordTicketWithdrawal,
} from "./users.js";

type ResourceMutationQuery = {
  query: string;
  values: number[];
};

async function applyGlobalTicketSpendIfNeeded(
  dbClient: PoolClient,
  userId: number,
  cost: ResourceAmount,
): Promise<number | undefined> {
  const globalTicketCost = cost[ResourceType.GLOBAL_TICKETS];

  if (globalTicketCost === undefined || globalTicketCost <= 0) {
    return undefined;
  }

  const userCheck = await dbClient.query(
    "SELECT tickets_contributed FROM users WHERE id = $1",
    [userId],
  );
  if (userCheck.rows.length === 0) {
    throw new Error("User not found");
  }

  const userContributed = userCheck.rows[0].tickets_contributed;
  const personalLimit = Number(userContributed) * 1.0;
  const withdrawnIn24h = await getTicketsWithdrawnIn24Hours(userId, dbClient);
  const projectedWithdrawal = Number(withdrawnIn24h) + Number(globalTicketCost);

  if (projectedWithdrawal > personalLimit) {
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

  return globalTicketCost;
}

function buildUserResourceMutationQuery(
  userId: number,
  cost: ResourceAmount,
  gain: ResourceAmount,
): ResourceMutationQuery {
  const userCost = { ...cost };
  delete userCost[ResourceType.GLOBAL_TICKETS];

  const setClauses: string[] = [];
  const values: number[] = [];
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

  return {
    query: `
      UPDATE users
      SET ${setClauses.join(", ")}
      WHERE ${whereClauses.join(" AND ")}
      RETURNING ${USER_SELECT_COLUMNS}
    `,
    values,
  };
}

async function executeResourceTransactionOnClient(
  dbClient: PoolClient,
  userId: number,
  cost: ResourceAmount,
  gain: ResourceAmount,
): Promise<User> {
  const globalTicketCost = await applyGlobalTicketSpendIfNeeded(
    dbClient,
    userId,
    cost,
  );
  const { query, values } = buildUserResourceMutationQuery(userId, cost, gain);
  const result = await dbClient.query(query, values);

  if (result.rows.length === 0) {
    throw new Error("Insufficient resources or user not found");
  }

  if (globalTicketCost !== undefined) {
    await recordTicketWithdrawal(userId, globalTicketCost, dbClient);
  }

  coerceUserRowNumbersInPlace(result.rows[0] as User);
  return hydrateUserWithWithdrawals(result.rows[0] as User, dbClient);
}

export async function executeResourceTransaction(
  userId: number,
  cost: ResourceAmount,
  gain: ResourceAmount,
  client?: PoolClient,
): Promise<User> {
  if (client) {
    return executeResourceTransactionOnClient(client, userId, cost, gain);
  }

  return withTransaction((dbClient) =>
    executeResourceTransactionOnClient(dbClient, userId, cost, gain),
  );
}

async function purchaseGemOnClient(
  dbClient: PoolClient,
  userId: number,
  globalTicketCost: number,
): Promise<User> {
  await executeResourceTransactionOnClient(
    dbClient,
    userId,
    { [ResourceType.GLOBAL_TICKETS]: globalTicketCost },
    { [ResourceType.GEMS]: 1 },
  );

  const result = await dbClient.query(
    `
      UPDATE users
      SET first_gem_purchased = TRUE
      WHERE id = $1
      RETURNING ${USER_SELECT_COLUMNS}
    `,
    [userId],
  );

  if (result.rows.length === 0) {
    throw new Error("User not found");
  }

  coerceUserRowNumbersInPlace(result.rows[0] as User);
  return hydrateUserWithWithdrawals(result.rows[0] as User, dbClient);
}

export async function purchaseGem(
  userId: number,
  globalTicketCost: number,
  client?: PoolClient,
): Promise<User> {
  if (client) {
    return purchaseGemOnClient(client, userId, globalTicketCost);
  }

  return withTransaction((dbClient) =>
    purchaseGemOnClient(dbClient, userId, globalTicketCost),
  );
}
