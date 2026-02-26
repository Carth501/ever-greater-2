import { configureStore } from "@reduxjs/toolkit";
import type { User } from "../../api/auth";
import * as authApi from "../../api/auth";
import authReducer, {
  AuthState,
  checkAuthThunk,
  clearError,
  loginThunk,
  logoutThunk,
  signupThunk,
  updateSupplies,
} from "./authSlice";

jest.mock("../../api/auth");

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

const mockUser: User = {
  id: 1,
  email: "test@example.com",
  tickets_contributed: 5,
  printer_supplies: 100,
  money: 0,
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
      jest.clearAllMocks();
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
  });
});
