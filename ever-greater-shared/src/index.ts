// Export all resources types and utilities
export {
  DB_FIELD_TO_RESOURCE,
  getUserResource,
  hasResources,
  RESOURCE_DB_FIELDS,
  ResourceType,
  setUserResource,
} from "./resources.js";

export type { ResourceAmount, User } from "./resources.js";

// Export all operations types and utilities
export {
  applyTransaction,
  canAfford,
  evaluateResourceAmount,
  getOperationCost,
  getOperationGain,
  OperationId,
  operations,
  validateOperation,
} from "./operations.js";

export type {
  Operation,
  OperationContext,
  ResourceCalculator,
  ValidationResult,
} from "./operations.js";

// Export typed WebSocket message shapes
export type {
  GlobalCountUpdate,
  UserResourceFields,
  UserResourceUpdate,
  WebSocketMessage,
} from "./messages.js";

export {
  isUserResourceFields,
  isWebSocketMessage,
  parseWebSocketMessage,
} from "./messages.js";
