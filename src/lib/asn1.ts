// ASN.1 JavaScript decoder
// Copyright (c) 2008-2023 Lapo Luchini <lapo@lapo.it>
import { ASN1Tag } from './asn1-tag';
import { Stream } from './stream';
import { IDescription } from './asn1.interface';
// 递归
// OctetString 八位字节串
type IParseType =
  | 'parseStringUTF'
  | 'parseStringT61'
  | 'parseStringISO'
  | 'parseStringBMP'
  | 'parseBitString'
  | 'parseOctetString';
export function recurse(
  el: ASN1,
  parser: IParseType,
  maxLength: number
): IDescription {
  let avoidRecurse = true;
  if (el.tag?.tagConstructed && el.sub) {
    avoidRecurse = false;
    el.sub.forEach(function (e1: ASN1) {
      if (
        e1.tag?.tagClass !== el.tag?.tagClass ||
        e1.tag?.tagNumber !== el.tag?.tagNumber
      ) {
        avoidRecurse = true;
      }
    });
  }
  if (avoidRecurse) {
    return el.stream[parser](
      el.posContent(),
      el.posContent() + Math.abs(el.length),
      maxLength
    );
  }
  const d = { size: 0, str: '' };
  el.sub?.forEach(function (el: ASN1) {
    const d1 = recurse(el, parser, maxLength - d.str.length);
    d.size += d1.size;
    d.str += d1.str;
  });
  return d;
}
export class ASN1 {
  stream: Stream;
  header: number;
  length: number;
  tag?: ASN1Tag;
  tagLen: number;
  sub: ASN1[]; // todo null ???? 不用null会有什么问题
  def: any;

  constructor(
    stream: Stream,
    header: number,
    length: number,
    tag: ASN1Tag | unknown,
    tagLen: number,
    sub: ASN1[] | null
  ) {
    if (!(tag instanceof ASN1Tag)) throw Error('Invalid tag value.');
    this.stream = stream;
    this.header = header;
    this.length = length;
    this.tag = tag;
    this.tagLen = tagLen;
    this.sub = sub || [];
  }

  typeName(): string | undefined {
    if (this.tag === undefined) {
      // throw Error('this.tag is undefined . ');
      return undefined;
    }
    switch (this.tag.tagClass) {
      case 0: // universal
        switch (this.tag.tagNumber) {
          case 0x00:
            return 'EOC';
          case 0x01:
            return 'BOOLEAN';
          case 0x02:
            return 'INTEGER';
          case 0x03:
            return 'BIT_STRING';
          case 0x04:
            return 'OCTET_STRING';
          case 0x05:
            return 'NULL';
          case 0x06:
            return 'OBJECT_IDENTIFIER';
          case 0x07:
            return 'ObjectDescriptor';
          case 0x08:
            return 'EXTERNAL';
          case 0x09:
            return 'REAL';
          case 0x0a:
            return 'ENUMERATED';
          case 0x0b:
            return 'EMBEDDED_PDV';
          case 0x0c:
            return 'UTF8String';
          case 0x0d:
            return 'RELATIVE_OID';
          case 0x10:
            return 'SEQUENCE';
          case 0x11:
            return 'SET';
          case 0x12:
            return 'NumericString';
          case 0x13:
            return 'PrintableString'; // ASCII subset
          case 0x14:
            return 'TeletexString'; // aka T61String
          case 0x15:
            return 'VideotexString';
          case 0x16:
            return 'IA5String'; // ASCII
          case 0x17:
            return 'UTCTime';
          case 0x18:
            return 'GeneralizedTime';
          case 0x19:
            return 'GraphicString';
          case 0x1a:
            return 'VisibleString'; // ASCII subset
          case 0x1b:
            return 'GeneralString';
          case 0x1c:
            return 'UniversalString';
          case 0x1e:
            return 'BMPString';
        }
        return 'Universal_' + this.tag.tagNumber.toString();
      case 1:
        return 'Application_' + this.tag.tagNumber.toString();
      case 2:
        return '[' + this.tag.tagNumber.toString() + ']'; // Context
      case 3:
        return 'Private_' + this.tag.tagNumber.toString();
      default:
        return undefined;
    }
  }

