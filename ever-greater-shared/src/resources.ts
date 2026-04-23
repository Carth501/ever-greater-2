/**
 * Enum for all resource types in the game.
 * Using enum instead of string literals for type safety and refactorability.
 */
export enum ResourceType {
  TICKETS_CONTRIBUTED = "TICKETS_CONTRIBUTED",
  PRINTER_SUPPLIES = "PRINTER_SUPPLIES",
  MONEY = "MONEY",
  GOLD = "GOLD",
  GEMS = "GEMS",
  AUTOPRINTERS = "AUTOPRINTERS",
  CREDIT = "CREDIT",
  MONEY_PER_TICKET_LEVEL = "MONEY_PER_TICKET_LEVEL",
  CREDIT_GENERATION_LEVEL = "CREDIT_GENERATION_LEVEL",
  CREDIT_CAPACITY_LEVEL = "CREDIT_CAPACITY_LEVEL",
  CREDIT_CAPACITY_AMOUNT_LEVEL = "CREDIT_CAPACITY_AMOUNT_LEVEL",
  TICKET_BATCH_LEVEL = "TICKET_BATCH_LEVEL",
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
  [ResourceType.GEMS]: "gems",
  [ResourceType.AUTOPRINTERS]: "autoprinters",
  [ResourceType.CREDIT]: "credit_value",
  [ResourceType.MONEY_PER_TICKET_LEVEL]: "money_per_ticket_level",
  [ResourceType.CREDIT_GENERATION_LEVEL]: "credit_generation_level",
  [ResourceType.CREDIT_CAPACITY_LEVEL]: "credit_capacity_level",
  [ResourceType.CREDIT_CAPACITY_AMOUNT_LEVEL]: "credit_capacity_amount_level",
  [ResourceType.TICKET_BATCH_LEVEL]: "ticket_batch_level",
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
  gems: ResourceType.GEMS,
  autoprinters: ResourceType.AUTOPRINTERS,
  credit_value: ResourceType.CREDIT,
  money_per_ticket_level: ResourceType.MONEY_PER_TICKET_LEVEL,
  credit_generation_level: ResourceType.CREDIT_GENERATION_LEVEL,
  credit_capacity_level: ResourceType.CREDIT_CAPACITY_LEVEL,
  credit_capacity_amount_level: ResourceType.CREDIT_CAPACITY_AMOUNT_LEVEL,
  ticket_batch_level: ResourceType.TICKET_BATCH_LEVEL,
  manual_print_batch_level: ResourceType.MANUAL_PRINT_BATCH_LEVEL,
  supplies_batch_level: ResourceType.SUPPLIES_BATCH_LEVEL,
};

/**
 * Represents an amount of resources.
 * Partial record allows specifying only the resources that are relevant.
 */
export type ResourceAmount = Partial<Record<ResourceType, number>>;

export enum AutoBuyResourceKey {
  PRINTER_SUPPLIES = "printer_supplies",
  GOLD = "gold",
}

export enum AutoBuyScaleMode {
  MIN = "MIN",
  CUSTOM_VALUE = "CUSTOM_VALUE",
  CUSTOM_PERCENT = "CUSTOM_PERCENT",
  MAX = "MAX",
}

export interface AutoBuyRule {
  threshold: number;
  scaleMode: AutoBuyScaleMode;
  scaleValue: number;
}

export type AutoBuySettings = Record<AutoBuyResourceKey, AutoBuyRule>;

const DEFAULT_AUTO_BUY_RULE: AutoBuyRule = {
  threshold: 0,
  scaleMode: AutoBuyScaleMode.MAX,
  scaleValue: 0,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function clampToNonNegativeInteger(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
}

function clampToPositiveInteger(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 1;
  }

  return Math.max(1, Math.round(value));
}

export function isAutoBuyResourceKey(
  value: unknown,
): value is AutoBuyResourceKey {
  return Object.values(AutoBuyResourceKey).includes(
    value as AutoBuyResourceKey,
  );
}

export function isAutoBuyScaleMode(value: unknown): value is AutoBuyScaleMode {
  return Object.values(AutoBuyScaleMode).includes(value as AutoBuyScaleMode);
}

export function normalizeAutoBuyRule(rule?: unknown): AutoBuyRule {
  const rawRule = isRecord(rule) ? rule : {};
  const scaleMode = isAutoBuyScaleMode(rawRule.scaleMode)
    ? rawRule.scaleMode
    : DEFAULT_AUTO_BUY_RULE.scaleMode;

  return {
    threshold: clampToNonNegativeInteger(rawRule.threshold),
    scaleMode,
    scaleValue:
      scaleMode === AutoBuyScaleMode.CUSTOM_PERCENT
        ? Math.min(100, clampToPositiveInteger(rawRule.scaleValue))
        : scaleMode === AutoBuyScaleMode.CUSTOM_VALUE
          ? clampToPositiveInteger(rawRule.scaleValue)
          : 0,
  };
}

export function getDefaultAutoBuySettings(): AutoBuySettings {
  return {
    [AutoBuyResourceKey.PRINTER_SUPPLIES]: {
      ...DEFAULT_AUTO_BUY_RULE,
    },
    [AutoBuyResourceKey.GOLD]: {
      ...DEFAULT_AUTO_BUY_RULE,
    },
  };
}

