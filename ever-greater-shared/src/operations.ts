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

/**
 * Operation definition with static or dynamic costs and gains.
 */
export interface Operation {
  id: string;
  name: string;
  description?: string;
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
  BUY_GOLD = "BUY_GOLD",
  BUY_AUTOPRINTER = "BUY_AUTOPRINTER",
  PRINT_TICKET = "PRINT_TICKET",
  INCREASE_CREDIT_GENERATION = "INCREASE_CREDIT_GENERATION",
  INCREASE_CREDIT_CAPACITY = "INCREASE_CREDIT_CAPACITY",
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
    cost: {
      [ResourceType.GOLD]: 1,
    },
    gain: {
      [ResourceType.PRINTER_SUPPLIES]: 200,
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

  [OperationId.BUY_GOLD]: {
    id: OperationId.BUY_GOLD,
    name: "Buy Gold",
    description: "Purchase gold with money",
    cost: (ctx: OperationContext) => {
      const quantity = ctx.params?.quantity ?? 1;
      return {
        [ResourceType.MONEY]: 100 * quantity,
      };
    },
    gain: (ctx: OperationContext) => {
      const quantity = ctx.params?.quantity ?? 1;
      return {
        [ResourceType.GOLD]: quantity,
      };
    },
  },

  [OperationId.BUY_AUTOPRINTER]: {
    id: OperationId.BUY_AUTOPRINTER,
    name: "Buy Autoprinter",
    description: "Purchase an autoprinter with credit",
    cost: (ctx: OperationContext) => {
      const currentAutoprinters = ctx.user.autoprinters;
      const creditCost = 2 * Math.floor(Math.pow(currentAutoprinters + 1, 1.5));
      return {
        [ResourceType.CREDIT]: creditCost,
      };
    },
    gain: {
      [ResourceType.AUTOPRINTERS]: 1,
    },
  },

  [OperationId.PRINT_TICKET]: {
    id: OperationId.PRINT_TICKET,
    name: "Print Ticket",
    description: "Print a ticket using supplies",
    cost: {
      [ResourceType.PRINTER_SUPPLIES]: 1,
    },
    gain: {
      [ResourceType.MONEY]: 1,
      [ResourceType.TICKETS_CONTRIBUTED]: 1,
    },
  },

  [OperationId.INCREASE_CREDIT_GENERATION]: {
    id: OperationId.INCREASE_CREDIT_GENERATION,
    name: "Increase Credit Generation",
    description: "Increase credit generation by 0.1 per second",
    cost: {
      [ResourceType.GOLD]: 1,
    },
    gain: {
      [ResourceType.CREDIT_GENERATION_LEVEL]: 1,
    },
  },

  [OperationId.INCREASE_CREDIT_CAPACITY]: {
    id: OperationId.INCREASE_CREDIT_CAPACITY,
    name: "Increase Credit Capacity",
    description: "Increase your maximum credit by 1",
    cost: {
      [ResourceType.GLOBAL_TICKETS]: 200,
    },
    gain: {
      [ResourceType.CREDIT_CAPACITY_LEVEL]: 1,
    },
  },
};

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