  /** A string preview of the content (intended for humans). */
  content(maxLength?: number): string | null {
    console.log('content . ');
    console.log('maxLength is ', maxLength);
    if (this.tag === undefined) return null;
    if (maxLength === undefined) maxLength = Infinity;
    const content = this.posContent();
    const len = Math.abs(this.length);
    if (!this.tag.isUniversal()) {
      if (this.sub !== null) return '(' + this.sub.length + ' elem)';
      const d1 = this.stream.parseOctetString(content, content + len, maxLength);
      return '(' + d1.size + ' byte)\n' + d1.str;
    }
    switch (this.tag.tagNumber) {
      case 0x01: // BOOLEAN
        return this.stream.get(content) === 0 ? 'false' : 'true';
      case 0x02: // INTEGER
        return this.stream.parseInteger(content, content + len);
      case 0x03: {
        // BIT_STRING
        const d = recurse(this, 'parseBitString', maxLength);
        return '(' + d.size + ' bit)\n' + d.str;
      }
      case 0x04: {
        // OCTET_STRING
        const d = recurse(this, 'parseOctetString', maxLength);
        return '(' + d.size + ' byte)\n' + d.str;
      }
      // case 0x05: // NULL
      case 0x06: // OBJECT_IDENTIFIER
        return this.stream.parseOID(content, content + len, maxLength);
      // case 0x07: // ObjectDescriptor
      // case 0x08: // EXTERNAL
      // case 0x09: // REAL
      case 0x0a: // ENUMERATED
        return this.stream.parseInteger(content, content + len);
      // case 0x0B: // EMBEDDED_PDV
      case 0x0d: // RELATIVE-OID
        return this.stream.parseRelativeOID(content, content + len, maxLength);
      case 0x10: // SEQUENCE
      case 0x11: // SET
        if (this.sub !== null) return '(' + this.sub.length + ' elem)';
        else return '(no elem)';
      case 0x0c: // UTF8String
        return recurse(this, 'parseStringUTF', maxLength).str;
      case 0x14: // TeletexString
        return recurse(this, 'parseStringT61', maxLength).str;
      case 0x12: // NumericString
      case 0x13: // PrintableString
      case 0x15: // VideotexString
      case 0x16: // IA5String
      case 0x1a: // VisibleString
      case 0x1b: // GeneralString
        // case 0x19: // GraphicString
        // case 0x1C: // UniversalString
        return recurse(this, 'parseStringISO', maxLength).str;
      case 0x1e: // BMPString
        return recurse(this, 'parseStringBMP', maxLength).str;
      case 0x17: // UTCTime
      case 0x18: // GeneralizedTime
        return this.stream.parseTime(
          content,
          content + len,
          this.tag.tagNumber === 0x17
        );
    }
    return null;
  }

  toString(): string {
    return (
      this.typeName() +
      '@' +
      this.stream.pos +
      '[header:' +
      this.header +
      ',length:' +
      this.length +
      ',sub:' +
      (this.sub === null ? ' null ' : this.sub.length) +
      ']'
    );
  }

  toPrettyString(indent?: string): string {
    if (indent === undefined) indent = '';
    let s = indent + this.typeName() + ' @' + this.stream.pos;
    if (this.length >= 0) {
      s += '+';
    }
    s += this.length;
    if (this.tag?.tagConstructed) {
      s += ' (constructed)';
    } else if (
      this.tag?.isUniversal() &&
      (this.tag?.tagNumber === 0x03 || this.tag?.tagNumber === 0x04) &&
      this.sub !== null
    ) {
      s += ' (encapsulates)';
    }
    const content = this.content();
    if (content) {
      s += ': ' + content.replace(/\n/g, '|');
    }
    s += '\n';
    if (this.sub !== null) {
      indent += '  ';
      for (let i = 0, max = this.sub.length; i < max; ++i) {
        s += this.sub[i].toPrettyString(indent);
      }
    }
    return s;
  }

  posStart(): number {
    return this.stream.pos;
  }

  posContent(): number {
    return this.stream.pos + this.header;
  }

