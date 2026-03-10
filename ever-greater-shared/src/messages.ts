/**
 * Typed WebSocket message discriminated union.
 * Eliminates implicit field-name matching between server and client.
 */

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
