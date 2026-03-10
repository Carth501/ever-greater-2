import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  buyAutoBuySuppliesThunk,
  buyAutoprinterThunk,
  buyGoldThunk,
  buySuppliesThunk,
  increaseCreditCapacityThunk,
  increaseCreditGenerationThunk,
  toggleAutoBuySuppliesThunk,
} from "../store/slices/operationsSlice";

export function useOperations(onError?: (message: string) => void) {
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const buySupplies = () => {
    dispatch(buySuppliesThunk()).then((result) => {
      if (result.type === buySuppliesThunk.rejected.type) {
        onError?.(result.payload as string);
      }
    });
  };

  const buyGold = (quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 1) {
      onError?.("Invalid quantity. Must be a positive integer.");
      return;
    }
    dispatch(buyGoldThunk(quantity)).then((result) => {
      if (result.type === buyGoldThunk.rejected.type) {
        onError?.(result.payload as string);
      }
    });
  };

  const buyAutoprinter = () => {
    dispatch(buyAutoprinterThunk()).then((result) => {
      if (result.type === buyAutoprinterThunk.rejected.type) {
        onError?.(result.payload as string);
      }
    });
  };

  const buyAutoBuySupplies = () => {
    dispatch(buyAutoBuySuppliesThunk()).then((result) => {
      if (result.type === buyAutoBuySuppliesThunk.rejected.type) {
        onError?.(result.payload as string);
      }
    });
  };

  const toggleAutoBuySupplies = (active: boolean) => {
    dispatch(toggleAutoBuySuppliesThunk(active)).then((result) => {
      if (result.type === toggleAutoBuySuppliesThunk.rejected.type) {
        onError?.(result.payload as string);
      }
    });
  };

  const increaseCreditGeneration = () => {
    dispatch(increaseCreditGenerationThunk()).then((result) => {
      if (result.type === increaseCreditGenerationThunk.rejected.type) {
        onError?.(result.payload as string);
      }
    });
  };

  const increaseCreditCapacity = () => {
    dispatch(increaseCreditCapacityThunk()).then((result) => {
      if (result.type === increaseCreditCapacityThunk.rejected.type) {
        onError?.(result.payload as string);
      }
    });
  };

  return {
    isLoading,
    error,
    buySupplies,
    buyGold,
    buyAutoprinter,
    buyAutoBuySupplies,
    toggleAutoBuySupplies,
    increaseCreditGeneration,
    increaseCreditCapacity,
  };
}
