import { OperationId, type User } from "ever-greater-shared";

const DEFAULT_API_BASE = "http://localhost:4000";
const apiBase = process.env.REACT_APP_API_BASE || DEFAULT_API_BASE;

interface OperationResponse {
  operationId: string;
  cost: Record<string, number>;
  gain: Record<string, number>;
  count: number | null;
  user: User;
}

interface OperationError {
  error: string;
  insufficientResources?: string[];
  cost?: Record<string, number>;
  gain?: Record<string, number>;
  details?: string;
}

/**
 * Execute an operation on the server
 * @param operationId The operation to execute
 * @param params Optional parameters for the operation (e.g., quantity for BUY_GOLD)
 * @returns Updated user object
 * @throws Error if operation fails
 */
export async function executeOperation(
  operationId: OperationId,
  params?: Record<string, unknown>,
): Promise<User> {
  const response = await fetch(`${apiBase}/api/operations/${operationId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(params || {}),
  });

  if (!response.ok) {
    const error: OperationError = await response.json();
    throw new Error(error.error || "Operation failed");
  }

  const data: OperationResponse = await response.json();
  return data.user;
}

/**
 * Buy supplies with money (uses generic operation endpoint)
 */
export async function buySupplies(): Promise<User> {
  return executeOperation(OperationId.BUY_SUPPLIES);
}

/**
 * Buy gold with money (uses generic operation endpoint)
 * @param quantity Amount of gold to purchase
 */
export async function buyGold(quantity: number): Promise<User> {
  return executeOperation(OperationId.BUY_GOLD, { quantity });
}

/**
 * Buy an autoprinter with gold (uses generic operation endpoint)
 */
export async function buyAutoprinter(): Promise<User> {
  return executeOperation(OperationId.BUY_AUTOPRINTER);
}

/**
 * Print a ticket (uses generic operation endpoint)
 */
export async function printTicket(): Promise<User> {
  return executeOperation(OperationId.PRINT_TICKET);
}
