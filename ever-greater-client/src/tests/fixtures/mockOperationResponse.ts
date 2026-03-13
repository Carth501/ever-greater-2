import type { OperationId, User } from "ever-greater-shared";
import { OperationId as OperationIds } from "ever-greater-shared";
import { mockUser } from "./mockUser";

export interface MockOperationResponse {
  operationId: string;
  cost: Record<string, number>;
  gain: Record<string, number>;
  count: number | null;
  user: User;
}

export function mockOperationResponse(
  overrides: Partial<MockOperationResponse> & {
    operationId?: OperationId;
  } = {},
): MockOperationResponse {
  return {
    operationId: overrides.operationId ?? OperationIds.PRINT_TICKET,
    cost: overrides.cost ?? {},
    gain: overrides.gain ?? {},
    count: overrides.count ?? null,
    user: overrides.user ?? mockUser(),
  };
}
