import { configureStore } from "@reduxjs/toolkit";
import type { User } from "../api/auth";
import * as authApi from "../api/auth";
import * as ticketApi from "../api/globalTicket";
import authReducer, {
  AuthState,
  loginThunk,
  logoutThunk,
} from "./slices/authSlice";
import errorReducer, {
  clearError,
  ErrorState,
  setError,
} from "./slices/errorSlice";
import ticketReducer, {
  fetchCountThunk,
  incrementCountThunk,
  TicketState,
  updateCount,
} from "./slices/ticketSlice";

jest.mock("../api/auth");
jest.mock("../api/globalTicket");

const mockAuthApi = authApi as jest.Mocked<typeof authApi>;
const mockTicketApi = ticketApi as jest.Mocked<typeof ticketApi>;

const mockUser: User = {
  id: 1,
  email: "test@example.com",
  tickets_contributed: 5,
};

type TestRootState = {
  auth: AuthState;
  ticket: TicketState;
  error: ErrorState;
};

describe("Redux Store Integration", () => {
  let store: ReturnType<typeof configureStore<TestRootState>>;

  beforeEach(() => {
    jest.clearAllMocks();
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

    it("should handle increment count", async () => {
      mockTicketApi.fetchGlobalCount.mockResolvedValueOnce(50);
      mockTicketApi.incrementGlobalCount.mockResolvedValueOnce(51);

      await store.dispatch(fetchCountThunk() as any);
      let state = store.getState();
      expect(state.ticket.count).toBe(50);

      await store.dispatch(incrementCountThunk() as any);

      state = store.getState();
      expect(state.ticket.count).toBe(51);
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
});
