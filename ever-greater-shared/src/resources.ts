/**
 * Enum for all resource types in the game.
 * Using enum instead of string literals for type safety and refactorability.
 */
export enum ResourceType {
  TICKETS_CONTRIBUTED = "TICKETS_CONTRIBUTED",
  PRINTER_SUPPLIES = "PRINTER_SUPPLIES",
  MONEY = "MONEY",
  GOLD = "GOLD",
  AUTOPRINTERS = "AUTOPRINTERS",
  CREDIT = "CREDIT",
  CREDIT_GENERATION_LEVEL = "CREDIT_GENERATION_LEVEL",
  CREDIT_CAPACITY_LEVEL = "CREDIT_CAPACITY_LEVEL",
  MANUAL_PRINT_BATCH_LEVEL = "MANUAL_PRINT_BATCH_LEVEL",
  SUPPLIES_BATCH_LEVEL = "SUPPLIES_BATCH_LEVEL",
  GLOBAL_TICKETS = "GLOBAL_TICKETS",
}

/**
 * Maps ResourceType enum values to database column names.
 * This ensures consistent naming between the enum and database schema.
 * Note: GLOBAL_TICKETS is not included as it is not a user resource.
 */
export const RESOURCE_DB_FIELDS: Partial<Record<ResourceType, string>> = {
  [ResourceType.TICKETS_CONTRIBUTED]: "tickets_contributed",
  [ResourceType.PRINTER_SUPPLIES]: "printer_supplies",
  [ResourceType.MONEY]: "money",
  [ResourceType.GOLD]: "gold",
  [ResourceType.AUTOPRINTERS]: "autoprinters",
  [ResourceType.CREDIT]: "credit_value",
  [ResourceType.CREDIT_GENERATION_LEVEL]: "credit_generation_level",
  [ResourceType.CREDIT_CAPACITY_LEVEL]: "credit_capacity_level",
  [ResourceType.MANUAL_PRINT_BATCH_LEVEL]: "manual_print_batch_level",
  [ResourceType.SUPPLIES_BATCH_LEVEL]: "supplies_batch_level",
};

/**
 * Maps database column names back to ResourceType enum values.
 * Useful for processing database results.
 */
export const DB_FIELD_TO_RESOURCE: Record<string, ResourceType> = {
  tickets_contributed: ResourceType.TICKETS_CONTRIBUTED,
  printer_supplies: ResourceType.PRINTER_SUPPLIES,
  money: ResourceType.MONEY,
  gold: ResourceType.GOLD,
  autoprinters: ResourceType.AUTOPRINTERS,
  credit_value: ResourceType.CREDIT,
  credit_generation_level: ResourceType.CREDIT_GENERATION_LEVEL,
  credit_capacity_level: ResourceType.CREDIT_CAPACITY_LEVEL,
  manual_print_batch_level: ResourceType.MANUAL_PRINT_BATCH_LEVEL,
  supplies_batch_level: ResourceType.SUPPLIES_BATCH_LEVEL,
};

/**
 * Represents an amount of resources.
 * Partial record allows specifying only the resources that are relevant.
 */
export type ResourceAmount = Partial<Record<ResourceType, number>>;

/**
 * User type representing a player in the game.
 * This is the single source of truth for user data structure.
 */
export interface User {
  id: number;
  email: string;
  tickets_contributed: number;
  tickets_withdrawn: number;
  printer_supplies: number;
  money: number;
  gold: number;
  autoprinters: number;
  credit_value: number;
  credit_generation_level: number;
  credit_capacity_level: number;
  manual_print_batch_level: number;
  supplies_batch_level: number;
  auto_buy_supplies_purchased: boolean;
  auto_buy_supplies_active: boolean;
}

/**
 * Helper function to get a resource value from a user object.
 * Uses the RESOURCE_DB_FIELDS mapping to access the correct property.
 * Returns 0 for resources without a user database mapping.
 */
export function getUserResource(
  user: User,
  resourceType: ResourceType,
): number {
  const fieldName = RESOURCE_DB_FIELDS[resourceType];
  if (!fieldName) {
    return 0;
  }
  return user[fieldName as keyof User] as number;
}

/**
 * Helper function to set a resource value on a user object (immutably).
 * Returns a new user object with the updated resource value.
 * Skips setting resources that don't have a user database mapping.
 */
export function setUserResource(
  user: User,
  resourceType: ResourceType,
  value: number,
): User {
  const fieldName = RESOURCE_DB_FIELDS[resourceType];
  if (!fieldName) {
    return user;
  }
  return {
    ...user,
    [fieldName]: value,
  };
}

/**
 * Helper function to check if a user has at least the specified amount of resources.
 */
export function hasResources(user: User, resources: ResourceAmount): boolean {
  for (const [resourceType, amount] of Object.entries(resources)) {
    if (amount === undefined) {
      continue;
    }
    const userAmount = getUserResource(user, resourceType as ResourceType);
    if (userAmount < amount) {
      return false;
    }
  }
  return true;
}
