// Export all resources types and utilities
export {
  areAutoBuySettingsEqual,
  AutoBuyResourceKey,
  AutoBuyScaleMode,
  CLIENT_USER_STATE_DEFAULTS,
  CLIENT_USER_STATE_FIELD_TYPES,
  CLIENT_USER_STATE_FIELDS,
  DB_FIELD_TO_RESOURCE,
  getAutoBuyRule,
  getDefaultAutoBuySettings,
  getUserResource,
  hasResources,
  isAutoBuyResourceKey,
  isAutoBuyRule,
  isAutoBuyScaleMode,
  isAutoBuySettings,
  normalizeAutoBuyRule,
  normalizeAutoBuySettings,
  resolveAutoBuySpendAmount,
  RESOURCE_DB_FIELDS,
  ResourceType,
  setAutoBuyRule,
  setUserResource,
  shouldTriggerAutoBuy,
  toClientUserState,
} from "./resources.js";

export type {
  AutoBuyRule,
  AutoBuySettings,
  ClientUserState,
  ClientUserStateField,
  ResourceAmount,
  User,
} from "./resources.js";

// Export all operations types and utilities
export {
  applyTransaction,
  AUTOPRINTER_COST_MULTIPLIER,
  canAfford,
  clientOperationIds,
  CREDIT_CAPACITY_UPGRADE_AMOUNT,
  evaluateResourceAmount,
  GEM_SHOP_UNLOCK_TICKETS,
  GEM_TICKET_COST,
  getAutoprinterCost,
  getAutoprinterPrintQuantity,
  getBuySuppliesGainForGold,
  getBuySuppliesSpend,
  getCreditCapacityUpgradeCost,
  getCreditGenerationAmount,
  getCreditGenerationUpgradeCost,
  getManualPrintBatchLevel,
  getManualPrintBatchUpgradeCost,
  getManualPrintQuantity,
  getMaxAffordableGoldQuantity,
  getMaxCreditValue,
  getMaxSuppliesPurchaseGold,
  getMoneyPerTicket,
  getMoneyPerTicketUpgradeCost,
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
  ConfigureAutoBuyParams,
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
