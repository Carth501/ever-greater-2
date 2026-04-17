import {
  RESOURCE_DB_FIELDS,
  ResourceAmount,
  ResourceType,
  User,
} from "./resources.js";

/**
 * Context provided to cost and gain calculators.
 */
export interface OperationContext {
  user: User;
  params?: any;
  globalTicketCount?: number;
}

/**
 * A function that calculates resource costs or gains dynamically based on context.
 */
export type ResourceCalculator = (ctx: OperationContext) => ResourceAmount;

export type OperationScope = "client" | "internal";

/**
 * Operation definition with static or dynamic costs and gains.
 */
export interface Operation {
  id: string;
  name: string;
  description?: string;
  scope?: OperationScope;
  cost: ResourceAmount | ResourceCalculator;
  gain: ResourceAmount | ResourceCalculator;
}

/**
 * Enum for all available operations.
 * Using enum for type-safe operation references.
 */
export enum OperationId {
  BUY_SUPPLIES = "BUY_SUPPLIES",
  AUTO_BUY_SUPPLIES = "AUTO_BUY_SUPPLIES",
  TOGGLE_AUTO_BUY_SUPPLIES = "TOGGLE_AUTO_BUY_SUPPLIES",
  BUY_GOLD = "BUY_GOLD",
  BUY_AUTOPRINTER = "BUY_AUTOPRINTER",
  PRINT_TICKET = "PRINT_TICKET",
  INCREASE_TICKET_BATCH = "INCREASE_TICKET_BATCH",
  INCREASE_MANUAL_PRINT_BATCH = "INCREASE_MANUAL_PRINT_BATCH",
  INCREASE_SUPPLIES_BATCH = "INCREASE_SUPPLIES_BATCH",
  INCREASE_CREDIT_GENERATION = "INCREASE_CREDIT_GENERATION",
  INCREASE_CREDIT_CAPACITY = "INCREASE_CREDIT_CAPACITY",
  GENERATE_CREDIT = "GENERATE_CREDIT",
}

export const SUPPLIES_PER_GOLD = 200;
export const TICKET_BATCH_UPGRADE_COST = 10;
export const MANUAL_PRINT_BATCH_UPGRADE_COST = 10;
export const SUPPLIES_BATCH_UPGRADE_COST = 10;
export const AUTOPRINTER_COST_MULTIPLIER = 20;
export const CREDIT_CAPACITY_UPGRADE_AMOUNT = 20;

function getOperationQuantity(params?: any): number {
  if (!Number.isInteger(params?.quantity) || params.quantity < 1) {
    return 1;
  }

  return params.quantity;
}

export function getSuppliesBatchLevel(user: User): number {
  return Math.max(0, user.supplies_batch_level ?? 0);
}

function getBatchMultiplier(level: number): number {
  return 2 ** Math.max(0, level);
}

function getBatchSize(level: number): number {
  return Math.max(0, level) + 1;
}

function getBatchUpgradeCost(level: number, baseCost: number): number {
  return getBatchMultiplier(level) * baseCost;
}

function getLinearUpgradeCost(level: number, baseCost: number): number {
  return getBatchSize(level) * baseCost;
}

function getLevel(userLevel: number | undefined): number {
  return Math.max(0, userLevel ?? 0);
}

export function getTicketBatchLevel(user: User): number {
  return getLevel(user.ticket_batch_level);
}

export function getTicketBatchScale(user: User): number {
  return getBatchMultiplier(getTicketBatchLevel(user));
}

export function getManualPrintBatchLevel(user: User): number {
  return getLevel(user.manual_print_batch_level);
}

export function getScaledTicketQuantity(
  baseQuantity: number,
  user: User,
): number {
  return Math.max(0, baseQuantity) * getTicketBatchScale(user);
}

export function getAutoprinterPrintQuantity(user: User): number {
  return getScaledTicketQuantity(Math.max(0, user.autoprinters ?? 0), user);
}

export function getAutoprinterCost(user: User): number {
  const currentAutoprinters = Math.max(0, user.autoprinters ?? 0);

  return (
    AUTOPRINTER_COST_MULTIPLIER *
    2 *
    Math.floor(Math.pow(currentAutoprinters + 1, 1.5))
  );
}

export function getManualPrintQuantity(user: User): number {
  return getScaledTicketQuantity(
    getBatchSize(getManualPrintBatchLevel(user)),
    user,
  );
}

export function getTicketBatchUpgradeCost(user: User): number {
  return getBatchUpgradeCost(
    getTicketBatchLevel(user),
    TICKET_BATCH_UPGRADE_COST,
  );
}