export function normalizeAutoBuySettings(settings?: unknown): AutoBuySettings {
  const rawSettings = isRecord(settings) ? settings : {};

  return {
    [AutoBuyResourceKey.PRINTER_SUPPLIES]: normalizeAutoBuyRule(
      rawSettings[AutoBuyResourceKey.PRINTER_SUPPLIES],
    ),
    [AutoBuyResourceKey.GOLD]: normalizeAutoBuyRule(
      rawSettings[AutoBuyResourceKey.GOLD],
    ),
  };
}

export function getAutoBuyRule(
  settings: AutoBuySettings | undefined,
  resourceKey: AutoBuyResourceKey,
): AutoBuyRule {
  return normalizeAutoBuySettings(settings)[resourceKey];
}

export function setAutoBuyRule(
  settings: AutoBuySettings | undefined,
  resourceKey: AutoBuyResourceKey,
  rule: unknown,
): AutoBuySettings {
  return {
    ...normalizeAutoBuySettings(settings),
    [resourceKey]: normalizeAutoBuyRule(rule),
  };
}

export function isAutoBuyRule(value: unknown): value is AutoBuyRule {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.threshold === "number" &&
    Number.isFinite(value.threshold) &&
    isAutoBuyScaleMode(value.scaleMode) &&
    typeof value.scaleValue === "number" &&
    Number.isFinite(value.scaleValue)
  );
}

export function isAutoBuySettings(value: unknown): value is AutoBuySettings {
  if (!isRecord(value)) {
    return false;
  }

  return Object.values(AutoBuyResourceKey).every((resourceKey) =>
    isAutoBuyRule(value[resourceKey]),
  );
}

export function areAutoBuySettingsEqual(
  left: AutoBuySettings | undefined,
  right: AutoBuySettings | undefined,
): boolean {
  const normalizedLeft = normalizeAutoBuySettings(left);
  const normalizedRight = normalizeAutoBuySettings(right);

  return Object.values(AutoBuyResourceKey).every((resourceKey) => {
    const leftRule = normalizedLeft[resourceKey];
    const rightRule = normalizedRight[resourceKey];

    return (
      leftRule.threshold === rightRule.threshold &&
      leftRule.scaleMode === rightRule.scaleMode &&
      leftRule.scaleValue === rightRule.scaleValue
    );
  });
}

export function resolveAutoBuySpendAmount(
  rule: AutoBuyRule,
  availableAmount: number,
  maxSpend: number,
): number {
  const spendCap = Math.max(
    0,
    Math.min(clampToNonNegativeInteger(availableAmount), maxSpend),
  );

  if (spendCap < 1) {
    return 0;
  }

  switch (rule.scaleMode) {
    case AutoBuyScaleMode.MIN:
      return 1;
    case AutoBuyScaleMode.CUSTOM_VALUE:
      return Math.min(spendCap, clampToPositiveInteger(rule.scaleValue));
    case AutoBuyScaleMode.CUSTOM_PERCENT:
      return Math.min(
        spendCap,
        Math.max(
          1,
          Math.round(
            (clampToNonNegativeInteger(availableAmount) * rule.scaleValue) /
              100,
          ),
        ),
      );
    case AutoBuyScaleMode.MAX:
    default:
      return spendCap;
  }
}

export function shouldTriggerAutoBuy(
  currentAmount: number,
  requiredAmount: number,
  threshold: number,
): boolean {
  return currentAmount < Math.max(requiredAmount, threshold);
}

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
  gems: number;
  autoprinters: number;
  credit_value: number;
  money_per_ticket_level: number;
  credit_generation_level: number;
  credit_capacity_level: number;
  credit_capacity_amount_level: number;
  ticket_batch_level: number;
  manual_print_batch_level: number;
  supplies_batch_level: number;
  auto_buy_supplies_purchased: boolean;
  auto_buy_supplies_active: boolean;
  auto_buy_settings: AutoBuySettings;
}

export const CLIENT_USER_STATE_DEFAULTS = {
  printer_supplies: 0,
  money: 0,
  gold: 0,
  gems: 0,
  autoprinters: 0,
  tickets_contributed: 0,
  tickets_withdrawn: 0,
  credit_value: 0,
  money_per_ticket_level: 0,
  credit_generation_level: 0,
  credit_capacity_level: 0,
  credit_capacity_amount_level: 0,
  ticket_batch_level: 0,
  manual_print_batch_level: 0,
  supplies_batch_level: 0,
  auto_buy_supplies_purchased: false,
  auto_buy_supplies_active: false,
  auto_buy_settings: getDefaultAutoBuySettings(),
} satisfies Omit<User, "id" | "email">;

export type ClientUserStateField = keyof typeof CLIENT_USER_STATE_DEFAULTS;

export type ClientUserState = Pick<User, ClientUserStateField>;

export const CLIENT_USER_STATE_FIELDS = Object.keys(
  CLIENT_USER_STATE_DEFAULTS,
) as ClientUserStateField[];

export const CLIENT_USER_STATE_FIELD_TYPES = Object.fromEntries(
  Object.entries(CLIENT_USER_STATE_DEFAULTS).map(([field, value]) => [
    field,
    typeof value,
  ]),
) as Record<ClientUserStateField, "number" | "boolean" | "object">;

export function toClientUserState(
  user: Partial<ClientUserState>,
): ClientUserState {
  return Object.fromEntries(
    CLIENT_USER_STATE_FIELDS.map((field) => [
      field,
      field === "auto_buy_settings"
        ? normalizeAutoBuySettings(user.auto_buy_settings)
        : (user[field] ?? CLIENT_USER_STATE_DEFAULTS[field]),
    ]),
  ) as ClientUserState;
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
