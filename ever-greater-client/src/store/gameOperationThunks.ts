import { createAsyncThunk } from "@reduxjs/toolkit";
import type { User } from "../api/auth";
import { getApiErrorInfo } from "../api/client";
import * as operationsApi from "../api/operations";

function createGameOperationThunk<Arg = void>(
  typePrefix: string,
  execute: (arg: Arg) => Promise<User>,
  fallbackMessage: string,
) {
  return createAsyncThunk(typePrefix, async (arg: Arg, { rejectWithValue }) => {
    try {
      return await execute(arg);
    } catch (error) {
      return rejectWithValue(getApiErrorInfo(error, fallbackMessage));
    }
  });
}

export const buySuppliesThunk = createGameOperationThunk(
  "operations/buySupplies",
  () => operationsApi.buySupplies(),
  "Failed to buy supplies",
);

export const buyGoldThunk = createGameOperationThunk(
  "operations/buyGold",
  (quantity: number) => operationsApi.buyGold(quantity),
  "Failed to buy gold",
);

export const buyAutoBuySuppliesThunk = createGameOperationThunk(
  "operations/buyAutoBuySupplies",
  () => operationsApi.buyAutoBuySupplies(),
  "Failed to unlock auto-buy supplies",
);

export const buyAutoprinterThunk = createGameOperationThunk(
  "operations/buyAutoprinter",
  () => operationsApi.buyAutoprinter(),
  "Failed to buy autoprinter",
);

export const increaseCreditGenerationThunk = createGameOperationThunk(
  "operations/increaseCreditGeneration",
  () => operationsApi.increaseCreditGeneration(),
  "Failed to increase credit generation",
);

export const increaseSuppliesBatchThunk = createGameOperationThunk(
  "operations/increaseSuppliesBatch",
  () => operationsApi.increaseSuppliesBatch(),
  "Failed to increase supplies batch size",
);

export const increaseCreditCapacityThunk = createGameOperationThunk(
  "operations/increaseCreditCapacity",
  () => operationsApi.increaseCreditCapacity(),
  "Failed to increase credit capacity",
);

export const toggleAutoBuySuppliesThunk = createGameOperationThunk(
  "operations/toggleAutoBuySupplies",
  (active: boolean) => operationsApi.toggleAutoBuySupplies(active),
  "Failed to toggle auto-buy supplies",
);

export const printTicketThunk = createGameOperationThunk(
  "operations/printTicket",
  () => operationsApi.printTicket(),
  "Failed to print ticket",
);