export function getManualPrintBatchUpgradeCost(user: User): number {
  return getLinearUpgradeCost(
    getManualPrintBatchLevel(user),
    MANUAL_PRINT_BATCH_UPGRADE_COST,
  );
}

export function getSuppliesBatchUpgradeCost(user: User): number {
  return getBatchUpgradeCost(
    getSuppliesBatchLevel(user),
    SUPPLIES_BATCH_UPGRADE_COST,
  );
}

export function getCreditGenerationUpgradeCost(user: User): number {
  const level = getLevel(user.credit_generation_level);

  return Math.floor(1 + Math.pow(level, 1.2));
}

export function getCreditCapacityUpgradeCost(user: User): number {
  const level = getLevel(user.credit_capacity_level);

  return Math.floor(200 + Math.pow(level, 1.5) * 10);
}

export function getMaxCreditValue(user: User): number {
  return getLevel(user.credit_capacity_level) * CREDIT_CAPACITY_UPGRADE_AMOUNT;
}

export function getMaxSuppliesPurchaseGold(user: User): number {
  return 2 ** getSuppliesBatchLevel(user);
}

export function getBuySuppliesSpend(user: User): number {
  if (user.gold <= 0) {
    return 0;
  }

  return Math.min(user.gold, getMaxSuppliesPurchaseGold(user));
}

export function getBuySuppliesGainForGold(spendGold: number): number {
  return spendGold * SUPPLIES_PER_GOLD;
}

function getPrintTicketQuantity(ctx: OperationContext): number {
  if (ctx.params?.quantity === undefined) {
    return getManualPrintQuantity(ctx.user);
  }

  return getOperationQuantity(ctx.params);
}

export function getCreditGenerationAmount(user: User): number {
  const generatedCredit = Math.max(0, user.credit_generation_level ?? 0) / 10;
  const remainingCapacity = Math.max(
    0,
    getMaxCreditValue(user) - (user.credit_value ?? 0),
  );

  return Math.min(generatedCredit, remainingCapacity);
}

/**
 * All available operations in the game.
 * Single source of truth for game economy.
 */
