import {
  AutoBuyResourceKey,
  getAutoBuyRule,
  getManualPrintQuantity,
  getMaxSuppliesPurchaseGold,
  OperationId,
  operations,
  resolveAutoBuySpendAmount,
  ResourceType,
  setAutoBuyRule,
  shouldTriggerAutoBuy,
  validateOperation,
  type ConfigureAutoBuyParams,
  type ResourceAmount,
  type User,
  type ValidationResult,
} from "ever-greater-shared";
import type { PoolClient } from "pg";
import {
  executeResourceTransaction,
  getGlobalCount,
  getUserById,
  incrementGlobalCount,
  purchaseAutoBuySupplies,
  setAutoBuySettings,
  setAutoBuySuppliesActive,
} from "./db-access.js";

export class OperationValidationError extends Error {
  validation: ValidationResult;

  constructor(validation: ValidationResult) {
    super(validation.error || "Invalid operation");
    this.name = "OperationValidationError";
    this.validation = validation;
  }
}

export class OperationUserNotFoundError extends Error {
  constructor() {
    super("User not found");
    this.name = "OperationUserNotFoundError";
  }
}

export interface ExecuteOperationOptions {
  client?: PoolClient;
  currentUser?: User;
  globalTicketCount?: number;
  allowPrintAutoBuyFallback?: boolean;
}

export interface ExecutedOperationResult {
  operationId: OperationId;
  cost: ResourceAmount;
  gain: ResourceAmount;
  count: number | null;
  user: User;
}

function getAutoBuySuppliesSpend(user: User): number {
  const rule = getAutoBuyRule(
    user.auto_buy_settings,
    AutoBuyResourceKey.PRINTER_SUPPLIES,
  );

  return resolveAutoBuySpendAmount(
    rule,
    user.gold ?? 0,
    Math.min(user.gold ?? 0, getMaxSuppliesPurchaseGold(user)),
  );
}

async function maybeAutoBuyForPrint(
  userId: number,
  currentUser: User,
  globalTicketCount: number,
  client?: PoolClient,
): Promise<User> {
  const printQuantity = getManualPrintQuantity(currentUser);
  const autoBuyRule = getAutoBuyRule(
    currentUser.auto_buy_settings,
    AutoBuyResourceKey.PRINTER_SUPPLIES,
  );

  if (
    !shouldTriggerAutoBuy(
      currentUser.printer_supplies ?? 0,
      printQuantity,
      autoBuyRule.threshold,
    )
  ) {
    return currentUser;
  }

  const spendGold = getAutoBuySuppliesSpend(currentUser);

  if (spendGold < 1) {
    return currentUser;
  }

  try {
    const result = await executeOperationForUser(
      userId,
      OperationId.BUY_SUPPLIES,
      { spendGold },
      {
        client,
        currentUser,
        globalTicketCount,
        allowPrintAutoBuyFallback: false,
      },
    );
    return result.user;
  } catch (error) {
    if (error instanceof OperationValidationError) {
      return currentUser;
    }

    throw error;
  }
}

async function applyValidatedOperation(
  userId: number,
  operationId: OperationId,
  params: Record<string, unknown> | undefined,
  currentUser: User,
  cost: ResourceAmount,
  gain: ResourceAmount,
  client?: PoolClient,
): Promise<User> {
  if (operationId === OperationId.AUTO_BUY_SUPPLIES) {
    return purchaseAutoBuySupplies(
      userId,
      cost[ResourceType.GOLD] ?? 0,
      client,
    );
  }

  if (operationId === OperationId.TOGGLE_AUTO_BUY_SUPPLIES) {
    return setAutoBuySuppliesActive(userId, params?.active as boolean, client);
  }

  if (operationId === OperationId.CONFIGURE_AUTO_BUY) {
    const configureParams = params as ConfigureAutoBuyParams;

    return setAutoBuySettings(
      userId,
      setAutoBuyRule(
        currentUser.auto_buy_settings,
        configureParams.resourceKey,
        configureParams,
      ),
      client,
    );
  }

  return executeResourceTransaction(userId, cost, gain, client);
}

export async function executeOperationForUser(
  userId: number,
  operationId: OperationId,
  params?: Record<string, unknown>,
  options: ExecuteOperationOptions = {},
): Promise<ExecutedOperationResult> {
  const currentUser =
    options.currentUser ?? (await getUserById(userId, options.client));

  if (!currentUser) {
    throw new OperationUserNotFoundError();
  }

  const globalTicketCount =
    options.globalTicketCount ?? (await getGlobalCount(options.client));

  let userForValidation = currentUser;

  if (
    options.allowPrintAutoBuyFallback &&
    operationId === OperationId.PRINT_TICKET &&
    currentUser.auto_buy_supplies_active
  ) {
    userForValidation = await maybeAutoBuyForPrint(
      userId,
      currentUser,
      globalTicketCount,
      options.client,
    );
  }

  const operation = operations[operationId];
  const validation = validateOperation(
    userForValidation,
    operation,
    params,
    globalTicketCount,
  );

  if (!validation.valid) {
    throw new OperationValidationError(validation);
  }

  const updatedUser = await applyValidatedOperation(
    userId,
    operationId,
    params,
    userForValidation,
    validation.cost,
    validation.gain,
    options.client,
  );

  const contributedTickets =
    validation.gain[ResourceType.TICKETS_CONTRIBUTED] ?? 0;
  const spentGlobalTickets = validation.cost[ResourceType.GLOBAL_TICKETS] ?? 0;

  let count: number | null = null;
  if (contributedTickets > 0) {
    count = await incrementGlobalCount(contributedTickets, options.client);
  } else if (spentGlobalTickets > 0) {
    count = await getGlobalCount(options.client);
  }

  return {
    operationId,
    cost: validation.cost,
    gain: validation.gain,
    count,
    user: updatedUser,
  };
}
