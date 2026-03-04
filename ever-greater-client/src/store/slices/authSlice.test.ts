import { configureStore } from "@reduxjs/toolkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { User } from "../../api/auth";
import * as authApi from "../../api/auth";
import * as operationsApi from "../../api/operations";
import authReducer, {
  AuthState,
  applyUserUpdate,
  buyGoldThunk,
  buySuppliesThunk,
  checkAuthThunk,
  clearError,
  loginThunk,
  logoutThunk,
  signupThunk,
  updateSupplies,
} from "./authSlice";

vi.mock("../../api/auth");
vi.mock("../../api/operations");

const mockAuthApi = authApi as any;
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
};

describe("authSlice", () => {
  const initialState: AuthState = {
    user: null,
    isCheckingAuth: true,
    isLoading: false,
    error: null,
  };

  describe("reducers", () => {
    it("should clear error", () => {
      const state: AuthState = {
        user: null,
        isCheckingAuth: false,
        isLoading: false,
        error: "Some error",
      };

      const newState = authReducer(state, clearError());
      expect(newState.error).toBeNull();
    });

    it("should update supplies when user exists", () => {
      const state: AuthState = {
        user: mockUser,
        isCheckingAuth: false,
        isLoading: false,
        error: null,
      };

      const newState = authReducer(state, updateSupplies(75));
      expect(newState.user?.printer_supplies).toBe(75);
    });

    it("should not crash when updating supplies with no user", () => {
      const state: AuthState = {
        user: null,
        isCheckingAuth: false,
        isLoading: false,
        error: null,
      };

      const newState = authReducer(state, updateSupplies(75));
      expect(newState.user).toBeNull();
    });
  });

  describe("thunks with store", () => {
    let store: ReturnType<typeof configureStore>;

    beforeEach(() => {
      store = configureStore({
        reducer: { auth: authReducer },
      });
      vi.clearAllMocks();
    });

    it("should handle successful auth check", async () => {
      mockAuthApi.getCurrentUser.mockResolvedValueOnce(mockUser);
      await store.dispatch(checkAuthThunk() as any);

      const state = (store.getState() as { auth: AuthState }).auth;
      expect(state.isCheckingAuth).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(state.error).toBeNull();
    });

    it("should handle null user (not authenticated)", async () => {
      mockAuthApi.getCurrentUser.mockResolvedValueOnce(null);
      await store.dispatch(checkAuthThunk() as any);

      const state = (store.getState() as { auth: AuthState }).auth;
      expect(state.isCheckingAuth).toBe(false);
      expect(state.user).toBeNull();
    });

    it("should handle successful login", async () => {
      mockAuthApi.login.mockResolvedValueOnce(mockUser);

      const credentials = {
        email: "test@example.com",
        password: "password123",
      };
      await store.dispatch(loginThunk(credentials) as any);

      const state = (store.getState() as { auth: AuthState }).auth;
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(state.error).toBeNull();
    });

    it("should handle login failure", async () => {
      const errorMessage = "Invalid credentials";
      mockAuthApi.login.mockRejectedValueOnce(new Error(errorMessage));

      const credentials = { email: "test@example.com", password: "wrong" };
      await store.dispatch(loginThunk(credentials) as any);

      const state = (store.getState() as { auth: AuthState }).auth;
      expect(state.isLoading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBe(errorMessage);
    });

    it("should handle successful signup", async () => {
      mockAuthApi.register.mockResolvedValueOnce(mockUser);

      const credentials = {
        email: "newuser@example.com",
        password: "password123",
      };
      await store.dispatch(signupThunk(credentials) as any);

      const state = (store.getState() as { auth: AuthState }).auth;
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(state.error).toBeNull();
    });

    it("should handle successful logout", async () => {
      mockAuthApi.logout.mockResolvedValueOnce(undefined);

      const stateWithUser: AuthState = {
        user: mockUser,
        isCheckingAuth: false,
        isLoading: false,
        error: null,
      };
      store = configureStore({
        reducer: { auth: authReducer },
        preloadedState: { auth: stateWithUser },
      });

      await store.dispatch(logoutThunk() as any);

      const state = (store.getState() as { auth: AuthState }).auth;
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should preserve tickets withdrawn and credit fields when buyGold response is partial", async () => {
      const stateWithUser: AuthState = {
        user: {
          ...mockUser,
          tickets_withdrawn: 12,
          credit_value: 4,
          credit_generation_level: 3,
          credit_capacity_level: 8,
        },
        isCheckingAuth: false,
        isLoading: false,
        error: null,
      };

      store = configureStore({
        reducer: { auth: authReducer },
        preloadedState: { auth: stateWithUser },
      });

      mockOperationsApi.buyGold.mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        money: 100,
        gold: 3,
      } as unknown as User);

      await store.dispatch(buyGoldThunk(1) as any);

      const state = (store.getState() as { auth: AuthState }).auth;
      expect(state.user?.tickets_withdrawn).toBe(12);
      expect(state.user?.credit_value).toBe(4);
      expect(state.user?.credit_generation_level).toBe(3);
      expect(state.user?.credit_capacity_level).toBe(8);
    });

    it("should preserve tickets withdrawn and credit fields when buySupplies response is partial", async () => {
      const stateWithUser: AuthState = {
        user: {
          ...mockUser,
          tickets_withdrawn: 9,
          credit_value: 5,
          credit_generation_level: 2,
          credit_capacity_level: 7,
        },
        isCheckingAuth: false,
        isLoading: false,
        error: null,
      };

      store = configureStore({
        reducer: { auth: authReducer },
        preloadedState: { auth: stateWithUser },
      });

      mockOperationsApi.buySupplies.mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        printer_supplies: 300,
        gold: 2,
      } as unknown as User);

      await store.dispatch(buySuppliesThunk() as any);

      const state = (store.getState() as { auth: AuthState }).auth;
      expect(state.user?.tickets_withdrawn).toBe(9);
      expect(state.user?.credit_value).toBe(5);
      expect(state.user?.credit_generation_level).toBe(2);
      expect(state.user?.credit_capacity_level).toBe(7);
    });
  });

  describe("reducer state updates", () => {
    it("should set isCheckingAuth to false on checkAuthThunk.fulfilled", () => {
      const state = authReducer(
        initialState,
        checkAuthThunk.fulfilled(mockUser, ""),
      );
      expect(state.isCheckingAuth).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(state.error).toBeNull();
    });

    it("should set isCheckingAuth to false on checkAuthThunk.rejected", () => {
      const state = authReducer(
        initialState,
        checkAuthThunk.rejected(null, "", undefined, "Auth failed"),
      );
      expect(state.isCheckingAuth).toBe(false);
      expect(state.user).toBeNull();
      expect(state.error).toBe("Auth failed");
    });

    it("should set isLoading on loginThunk.pending", () => {
      const state = authReducer(
        initialState,
        loginThunk.pending("", { email: "", password: "" }),
      );
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it("should set user on loginThunk.fulfilled", () => {
      const state = authReducer(
        initialState,
        loginThunk.fulfilled(mockUser, "", { email: "", password: "" }),
      );
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(state.error).toBeNull();
    });

    it("should set error on loginThunk.rejected", () => {
      const state = authReducer(
        initialState,
        loginThunk.rejected(
          null,
          "",
          { email: "", password: "" },
          "Invalid credentials",
        ),
      );
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe("Invalid credentials");
    });

    it("should clear user on logoutThunk.fulfilled", () => {
      const stateWithUser: AuthState = { ...initialState, user: mockUser };
      const state = authReducer(stateWithUser, logoutThunk.fulfilled(null, ""));
      expect(state.user).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it("should apply user update with credit level fields via applyUserUpdate reducer", () => {
      const stateWithUser: AuthState = {
        ...initialState,
        user: mockUser,
      };

      const updatePayload = {
        credit_value: 150,
        credit_generation_level: 3,
        credit_capacity_level: 10,
      };

      const state = authReducer(stateWithUser, applyUserUpdate(updatePayload));

      expect(state.user?.credit_value).toBe(150);
      expect(state.user?.credit_generation_level).toBe(3);
      expect(state.user?.credit_capacity_level).toBe(10);
      // Verify other fields remain unchanged
      expect(state.user?.email).toBe(mockUser.email);
      expect(state.user?.id).toBe(mockUser.id);
    });
  });
});
