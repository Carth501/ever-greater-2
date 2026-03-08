import { useEffect, useRef, useState } from "react";

/**
 * Custom hook that animates a number value smoothly.
 * Moves at a rate of 50% of the remaining difference per second (rounded up).
 *
 * @param targetValue - The target number to animate towards
 * @returns The current animated value to display
 *
 * @example
 * const displayValue = useAnimatedNumber(ticketCount);
 * return <div>{displayValue.toLocaleString()}</div>;
 */
export function useAnimatedNumber(
  targetValue: number,
  decimalPlaces = 0,
): number {
  const [displayValue, setDisplayValue] = useState<number>(targetValue);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const currentValueRef = useRef(targetValue);
  const hasAnimatedRef = useRef(false);

  // Keep currentValueRef in sync with displayValue
  useEffect(() => {
    currentValueRef.current = displayValue;
  }, [displayValue]);

  useEffect(() => {
    // If target changed, reset the animation
    lastTimeRef.current = null;

    // For the very first significant change, skip animation (instant load)
    // This handles the common pattern of initial state = 0, then loads real data
    if (
      !hasAnimatedRef.current &&
      Math.abs(targetValue - displayValue) >= 0.5
    ) {
      setDisplayValue(targetValue);
      currentValueRef.current = targetValue;
      hasAnimatedRef.current = true;
      return;
    }

    const animate = (currentTime: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = currentTime;
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      const current = currentValueRef.current;
      const difference = targetValue - current;

      // Stop animating if we're close enough (within 0.5)
      if (Math.abs(difference) < 0.5) {
        setDisplayValue(targetValue);
        currentValueRef.current = targetValue;
        animationFrameRef.current = null;
        return;
      }

      // Calculate how much to move based on 50% per second decay
      // Formula: move by (1 - 0.5^(deltaTime/1000)) of the remaining difference
      const decayFactor = Math.pow(0.5, deltaTime / 1000);
      const moveAmount = difference * (1 - decayFactor);

      // Round up the absolute movement to ensure progress on small values
      const roundedMove =
        (Math.sign(moveAmount) *
          Math.ceil(Math.abs(moveAmount) * Math.pow(10, decimalPlaces))) /
        Math.pow(10, decimalPlaces);

      const newValue = current + roundedMove;
      setDisplayValue(newValue);
      currentValueRef.current = newValue;

      // Check if we've reached the target after this update
      const newDifference = targetValue - newValue;
      if (Math.abs(newDifference) < 0.5) {
        // We're close enough, set to exact target on next frame
        animationFrameRef.current = requestAnimationFrame(() => {
          setDisplayValue(targetValue);
          currentValueRef.current = targetValue;
        });
      } else {
        // Continue animating
        animationFrameRef.current = requestAnimationFrame(animate);
      }
    };

    // Start animation if we're not at the target
    if (Math.abs(targetValue - displayValue) >= 0.5) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      // Already at target, just set it
      setDisplayValue(targetValue);
    }

    // Cleanup function
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [targetValue]); // Re-run effect when target changes

  return displayValue;
}
