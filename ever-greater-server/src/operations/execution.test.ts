import {
  AutoBuyResourceKey,
  AutoBuyScaleMode,
  getDefaultAutoBuySettings,
  OperationId,
  ResourceType,
  type User,
} from "ever-greater-shared";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as dbAccess from "./db-access.js";
import {
  executeOperationForUser,
  OperationUserNotFoundError,
  OperationValidationError,
} from "./execution.js";

vi.mock("./db-access.js", () => ({
  executeResourceTransaction: vi.fn(),
  getGlobalCount: vi.fn(),
  getUserById: vi.fn(),
  incrementGlobalCount: vi.fn(),
  purchaseAutoBuySupplies: vi.fn(),
  setAutoBuySettings: vi.fn(),
  setAutoBuySuppliesActive: vi.fn(),
}));

const mockDbAccess = dbAccess as any;

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: "executor@example.com",
    tickets_contributed: 10,
    tickets_withdrawn: 0,
    printer_supplies: 10,
    money: 0,
    gold: 10,
    gems: 0,
    autoprinters: 0,
    credit_value: 0,
    credit_generation_level: 0,
    credit_capacity_level: 0,
    credit_capacity_amount_level: 0,
    ticket_batch_level: 0,
    manual_print_batch_level: 0,
    supplies_batch_level: 0,
    auto_buy_supplies_purchased: false,
    auto_buy_supplies_active: false,
    auto_buy_settings: getDefaultAutoBuySettings(),
    ...overrides,
  };
}

