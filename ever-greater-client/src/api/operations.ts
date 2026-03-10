import { OperationId, type User } from "ever-greater-shared";
import { apiFetch } from "./client";

const DEFAULT_API_BASE = "http://localhost:4000";
let apiBase = DEFAULT_API_BASE;
try {
  apiBase = (import.meta.env.VITE_API_BASE as string) || DEFAULT_API_BASE;
} catch {
  // In test environments, import.meta may not be available
}

interface OperationResponse {
  operationId: string;
  cost: Record<string, number>;
  gain: Record<string, number>;
  count: number | null;
  user: User;
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
  const data = await apiFetch<OperationResponse>(
    `${apiBase}/api/operations/${operationId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(params || {}),
    },
  );
  return data.user;
}

/**
 * Buy supplies with money (uses generic operation endpoint)
 */
export async function buySupplies(): Promise<User> {
  return executeOperation(OperationId.BUY_SUPPLIES);
}

/**
 * Unlock auto-buy supplies permanently (one-time purchase).
 */
export async function buyAutoBuySupplies(): Promise<User> {
  return executeOperation(OperationId.AUTO_BUY_SUPPLIES);
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

/**
 * Increase credit generation rate by 0.1 per second
 */
export async function increaseCreditGeneration(): Promise<User> {
  return executeOperation(OperationId.INCREASE_CREDIT_GENERATION);
}

/**
 * Increase credit capacity maximum by 1
 */
export async function increaseCreditCapacity(): Promise<User> {
  return executeOperation(OperationId.INCREASE_CREDIT_CAPACITY);
}
