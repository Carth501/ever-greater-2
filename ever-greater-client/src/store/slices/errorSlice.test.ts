import errorReducer, { clearError, ErrorState, setError } from "./errorSlice";

describe("errorSlice", () => {
  const initialState: ErrorState = {
    message: null,
    timestamp: null,
  };

  describe("reducers", () => {
    it("should set error message with timestamp", () => {
      const errorMessage = "Something went wrong";
      const state = errorReducer(initialState, setError(errorMessage));

      expect(state.message).toBe(errorMessage);
      expect(state.timestamp).not.toBeNull();
      expect(typeof state.timestamp).toBe("number");
    });

    it("should clear error message", () => {
      const stateWithError: ErrorState = {
        message: "Some error",
        timestamp: Date.now(),
      };
      const state = errorReducer(stateWithError, clearError());

      expect(state.message).toBeNull();
      expect(state.timestamp).toBeNull();
    });

    it("should update error message when setting new error", () => {
      let state: ErrorState = {
        message: "First error",
        timestamp: 1000,
      };

      const newErrorMessage = "Second error";
      state = errorReducer(state, setError(newErrorMessage));

      expect(state.message).toBe(newErrorMessage);
      expect(state.timestamp).not.toBe(1000);
    });

    it("should handle empty error message", () => {
      const state = errorReducer(initialState, setError(""));

      expect(state.message).toBe("");
      expect(state.timestamp).not.toBeNull();
    });
  });

  describe("edge cases", () => {
    it("should handle clearing already-cleared state", () => {
      const state = errorReducer(initialState, clearError());
      expect(state.message).toBeNull();
      expect(state.timestamp).toBeNull();
    });

    it("should handle very long error messages", () => {
      const longMessage = "a".repeat(1000);
      const state = errorReducer(initialState, setError(longMessage));
      expect(state.message).toBe(longMessage);
    });

    it("should handle error messages with special characters", () => {
      const specialMessage = 'Error: "Something" went <wrong> & failed!';
      const state = errorReducer(initialState, setError(specialMessage));
      expect(state.message).toBe(specialMessage);
    });
  });
});
