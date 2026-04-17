// Export all resources types and utilities
export {
  CLIENT_USER_STATE_DEFAULTS,
  CLIENT_USER_STATE_FIELD_TYPES,
  CLIENT_USER_STATE_FIELDS,
  DB_FIELD_TO_RESOURCE,
  getUserResource,
  hasResources,
  RESOURCE_DB_FIELDS,
  ResourceType,
  setUserResource,
  toClientUserState,
} from "./resources.js";

export type {
  ClientUserState,
  ClientUserStateField,
  ResourceAmount,
  User,
} from "./resources.js";

// Export all operations types and utilities
export {
  applyTransaction,
  canAfford,
  clientOperationIds,
  evaluateResourceAmount,
  getAutoprinterPrintQuantity,
  getBuySuppliesGainForGold,
  getBuySuppliesSpend,
  getCreditGenerationAmount,
  getManualPrintBatchLevel,
  getManualPrintBatchUpgradeCost,
  getManualPrintQuantity,
  getMaxSuppliesPurchaseGold,
  getOperationCost,
  getOperationGain,
  getScaledTicketQuantity,
  getSuppliesBatchLevel,
  getSuppliesBatchUpgradeCost,
  getTicketBatchLevel,
  getTicketBatchScale,
  getTicketBatchUpgradeCost,
  isClientOperationId,
  MANUAL_PRINT_BATCH_UPGRADE_COST,
  OperationId,
  operations,
  SUPPLIES_BATCH_UPGRADE_COST,
  SUPPLIES_PER_GOLD,
  TICKET_BATCH_UPGRADE_COST,
  validateOperation,
  type OperationScope,
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
