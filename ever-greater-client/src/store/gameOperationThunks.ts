import { createAsyncThunk, type AsyncThunk } from "@reduxjs/toolkit";
import {
  AutoBuyScaleMode,
  type ConfigureAutoBuyParams,
} from "ever-greater-shared";
import type { User } from "../api/auth";
import { getApiErrorInfo } from "../api/client";
import * as operationsApi from "../api/operations";

type GameOperationRejectValue = ReturnType<typeof getApiErrorInfo>;

type GameOperationConfig<Arg = void> = {
  typePrefix: string;
  execute: (arg: Arg) => Promise<User>;
  fallbackMessage: string;
  tracksOperationsState?: boolean;
  mergesIntoAuthUser?: boolean;
  exposeInOperationsHook?: boolean;
  validate?: (arg: Arg) => string | null;
};

type GameOperationConfigs = Record<string, GameOperationConfig<any>>;

type GameOperationThunk<Arg = void> = AsyncThunk<
  User,
  Arg,
  { rejectValue: GameOperationRejectValue }
>;

type GameOperationThunks<TConfigs extends GameOperationConfigs> = {
  [K in keyof TConfigs]: TConfigs[K] extends GameOperationConfig<infer Arg>
    ? GameOperationThunk<Arg>
    : never;
};

function createGameOperationThunk<Arg = void>(
  typePrefix: string,
  execute: (arg: Arg) => Promise<User>,
  fallbackMessage: string,
) {
  return createAsyncThunk<User, Arg, { rejectValue: GameOperationRejectValue }>(
    typePrefix,
    async (arg, { rejectWithValue }) => {
      try {
        return await execute(arg);
      } catch (error) {
        return rejectWithValue(getApiErrorInfo(error, fallbackMessage));
      }
    },
  );
}

function createGameOperationThunks<TConfigs extends GameOperationConfigs>(
  configs: TConfigs,
): GameOperationThunks<TConfigs> {
  return Object.fromEntries(
    Object.entries(configs).map(([name, config]) => [
      name,
      createGameOperationThunk(
        config.typePrefix,
        config.execute,
        config.fallbackMessage,
      ),
    ]),
  ) as GameOperationThunks<TConfigs>;
}

function defineGameOperationConfig<
  Arg = void,
  T extends GameOperationConfig<Arg> = GameOperationConfig<Arg>,
>(config: T): T & GameOperationConfig<Arg> {
  return config;
}

const invalidQuantityMessage = "Invalid quantity. Must be a positive integer.";
const invalidThresholdMessage = "Threshold must be a non-negative number.";
const invalidAutoBuyScaleMessage =
  "Custom auto-buy scale requires a numeric value.";

const gameOperationConfigs = {
  buySupplies: defineGameOperationConfig({
    typePrefix: "operations/buySupplies",
    execute: () => operationsApi.buySupplies(),
    fallbackMessage: "Failed to buy supplies",
    tracksOperationsState: true,
    mergesIntoAuthUser: true,
    exposeInOperationsHook: true,
  }),
  buyGold: defineGameOperationConfig<number>({
    typePrefix: "operations/buyGold",
    execute: (quantity: number) => operationsApi.buyGold(quantity),
    fallbackMessage: "Failed to buy gold",
    tracksOperationsState: true,
    mergesIntoAuthUser: true,
    exposeInOperationsHook: true,
    validate: (quantity: number) =>
      !Number.isInteger(quantity) || quantity < 1
        ? invalidQuantityMessage
        : null,
  }),
  buyGem: defineGameOperationConfig({
    typePrefix: "operations/buyGem",
    execute: () => operationsApi.buyGem(),
    fallbackMessage: "Failed to buy gem",
    tracksOperationsState: true,
    mergesIntoAuthUser: true,
    exposeInOperationsHook: true,
  }),
  buyAutoBuySupplies: defineGameOperationConfig({
    typePrefix: "operations/buyAutoBuySupplies",
    execute: () => operationsApi.buyAutoBuySupplies(),
    fallbackMessage: "Failed to unlock auto-buy supplies",
    tracksOperationsState: true,
    mergesIntoAuthUser: true,
    exposeInOperationsHook: true,
  }),
  buyAutoprinter: defineGameOperationConfig({
    typePrefix: "operations/buyAutoprinter",
    execute: () => operationsApi.buyAutoprinter(),
    fallbackMessage: "Failed to buy autoprinter",
    tracksOperationsState: true,
    mergesIntoAuthUser: true,
    exposeInOperationsHook: true,
  }),
  increaseCreditGeneration: defineGameOperationConfig({
    typePrefix: "operations/increaseCreditGeneration",
    execute: () => operationsApi.increaseCreditGeneration(),
    fallbackMessage: "Failed to increase credit generation",
    tracksOperationsState: true,
    mergesIntoAuthUser: true,
    exposeInOperationsHook: true,
  }),
  increaseTicketBatch: defineGameOperationConfig({
    typePrefix: "operations/increaseTicketBatch",
    execute: () => operationsApi.increaseTicketBatch(),
    fallbackMessage: "Failed to increase ticket batch scale",
    tracksOperationsState: true,
    mergesIntoAuthUser: true,
    exposeInOperationsHook: true,
  }),
  increaseManualPrintBatch: defineGameOperationConfig({
    typePrefix: "operations/increaseManualPrintBatch",
    execute: () => operationsApi.increaseManualPrintBatch(),
    fallbackMessage: "Failed to increase manual print batch size",
    tracksOperationsState: true,
    mergesIntoAuthUser: true,
    exposeInOperationsHook: true,
  }),
  increaseSuppliesBatch: defineGameOperationConfig({
    typePrefix: "operations/increaseSuppliesBatch",
    execute: () => operationsApi.increaseSuppliesBatch(),
    fallbackMessage: "Failed to increase supplies batch size",
    tracksOperationsState: true,
    mergesIntoAuthUser: true,
    exposeInOperationsHook: true,
  }),
  increaseCreditCapacity: defineGameOperationConfig({
    typePrefix: "operations/increaseCreditCapacity",
    execute: () => operationsApi.increaseCreditCapacity(),
    fallbackMessage: "Failed to increase credit capacity",
    tracksOperationsState: true,
    mergesIntoAuthUser: true,
    exposeInOperationsHook: true,
  }),
  toggleAutoBuySupplies: defineGameOperationConfig<boolean>({
    typePrefix: "operations/toggleAutoBuySupplies",
    execute: (active: boolean) => operationsApi.toggleAutoBuySupplies(active),
    fallbackMessage: "Failed to toggle auto-buy supplies",
    tracksOperationsState: true,
    mergesIntoAuthUser: true,
    exposeInOperationsHook: true,
  }),
  configureAutoBuy: defineGameOperationConfig<ConfigureAutoBuyParams>({
    typePrefix: "operations/configureAutoBuy",
    execute: (params: ConfigureAutoBuyParams) =>
      operationsApi.configureAutoBuy(params),
    fallbackMessage: "Failed to update auto-buy settings",
    tracksOperationsState: true,
    mergesIntoAuthUser: true,
    exposeInOperationsHook: true,
    validate: (params: ConfigureAutoBuyParams) => {
      if (!Number.isFinite(params.threshold) || params.threshold < 0) {
        return invalidThresholdMessage;
      }

      if (
        (params.scaleMode === AutoBuyScaleMode.CUSTOM_VALUE ||
          params.scaleMode === AutoBuyScaleMode.CUSTOM_PERCENT) &&
        (typeof params.scaleValue !== "number" ||
          !Number.isFinite(params.scaleValue))
      ) {
        return invalidAutoBuyScaleMessage;
      }

      return null;
    },
  }),
  printTicket: defineGameOperationConfig({
    typePrefix: "operations/printTicket",
    execute: () => operationsApi.printTicket(),
    fallbackMessage: "Failed to print ticket",
    mergesIntoAuthUser: true,
  }),
} as const;

