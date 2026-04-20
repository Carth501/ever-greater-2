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
 * Enable or disable automatic supplies purchasing.
 */
export async function toggleAutoBuySupplies(active: boolean): Promise<User> {
  return executeOperation(OperationId.TOGGLE_AUTO_BUY_SUPPLIES, { active });
}

/**
 * Buy gold with money (uses generic operation endpoint)
 * @param quantity Amount of gold to purchase
 */
export async function buyGold(quantity: number): Promise<User> {
  return executeOperation(OperationId.BUY_GOLD, { quantity });
}

/**
 * Buy a gem with tickets (uses generic operation endpoint)
 */
export async function buyGem(): Promise<User> {
  return executeOperation(OperationId.BUY_GEM);
}

/**
 * Buy an autoprinter with credit (uses generic operation endpoint)
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
 * Increase the general ticket batch scale for all printing.
 */
export async function increaseTicketBatch(): Promise<User> {
  return executeOperation(OperationId.INCREASE_TICKET_BATCH);
}

/**
 * Increase the manual ticket print batch size.
 */
export async function increaseManualPrintBatch(): Promise<User> {
  return executeOperation(OperationId.INCREASE_MANUAL_PRINT_BATCH);
}

/**
 * Increase the maximum supplies purchase batch size.
 */
export async function increaseSuppliesBatch(): Promise<User> {
  return executeOperation(OperationId.INCREASE_SUPPLIES_BATCH);
}

/**
 * Increase credit capacity maximum by 20
 */
export async function increaseCreditCapacity(): Promise<User> {
  return executeOperation(OperationId.INCREASE_CREDIT_CAPACITY);
}
