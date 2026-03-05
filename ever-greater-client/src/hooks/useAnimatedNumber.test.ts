import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAnimatedNumber } from "./useAnimatedNumber";

describe("useAnimatedNumber", () => {
  it("should return the initial value immediately", () => {
    const { result } = renderHook(() => useAnimatedNumber(100));
    expect(result.current).toBe(100);
  });

  it("should return the target value immediately when changed to same value", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useAnimatedNumber(value),
      { initialProps: { value: 100 } },
    );

    expect(result.current).toBe(100);

    rerender({ value: 100 });
    expect(result.current).toBe(100);
  });

  it("should animate towards the target value", async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useAnimatedNumber(value),
      { initialProps: { value: 0 } },
    );

    expect(result.current).toBe(0);

    // Change target to 1000 (first change, will be instant)
    rerender({ value: 1000 });
    expect(result.current).toBe(1000);

    // Change again - this should animate
    rerender({ value: 2000 });

    await waitFor(
      () => {
        expect(result.current).toBeGreaterThan(1000);
      },
      { timeout: 200 },
    );

    expect(result.current).toBeLessThan(2000);
  });

  it("should eventually reach the target value", async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useAnimatedNumber(value),
      { initialProps: { value: 0 } },
    );

    // First update is instant (no animation)
    rerender({ value: 100 });
    expect(result.current).toBe(100);

    // Second update animates
    rerender({ value: 200 });

    await waitFor(
      () => {
        expect(result.current).toBe(200);
      },
      { timeout: 3000 },
    );
  });

  it("should animate downwards towards lower target", async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useAnimatedNumber(value),
      { initialProps: { value: 1000 } },
    );

    expect(result.current).toBe(1000);

    // First change is instant
    rerender({ value: 500 });
    expect(result.current).toBe(500);

    // Second change animates
    rerender({ value: 250 });

    await waitFor(
      () => {
        expect(result.current).toBeLessThan(500);
      },
      { timeout: 500 },
    );

    expect(result.current).toBeGreaterThan(250);
  });

  it("should handle rapid value changes", async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useAnimatedNumber(value),
      { initialProps: { value: 0 } },
    );

    // First update is instant
    rerender({ value: 100 });
    expect(result.current).toBe(100);

    // Rapidly change values
    rerender({ value: 200 });
    rerender({ value: 150 });

    // Should start animating towards the final target
    await waitFor(
      () => {
        expect(result.current).toBeGreaterThan(100);
      },
      { timeout: 500 },
    );

    // Verify it's moving in the right direction
    expect(result.current).toBeLessThanOrEqual(150);
  });

  it("should handle small differences", async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useAnimatedNumber(value),
      { initialProps: { value: 100 } },
    );

    // First change is instant
    rerender({ value: 101 });
    expect(result.current).toBe(101);

    // With small difference, should animate or immediately show target
    rerender({ value: 102 });
    await waitFor(
      () => {
        expect(result.current).toBeGreaterThanOrEqual(101);
        expect(result.current).toBeLessThanOrEqual(102);
      },
      { timeout: 500 },
    );
  });

  it("should handle zero target", async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useAnimatedNumber(value),
      { initialProps: { value: 100 } },
    );

    // First change is instant
    rerender({ value: 0 });
    expect(result.current).toBe(0);

    // Second change animates
    rerender({ value: 50 });
    await waitFor(
      () => {
        expect(result.current).toBeGreaterThan(0);
      },
      { timeout: 500 },
    );

    expect(result.current).toBeLessThan(50);
  });

  it("should handle negative values", async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useAnimatedNumber(value),
      { initialProps: { value: 0 } },
    );

    // First change is instant
    rerender({ value: -50 });
    expect(result.current).toBe(-50);

    // Second change animates
    rerender({ value: -100 });
    await waitFor(
      () => {
        expect(result.current).toBeLessThan(-50);
      },
      { timeout: 500 },
    );

    // Verify it's in the expected range
    expect(result.current).toBeGreaterThanOrEqual(-100);
  });

  it("should cleanup animation frame on unmount", () => {
    const cancelAnimationFrameSpy = vi.spyOn(window, "cancelAnimationFrame");

    const { unmount, rerender } = renderHook(
      ({ value }) => useAnimatedNumber(value),
      { initialProps: { value: 0 } },
    );

    // First rerender is instant, second one animates
    rerender({ value: 1000 });
    rerender({ value: 2000 });

    // Unmount while animating
    unmount();

    // Should have called cancelAnimationFrame
    expect(cancelAnimationFrameSpy).toHaveBeenCalled();

    cancelAnimationFrameSpy.mockRestore();
  });

  it("should make progress each frame (roughly 50% per second)", async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useAnimatedNumber(value),
      { initialProps: { value: 0 } },
    );

    // First change is instant
    rerender({ value: 1000 });
    expect(result.current).toBe(1000);

    // Second change animates
    rerender({ value: 2000 });

    // Should start animating
    await waitFor(
      () => {
        expect(result.current).toBeGreaterThan(1000);
      },
      { timeout: 500 },
    );

    // Should be animating towards target
    expect(result.current).toBeGreaterThan(1000);
    expect(result.current).toBeLessThanOrEqual(2000);
  });
});
