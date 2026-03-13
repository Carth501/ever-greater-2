import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  canAfford,
  getOperationCost,
  getOperationGain,
  OperationId,
  operations,
  type ResourceAmount,
  ResourceType,
  type User,
  validateOperation,
  type WebSocketMessage,
} from "./index.js";

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: "shared@example.com",
    tickets_contributed: 1000,
    tickets_withdrawn: 0,
    printer_supplies: 500,
    money: 10000,
    gold: 100,
    autoprinters: 2,
    credit_value: 100,
    credit_generation_level: 5,
    credit_capacity_level: 100,
    auto_buy_supplies_purchased: false,
    auto_buy_supplies_active: false,
    ...overrides,
  };
}

function assertNever(value: never): never {
  throw new Error(`Unhandled websocket message: ${JSON.stringify(value)}`);
}

function handleMessage(message: WebSocketMessage): string {
  switch (message.type) {
    case "GLOBAL_COUNT_UPDATE":
      return `count:${message.count}`;
    case "USER_RESOURCE_UPDATE":
      return `user:${Object.keys(message.user_update).length}`;
    default:
      return assertNever(message);
  }
}

describe("shared operation contracts", () => {
  it.each(Object.values(OperationId))(
    "validates and applies %s",
    (operationId) => {
      const user = makeUser();
      const operation = operations[operationId];
      const params =
        operationId === OperationId.BUY_GOLD ? { quantity: 3 } : undefined;
      const globalTicketCount =
        operationId === OperationId.INCREASE_CREDIT_CAPACITY ? 1000 : undefined;

      const validation = validateOperation(
        user,
        operation,
        params,
        globalTicketCount,
      );

      expect(validation.valid).toBe(true);

      const expectedCost = getOperationCost(operation, {
        user,
        params,
        globalTicketCount,
      });
      const expectedGain = getOperationGain(operation, {
        user,
        params,
        globalTicketCount,
      });

      expect(validation.cost).toEqual(expectedCost);
      expect(validation.gain).toEqual(expectedGain);
      expect(canAfford(user, expectedCost)).toBe(true);

      const updatedUser = applyTransaction(user, expectedCost, expectedGain);

      expect(updatedUser).not.toBe(user);

      for (const [resourceType, amount] of Object.entries(
        expectedCost,
      ) as Array<[ResourceType, number]>) {
        const field = resourceField(resourceType);
        if (!field || amount === undefined) {
          continue;
        }
        expect(Number(updatedUser[field])).toBe(Number(user[field]) - amount);
      }

      for (const [resourceType, amount] of Object.entries(
        expectedGain,
      ) as Array<[ResourceType, number]>) {
        const field = resourceField(resourceType);
        if (!field || amount === undefined) {
          continue;
        }

        const startingValue =
          Number(user[field]) -
          (((expectedCost as ResourceAmount)[resourceType] ?? 0) as number);

        expect(Number(updatedUser[field])).toBe(startingValue + amount);
      }
    },
  );

  it("rejects invalid gold quantity", () => {
    const user = makeUser();

    const validation = validateOperation(
      user,
      operations[OperationId.BUY_GOLD],
      { quantity: 0 },
    );

    expect(validation.valid).toBe(false);
    expect(validation.error).toBe("Quantity must be a positive integer");
  });

  it("rejects auto-buy unlock when already purchased", () => {
    const user = makeUser({ auto_buy_supplies_purchased: true });

    const validation = validateOperation(
      user,
      operations[OperationId.AUTO_BUY_SUPPLIES],
    );

    expect(validation.valid).toBe(false);
    expect(validation.error).toBe("Auto-buy supplies already unlocked");
  });

  it("rejects credit capacity when global tickets are insufficient", () => {
    const user = makeUser();

    const validation = validateOperation(
      user,
      operations[OperationId.INCREASE_CREDIT_CAPACITY],
      undefined,
      10,
    );

    expect(validation.valid).toBe(false);
    expect(validation.error).toBe("Insufficient resources");
    expect(validation.insufficientResources).toContain(
      ResourceType.GLOBAL_TICKETS,
    );
  });
});

describe("shared websocket contracts", () => {
  it("handles every websocket message variant exhaustively", () => {
    expect(handleMessage({ type: "GLOBAL_COUNT_UPDATE", count: 42 })).toBe(
      "count:42",
    );
    expect(
      handleMessage({
        type: "USER_RESOURCE_UPDATE",
        user_update: { credit_value: 3 },
      }),
    ).toBe("user:1");
  });
});

function resourceField(resourceType: ResourceType): keyof User | null {
  switch (resourceType) {
    case ResourceType.TICKETS_CONTRIBUTED:
      return "tickets_contributed";
    case ResourceType.PRINTER_SUPPLIES:
      return "printer_supplies";
    case ResourceType.MONEY:
      return "money";
    case ResourceType.GOLD:
      return "gold";
    case ResourceType.AUTOPRINTERS:
      return "autoprinters";
    case ResourceType.CREDIT:
      return "credit_value";
    case ResourceType.CREDIT_GENERATION_LEVEL:
      return "credit_generation_level";
    case ResourceType.CREDIT_CAPACITY_LEVEL:
      return "credit_capacity_level";
    case ResourceType.GLOBAL_TICKETS:
      return null;
  }
}
