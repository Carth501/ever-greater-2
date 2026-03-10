import { configureStore } from "@reduxjs/toolkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../api/auth";
import * as authApi from "../api/auth";
import * as ticketApi from "../api/globalTicket";
import * as operationsApi from "../api/operations";
import authReducer, {
  AuthState,
  checkAuthThunk,
  loginThunk,
  logoutThunk,
  signupThunk,
  updateAutoprinters,
  updateGold,
  updateMoney,
  updateSupplies,
} from "./slices/authSlice";
import errorReducer, {
  clearError,
  ErrorState,
  setError,
} from "./slices/errorSlice";
import {
  buyAutoBuySuppliesThunk,
  buyAutoprinterThunk,
  buyGoldThunk,
  buySuppliesThunk,
} from "./slices/operationsSlice";
import ticketReducer, {
  clearError as clearTicketError,
  fetchCountThunk,
  incrementCountThunk,
  TicketState,
  updateCount,
} from "./slices/ticketSlice";

vi.mock("../api/auth");
vi.mock("../api/globalTicket");
vi.mock("../api/operations");

const mockAuthApi = authApi as any;
const mockTicketApi = ticketApi as any;
const mockOperationsApi = operationsApi as any;

const mockUser: User = {
  id: 1,
  email: "test@example.com",
  tickets_contributed: 5,
  tickets_withdrawn: 0,
  printer_supplies: 100,
  money: 0,
  gold: 0,
  autoprinters: 0,
  credit_value: 0,
  credit_generation_level: 0,
  credit_capacity_level: 0,
  auto_buy_supplies_active: false,
  auto_buy_supplies_purchased: false,
};

type TestRootState = {
  auth: AuthState;
  ticket: TicketState;
  error: ErrorState;
};

