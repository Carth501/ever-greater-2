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

  test("gets the power of 10 right in scientific notation", () => {
    const num = new ScalingNumber();
    num.fromString("123444444444444444");
    expect(num.toString(true)).toBe("1.234e17");
  });
});

describe("ScalingNumber.toString()", () => {
  test("returns scientific notation with the correct number of digits", () => {
    const num = new ScalingNumber();
    num.fromString("123456789012345678");
    expect(num.toString(true)).toBe("1.235e17");
  });

  test("returns scientific notation with values across multiple array elements", () => {
    const num = new ScalingNumber();
    num.fromString("1234000000");
    expect(num.toString(true)).toBe("1.234e9");
  });
});

describe("ScalingNumber constructor", () => {
  test("constructs from Number.MAX_VALUE in constructor", () => {
    const num = new ScalingNumber(Number.MAX_VALUE);
    expect(num.toString()).toBe(
      "179769313486231633920913983488271282176690646528442980864382362624911135744135943680007514624793594880838525440431445504845668352309090304009428480671512064675351040482460672797935616410028032925221888353556480727533056334680064851722752951541248139257344981958144618303488363269120201339392755057664124858368",
    );
  });

  test("constructs from Number.MAX_VALUE in fromString", () => {
    const num = new ScalingNumber();
    num.fromString(
      "179769313486231633920913983488271282176690646528442980864382362624911135744135943680007514624793594880838525440431445504845668352309090304009428480671512064675351040482460672797935616410028032925221888353556480727533056334680064851722752951541248139257344981958144618303488363269120201339392755057664124858368",
    );
    expect(num.toString()).toBe(
      "179769313486231633920913983488271282176690646528442980864382362624911135744135943680007514624793594880838525440431445504845668352309090304009428480671512064675351040482460672797935616410028032925221888353556480727533056334680064851722752951541248139257344981958144618303488363269120201339392755057664124858368",
    );
  });
});

describe("ScalingNumber.add()", () => {
  test("adds Number.MAX_VALUE to a ScalingNumber", () => {
    const num1 = new ScalingNumber(Number.MAX_VALUE);
    const num2 = new ScalingNumber(Number.MAX_VALUE);
    const result = num1.add(num2);
    expect(result.toString()).toBe(
      "35815386269724632678401827966976542564352138129305688596172876472524818222714882718873600150292481587189760167705088086289100816913367046181806080188569601343024128135070208096492134415958712328200560641850443776707112960145506611266936012817034455041903082496278514688196391628812366069767265382404026787841510115328249716736",
    );
  });
});

describe("ScalingNumber.subtract()", () => {
  test("subtracts a smaller ScalingNumber from a larger one", () => {
    const num1 = new ScalingNumber(Number.MAX_VALUE);
    const num2 = new ScalingNumber(1);
    const result = num1.subtract(num2);
    expect(result.toString()).toBe(
      "179769313486231633920913983488271282176690646528442980864382362624911135744135943680007514624793594880838525440431445504845668352309090304009428480671512064675351040482460672797935616410028032925221888353556480727533056334680064851722752951541248139257344981958144618303488363269120201339392755057664124858367",
    );
  });

  test("subtracts a larger ScalingNumber from a smaller one", () => {
    const num1 = new ScalingNumber(1);
    const num2 = new ScalingNumber(Number.MAX_VALUE);
    expect(() => num1.subtract(num2)).toThrow(
      "Cannot subtract a larger number from a smaller number",
    );
  });

  test("Subtract a large number and check there are no negative digits", () => {
    const num1 = new ScalingNumber(8159020270712095092489);
    const num2 = new ScalingNumber(8158020270712095092480);
    const result = num1.subtract(num2);
    expect(result.toString()).toBe("999999999999737856");
  });
});
