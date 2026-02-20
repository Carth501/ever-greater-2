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

    for (let i = 0; i < maxLength; i++) {
      const a = this.digits[i] || 0;
      const b = other.digits[i] || 0;
      result.digits[i] = a - b;
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
      const magnitude = Math.floor(Math.log10(mostSignificant));
      const divisor = Math.pow(10, Math.floor(magnitude));
      const firstDigit = Math.floor(mostSignificant / divisor);
      const trailingDigits = mostSignificant % divisor;
      const roundedTrailing = Math.round(
        trailingDigits / Math.pow(10, magnitude - 3),
      );
      const power = mostSignificantIndex * 9 + magnitude;
      return `${firstDigit}.${roundedTrailing}e${power}`;
    } else {
      const result = this.digits
        .slice()
        .reverse()
        .map((digit, index) => digit.toString().padStart(9, "0"))
        .join("");
      return result.replace(/^0+/, "") || "0";
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
