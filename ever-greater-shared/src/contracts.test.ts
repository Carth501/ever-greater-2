import { describe, expect, it } from "vitest";
import {
  applyTransaction,
  AutoBuyResourceKey,
  AutoBuyScaleMode,
  canAfford,
  clientOperationIds,
  getAutoprinterCost,
  getBuySuppliesGainForGold,
  getCreditCapacityUpgradeCost,
  getCreditGenerationAmount,
  getCreditGenerationUpgradeCost,
  getDefaultAutoBuySettings,
  getManualPrintBatchUpgradeCost,
  getManualPrintQuantity,
  getMaxCreditValue,
  getMaxSuppliesPurchaseGold,
  getOperationCost,
  getOperationGain,
  getSuppliesBatchUpgradeCost,
  getTicketBatchUpgradeCost,
  isUserResourceFields,
  isWebSocketMessage,
  OperationId,
  operations,
  parseWebSocketMessage,
  resolveAutoBuySpendAmount,
  type ResourceAmount,
  ResourceType,
  shouldTriggerAutoBuy,
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
    gems: 0,
    autoprinters: 2,
    credit_value: 0,
    credit_generation_level: 0,
    credit_capacity_level: 0,
    ticket_batch_level: 0,
    manual_print_batch_level: 0,
    supplies_batch_level: 0,
    auto_buy_supplies_purchased: false,
    auto_buy_supplies_active: false,
    auto_buy_settings: getDefaultAutoBuySettings(),
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
          : operationId === OperationId.GENERATE_CREDIT
            ? {
                credit_value: 99,
                credit_generation_level: 5,
                credit_capacity_level: 100,
              }
            : operationId === OperationId.BUY_AUTOPRINTER
              ? { credit_value: 1000 }
              : {},
      );
      const operation = operations[operationId];
      const params =
        operationId === OperationId.BUY_GOLD
          ? { quantity: 3 }
          : operationId === OperationId.PRINT_TICKET
            ? { quantity: 3 }
            : operationId === OperationId.TOGGLE_AUTO_BUY_SUPPLIES
              ? { active: false }
              : operationId === OperationId.CONFIGURE_AUTO_BUY
                ? {
                    resourceKey: AutoBuyResourceKey.PRINTER_SUPPLIES,
                    threshold: 24,
                    scaleMode: AutoBuyScaleMode.CUSTOM_PERCENT,
                    scaleValue: 35,
                  }
                : undefined;
      const globalTicketCount =
        operationId === OperationId.INCREASE_CREDIT_CAPACITY ||
        operationId === OperationId.BUY_GEM
          ? 5000
          : undefined;

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

      if (expectedCost[ResourceType.GLOBAL_TICKETS] === undefined) {
        expect(canAfford(user, expectedCost)).toBe(true);
      } else {
        expect(globalTicketCount).toBeGreaterThanOrEqual(
          expectedCost[ResourceType.GLOBAL_TICKETS] ?? 0,
        );
      }

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

  it("validates and normalizes configurable auto-buy rules", () => {
    const user = makeUser();

    expect(
      validateOperation(user, operations[OperationId.CONFIGURE_AUTO_BUY], {
        resourceKey: AutoBuyResourceKey.PRINTER_SUPPLIES,
        threshold: 20,
        scaleMode: AutoBuyScaleMode.CUSTOM_VALUE,
        scaleValue: 3,
      }),
    ).toMatchObject({ valid: true, cost: {}, gain: {} });

    expect(
      validateOperation(user, operations[OperationId.CONFIGURE_AUTO_BUY], {
        resourceKey: "unknown",
        threshold: 20,
        scaleMode: AutoBuyScaleMode.MAX,
      }),
    ).toMatchObject({
      valid: false,
      error: "'resourceKey' is required",
    });

    expect(
      validateOperation(user, operations[OperationId.CONFIGURE_AUTO_BUY], {
        resourceKey: AutoBuyResourceKey.PRINTER_SUPPLIES,
        threshold: -1,
        scaleMode: AutoBuyScaleMode.MAX,
      }),
    ).toMatchObject({
      valid: false,
      error: "'threshold' must be a non-negative number",
    });
  });

  it("supports explicit auto-buy spend control for supplies purchases", () => {
    const user = makeUser({ gold: 8, supplies_batch_level: 2 });

    expect(
      getOperationCost(operations[OperationId.BUY_SUPPLIES], {
        user,
        params: { spendGold: 2 },
      }),
    ).toEqual({ [ResourceType.GOLD]: 2 });
    expect(
      getOperationGain(operations[OperationId.BUY_SUPPLIES], {
        user,
        params: { spendGold: 2 },
      }),
    ).toEqual({ [ResourceType.PRINTER_SUPPLIES]: 400 });
  });

  it("resolves auto-buy spend scales against available gold", () => {
    expect(
      resolveAutoBuySpendAmount(
        {
          threshold: 0,
          scaleMode: AutoBuyScaleMode.MIN,
          scaleValue: 0,
        },
        12,
        4,
      ),
    ).toBe(1);

    expect(
      resolveAutoBuySpendAmount(
        {
          threshold: 0,
          scaleMode: AutoBuyScaleMode.CUSTOM_VALUE,
          scaleValue: 6,
        },
        12,
        4,
      ),
    ).toBe(4);

    expect(
      resolveAutoBuySpendAmount(
        {
          threshold: 0,
          scaleMode: AutoBuyScaleMode.CUSTOM_PERCENT,
          scaleValue: 26,
        },
        12,
        6,
      ),
    ).toBe(3);

    expect(
      resolveAutoBuySpendAmount(
        {
          threshold: 0,
          scaleMode: AutoBuyScaleMode.MAX,
          scaleValue: 0,
        },
        12,
        6,
      ),
    ).toBe(6);
  });

  it("triggers auto-buy when either threshold or required quantity is crossed", () => {
    expect(shouldTriggerAutoBuy(5, 1, 8)).toBe(true);
    expect(shouldTriggerAutoBuy(5, 6, 2)).toBe(true);
    expect(shouldTriggerAutoBuy(8, 4, 6)).toBe(false);
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

  it("scales supplies batch upgrade cost by current level", () => {
    const baseLevelUser = makeUser({ supplies_batch_level: 0 });
    const oneUpgradeUser = makeUser({ supplies_batch_level: 1 });
    const twoUpgradeUser = makeUser({ supplies_batch_level: 2 });

    expect(getSuppliesBatchUpgradeCost(baseLevelUser)).toBe(10);
    expect(getSuppliesBatchUpgradeCost(oneUpgradeUser)).toBe(20);
    expect(getSuppliesBatchUpgradeCost(twoUpgradeUser)).toBe(40);

    expect(
      getOperationCost(operations[OperationId.INCREASE_SUPPLIES_BATCH], {
        user: twoUpgradeUser,
      }),
    ).toEqual({ [ResourceType.GOLD]: 40 });
  });

  it("scales the general ticket batch upgrade cost by current level", () => {
    const baseLevelUser = makeUser({ ticket_batch_level: 0 });
    const oneUpgradeUser = makeUser({ ticket_batch_level: 1 });
    const twoUpgradeUser = makeUser({ ticket_batch_level: 2 });

    expect(getTicketBatchUpgradeCost(baseLevelUser)).toBe(10);
    expect(getTicketBatchUpgradeCost(oneUpgradeUser)).toBe(20);
    expect(getTicketBatchUpgradeCost(twoUpgradeUser)).toBe(40);

    expect(
      getOperationCost(operations[OperationId.INCREASE_TICKET_BATCH], {
        user: twoUpgradeUser,
      }),
    ).toEqual({ [ResourceType.GOLD]: 40 });
  });

  it("scales manual print quantity with both general and manual batch upgrades", () => {
    const user = makeUser({
      ticket_batch_level: 1,
      manual_print_batch_level: 2,
      printer_supplies: 20,
      money: 0,
      tickets_contributed: 0,
    });

    expect(getManualPrintQuantity(user)).toBe(6);
    expect(
      getOperationCost(operations[OperationId.PRINT_TICKET], {
        user,
      }),
    ).toEqual({ [ResourceType.PRINTER_SUPPLIES]: 6 });
    expect(
      getOperationGain(operations[OperationId.PRINT_TICKET], {
        user,
      }),
    ).toEqual({
      [ResourceType.MONEY]: 6,
      [ResourceType.TICKETS_CONTRIBUTED]: 6,
    });
  });

  it("scales manual print batch upgrade cost by current level", () => {
    const baseLevelUser = makeUser({ manual_print_batch_level: 0 });
    const oneUpgradeUser = makeUser({ manual_print_batch_level: 1 });
    const twoUpgradeUser = makeUser({ manual_print_batch_level: 2 });

    expect(getManualPrintBatchUpgradeCost(baseLevelUser)).toBe(10);
    expect(getManualPrintBatchUpgradeCost(oneUpgradeUser)).toBe(20);
    expect(getManualPrintBatchUpgradeCost(twoUpgradeUser)).toBe(30);

    expect(
      getOperationCost(operations[OperationId.INCREASE_MANUAL_PRINT_BATCH], {
        user: twoUpgradeUser,
      }),
    ).toEqual({ [ResourceType.GOLD]: 30 });
  });

  it("scales ticket printing by quantity", () => {
    const user = makeUser({
      ticket_batch_level: 2,
      printer_supplies: 20,
      money: 0,
      tickets_contributed: 0,
    });

    expect(
      getOperationCost(operations[OperationId.PRINT_TICKET], {
        user,
        params: { quantity: 4 },
      }),
    ).toEqual({ [ResourceType.PRINTER_SUPPLIES]: 4 });
    expect(
      getOperationGain(operations[OperationId.PRINT_TICKET], {
        user,
        params: { quantity: 4 },
      }),
    ).toEqual({
      [ResourceType.MONEY]: 4,
      [ResourceType.TICKETS_CONTRIBUTED]: 4,
    });
  });

  it("marks internal-only credit generation operations as non-client", () => {
    expect(clientOperationIds).not.toContain(OperationId.GENERATE_CREDIT);
  });

  it("scales credit generation upgrade cost by current level", () => {
    const baseLevelUser = makeUser({ credit_generation_level: 0 });
    const oneUpgradeUser = makeUser({ credit_generation_level: 1 });
    const twoUpgradeUser = makeUser({ credit_generation_level: 2 });
    const fiveUpgradeUser = makeUser({ credit_generation_level: 5 });

    expect(getCreditGenerationUpgradeCost(baseLevelUser)).toBe(1);
    expect(getCreditGenerationUpgradeCost(oneUpgradeUser)).toBe(2);
    expect(getCreditGenerationUpgradeCost(twoUpgradeUser)).toBe(3);
    expect(getCreditGenerationUpgradeCost(fiveUpgradeUser)).toBe(7);

    expect(
      getOperationCost(operations[OperationId.INCREASE_CREDIT_GENERATION], {
        user: fiveUpgradeUser,
      }),
    ).toEqual({ [ResourceType.GOLD]: 7 });
  });

  it("multiplies autoprinter cost by the updated economy factor", () => {
    const baseAutoprinterUser = makeUser({ autoprinters: 0 });
    const threeAutoprinterUser = makeUser({ autoprinters: 3 });

    expect(getAutoprinterCost(baseAutoprinterUser)).toBe(40);
    expect(getAutoprinterCost(threeAutoprinterUser)).toBe(320);

    expect(
      getOperationCost(operations[OperationId.BUY_AUTOPRINTER], {
        user: threeAutoprinterUser,
      }),
    ).toEqual({ [ResourceType.CREDIT]: 320 });
  });

  it("scales credit capacity upgrade cost by current level", () => {
    const baseLevelUser = makeUser({ credit_capacity_level: 0 });
    const oneUpgradeUser = makeUser({ credit_capacity_level: 1 });
    const twoUpgradeUser = makeUser({ credit_capacity_level: 2 });
    const threeUpgradeUser = makeUser({ credit_capacity_level: 3 });

    expect(getCreditCapacityUpgradeCost(baseLevelUser)).toBe(200);
    expect(getCreditCapacityUpgradeCost(oneUpgradeUser)).toBe(210);
    expect(getCreditCapacityUpgradeCost(twoUpgradeUser)).toBe(228);
    expect(getCreditCapacityUpgradeCost(threeUpgradeUser)).toBe(251);
    expect(getMaxCreditValue(threeUpgradeUser)).toBe(60);

    expect(
      getOperationCost(operations[OperationId.INCREASE_CREDIT_CAPACITY], {
        user: threeUpgradeUser,
      }),
    ).toEqual({ [ResourceType.GLOBAL_TICKETS]: 251 });

    expect(
      getOperationGain(operations[OperationId.INCREASE_CREDIT_CAPACITY], {
        user: threeUpgradeUser,
      }),
    ).toEqual({
      [ResourceType.CREDIT_CAPACITY_LEVEL]: 1,
    });
  });

  it("prices gems as 2000 global tickets for 1 gem", () => {
    const user = makeUser();

    expect(
      getOperationCost(operations[OperationId.BUY_GEM], {
        user,
      }),
    ).toEqual({ [ResourceType.GLOBAL_TICKETS]: 2000 });

    expect(
      getOperationGain(operations[OperationId.BUY_GEM], {
        user,
      }),
    ).toEqual({ [ResourceType.GEMS]: 1 });
  });

  it("calculates periodic credit generation from current value and capacity", () => {
    expect(
      getCreditGenerationAmount(
        makeUser({
          credit_value: 1.5,
          credit_generation_level: 4,
          credit_capacity_level: 5,
        }),
      ),
    ).toBe(0.4);

    expect(
      getCreditGenerationAmount(
        makeUser({
          credit_value: 19.9,
          credit_generation_level: 4,
          credit_capacity_level: 1,
        }),
      ),
    ).toBeCloseTo(0.1);

    expect(
      getCreditGenerationAmount(
        makeUser({
          credit_value: 99.9,
          credit_generation_level: 4,
          credit_capacity_level: 5,
        }),
      ),
    ).toBeCloseTo(0.1);
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
        user_update: {
          auto_buy_settings: {
            printer_supplies: {
              threshold: 12,
              scaleMode: AutoBuyScaleMode.CUSTOM_PERCENT,
              scaleValue: 40,
            },
          },
        },
      }),
    ).toEqual({
      type: "USER_RESOURCE_UPDATE",
      user_update: {
        auto_buy_settings: {
          printer_supplies: {
            threshold: 12,
            scaleMode: AutoBuyScaleMode.CUSTOM_PERCENT,
            scaleValue: 40,
          },
        },
      },
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
    expect(
      isUserResourceFields({
        auto_buy_settings: getDefaultAutoBuySettings(),
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
    case ResourceType.GEMS:
      return "gems";
    case ResourceType.AUTOPRINTERS:
      return "autoprinters";
    case ResourceType.CREDIT:
      return "credit_value";
    case ResourceType.CREDIT_GENERATION_LEVEL:
      return "credit_generation_level";
    case ResourceType.CREDIT_CAPACITY_LEVEL:
      return "credit_capacity_level";
    case ResourceType.TICKET_BATCH_LEVEL:
      return "ticket_batch_level";
    case ResourceType.MANUAL_PRINT_BATCH_LEVEL:
      return "manual_print_batch_level";
    case ResourceType.SUPPLIES_BATCH_LEVEL:
      return "supplies_batch_level";
    case ResourceType.GLOBAL_TICKETS:
      return null;
  }
}
