class ScalingNumber {
  private digits: number[] = [];

  constructor(value: number = 0) {
    if (value > 0) {
      this.digits = [value];
    }
  }

  add(other: ScalingNumber): ScalingNumber {
    const result = new ScalingNumber();
    const maxLength = Math.max(this.digits.length, other.digits.length);

    for (let i = 0; i < maxLength; i++) {
      const a = this.digits[i] || 0;
      const b = other.digits[i] || 0;
      result.digits[i] = a + b;
    }

    return result;
  }

  subtract(other: ScalingNumber): ScalingNumber {
    const result = new ScalingNumber();
    const maxLength = Math.max(this.digits.length, other.digits.length);

    for (let i = 0; i < maxLength; i++) {
      const a = this.digits[i] || 0;
      const b = other.digits[i] || 0;
      result.digits[i] = a - b;
    }

    return result;
  }

  increment(): void {
    if (this.digits.length === 0) {
      this.digits = [1];
    } else {
      this.digits[0]++;
    }
  }

  toString(): string {
    if (this.digits.length === 0) return "0";
    return this.digits
      .reverse()
      .map((digit, index) => digit + "e" + index * 9)
      .join(" + ");
  }

  fromString(str: string): void {
    if (!/^[0-9]+$/.test(str)) {
      throw new Error("Invalid input: only numbers are allowed");
    }
    this.digits = [];
    for (let i = str.length; i > 0; i -= 9) {
      const group = str.substring(Math.max(0, i - 9), i);
      this.digits.push(parseInt(group, 10));
    }
  }

  getValue(): number {
    return this.digits.reduce(
      (sum, digit, index) => sum + digit * Math.pow(10, index * 9),
      0,
    );
  }
}

export default ScalingNumber;
