// Export all resources types and utilities
export {
  DB_FIELD_TO_RESOURCE,
  RESOURCE_DB_FIELDS,
  ResourceType,
  getUserResource,
  hasResources,
  setUserResource,
} from "./resources.js";

export type { ResourceAmount, User } from "./resources.js";

// Export all operations types and utilities
export {
  OperationId,
  applyTransaction,
  canAfford,
  evaluateResourceAmount,
  getOperationCost,
  getOperationGain,
  operations,
  validateOperation,
} from "./operations.js";

export type {
  Operation,
  OperationContext,
  ResourceCalculator,
  ValidationResult,
} from "./operations";
