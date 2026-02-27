const DEFAULT_API_BASE = "http://localhost:4000";
const apiBase = process.env.REACT_APP_API_BASE || DEFAULT_API_BASE;

export type User = {
  id: number;
  email: string;
  tickets_contributed: number;
  printer_supplies: number;
  money: number;
  gold: number;
  autoprinters: number;
};

type RegisterResponse = {
  user: User;
};

type LoginResponse = {
  user: User;
};

type MeResponse = {
  user: User;
};

/**
 * Register a new user
 * @param email User email
 * @param password User password
 * @returns User object
 */
export async function register(email: string, password: string): Promise<User> {
  const response = await fetch(`${apiBase}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to register");
  }

  const data = (await response.json()) as RegisterResponse;
  return data.user;
}

/**
 * Login user
 * @param email User email
 * @param password User password
 * @returns User object
 */
export async function login(email: string, password: string): Promise<User> {
  const response = await fetch(`${apiBase}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to login");
  }

  const data = (await response.json()) as LoginResponse;
  return data.user;
}

/**
 * Get current authenticated user
 * @returns User object or null if not authenticated
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const response = await fetch(`${apiBase}/api/auth/me`, {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as MeResponse;
    return data.user;
  } catch (error) {
    console.error("Error fetching current user:", error);
    return null;
  }
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  const response = await fetch(`${apiBase}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to logout");
  }
}

/**
 * Buy supplies with money
 * @returns Object with updated money and printer_supplies
 */
type BuySuppliesResponse = {
  money: number;
  printer_supplies: number;
};

export async function buySupplies(): Promise<BuySuppliesResponse> {
  const response = await fetch(`${apiBase}/api/shop/buy-supplies`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to buy supplies");
  }

  const data = (await response.json()) as BuySuppliesResponse;
  return data;
}

/**
 * Buy gold with money
 * @param quantity Number of gold to purchase
 * @returns Object with updated money and gold
 */
type BuyGoldResponse = {
  money: number;
  gold: number;
};

export async function buyGold(quantity: number): Promise<BuyGoldResponse> {
  const response = await fetch(`${apiBase}/api/shop/buy-gold`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ quantity }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to buy gold");
  }

  const data = (await response.json()) as BuyGoldResponse;
  return data;
}

/**
 * Buy an autoprinter with gold
 * Cost: 3 * (current_autoprinters + 1)^2 gold
 * @returns Object with updated gold and autoprinters
 */
type BuyAutoprinterResponse = {
  gold: number;
  autoprinters: number;
};

export async function buyAutoprinter(): Promise<BuyAutoprinterResponse> {
  const response = await fetch(`${apiBase}/api/shop/buy-autoprinter`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to buy autoprinter");
  }

  const data = (await response.json()) as BuyAutoprinterResponse;
  return data;
}
