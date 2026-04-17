import { OperationId, ResourceType, type User } from "ever-greater-shared";
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
    autoprinters: 0,
    credit_value: 0,
    credit_generation_level: 0,
    credit_capacity_level: 0,
    manual_print_batch_level: 0,
    supplies_batch_level: 0,
    auto_buy_supplies_purchased: false,
    auto_buy_supplies_active: false,
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

  it("uses the manual print batch level when no quantity is provided", async () => {
    const user = makeUser({ manual_print_batch_level: 2, printer_supplies: 8 });
    const updatedUser = makeUser({
      manual_print_batch_level: 2,
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
