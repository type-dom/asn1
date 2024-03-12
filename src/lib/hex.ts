// Hex JavaScript decoder

let decoder: number[]; // populated on first usage
// 判断是否支持Uint8Array, 不支持直接报错退出
const haveU8 = (typeof Uint8Array === 'function');

export class Hex {
  /**
   * Decodes an hexadecimal value.
   * @param {string|Array|Uint8Array} a - a string representing hexadecimal data, or an array representation of its charcodes
   */
  static decode(a: string | Uint8Array): Uint8Array {
    let i;
    if (decoder === undefined) {
      let hex = '0123456789ABCDEF';
      const ignore = ' \f\n\r\t\u00A0\u2028\u2029';
      decoder = [];
      for (i = 0; i < 16; ++i) {
        decoder[hex.charCodeAt(i)] = i;
      }
      hex = hex.toLowerCase();
      for (i = 10; i < 16; ++i) {
        decoder[hex.charCodeAt(i)] = i;
      }
      for (i = 0; i < ignore.length; ++i) {
        decoder[ignore.charCodeAt(i)] = -1;
      }
    }
    if (!haveU8) throw Error('不支持Uint8Array ');
    let out = new Uint8Array(a.length >> 1);
    let bits = 0;
    let char_count = 0;
    let len = 0;
    for (i = 0; i < a.length; ++i) {
      let c = (typeof a === 'string') ? a.charCodeAt(i) : a[i];
      c = decoder[c];
      if (c === -1) {
        continue;
      }
      if (c === undefined) {
        throw Error('Illegal character at offset ' + i);
      }
      bits |= c;
      if (++char_count >= 2) {
        out[len++] = bits;
        bits = 0;
        char_count = 0;
      } else {
        bits <<= 4;
      }
    }
    if (char_count) {
      throw Error('Hex encoding incomplete: 4 bits missing');
    }
    if (haveU8 && out.length > len) { // in case it was originally longer because of ignored characters
      out = out.subarray(0, len);
    }
    return out;
  }
}

