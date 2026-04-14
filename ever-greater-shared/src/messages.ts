/**
 * Typed WebSocket message discriminated union.
 * Eliminates implicit field-name matching between server and client.
 */

const USER_RESOURCE_FIELD_TYPES = {
  printer_supplies: "number",
  money: "number",
  tickets_contributed: "number",
  tickets_withdrawn: "number",
  gold: "number",
  autoprinters: "number",
  credit_value: "number",
  credit_generation_level: "number",
  credit_capacity_level: "number",
  auto_buy_supplies_purchased: "boolean",
  auto_buy_supplies_active: "boolean",
} as const;

export type UserResourceFields = Partial<{
  printer_supplies: number;
  money: number;
  tickets_contributed: number;
  tickets_withdrawn: number;
  gold: number;
  autoprinters: number;
  credit_value: number;
  credit_generation_level: number;
  credit_capacity_level: number;
  auto_buy_supplies_purchased: boolean;
  auto_buy_supplies_active: boolean;
}>;

export type GlobalCountUpdate = {
  type: "GLOBAL_COUNT_UPDATE";
  count: number;
};

export type UserResourceUpdate = {
  type: "USER_RESOURCE_UPDATE";
  user_update: UserResourceFields;
};

export type WebSocketMessage = GlobalCountUpdate | UserResourceUpdate;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isUserResourceFields(
  value: unknown,
): value is UserResourceFields {
  if (!isRecord(value)) {
    return false;
  }

  return Object.entries(value).every(([key, fieldValue]) => {
    const expectedType =
      USER_RESOURCE_FIELD_TYPES[key as keyof typeof USER_RESOURCE_FIELD_TYPES];

    return expectedType !== undefined && typeof fieldValue === expectedType;
  });
}

export function isWebSocketMessage(value: unknown): value is WebSocketMessage {
  if (!isRecord(value) || typeof value.type !== "string") {
    return false;
  }

  switch (value.type) {
    case "GLOBAL_COUNT_UPDATE":
      return typeof value.count === "number";
    case "USER_RESOURCE_UPDATE":
      return isUserResourceFields(value.user_update);
    default:
      return false;
  }
}

export function parseWebSocketMessage(value: unknown): WebSocketMessage | null {
  return isWebSocketMessage(value) ? value : null;
}
