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
    expect(num.getValue()).toBe(123456789012345678);
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

  test("constructs from Number.MAX_VALUE in constructor", () => {
    const num = new ScalingNumber(Number.MAX_VALUE);
    expect(num.toString()).toBe(
      "179769313486231633920913983488271282176690646528442980864382362624911135744135943680007514624793594880838525440431445504845668352309090304009428480671512064675351040482460672797935616410028032925221888353556480727533056334680064851722752951541248139257344981958144618303488363269120201339392755057664124858368",
    );
  });
});

describe("ScalingNumber.add()", () => {
  test("adds Number.MAX_VALUE to a ScalingNumber", () => {
    const num1 = new ScalingNumber(Number.MAX_VALUE);
    const num2 = new ScalingNumber(Number.MAX_VALUE);
    num1.add(num2);
    console.log(num1.toString());
    expect(num1.toString()).toBe(
      "179769313486231570814527423731704356798070567525844996598917476803157260780028538760589558632766878171540458953514382464234321326889464182768467546703537516986049910576551282076245490090389328944075868508455133942304583236903222948165808559332123348274797826204144723168738177180919299881250404026184124858368",
    );
  });
});
