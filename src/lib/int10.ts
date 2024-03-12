// Big integer base-10 printing library
// Copyright (c) 2008-2021 Lapo Luchini <lapo@lapo.it>

const max = 10000000000000; // biggest 10^n integer that can still fit 2^53 when multiplied by 256

export class Int10 {
  buf: number[];

  /**
   * Arbitrary length base-10 value.
   * @param {number} value - Optional initial value (will be 0 otherwise).
   */
  constructor(value?: number) {
    this.buf = [value || 0].map(item => Number(item)); //
  }

  /**
   * Multiply value by m and add c.
   * @param {number} m - multiplier, must be < =256
   * @param {number} c - value to add
   */
  mulAdd(m: number, c: number): void {
    // assert(m <= 256)
    const b = this.buf;
    const l = b.length;
    let i;
    let t;
    for (i = 0; i < l; ++i) {
      t = b[i] * m + c;
      if (t < max) {
        c = 0;
      } else {
        c = 0 | (t / max);
        t -= c * max;
      }
      b[i] = t;
    }
    if (c > 0) {
      b[i] = c;
    }
  }

  /**
   * Subtract value.
   * @param {number} c - value to subtract
   */
  sub(c: number): void {
    const b = this.buf;
    const l = b.length;
    let i;
    let t;
    for (i = 0; i < l; ++i) {
      t = b[i] - c;
      if (t < 0) {
        t += max;
        c = 1;
      } else {
        c = 0;
      }
      b[i] = t;
    }
    while (b[b.length - 1] === 0) {
      b.pop();
    }
  }

  /**
   * Convert to decimal string representation.
   * @param {*} base - optional value, only value accepted is 10
   */
  toString(base?: number): string {
    if ((base || 10) !== 10) {
      throw Error('only base 10 is supported');
    }
    const b = this.buf;
    let s = b[b.length - 1].toString();
    for (let i = b.length - 2; i >= 0; --i) {
      s += (max + b[i]).toString().substring(1);
    }
    return s;
  }

  /**
   * Convert to Number value representation.
   * Will probably overflow 2^53 and thus become approximate.
   */
  valueOf(): number {
    const b = this.buf;
    let v = 0;
    for (let i = b.length - 1; i >= 0; --i) {
      v = v * max + b[i];
    }
    return v;
  }

  /**
   * Return value as a simple Number (if it is <= 10000000000000), or return this.
   */
  simplify(): number | Int10 {
    const b = this.buf;
    return (b.length === 1) ? b[0] : this;
  }
}