describe("executeOperationForUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("executes print operations and increments the global count by quantity", async () => {
    const user = makeUser({ printer_supplies: 8 });
    const updatedUser = makeUser({
      printer_supplies: 4,
      money: 4,
      tickets_contributed: 14,
    });

    mockDbAccess.getUserById.mockResolvedValue(user);
    mockDbAccess.getGlobalCount.mockResolvedValue(100);
    mockDbAccess.executeResourceTransaction.mockResolvedValue(updatedUser);
    mockDbAccess.incrementGlobalCount.mockResolvedValue(104);

    const result = await executeOperationForUser(1, OperationId.PRINT_TICKET, {
      quantity: 4,
    });

    expect(mockDbAccess.executeResourceTransaction).toHaveBeenCalledWith(
      1,
      { [ResourceType.PRINTER_SUPPLIES]: 4 },
      {
        [ResourceType.MONEY]: 4,
        [ResourceType.TICKETS_CONTRIBUTED]: 4,
      },
      undefined,
    );
    expect(mockDbAccess.incrementGlobalCount).toHaveBeenCalledWith(
      4,
      undefined,
    );
    expect(result.count).toBe(104);
    expect(result.user).toEqual(updatedUser);
  });

  it("uses both ticket and manual print batch levels when no quantity is provided", async () => {
    const user = makeUser({
      ticket_batch_level: 1,
      manual_print_batch_level: 1,
      printer_supplies: 8,
    });
    const updatedUser = makeUser({
      ticket_batch_level: 1,
      manual_print_batch_level: 1,
      printer_supplies: 4,
      money: 4,
      tickets_contributed: 14,
    });

    mockDbAccess.getUserById.mockResolvedValue(user);
    mockDbAccess.getGlobalCount.mockResolvedValue(100);
    mockDbAccess.executeResourceTransaction.mockResolvedValue(updatedUser);
    mockDbAccess.incrementGlobalCount.mockResolvedValue(104);

    const result = await executeOperationForUser(1, OperationId.PRINT_TICKET);

    expect(mockDbAccess.executeResourceTransaction).toHaveBeenCalledWith(
      1,
      { [ResourceType.PRINTER_SUPPLIES]: 4 },
      {
        [ResourceType.MONEY]: 4,
        [ResourceType.TICKETS_CONTRIBUTED]: 4,
      },
      undefined,
    );
    expect(result.count).toBe(104);
    expect(result.user).toEqual(updatedUser);
  });

  it("uses the special unlock executor for AUTO_BUY_SUPPLIES", async () => {
    const user = makeUser({ gold: 12 });
    const updatedUser = makeUser({
      gold: 2,
      auto_buy_supplies_purchased: true,
      auto_buy_supplies_active: true,
    });

    mockDbAccess.getUserById.mockResolvedValue(user);
    mockDbAccess.getGlobalCount.mockResolvedValue(100);
    mockDbAccess.purchaseAutoBuySupplies.mockResolvedValue(updatedUser);

    const result = await executeOperationForUser(
      1,
      OperationId.AUTO_BUY_SUPPLIES,
    );

    expect(mockDbAccess.purchaseAutoBuySupplies).toHaveBeenCalledWith(
      1,
      10,
      undefined,
    );
    expect(result.user).toEqual(updatedUser);
  });

  it("uses the special toggle executor for TOGGLE_AUTO_BUY_SUPPLIES", async () => {
    const user = makeUser({
      auto_buy_supplies_purchased: true,
      auto_buy_supplies_active: true,
    });
    const updatedUser = makeUser({
      auto_buy_supplies_purchased: true,
      auto_buy_supplies_active: false,
    });

    mockDbAccess.getUserById.mockResolvedValue(user);
    mockDbAccess.getGlobalCount.mockResolvedValue(100);
    mockDbAccess.setAutoBuySuppliesActive.mockResolvedValue(updatedUser);

    const result = await executeOperationForUser(
      1,
      OperationId.TOGGLE_AUTO_BUY_SUPPLIES,
      { active: false },
    );

    expect(mockDbAccess.setAutoBuySuppliesActive).toHaveBeenCalledWith(
      1,
      false,
      undefined,
    );
    expect(result.user).toEqual(updatedUser);
  });

  it("uses the special settings executor for CONFIGURE_AUTO_BUY", async () => {
    const user = makeUser();
    const updatedUser = makeUser({
      auto_buy_settings: {
        printer_supplies: {
          threshold: 18,
          scaleMode: AutoBuyScaleMode.CUSTOM_PERCENT,
          scaleValue: 40,
        },
        gold: {
          threshold: 0,
          scaleMode: AutoBuyScaleMode.MAX,
          scaleValue: 0,
        },
      },
    });

    mockDbAccess.getUserById.mockResolvedValue(user);
    mockDbAccess.getGlobalCount.mockResolvedValue(100);
    mockDbAccess.setAutoBuySettings.mockResolvedValue(updatedUser);

    const result = await executeOperationForUser(
      1,
      OperationId.CONFIGURE_AUTO_BUY,
      {
        resourceKey: AutoBuyResourceKey.PRINTER_SUPPLIES,
        threshold: 18,
        scaleMode: AutoBuyScaleMode.CUSTOM_PERCENT,
        scaleValue: 40,
      },
    );

    expect(mockDbAccess.setAutoBuySettings).toHaveBeenCalledWith(
      1,
      {
        printer_supplies: {
          threshold: 18,
          scaleMode: AutoBuyScaleMode.CUSTOM_PERCENT,
          scaleValue: 40,
        },
        gold: {
          threshold: 0,
          scaleMode: AutoBuyScaleMode.MAX,
          scaleValue: 0,
        },
      },
      undefined,
    );
    expect(result.user).toEqual(updatedUser);
  });

  it("auto-buys gold before refilling supplies when the print fallback needs it", async () => {
    const user = makeUser({
      printer_supplies: 0,
      money: 200,
      gold: 0,
      auto_buy_supplies_purchased: true,
      auto_buy_supplies_active: true,
    });
    const goldPurchasedUser = makeUser({
      printer_supplies: 0,
      money: 0,
      gold: 2,
      auto_buy_supplies_purchased: true,
      auto_buy_supplies_active: true,
    });
    const refilledUser = makeUser({
      printer_supplies: 200,
      money: 0,
      gold: 1,
      auto_buy_supplies_purchased: true,
      auto_buy_supplies_active: true,
    });
    const printedUser = makeUser({
      printer_supplies: 199,
      money: 1,
      gold: 1,
      tickets_contributed: 11,
      auto_buy_supplies_purchased: true,
      auto_buy_supplies_active: true,
    });

    mockDbAccess.getUserById.mockResolvedValue(user);
    mockDbAccess.getGlobalCount.mockResolvedValue(100);
    mockDbAccess.executeResourceTransaction
      .mockResolvedValueOnce(goldPurchasedUser)
      .mockResolvedValueOnce(refilledUser)
      .mockResolvedValueOnce(printedUser);
    mockDbAccess.incrementGlobalCount.mockResolvedValue(101);

    const result = await executeOperationForUser(
      1,
      OperationId.PRINT_TICKET,
      undefined,
      {
        allowPrintAutoBuyFallback: true,
      },
    );

    expect(mockDbAccess.executeResourceTransaction).toHaveBeenNthCalledWith(
      1,
      1,
      { [ResourceType.MONEY]: 200 },
      { [ResourceType.GOLD]: 2 },
      undefined,
    );
    expect(mockDbAccess.executeResourceTransaction).toHaveBeenNthCalledWith(
      2,
      1,
      { [ResourceType.GOLD]: 1 },
      { [ResourceType.PRINTER_SUPPLIES]: 200 },
      undefined,
    );
    expect(mockDbAccess.executeResourceTransaction).toHaveBeenNthCalledWith(
      3,
      1,
      { [ResourceType.PRINTER_SUPPLIES]: 1 },
      {
        [ResourceType.MONEY]: 1,
        [ResourceType.TICKETS_CONTRIBUTED]: 1,
      },
      undefined,
    );
    expect(result.user).toEqual(printedUser);
    expect(result.count).toBe(101);
  });

  it("charges the scaled gold cost for credit generation upgrades", async () => {
    const user = makeUser({ gold: 20, credit_generation_level: 5 });
    const updatedUser = makeUser({ gold: 13, credit_generation_level: 6 });

    mockDbAccess.getUserById.mockResolvedValue(user);
    mockDbAccess.getGlobalCount.mockResolvedValue(100);
    mockDbAccess.executeResourceTransaction.mockResolvedValue(updatedUser);

    const result = await executeOperationForUser(
      1,
      OperationId.INCREASE_CREDIT_GENERATION,
    );

    expect(mockDbAccess.executeResourceTransaction).toHaveBeenCalledWith(
      1,
      { [ResourceType.GOLD]: 7 },
      { [ResourceType.CREDIT_GENERATION_LEVEL]: 1 },
      undefined,
    );
    expect(result.user).toEqual(updatedUser);
  });

  it("charges the multiplied credit cost for autoprinter purchases", async () => {
    const user = makeUser({ credit_value: 500, autoprinters: 3 });
    const updatedUser = makeUser({ credit_value: 180, autoprinters: 4 });

    mockDbAccess.getUserById.mockResolvedValue(user);
    mockDbAccess.getGlobalCount.mockResolvedValue(100);
    mockDbAccess.executeResourceTransaction.mockResolvedValue(updatedUser);

    const result = await executeOperationForUser(
      1,
      OperationId.BUY_AUTOPRINTER,
    );

    expect(mockDbAccess.executeResourceTransaction).toHaveBeenCalledWith(
      1,
      { [ResourceType.CREDIT]: 320 },
      { [ResourceType.AUTOPRINTERS]: 1 },
      undefined,
    );
    expect(result.user).toEqual(updatedUser);
  });

  it("charges the scaled ticket cost for credit capacity upgrades", async () => {
    const user = makeUser({
      tickets_contributed: 1000,
      credit_capacity_level: 3,
    });
    const updatedUser = makeUser({
      tickets_contributed: 1000,
      credit_capacity_level: 4,
    });

    mockDbAccess.getUserById.mockResolvedValue(user);
    mockDbAccess.getGlobalCount
      .mockResolvedValueOnce(1000)
      .mockResolvedValueOnce(749);
    mockDbAccess.executeResourceTransaction.mockResolvedValue(updatedUser);

    const result = await executeOperationForUser(
      1,
      OperationId.INCREASE_CREDIT_CAPACITY,
    );

    expect(mockDbAccess.executeResourceTransaction).toHaveBeenCalledWith(
      1,
      { [ResourceType.GLOBAL_TICKETS]: 251 },
      { [ResourceType.CREDIT_CAPACITY_LEVEL]: 1 },
      undefined,
    );
    expect(mockDbAccess.getGlobalCount).toHaveBeenCalledTimes(2);
    expect(result.count).toBe(749);
    expect(result.user).toEqual(updatedUser);
  });

  it("charges gold and gems for credit capacity amount upgrades", async () => {
    const user = makeUser({
      gold: 30,
      gems: 30,
      credit_capacity_amount_level: 2,
    });
    const updatedUser = makeUser({
      gold: 8,
      gems: 10,
      credit_capacity_amount_level: 3,
    });

    mockDbAccess.getUserById.mockResolvedValue(user);
    mockDbAccess.getGlobalCount.mockResolvedValue(100);
    mockDbAccess.executeResourceTransaction.mockResolvedValue(updatedUser);

    const result = await executeOperationForUser(
      1,
      OperationId.INCREASE_CREDIT_CAPACITY_AMOUNT,
    );

    expect(mockDbAccess.executeResourceTransaction).toHaveBeenCalledWith(
      1,
      { [ResourceType.GOLD]: 22, [ResourceType.GEMS]: 20 },
      { [ResourceType.CREDIT_CAPACITY_AMOUNT_LEVEL]: 1 },
      undefined,
    );
    expect(result.user).toEqual(updatedUser);
  });

  it("spends 2000 global tickets to award 1 gem", async () => {
    const user = makeUser({ tickets_contributed: 5000, tickets_withdrawn: 0 });
    const updatedUser = makeUser({
      tickets_contributed: 5000,
      tickets_withdrawn: 0,
      gems: 1,
    });

    mockDbAccess.getUserById.mockResolvedValue(user);
    mockDbAccess.getGlobalCount
      .mockResolvedValueOnce(5000)
      .mockResolvedValueOnce(3000);
    mockDbAccess.executeResourceTransaction.mockResolvedValue(updatedUser);

    const result = await executeOperationForUser(1, OperationId.BUY_GEM);

    expect(mockDbAccess.executeResourceTransaction).toHaveBeenCalledWith(
      1,
      { [ResourceType.GLOBAL_TICKETS]: 2000 },
      { [ResourceType.GEMS]: 1 },
      undefined,
    );
    expect(mockDbAccess.getGlobalCount).toHaveBeenCalledTimes(2);
    expect(result.count).toBe(3000);
    expect(result.user).toEqual(updatedUser);
  });

  it("auto-buys supplies before printing when fallback is allowed", async () => {
    const user = makeUser({
      printer_supplies: 0,
      gold: 2,
      auto_buy_supplies_purchased: true,
      auto_buy_supplies_active: true,
    });
    const refilledUser = makeUser({
      printer_supplies: 200,
      gold: 1,
      auto_buy_supplies_purchased: true,
      auto_buy_supplies_active: true,
    });
    const printedUser = makeUser({
      printer_supplies: 199,
      gold: 1,
      money: 1,
      tickets_contributed: 11,
      auto_buy_supplies_purchased: true,
      auto_buy_supplies_active: true,
    });

    mockDbAccess.getUserById.mockResolvedValue(user);
    mockDbAccess.getGlobalCount.mockResolvedValue(100);
    mockDbAccess.executeResourceTransaction
      .mockResolvedValueOnce(refilledUser)
      .mockResolvedValueOnce(printedUser);
    mockDbAccess.incrementGlobalCount.mockResolvedValue(101);

    const result = await executeOperationForUser(
      1,
      OperationId.PRINT_TICKET,
      undefined,
      {
        allowPrintAutoBuyFallback: true,
      },
    );

    expect(mockDbAccess.executeResourceTransaction).toHaveBeenNthCalledWith(
      1,
      1,
      { [ResourceType.GOLD]: 1 },
      { [ResourceType.PRINTER_SUPPLIES]: 200 },
      undefined,
    );
    expect(mockDbAccess.executeResourceTransaction).toHaveBeenNthCalledWith(
      2,
      1,
      { [ResourceType.PRINTER_SUPPLIES]: 1 },
      {
        [ResourceType.MONEY]: 1,
        [ResourceType.TICKETS_CONTRIBUTED]: 1,
      },
      undefined,
    );
    expect(result.user).toEqual(printedUser);
    expect(result.count).toBe(101);
  });

  it("throws a validation error for invalid operation parameters", async () => {
    mockDbAccess.getUserById.mockResolvedValue(makeUser());
    mockDbAccess.getGlobalCount.mockResolvedValue(100);

    await expect(
      executeOperationForUser(1, OperationId.BUY_GOLD, { quantity: 0 }),
    ).rejects.toBeInstanceOf(OperationValidationError);
  });

  it("throws when the user does not exist", async () => {
    mockDbAccess.getUserById.mockResolvedValue(null);

    await expect(
      executeOperationForUser(999, OperationId.BUY_SUPPLIES),
    ).rejects.toBeInstanceOf(OperationUserNotFoundError);
  });
});
