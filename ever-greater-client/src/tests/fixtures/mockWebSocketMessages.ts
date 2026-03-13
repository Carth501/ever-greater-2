import type {
  GlobalCountUpdate,
  UserResourceFields,
  UserResourceUpdate,
} from "ever-greater-shared";

export function mockWsCountUpdate(count = 0): GlobalCountUpdate {
  return {
    type: "GLOBAL_COUNT_UPDATE",
    count,
  };
}

export function mockWsUserUpdate(
  user_update: UserResourceFields = {},
): UserResourceUpdate {
  return {
    type: "USER_RESOURCE_UPDATE",
    user_update,
  };
}
