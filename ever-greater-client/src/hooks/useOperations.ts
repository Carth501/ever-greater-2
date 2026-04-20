import type { ConfigureAutoBuyParams } from "ever-greater-shared";
import { formatApiErrorForDisplay, type ApiErrorInfo } from "../api/client";
import { operationHookDefinitions } from "../store/gameOperationThunks";
import { useAppDispatch, useAppSelector } from "../store/hooks";

type HookOperationHandlers = {
  buySupplies: () => void;
  buyGold: (quantity: number) => void;
  buyGem: () => void;
  buyAutoprinter: () => void;
  buyAutoBuySupplies: () => void;
  toggleAutoBuySupplies: (active: boolean) => void;
  configureAutoBuy: (params: ConfigureAutoBuyParams) => void;
  increaseCreditGeneration: () => void;
  increaseTicketBatch: () => void;
  increaseManualPrintBatch: () => void;
  increaseSuppliesBatch: () => void;
  increaseCreditCapacity: () => void;
};

type OperationThunk<Arg = void> = {
  (arg: Arg): unknown;
  rejected: {
    match: (action: unknown) => action is { payload?: unknown };
  };
};

type OperationHandlerDefinition<Arg = void> = {
  thunk: OperationThunk<Arg>;
  validate?: (arg: Arg) => string | null;
};

type BoundOperationHandler<TDefinition> =
  TDefinition extends OperationHandlerDefinition<infer Arg>
    ? [Arg] extends [void]
      ? () => void
      : (arg: Arg) => void
    : never;

function bindOperationHandlers<
  TDefinitions extends Record<string, OperationHandlerDefinition<any>>,
>(
  definitions: TDefinitions,
  runOperation: <Arg>(
    definition: OperationHandlerDefinition<Arg>,
    arg: Arg,
  ) => void,
): { [K in keyof TDefinitions]: BoundOperationHandler<TDefinitions[K]> } {
  return Object.fromEntries(
    Object.entries(definitions).map(([name, definition]) => [
      name,
      (...args: unknown[]) =>
        runOperation(
          definition as OperationHandlerDefinition<unknown>,
          args[0] as unknown,
        ),
    ]),
  ) as { [K in keyof TDefinitions]: BoundOperationHandler<TDefinitions[K]> };
}

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

  const runOperation = <Arg>(
    definition: OperationHandlerDefinition<Arg>,
    arg: Arg,
  ) => {
    const validationMessage = definition.validate?.(arg);

    if (validationMessage) {
      onError?.(validationMessage);
      return;
    }

    const pendingOperation = dispatch(
      definition.thunk(arg as never) as never,
    ) as Promise<{ payload?: unknown }>;

    pendingOperation.then((result: { payload?: unknown }) => {
      if (definition.thunk.rejected.match(result)) {
        notifyRejected(result.payload);
      }
    });
  };

  const operationHandlers = bindOperationHandlers(
    operationHookDefinitions as unknown as Record<
      keyof HookOperationHandlers,
      OperationHandlerDefinition<any>
    >,
    runOperation,
  ) as HookOperationHandlers;

  return {
    isLoading,
    error,
    errorCode,
    errorDetail,
    ...operationHandlers,
  };
}
