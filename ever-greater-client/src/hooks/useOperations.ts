import { formatApiErrorForDisplay, type ApiErrorInfo } from "../api/client";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import {
  buyAutoBuySuppliesThunk,
  buyAutoprinterThunk,
  buyGoldThunk,
  buySuppliesThunk,
  increaseCreditCapacityThunk,
  increaseCreditGenerationThunk,
  increaseManualPrintBatchThunk,
  increaseSuppliesBatchThunk,
  toggleAutoBuySuppliesThunk,
} from "../store/slices/operationsSlice";

export function useOperations(onError?: (message: string) => void) {
  const dispatch = useAppDispatch();
  const { isLoading, error, errorCode, errorDetail } = useAppSelector(
    (state) => state.operations,
  );

  const notifyRejected = (payload: unknown) => {
    const displayMessage = formatApiErrorForDisplay(
      payload as ApiErrorInfo | null | undefined,
    );
    if (displayMessage) {
      onError?.(displayMessage);
    }
  };

  const buySupplies = () => {
    dispatch(buySuppliesThunk()).then((result) => {
      if (result.type === buySuppliesThunk.rejected.type) {
        notifyRejected(result.payload);
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
        notifyRejected(result.payload);
      }
    });
  };

  const buyAutoprinter = () => {
    dispatch(buyAutoprinterThunk()).then((result) => {
      if (result.type === buyAutoprinterThunk.rejected.type) {
        notifyRejected(result.payload);
      }
    });
  };

  const buyAutoBuySupplies = () => {
    dispatch(buyAutoBuySuppliesThunk()).then((result) => {
      if (result.type === buyAutoBuySuppliesThunk.rejected.type) {
        notifyRejected(result.payload);
      }
    });
  };

  const toggleAutoBuySupplies = (active: boolean) => {
    dispatch(toggleAutoBuySuppliesThunk(active)).then((result) => {
      if (result.type === toggleAutoBuySuppliesThunk.rejected.type) {
        notifyRejected(result.payload);
      }
    });
  };

  const increaseCreditGeneration = () => {
    dispatch(increaseCreditGenerationThunk()).then((result) => {
      if (result.type === increaseCreditGenerationThunk.rejected.type) {
        notifyRejected(result.payload);
      }
    });
  };

  const increaseManualPrintBatch = () => {
    dispatch(increaseManualPrintBatchThunk()).then((result) => {
      if (result.type === increaseManualPrintBatchThunk.rejected.type) {
        notifyRejected(result.payload);
      }
    });
  };

  const increaseSuppliesBatch = () => {
    dispatch(increaseSuppliesBatchThunk()).then((result) => {
      if (result.type === increaseSuppliesBatchThunk.rejected.type) {
        notifyRejected(result.payload);
      }
    });
  };

  const increaseCreditCapacity = () => {
    dispatch(increaseCreditCapacityThunk()).then((result) => {
      if (result.type === increaseCreditCapacityThunk.rejected.type) {
        notifyRejected(result.payload);
      }
    });
  };

  return {
    isLoading,
    error,
    errorCode,
    errorDetail,
    buySupplies,
    buyGold,
    buyAutoprinter,
    buyAutoBuySupplies,
    toggleAutoBuySupplies,
    increaseCreditGeneration,
    increaseManualPrintBatch,
    increaseSuppliesBatch,
    increaseCreditCapacity,
  };
}