describe("Redux Store Integration", () => {
  let store: ReturnType<typeof configureStore<TestRootState>>;

  beforeEach(() => {
    vi.clearAllMocks();
    store = configureStore({
      reducer: {
        auth: authReducer,
        ticket: ticketReducer,
        error: errorReducer,
      },
    });
  });

  describe("auth flow", () => {
    it("should handle complete login flow", async () => {
      mockAuthApi.login.mockResolvedValueOnce(mockUser);

      const state1 = store.getState();
      expect(state1.auth.user).toBeNull();

      await store.dispatch(
        loginThunk({
          email: "test@example.com",
          password: "password123",
        }) as any,
      );

      const state2 = store.getState();
      expect(state2.auth.user).toEqual(mockUser);
      expect(state2.auth.error).toBeNull();
    });

    it("should handle login error", async () => {
      const errorMessage = "Invalid credentials";
      mockAuthApi.login.mockRejectedValueOnce(new Error(errorMessage));

      await store.dispatch(
        loginThunk({ email: "test@example.com", password: "wrong" }) as any,
      );

      const state = store.getState();
      expect(state.auth.user).toBeNull();
      expect(state.auth.error).toBe(errorMessage);
    });

    it("should handle logout", async () => {
      mockAuthApi.login.mockResolvedValueOnce(mockUser);
      mockAuthApi.logout.mockResolvedValueOnce(undefined);

      await store.dispatch(
        loginThunk({
          email: "test@example.com",
          password: "password123",
        }) as any,
      );
      let state = store.getState();
      expect(state.auth.user).toEqual(mockUser);

      await store.dispatch(logoutThunk() as any);

      state = store.getState();
      expect(state.auth.user).toBeNull();
      expect(state.auth.error).toBeNull();
    });
  });

  describe("ticket flow", () => {
    it("should handle fetch count", async () => {
      mockTicketApi.fetchGlobalCount.mockResolvedValueOnce(42);

      const state1 = store.getState();
      expect(state1.ticket.count).toBe(0);

      await store.dispatch(fetchCountThunk() as any);

      const state2 = store.getState();
      expect(state2.ticket.count).toBe(42);
    });

    it("should handle print ticket", async () => {
      mockTicketApi.fetchGlobalCount.mockResolvedValueOnce(50);
      mockAuthApi.login.mockResolvedValueOnce(mockUser);
      const updatedUser: User = {
        ...mockUser,
        printer_supplies: 99,
        tickets_contributed: 1,
        money: 1,
      };
      mockOperationsApi.printTicket.mockResolvedValueOnce(updatedUser);

      // First, login to establish user state
      await store.dispatch(
        loginThunk({
          email: "test@example.com",
          password: "password123",
        }) as any,
      );

      await store.dispatch(fetchCountThunk() as any);
      let state = store.getState();
      expect(state.ticket.count).toBe(50);

      await store.dispatch(incrementCountThunk() as any);

      state = store.getState();
      // Count should remain unchanged - it's updated via WebSocket
      expect(state.ticket.count).toBe(50);
      // Auth state should be updated with new user data
      expect(state.auth.user?.printer_supplies).toBe(99);
      expect(state.auth.user?.money).toBe(1);
    });

    it("should update count via updateCount action", () => {
      store.dispatch(updateCount(999));

      const state = store.getState();
      expect(state.ticket.count).toBe(999);
      expect(state.ticket.error).toBeNull();
    });

    it("should handle fetch error", async () => {
      const errorMessage = "Network error";
      mockTicketApi.fetchGlobalCount.mockRejectedValueOnce(
        new Error(errorMessage),
      );

      await store.dispatch(fetchCountThunk() as any);

      const state = store.getState();
      expect(state.ticket.error).toBe(errorMessage);
      expect(state.ticket.count).toBe(0);
    });
  });

  describe("error state management", () => {
    it("should set and clear global error", () => {
      store.dispatch(setError("Something went wrong"));

      let state = store.getState();
      expect(state.error.message).toBe("Something went wrong");
      expect(state.error.timestamp).not.toBeNull();

      store.dispatch(clearError());

      state = store.getState();
      expect(state.error.message).toBeNull();
      expect(state.error.timestamp).toBeNull();
    });
  });

  describe("concurrent operations", () => {
    it("should handle login and fetch count concurrently", async () => {
      mockAuthApi.login.mockResolvedValueOnce(mockUser);
      mockTicketApi.fetchGlobalCount.mockResolvedValueOnce(100);

      await Promise.all([
        store.dispatch(
          loginThunk({
            email: "test@example.com",
            password: "password123",
          }) as any,
        ),
        store.dispatch(fetchCountThunk() as any),
      ]);

      const state = store.getState();
      expect(state.auth.user).toEqual(mockUser);
      expect(state.ticket.count).toBe(100);
    });
  });

  describe("state immutability", () => {
    it("should not mutate previous state on updates", () => {
      const state1 = store.getState();
      const auth1 = state1.auth;
      const ticket1 = state1.ticket;

      store.dispatch(updateCount(50));

      const state2 = store.getState();
      const ticket2 = state2.ticket;
      const auth2 = state2.auth;

      expect(auth2).toBe(auth1);
      expect(ticket2).not.toBe(ticket1);
    });
  });

  describe("checkAuth and signup flow", () => {
    it("should handle checkAuth success", async () => {
      mockAuthApi.getCurrentUser.mockResolvedValueOnce(mockUser);

      await store.dispatch(checkAuthThunk() as any);

      const state = store.getState();
      expect(state.auth.user).toEqual(mockUser);
      expect(state.auth.isCheckingAuth).toBe(false);
      expect(state.auth.error).toBeNull();
    });

    it("should handle checkAuth failure", async () => {
      const errorMessage = "Not authenticated";
      mockAuthApi.getCurrentUser.mockRejectedValueOnce(new Error(errorMessage));

      await store.dispatch(checkAuthThunk() as any);

      const state = store.getState();
      expect(state.auth.user).toBeNull();
      expect(state.auth.isCheckingAuth).toBe(false);
      expect(state.auth.error).toBe(errorMessage);
    });

    it("should handle complete signup flow", async () => {
      mockAuthApi.register.mockResolvedValueOnce(mockUser);

      await store.dispatch(
        signupThunk({
          email: "newuser@example.com",
          password: "password123",
        }) as any,
      );

      const state = store.getState();
      expect(state.auth.user).toEqual(mockUser);
      expect(state.auth.error).toBeNull();
    });

    it("should handle signup error", async () => {
      const errorMessage = "Email already exists";
      mockAuthApi.register.mockRejectedValueOnce(new Error(errorMessage));

      await store.dispatch(
        signupThunk({
          email: "test@example.com",
          password: "password123",
        }) as any,
      );

      const state = store.getState();
      expect(state.auth.user).toBeNull();
      expect(state.auth.error).toBe(errorMessage);
    });
  });

  describe("shop operations", () => {
    beforeEach(async () => {
      mockAuthApi.login.mockResolvedValueOnce(mockUser);
      await store.dispatch(
        loginThunk({
          email: "test@example.com",
          password: "password123",
        }) as any,
      );
    });

    it("should handle buy supplies", async () => {
      const updatedUser: User = {
        ...mockUser,
        printer_supplies: 150,
        money: 50,
      };
      mockOperationsApi.buySupplies.mockResolvedValueOnce(updatedUser);

      await store.dispatch(buySuppliesThunk() as any);

      const state = store.getState();
      expect(state.auth.user?.printer_supplies).toBe(150);
      expect(state.auth.user?.money).toBe(50);
      expect(state.auth.error).toBeNull();
    });

    it("should handle buy supplies error", async () => {
      const errorMessage = "Not enough money";
      mockOperationsApi.buySupplies.mockRejectedValueOnce(
        new Error(errorMessage),
      );

      await store.dispatch(buySuppliesThunk() as any);

      const state = store.getState();
      expect(state.auth.error).toBe(errorMessage);
    });

    it("should handle buy gold", async () => {
      const updatedUser: User = {
        ...mockUser,
        gold: 10,
        money: 0,
      };
      mockOperationsApi.buyGold.mockResolvedValueOnce(updatedUser);

      await store.dispatch(buyGoldThunk(10) as any);

      const state = store.getState();
      expect(state.auth.user?.gold).toBe(10);
      expect(state.auth.user?.money).toBe(0);
      expect(state.auth.error).toBeNull();
    });

    it("should handle buy gold error", async () => {
      const errorMessage = "Invalid quantity";
      mockOperationsApi.buyGold.mockRejectedValueOnce(new Error(errorMessage));

      await store.dispatch(buyGoldThunk(5) as any);

      const state = store.getState();
      expect(state.auth.error).toBe(errorMessage);
    });

    it("should handle buy auto-buy supplies", async () => {
      const updatedUser: User = {
        ...mockUser,
        auto_buy_supplies_purchased: true,
        gold: 5,
      };
      mockOperationsApi.buyAutoBuySupplies.mockResolvedValueOnce(updatedUser);

      await store.dispatch(buyAutoBuySuppliesThunk() as any);

      const state = store.getState();
      expect(state.auth.user?.auto_buy_supplies_purchased).toBe(true);
      expect(state.auth.user?.gold).toBe(5);
      expect(state.auth.error).toBeNull();
    });

    it("should handle buy autoprinter", async () => {
      const updatedUser: User = {
        ...mockUser,
        autoprinters: 1,
        gold: 0,
      };
      mockOperationsApi.buyAutoprinter.mockResolvedValueOnce(updatedUser);

      await store.dispatch(buyAutoprinterThunk() as any);

      const state = store.getState();
      expect(state.auth.user?.autoprinters).toBe(1);
      expect(state.auth.user?.gold).toBe(0);
      expect(state.auth.error).toBeNull();
    });
  });

  describe("resource update actions", () => {
    beforeEach(async () => {
      mockAuthApi.login.mockResolvedValueOnce(mockUser);
      await store.dispatch(
        loginThunk({
          email: "test@example.com",
          password: "password123",
        }) as any,
      );
    });

    it("should update supplies", () => {
      store.dispatch(updateSupplies(200));

      const state = store.getState();
      expect(state.auth.user?.printer_supplies).toBe(200);
    });

    it("should update money", () => {
      store.dispatch(updateMoney(500));

      const state = store.getState();
      expect(state.auth.user?.money).toBe(500);
    });

    it("should update gold", () => {
      store.dispatch(updateGold(25));

      const state = store.getState();
      expect(state.auth.user?.gold).toBe(25);
    });

    it("should update autoprinters", () => {
      store.dispatch(updateAutoprinters(3));

      const state = store.getState();
      expect(state.auth.user?.autoprinters).toBe(3);
    });

    it("should handle multiple resource updates", () => {
      store.dispatch(updateSupplies(75));
      store.dispatch(updateMoney(250));
      store.dispatch(updateGold(15));
      store.dispatch(updateAutoprinters(2));

      const state = store.getState();
      expect(state.auth.user?.printer_supplies).toBe(75);
      expect(state.auth.user?.money).toBe(250);
      expect(state.auth.user?.gold).toBe(15);
      expect(state.auth.user?.autoprinters).toBe(2);
    });
  });

  describe("loading states", () => {
    it("should track auth loading state during login", async () => {
      mockAuthApi.login.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockUser), 50);
          }),
      );

      const promise = store.dispatch(
        loginThunk({
          email: "test@example.com",
          password: "password123",
        }) as any,
      );

      const loadingState = store.getState();
      expect(loadingState.auth.isLoading).toBe(true);
      expect(loadingState.auth.pendingRequestCount).toBe(1);

      await promise;

      const finishedState = store.getState();
      expect(finishedState.auth.isLoading).toBe(false);
      expect(finishedState.auth.pendingRequestCount).toBe(0);
    });

    it("should track ticket loading state during fetch", async () => {
      mockTicketApi.fetchGlobalCount.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(42), 50);
          }),
      );

      const promise = store.dispatch(fetchCountThunk() as any);

      const loadingState = store.getState();
      expect(loadingState.ticket.isLoading).toBe(true);
      expect(loadingState.ticket.pendingRequestCount).toBe(1);

      await promise;

      const finishedState = store.getState();
      expect(finishedState.ticket.isLoading).toBe(false);
      expect(finishedState.ticket.pendingRequestCount).toBe(0);
    });

    it("should handle multiple concurrent requests", async () => {
      mockAuthApi.login.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockUser), 50);
          }),
      );
      mockOperationsApi.buySupplies.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(mockUser), 50);
          }),
      );

      const promise1 = store.dispatch(
        loginThunk({
          email: "test@example.com",
          password: "password123",
        }) as any,
      );
      const promise2 = store.dispatch(buySuppliesThunk() as any);

      const loadingState = store.getState();
      expect(loadingState.auth.isLoading).toBe(true);
      expect(loadingState.auth.pendingRequestCount).toBe(2);

      await Promise.all([promise1, promise2]);

      const finishedState = store.getState();
      expect(finishedState.auth.isLoading).toBe(false);
      expect(finishedState.auth.pendingRequestCount).toBe(0);
    });
  });

  describe("ticket error handling", () => {
    beforeEach(async () => {
      mockAuthApi.login.mockResolvedValueOnce(mockUser);
      await store.dispatch(
        loginThunk({
          email: "test@example.com",
          password: "password123",
        }) as any,
      );
    });

    it("should handle print ticket error", async () => {
      const errorMessage = "Not enough supplies";
      mockOperationsApi.printTicket.mockRejectedValueOnce(
        new Error(errorMessage),
      );

      await store.dispatch(incrementCountThunk() as any);

      const state = store.getState();
      expect(state.ticket.error).toBe(errorMessage);
    });

    it("should clear ticket error", () => {
      store.dispatch(clearTicketError());

      const state = store.getState();
      expect(state.ticket.error).toBeNull();
    });

    it("should clear error on successful fetch", async () => {
      // First cause an error
      mockTicketApi.fetchGlobalCount.mockRejectedValueOnce(
        new Error("Network error"),
      );
      await store.dispatch(fetchCountThunk() as any);

      let state = store.getState();
      expect(state.ticket.error).toBe("Network error");

      // Then succeed
      mockTicketApi.fetchGlobalCount.mockResolvedValueOnce(100);
      await store.dispatch(fetchCountThunk() as any);

      state = store.getState();
      expect(state.ticket.error).toBeNull();
      expect(state.ticket.count).toBe(100);
    });
  });

  describe("complex sequential operations", () => {
    it("should handle logout and re-login", async () => {
      mockAuthApi.login.mockResolvedValueOnce(mockUser);
      mockAuthApi.logout.mockResolvedValueOnce(undefined);

      // First login
      await store.dispatch(
        loginThunk({
          email: "test@example.com",
          password: "password123",
        }) as any,
      );
      let state = store.getState();
      expect(state.auth.user).toEqual(mockUser);

      // Logout
      await store.dispatch(logoutThunk() as any);
      state = store.getState();
      expect(state.auth.user).toBeNull();

      // Login again
      const newUser: User = { ...mockUser, id: 2 };
      mockAuthApi.login.mockResolvedValueOnce(newUser);
      await store.dispatch(
        loginThunk({
          email: "another@example.com",
          password: "password123",
        }) as any,
      );
      state = store.getState();
      expect(state.auth.user).toEqual(newUser);
    });

    it("should handle multiple shop purchases in sequence", async () => {
      mockAuthApi.login.mockResolvedValueOnce(mockUser);
      await store.dispatch(
        loginThunk({
          email: "test@example.com",
          password: "password123",
        }) as any,
      );

      const afterSupplies: User = {
        ...mockUser,
        printer_supplies: 150,
        money: 50,
      };
      mockOperationsApi.buySupplies.mockResolvedValueOnce(afterSupplies);
      await store.dispatch(buySuppliesThunk() as any);

      let state = store.getState();
      expect(state.auth.user?.printer_supplies).toBe(150);

      const afterGold: User = {
        ...afterSupplies,
        gold: 5,
        money: 0,
      };
      mockOperationsApi.buyGold.mockResolvedValueOnce(afterGold);
      await store.dispatch(buyGoldThunk(5) as any);

      state = store.getState();
      expect(state.auth.user?.gold).toBe(5);
      expect(state.auth.user?.money).toBe(0);
    });

    it("should maintain state consistency after error then success", async () => {
      // Login fails
      mockAuthApi.login.mockRejectedValueOnce(new Error("Invalid credentials"));
      await store.dispatch(
        loginThunk({
          email: "test@example.com",
          password: "wrong",
        }) as any,
      );

      let state = store.getState();
      expect(state.auth.user).toBeNull();
      expect(state.auth.error).toBe("Invalid credentials");

      // Login succeeds
      mockAuthApi.login.mockResolvedValueOnce(mockUser);
      await store.dispatch(
        loginThunk({
          email: "test@example.com",
          password: "correct",
        }) as any,
      );

      state = store.getState();
      expect(state.auth.user).toEqual(mockUser);
      expect(state.auth.error).toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should handle updateCount with zero", () => {
      store.dispatch(updateCount(100));
      store.dispatch(updateCount(0));

      const state = store.getState();
      expect(state.ticket.count).toBe(0);
    });

    it("should handle updateCount with negative numbers", () => {
      store.dispatch(updateCount(-1));

      const state = store.getState();
      expect(state.ticket.count).toBe(-1);
    });

    it("should handle updateCount with very large numbers", () => {
      store.dispatch(updateCount(999999999));

      const state = store.getState();
      expect(state.ticket.count).toBe(999999999);
    });

    it("should handle resource updates when user is null", () => {
      // No user logged in
      store.dispatch(updateSupplies(100));

      const state = store.getState();
      expect(state.auth.user).toBeNull();
    });

    it("should handle multiple errors in sequence", () => {
      store.dispatch(setError("Error 1"));
      let state = store.getState();
      expect(state.error.message).toBe("Error 1");

      store.dispatch(setError("Error 2"));
      state = store.getState();
      expect(state.error.message).toBe("Error 2");

      store.dispatch(clearError());
      state = store.getState();
      expect(state.error.message).toBeNull();
    });
  });
});
