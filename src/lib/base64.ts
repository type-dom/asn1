// Base64 JavaScript decoder
let decoder: number[] | undefined; // populated on first usage
const haveU8 = (typeof Uint8Array === 'function');
export class Base64 {
  static decode(a: string | Uint8Array): Uint8Array {
    const isString = (typeof a === 'string');
    let i;
    if (decoder === undefined) {
      const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      const ignore = '= \f\n\r\t\u00A0\u2028\u2029';
      decoder = [];
      for (i = 0; i < 64; ++i) decoder[b64.charCodeAt(i)] = i;
      for (i = 0; i < ignore.length; ++i) {
        decoder[ignore.charCodeAt(i)] = -1;
      }
      // RFC 3548 URL & file safe encoding
      decoder['-'.charCodeAt(0)] = decoder['+'.charCodeAt(0)];
      decoder['_'.charCodeAt(0)] = decoder['/'.charCodeAt(0)];
    }
    if (!haveU8) throw Error('不支持Uint8Array . ');
    let out = new Uint8Array(a.length * 3 >> 2);
    // let out = haveU8 ? new Uint8Array(a.length * 3 >> 2) : [];
    let bits = 0;
    let char_count = 0;
    let len = 0;
    for (i = 0; i < a.length; ++i) {
      let c = isString ? (a as string).charCodeAt(i) : (a as Uint8Array)[i];
      if (c === 61) // '='.charCodeAt(0)
      { break }
      c = decoder[c];
      if (c === -1) continue;
      if (c === undefined) throw Error('Illegal character at offset ' + i);
      bits |= c;
      if (++char_count >= 4) {
        out[len++] = (bits >> 16);
        out[len++] = (bits >> 8) & 0xFF;
        out[len++] = bits & 0xFF;
        bits = 0;
        char_count = 0;
      } else {
        bits <<= 6;
      }
    }
    switch (char_count) {
      case 1:
        throw Error('Base64 encoding incomplete: at least 2 bits missing');
      case 2:
        out[len++] = (bits >> 10);
        break;
      case 3:
        out[len++] = (bits >> 16);
        out[len++] = (bits >> 8) & 0xFF;
        break;
    }
    if (haveU8 && out.length > len) { // in case it was originally longer because of ignored characters
      out = out.subarray(0, len);
    }
    return out;
  }

  static pretty(str: string): string {
    // fix padding
    if (str.length % 4 > 0) str = (str + '===').slice(0, str.length + str.length % 4);
    // convert RFC 3548 to standard Base64
    str = str.replace(/-/g, '+').replace(/_/g, '/');
    // 80 column width
    return str.replace(/(.{80})/g, '$1\n');
  }

  static re = /-----BEGIN [^-]+-----([A-Za-z0-9+/=\s]+)-----END [^-]+-----|begin-base64[^\n]+\n([A-Za-z0-9+/=\s]+)====|^([A-Za-z0-9+/=\s]+)$/;

  static unarmor(a: string): Uint8Array {
    const m = Base64.re.exec(a);
    if (m) {
      if (m[1]) a = m[1];
      else if (m[2]) a = m[2];
      else if (m[3]) a = m[3];
      else throw Error('RegExp out of sync');
    }
    return Base64.decode(a);
  }
}

