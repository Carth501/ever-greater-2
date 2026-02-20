class ScalingNumber {
  private digits: number[] = [];

  constructor(value: number = 0) {
    if (!Number.isFinite(value)) {
      throw new Error("Value must be a finite number");
    }
    if (value < 0 || !Number.isInteger(value)) {
      throw new Error("Value must be a non-negative integer");
    }
    if (value > 0) {
      if (Math.log10(value) >= 9) {
        this.digits = [];
        while (value > 0) {
          this.digits.push(value % 1e9);
          value = Math.floor(value / 1e9);
        }
      } else {
        this.digits = [value];
      }
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
    if (other.isGreaterThan(this)) {
      throw new Error("Cannot subtract a larger number from a smaller number");
    }
    const result = new ScalingNumber();
    const maxLength = Math.max(this.digits.length, other.digits.length);
    let borrow = 0;

    for (let i = 0; i < maxLength; i++) {
      const a = this.digits[i] || 0;
      const b = other.digits[i] || 0;
      let diff = a - b - borrow;

      if (diff < 0) {
        diff += 1e9;
        borrow = 1;
      } else {
        borrow = 0;
      }

      result.digits[i] = diff;
    }

    return result;
  }

  isGreaterThan(other: ScalingNumber): boolean {
    const thisIndex = this.getMostSignificantIndex();
    const otherIndex = other.getMostSignificantIndex();

    if (thisIndex !== otherIndex) {
      return thisIndex > otherIndex;
    }
    for (let i = thisIndex; i >= 0; i--) {
      if (this.digits[i] !== other.digits[i]) {
        return this.digits[i] > other.digits[i];
      }
    }
    return false;
  }

  private getMostSignificantIndex(): number {
    for (let i = this.digits.length - 1; i >= 0; i--) {
      if (this.digits[i] !== 0) {
        return i;
      }
    }
    return 0;
  }

  increment(): void {
    if (this.digits.length === 0) {
      this.digits = [1];
    } else {
      this.digits[0]++;
    }
  }

  toString(scientific: boolean = false): string {
    if (this.digits.length === 0) return "0";
    if (scientific) {
      const mostSignificantIndex = this.getMostSignificantIndex();
      const mostSignificant = this.digits[mostSignificantIndex];
      let topDigits = mostSignificant;
      const digitCount = Math.floor(Math.log10(mostSignificant));
      // 4, because we want 3 after the decimal, with one to be rounded away, and the first is not counted.
      if (digitCount < 4) {
        const missingDigitCount = 4 - digitCount;
        const nextDigits = this.digits[mostSignificantIndex - 1] || 0;
        topDigits *= Math.pow(10, missingDigitCount);
        topDigits += Math.floor(
          nextDigits / Math.pow(10, 9 - missingDigitCount),
        );
      } else if (digitCount > 4) {
        const excessDigitCount = digitCount - 4;
        topDigits = Math.floor(topDigits / Math.pow(10, excessDigitCount));
      }

      // If the top digits would round over a power of 10, round down
      // instead of up to avoid displaying something like 1.000e6.
      // Many thresholds are at powers of 10, so this makes the display more intuitive.
      if (topDigits < 99999) {
        topDigits = Math.round(topDigits / 10);
      } else {
        topDigits = Math.floor(topDigits / 10);
      }
      const firstDigit = Math.floor(topDigits / 1000);
      const trailingDigits = topDigits % 1000;
      const trailingStr = trailingDigits.toString().padStart(3, "0");
      const exponent = mostSignificantIndex * 9 + digitCount;

      return `${firstDigit}.${trailingStr}e${exponent}`;
    } else {
      const result = this.digits
        .slice()
        .reverse()
        .map((digit, index) => digit.toString().padStart(9, "0"))
        .join("");
      return result.replace(/^0+/, "") || "0";
    }
  }

  toFormattedString(): string {
    if (this.digits.length === 0) return "0";
    const indexCount = this.getMostSignificantIndex();
    if (indexCount === 1) {
      return this.toString(false);
    } else {
      return this.toString(true);
    }
  }

  fromString(str: string): void {
    if (!/^[0-9]+$/.test(str)) {
      throw new Error(
        "Invalid input: only numbers are allowed. Received: " + str,
      );
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

  getDigits(): number[] {
    return [...this.digits];
  }
}

export default ScalingNumber;
