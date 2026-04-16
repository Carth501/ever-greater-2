import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  canAfford,
  getBuySuppliesGainForGold,
  getMaxSuppliesPurchaseGold,
  getOperationCost,
  getOperationGain,
  isUserResourceFields,
  isWebSocketMessage,
  OperationId,
  operations,
  parseWebSocketMessage,
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
    supplies_batch_level: 0,
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
      const user = makeUser(
        operationId === OperationId.TOGGLE_AUTO_BUY_SUPPLIES
          ? { auto_buy_supplies_purchased: true }
          : {},
      );
      const operation = operations[operationId];
      const params =
        operationId === OperationId.BUY_GOLD
          ? { quantity: 3 }
          : operationId === OperationId.TOGGLE_AUTO_BUY_SUPPLIES
            ? { active: false }
            : undefined;
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

  it("validates the auto-buy toggle as an operation", () => {
    const lockedUser = makeUser({ auto_buy_supplies_purchased: false });
    const unlockedUser = makeUser({ auto_buy_supplies_purchased: true });

    expect(
      validateOperation(
        lockedUser,
        operations[OperationId.TOGGLE_AUTO_BUY_SUPPLIES],
        { active: true },
      ),
    ).toMatchObject({
      valid: false,
      error: "Auto-buy supplies not unlocked",
    });

    expect(
      validateOperation(
        unlockedUser,
        operations[OperationId.TOGGLE_AUTO_BUY_SUPPLIES],
        { active: "yes" },
      ),
    ).toMatchObject({
      valid: false,
      error: "'active' boolean is required",
    });

    expect(
      validateOperation(
        unlockedUser,
        operations[OperationId.TOGGLE_AUTO_BUY_SUPPLIES],
        { active: false },
      ),
    ).toMatchObject({
      valid: true,
      cost: {},
      gain: {},
    });
  });

  it("scales supplies purchases with batch upgrades", () => {
    const oneUpgradeUser = makeUser({ supplies_batch_level: 1, gold: 10 });
    const twoUpgradeUser = makeUser({ supplies_batch_level: 2, gold: 10 });
    const partialGoldUser = makeUser({ supplies_batch_level: 2, gold: 3 });

    expect(getMaxSuppliesPurchaseGold(oneUpgradeUser)).toBe(2);
    expect(
      getOperationCost(operations[OperationId.BUY_SUPPLIES], {
        user: oneUpgradeUser,
      }),
    ).toEqual({ [ResourceType.GOLD]: 2 });
    expect(
      getOperationGain(operations[OperationId.BUY_SUPPLIES], {
        user: oneUpgradeUser,
      }),
    ).toEqual({ [ResourceType.PRINTER_SUPPLIES]: 400 });

    expect(getMaxSuppliesPurchaseGold(twoUpgradeUser)).toBe(4);
    expect(
      getOperationCost(operations[OperationId.BUY_SUPPLIES], {
        user: twoUpgradeUser,
      }),
    ).toEqual({ [ResourceType.GOLD]: 4 });
    expect(
      getOperationGain(operations[OperationId.BUY_SUPPLIES], {
        user: twoUpgradeUser,
      }),
    ).toEqual({ [ResourceType.PRINTER_SUPPLIES]: 800 });

    expect(
      getOperationCost(operations[OperationId.BUY_SUPPLIES], {
        user: partialGoldUser,
      }),
    ).toEqual({ [ResourceType.GOLD]: 3 });
    expect(
      getOperationGain(operations[OperationId.BUY_SUPPLIES], {
        user: partialGoldUser,
      }),
    ).toEqual({ [ResourceType.PRINTER_SUPPLIES]: 600 });
    expect(getBuySuppliesGainForGold(3)).toBe(600);
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

  it("validates websocket payloads at runtime", () => {
    expect(
      parseWebSocketMessage({
        type: "GLOBAL_COUNT_UPDATE",
        count: 42,
      }),
    ).toEqual({
      type: "GLOBAL_COUNT_UPDATE",
      count: 42,
    });

    expect(
      parseWebSocketMessage({
        type: "USER_RESOURCE_UPDATE",
        user_update: { credit_value: 3, auto_buy_supplies_active: true },
      }),
    ).toEqual({
      type: "USER_RESOURCE_UPDATE",
      user_update: { credit_value: 3, auto_buy_supplies_active: true },
    });

    expect(
      parseWebSocketMessage({
        type: "USER_RESOURCE_UPDATE",
        user_update: { credit_value: "3" },
      }),
    ).toBeNull();
    expect(parseWebSocketMessage({ type: "UNKNOWN" })).toBeNull();
    expect(isWebSocketMessage({ type: "GLOBAL_COUNT_UPDATE", count: 1 })).toBe(
      true,
    );
    expect(
      isUserResourceFields({
        credit_capacity_level: 4,
        auto_buy_supplies_purchased: false,
      }),
    ).toBe(true);
    expect(isUserResourceFields({ unknown: 1 })).toBe(false);
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
    case ResourceType.SUPPLIES_BATCH_LEVEL:
      return "supplies_batch_level";
    case ResourceType.GLOBAL_TICKETS:
      return null;
  }
}