export const operations: Record<OperationId, Operation> = {
  [OperationId.BUY_SUPPLIES]: {
    id: OperationId.BUY_SUPPLIES,
    name: "Buy Supplies",
    description: "Purchase printer supplies with gold",
    cost: (ctx: OperationContext) => {
      const spendGold = getBuySuppliesSpend(ctx.user);
      return {
        [ResourceType.GOLD]: spendGold,
      };
    },
    gain: (ctx: OperationContext) => {
      const spendGold = getBuySuppliesSpend(ctx.user);
      return {
        [ResourceType.PRINTER_SUPPLIES]: getBuySuppliesGainForGold(spendGold),
      };
    },
  },

  [OperationId.AUTO_BUY_SUPPLIES]: {
    id: OperationId.AUTO_BUY_SUPPLIES,
    name: "Buy Auto-Buy Supplies",
    description: "Unlock auto-buy supplies permanently",
    cost: {
      [ResourceType.GOLD]: 10,
    },
    gain: {},
  },

  [OperationId.TOGGLE_AUTO_BUY_SUPPLIES]: {
    id: OperationId.TOGGLE_AUTO_BUY_SUPPLIES,
    name: "Toggle Auto-Buy Supplies",
    description: "Enable or disable automatic supplies purchasing",
    cost: {},
    gain: {},
  },

  [OperationId.BUY_GOLD]: {
    id: OperationId.BUY_GOLD,
    name: "Buy Gold",
    description: "Purchase gold with money",
    cost: (ctx: OperationContext) => {
      const quantity = getOperationQuantity(ctx.params);
      return {
        [ResourceType.MONEY]: 100 * quantity,
      };
    },
    gain: (ctx: OperationContext) => {
      const quantity = getOperationQuantity(ctx.params);
      return {
        [ResourceType.GOLD]: quantity,
      };
    },
  },

  [OperationId.BUY_AUTOPRINTER]: {
    id: OperationId.BUY_AUTOPRINTER,
    name: "Buy Autoprinter",
    description: "Purchase an autoprinter with credit",
    cost: (ctx: OperationContext) => ({
      [ResourceType.CREDIT]: getAutoprinterCost(ctx.user),
    }),
    gain: {
      [ResourceType.AUTOPRINTERS]: 1,
    },
  },

  [OperationId.PRINT_TICKET]: {
    id: OperationId.PRINT_TICKET,
    name: "Print Ticket",
    description: "Print a ticket using supplies",
    cost: (ctx: OperationContext) => {
      const quantity = getPrintTicketQuantity(ctx);
      return {
        [ResourceType.PRINTER_SUPPLIES]: quantity,
      };
    },
    gain: (ctx: OperationContext) => {
      const quantity = getPrintTicketQuantity(ctx);
      return {
        [ResourceType.MONEY]: quantity,
        [ResourceType.TICKETS_CONTRIBUTED]: quantity,
      };
    },
  },

  [OperationId.INCREASE_TICKET_BATCH]: {
    id: OperationId.INCREASE_TICKET_BATCH,
    name: "Increase Ticket Batch Scale",
    description: "Double all ticket printing output",
    cost: (ctx: OperationContext) => ({
      [ResourceType.GOLD]: getTicketBatchUpgradeCost(ctx.user),
    }),
    gain: {
      [ResourceType.TICKET_BATCH_LEVEL]: 1,
    },
  },

  [OperationId.INCREASE_MANUAL_PRINT_BATCH]: {
    id: OperationId.INCREASE_MANUAL_PRINT_BATCH,
    name: "Increase Manual Print Batch",
    description: "Double the tickets printed by each manual press",
    cost: (ctx: OperationContext) => ({
      [ResourceType.GOLD]: getManualPrintBatchUpgradeCost(ctx.user),
    }),
    gain: {
      [ResourceType.MANUAL_PRINT_BATCH_LEVEL]: 1,
    },
  },

  [OperationId.INCREASE_SUPPLIES_BATCH]: {
    id: OperationId.INCREASE_SUPPLIES_BATCH,
    name: "Increase Supplies Batch",
    description: "Double the max supplies you can buy at once",
    cost: (ctx: OperationContext) => ({
      [ResourceType.GOLD]: getSuppliesBatchUpgradeCost(ctx.user),
    }),
    gain: {
      [ResourceType.SUPPLIES_BATCH_LEVEL]: 1,
    },
  },

  [OperationId.INCREASE_CREDIT_GENERATION]: {
    id: OperationId.INCREASE_CREDIT_GENERATION,
    name: "Increase Credit Generation",
    description: "Increase credit generation by 0.1 per second",
    cost: (ctx: OperationContext) => ({
      [ResourceType.GOLD]: getCreditGenerationUpgradeCost(ctx.user),
    }),
    gain: {
      [ResourceType.CREDIT_GENERATION_LEVEL]: 1,
    },
  },

  [OperationId.INCREASE_CREDIT_CAPACITY]: {
    id: OperationId.INCREASE_CREDIT_CAPACITY,
    name: "Increase Credit Capacity",
    description: `Increase your capacity level by 1 (+${CREDIT_CAPACITY_UPGRADE_AMOUNT} max credit)`,
    cost: (ctx: OperationContext) => ({
      [ResourceType.GLOBAL_TICKETS]: getCreditCapacityUpgradeCost(ctx.user),
    }),
    gain: {
      [ResourceType.CREDIT_CAPACITY_LEVEL]: 1,
    },
  },

  [OperationId.GENERATE_CREDIT]: {
    id: OperationId.GENERATE_CREDIT,
    name: "Generate Credit",
    description: "Internal periodic credit generation",
    scope: "internal",
    cost: {},
    gain: (ctx: OperationContext) => {
      const generatedCredit = getCreditGenerationAmount(ctx.user);

      return generatedCredit > 0
        ? {
            [ResourceType.CREDIT]: generatedCredit,
          }
        : {};
    },
  },
};

export const clientOperationIds = (
  Object.values(OperationId) as OperationId[]
).filter((operationId) => operations[operationId].scope !== "internal");

export function isClientOperationId(operationId: OperationId): boolean {
  return operations[operationId].scope !== "internal";
}

/**
 * Evaluates a cost or gain, returning a concrete ResourceAmount.
 * If the cost/gain is a function, it calls it with the provided context.
 * Otherwise, it returns the static value.
 */
export function evaluateResourceAmount(
  costOrGain: ResourceAmount | ResourceCalculator,
  ctx: OperationContext,
): ResourceAmount {
  if (typeof costOrGain === "function") {
    return costOrGain(ctx);
  }
  return costOrGain;
}

/**
 * Helper function to get the evaluated cost of an operation.
 */
export function getOperationCost(
  operation: Operation,
  ctx: OperationContext,
): ResourceAmount {
  return evaluateResourceAmount(operation.cost, ctx);
}

/**
 * Helper function to get the evaluated gain of an operation.
 */
export function getOperationGain(
  operation: Operation,
  ctx: OperationContext,
): ResourceAmount {
  return evaluateResourceAmount(operation.gain, ctx);
}

/**
 * Check if a user can afford the specified resource cost.
 */
export function canAfford(user: User, cost: ResourceAmount): boolean {
  for (const [resourceTypeStr, amount] of Object.entries(cost)) {
    if (amount === undefined) {
      continue;
    }
    const resourceType = resourceTypeStr as ResourceType;
    const dbField = RESOURCE_DB_FIELDS[resourceType] as keyof User;
    const userAmount = user[dbField] as number;

    if (userAmount < amount) {
      return false;
    }
  }
  return true;
}

