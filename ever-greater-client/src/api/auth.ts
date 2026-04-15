import { type User } from "ever-greater-shared";
import { apiFetch, NetworkError } from "./client";

const DEFAULT_API_BASE = "http://localhost:4000";
let apiBase = DEFAULT_API_BASE;
try {
  apiBase = (import.meta.env.VITE_API_BASE as string) || DEFAULT_API_BASE;
} catch {
  // In test environments, import.meta may not be available
}

export type { User };

type RegisterResponse = {
  user: User;
};

type LoginResponse = {
  user: User;
};

type MeResponse = {
  user: User;
};

type ToggleAutoBuySuppliesResponse = {
  user: User;
};

/**
 * Register a new user
 * @param email User email
 * @param password User password
 * @returns User object
 */
export async function register(email: string, password: string): Promise<User> {
  const data = await apiFetch<RegisterResponse>(
    `${apiBase}/api/auth/register`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    },
  );
  return data.user;
}

/**
 * Login user
 * @param email User email
 * @param password User password
 * @returns User object
 */
export async function login(email: string, password: string): Promise<User> {
  const data = await apiFetch<LoginResponse>(`${apiBase}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
  return data.user;
}

/**
 * Get current authenticated user
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const data = await apiFetch<MeResponse>(`${apiBase}/api/auth/me`, {
      method: "GET",
      credentials: "include",
    });
    return data.user;
  } catch (error) {
    if (error instanceof NetworkError) {
      console.error("Error fetching current user:", error);
    }
    return null;
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  await apiFetch<unknown>(`${apiBase}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });
}

/**
 * Toggle auto-buy supplies active state after unlock.
 */
export async function setAutoBuySuppliesActive(active: boolean): Promise<User> {
  const data = await apiFetch<ToggleAutoBuySuppliesResponse>(
    `${apiBase}/api/auth/auto-buy-supplies/toggle`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ active }),
    },
  );
  return data.user;
}
