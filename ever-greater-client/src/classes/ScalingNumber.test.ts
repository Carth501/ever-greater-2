import ScalingNumber from "./ScalingNumber";

describe("ScalingNumber.fromString()", () => {
  test("parses a simple numeric string", () => {
    const num = new ScalingNumber();
    num.fromString("123");
    expect(num.getValue()).toBe(123);
  });

  test("parses a string with exactly 9 digits", () => {
    const num = new ScalingNumber();
    num.fromString("123456789");
    expect(num.getValue()).toBe(123456789);
  });

  test("parses a string with more than 9 digits", () => {
    const num = new ScalingNumber();
    num.fromString("123456789012345678");
    // First group: 012345678 (9 digits from right) = 12345678
    // Second group: 123 (remaining) = 123 * 10^9
    expect(num.getValue()).toBe(123000000000 + 12345678);
  });

  test("parses a single digit string", () => {
    const num = new ScalingNumber();
    num.fromString("5");
    expect(num.getValue()).toBe(5);
  });

  test("parses string with leading zeros", () => {
    const num = new ScalingNumber();
    num.fromString("00123");
    expect(num.getValue()).toBe(123);
  });

  test("throws error for non-numeric string", () => {
    const num = new ScalingNumber();
    expect(() => num.fromString("abc")).toThrow(
      "Invalid input: only numbers are allowed",
    );
  });

  test("throws error for string with mixed content", () => {
    const num = new ScalingNumber();
    expect(() => num.fromString("123abc")).toThrow(
      "Invalid input: only numbers are allowed",
    );
  });

  test("throws error for string with spaces", () => {
    const num = new ScalingNumber();
    expect(() => num.fromString("123 456")).toThrow(
      "Invalid input: only numbers are allowed",
    );
  });

  test("clears previous digits before parsing", () => {
    const num = new ScalingNumber();
    num.fromString("999");
    expect(num.getValue()).toBe(999);

    num.fromString("123");
    expect(num.getValue()).toBe(123);
  });

  test("parses zero string", () => {
    const num = new ScalingNumber();
    num.fromString("0");
    expect(num.getValue()).toBe(0);
  });
});