/**
 * Apply a transaction to a user object, returning a new user with updated resources.
 * This is a pure function that does not mutate the original user object.
 */
export function applyTransaction(
  user: User,
  cost: ResourceAmount,
  gain: ResourceAmount,
): User {
  const newUser = { ...user };

  // Deduct costs
  for (const [resourceTypeStr, amount] of Object.entries(cost)) {
    if (amount === undefined) {
      continue;
    }
    const resourceType = resourceTypeStr as ResourceType;
    const dbField = RESOURCE_DB_FIELDS[resourceType] as keyof User;
    (newUser[dbField] as number) = (user[dbField] as number) - amount;
  }

  // Add gains
  for (const [resourceTypeStr, amount] of Object.entries(gain)) {
    if (amount === undefined) {
      continue;
    }
    const resourceType = resourceTypeStr as ResourceType;
    const dbField = RESOURCE_DB_FIELDS[resourceType] as keyof User;
    (newUser[dbField] as number) = (user[dbField] as number) + amount;
  }

  return newUser;
}

/**
 * Result of validating an operation.
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  cost: ResourceAmount;
  gain: ResourceAmount;
  insufficientResources?: ResourceType[];
}

/**
 * Validate that an operation can be performed by a user.
 * Returns detailed validation results including evaluated costs/gains.
 * Pass globalTicketCount to validate operations that cost GLOBAL_TICKETS.
 */
export function validateOperation(
  user: User,
  operation: Operation,
  params?: any,
  globalTicketCount?: number,
): ValidationResult {
  const ctx: OperationContext = { user, params, globalTicketCount };

  const cost = getOperationCost(operation, ctx);
  const gain = getOperationGain(operation, ctx);

  // Check for invalid quantities
  if (params?.quantity !== undefined) {
    const quantity = params.quantity;
    if (!Number.isInteger(quantity) || quantity < 1) {
      return {
        valid: false,
        error: "Quantity must be a positive integer",
        cost,
        gain,
      };
    }
  }

  if (operation.id === OperationId.TOGGLE_AUTO_BUY_SUPPLIES) {
    if (typeof params?.active !== "boolean") {
      return {
        valid: false,
        error: "'active' boolean is required",
        cost,
        gain,
      };
    }

    if (!user.auto_buy_supplies_purchased) {
      return {
        valid: false,
        error: "Auto-buy supplies not unlocked",
        cost,
        gain,
      };
    }
  }

  if (
    operation.id === OperationId.AUTO_BUY_SUPPLIES &&
    user.auto_buy_supplies_purchased
  ) {
    return {
      valid: false,
      error: "Auto-buy supplies already unlocked",
      cost,
      gain,
    };
  }

  if (
    operation.id === OperationId.GENERATE_CREDIT &&
    (gain[ResourceType.CREDIT] ?? 0) <= 0
  ) {
    return {
      valid: false,
      error: "No credit generated",
      cost,
      gain,
    };
  }

  if (
    operation.id === OperationId.BUY_SUPPLIES &&
    (cost[ResourceType.GOLD] ?? 0) < 1
  ) {
    return {
      valid: false,
      error: "Insufficient resources",
      cost: {
        [ResourceType.GOLD]: 1,
      },
      gain: {
        [ResourceType.PRINTER_SUPPLIES]: SUPPLIES_PER_GOLD,
      },
      insufficientResources: [ResourceType.GOLD],
    };
  }

  // Check affordability
  const insufficientResources: ResourceType[] = [];
  for (const [resourceTypeStr, amount] of Object.entries(cost)) {
    if (amount === undefined) {
      continue;
    }
    const resourceType = resourceTypeStr as ResourceType;

    // Handle global tickets specially
    if (resourceType === ResourceType.GLOBAL_TICKETS) {
      const availableGlobalTickets = globalTicketCount ?? 0;
      if (availableGlobalTickets < amount) {
        insufficientResources.push(resourceType);
      }
    } else {
      // Handle user resources normally
      const dbField = RESOURCE_DB_FIELDS[resourceType];
      if (!dbField) {
        // Skip resources that don't have a user database mapping
        continue;
      }
      const userAmount = user[dbField as keyof User] as number;

      if (userAmount < amount) {
        insufficientResources.push(resourceType);
      }
    }
  }

  if (insufficientResources.length > 0) {
    return {
      valid: false,
      error: "Insufficient resources",
      cost,
      gain,
      insufficientResources,
    };
  }

  return {
    valid: true,
    cost,
    gain,
  };
}