  posEnd(): number {
    return this.stream.pos + this.header + Math.abs(this.length);
  }

  /** Position of the length. */
  posLen(): number {
    return this.stream.pos + this.tagLen;
  }

  toHexString(): string {
    return this.stream.hexDump(this.posStart(), this.posEnd(), true);
  }

  toB64String(): string {
    return this.stream.b64Dump(this.posStart(), this.posEnd());
  }

  static decodeLength(stream: Stream): number | null {
    let buf = stream.get();
    const len = buf & 0x7f;
    if (len === buf) {
      // first bit was 0, short form
      return len;
    }
    if (len === 0) {
      // long form with length 0 is a special case
      return null; // undefined;
    } // undefined length ??? 为什么不直接是 0 ???
    if (len > 6) {
      // no reason to use Int10, as it would be a huge buffer anyways
      throw Error(
        'Length over 48 bits not supported at position ' + (stream.pos - 1)
      );
    }
    buf = 0;
    for (let i = 0; i < len; ++i) {
      buf = buf * 256 + stream.get();
    }
    return buf;
  }

  static decode(stream1: Stream | Uint8Array, offset = 0, type = ASN1): ASN1 {
    // console.log('asn1 decode . ');
    // console.log('stream1 is ', stream1);
    let stream: Stream;
    if (!(stream1 instanceof Stream)) {
      stream = new Stream(stream1, offset);
    } else {
      stream = stream1;
    }
    const streamStart = new Stream(stream);
    const tag = new ASN1Tag(stream);
    const tagLen = stream.pos - streamStart.pos;
    let len = ASN1.decodeLength(stream);
    const start = stream.pos;
    const header = start - streamStart.pos;
    let sub: ASN1[] | null = null;
    const getSub = function () {
      sub = [];
      if (len !== null) {
        // definite length
        const end = start + len;
        if (end > stream.enc.length) {
          throw Error(
            'Container at offset ' +
              start +
              ' has a length of ' +
              len +
              ', which is past the end of the stream'
          );
        }
        while (stream.pos < end) {
          sub[sub.length] = ASN1.decode(stream);
        }
        if (stream.pos !== end) {
          throw Error(
            'Content size is not correct for container at offset ' + start
          );
        }
      } else {
        // undefined length
        try {
          for (;;) {
            const s = ASN1.decode(stream);
            if (s.tag?.isEOC()) {
              break;
            }
            sub[sub.length] = s;
          }
          len = start - stream.pos; // undefined lengths are represented as negative values
        } catch (e) {
          throw Error(
            'Exception while decoding undefined length content at offset ' +
              start +
              ': ' +
              e
          );
        }
      }
      return sub; // add by xjf
    };
    if (tag.tagConstructed) {
      // must have valid content
      getSub();
    } else if (
      tag.isUniversal() &&
      (tag.tagNumber === 0x03 || tag.tagNumber === 0x04)
    ) {
      // sometimes BitString and OctetString are used to encapsulate ASN.1
      try {
        if (tag.tagNumber === 0x03) {
          if (stream.get() !== 0) {
            throw Error('BIT STRINGs with unused bits cannot encapsulate.');
          }
        }
        sub = getSub(); // add by xjf
        // getSub(); // 原来的代码
        // todo sub作为全局变量，已经变为 ASN1[] 了；不可能为null;
        for (let i = 0; i < sub.length; ++i) {
          if (sub[i].tag?.isEOC()) {
            throw Error('EOC is not supposed to be actual content.');
          }
        }
      } catch (e) {
        // but silently ignore when they don't
        sub = null;
        // DEBUG console.log('Could not decode structure at ' + start + ':', e);
        // console.error('Could not decode structure at ' + start + ':', e);
      }
    }
    if (sub === null) {
      if (len === null) {
        throw Error(
          "We can't skip over an invalid tag with undefined length at offset " +
            start
        );
      }
      // sub = []; // todo add by xjf ??why??  this.sub为数组
      stream.pos = start + Math.abs(len);
    }
    return new ASN1(streamStart, header, len!, tag, tagLen, sub);
  }
}
