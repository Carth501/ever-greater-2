/**
 * Typed WebSocket message discriminated union.
 * Eliminates implicit field-name matching between server and client.
 */

import {
  CLIENT_USER_STATE_FIELD_TYPES,
  type ClientUserState,
} from "./resources.js";

export type UserResourceFields = Partial<ClientUserState>;

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
      CLIENT_USER_STATE_FIELD_TYPES[
        key as keyof typeof CLIENT_USER_STATE_FIELD_TYPES
      ];

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