const gameOperationThunks = createGameOperationThunks(gameOperationConfigs);

type GameOperationName = keyof typeof gameOperationConfigs;

type OperationsHookName = {
  [K in GameOperationName]: (typeof gameOperationConfigs)[K]["exposeInOperationsHook"] extends true
    ? K
    : never;
}[GameOperationName];

export type OperationHookDefinitions = {
  [K in OperationsHookName]: {
    thunk: (typeof gameOperationThunks)[K];
    validate?: (typeof gameOperationConfigs)[K]["validate"];
  };
};

function selectGameOperationThunks(
  predicate: (
    name: GameOperationName,
    config: (typeof gameOperationConfigs)[GameOperationName],
  ) => boolean,
): GameOperationThunk<any>[] {
  return (Object.keys(gameOperationConfigs) as GameOperationName[])
    .filter((name) => predicate(name, gameOperationConfigs[name]))
    .map((name) => gameOperationThunks[name]);
}

export const buySuppliesThunk = gameOperationThunks.buySupplies;
export const buyGoldThunk = gameOperationThunks.buyGold;
export const buyGemThunk = gameOperationThunks.buyGem;
export const buyAutoBuySuppliesThunk = gameOperationThunks.buyAutoBuySupplies;
export const buyAutoprinterThunk = gameOperationThunks.buyAutoprinter;
export const increaseCreditGenerationThunk =
  gameOperationThunks.increaseCreditGeneration;
export const increaseTicketBatchThunk = gameOperationThunks.increaseTicketBatch;
export const increaseManualPrintBatchThunk =
  gameOperationThunks.increaseManualPrintBatch;
export const increaseSuppliesBatchThunk =
  gameOperationThunks.increaseSuppliesBatch;
export const increaseCreditCapacityThunk =
  gameOperationThunks.increaseCreditCapacity;
export const toggleAutoBuySuppliesThunk =
  gameOperationThunks.toggleAutoBuySupplies;
export const configureAutoBuyThunk = gameOperationThunks.configureAutoBuy;
export const printTicketThunk = gameOperationThunks.printTicket;

export const operationsStateThunks = selectGameOperationThunks(
  (_name, config) => config.tracksOperationsState === true,
);

export const userUpdateThunks = selectGameOperationThunks(
  (_name, config) => config.mergesIntoAuthUser === true,
);

export const operationsStatePendingActions = operationsStateThunks.map(
  (thunk) => thunk.pending,
);

export const operationsStateFulfilledActions = operationsStateThunks.map(
  (thunk) => thunk.fulfilled,
);

export const operationsStateRejectedActions = operationsStateThunks.map(
  (thunk) => thunk.rejected,
);

export const userUpdateFulfilledActions = userUpdateThunks.map(
  (thunk) => thunk.fulfilled,
);

export const operationHookDefinitions = Object.fromEntries(
  (Object.keys(gameOperationConfigs) as GameOperationName[])
    .filter((name) => gameOperationConfigs[name].exposeInOperationsHook)
    .map((name) => [
      name,
      {
        thunk: gameOperationThunks[name],
        validate: gameOperationConfigs[name].validate,
      },
    ]),
) as OperationHookDefinitions;
