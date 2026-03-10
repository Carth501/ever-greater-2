import type { User } from "ever-greater-shared";

export function mockUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: "test@example.com",
    tickets_contributed: 5,
    tickets_withdrawn: 0,
    printer_supplies: 100,
    money: 0,
    gold: 0,
    autoprinters: 0,
    credit_value: 0,
    credit_generation_level: 0,
    credit_capacity_level: 0,
    auto_buy_supplies_purchased: false,
    auto_buy_supplies_active: false,
    ...overrides,
  };
}
