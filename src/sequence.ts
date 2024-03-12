// ASN.1 标签类型
export enum AsnTag {
  Boolean = 0x01,
  Integer = 0x02,
  BitString = 0x03,
  OctetString = 0x04,
  Null = 0x05,
  ObjectIdentifier = 0x06,
  Sequence = 0x30,
  Set = 0x31,
}

// ASN.1 元素接口
interface AsnElement {
  type: AsnTag;
  length: number;
  value: any,
}

// 实现 ASN.1 序列化与反序列化的类
export class AsnEncoder {

  // 将 ASN.1 元素编码成字节数组
  static encode(element: AsnElement): Uint8Array {
    let encoded: Uint8Array;

    // 编码 ASN.1 标签
    const tag = new Uint8Array(1);
    tag[0] = element.type;

    // 编码 ASN.1 长度
    let lengthBytes: Uint8Array;
    if (element.length < 128) {
      lengthBytes = new Uint8Array(1);
      lengthBytes[0] = element.length;
    } else {
      const lengthOctets = Math.ceil(Math.log2(element.length + 1) / 8);
      lengthBytes = new Uint8Array(lengthOctets + 1);
      lengthBytes[0] = 0x80 | lengthOctets;
      for (let i = lengthOctets; i > 0; i--) {
        lengthBytes[i] = element.length & 0xFF;
        element.length >>= 8;
      }
    }

    // 编码 ASN.1 值
    if (element.type === AsnTag.Boolean) {
      encoded = new Uint8Array(2);
      encoded[1] = element.value ? 0xFF : 0x00;
    } else if (element.type === AsnTag.Integer) {
      encoded = new Uint8Array(lengthBytes.length + element.length);
      encoded.set(lengthBytes, 1);
      encoded.set(element.value, lengthBytes.length + 1);
    } else if (element.type === AsnTag.BitString) {
      encoded = new Uint8Array(lengthBytes.length + element.length + 1);
      encoded.set(lengthBytes, 1);
      encoded[1 + lengthBytes.length] = 0x00; // 这里假设位字符串是无补位的
      encoded.set(element.value, lengthBytes.length + 2);
    } else if (element.type === AsnTag.OctetString) {
      encoded = new Uint8Array(lengthBytes.length + element.length);
      encoded.set(lengthBytes, 1);
      encoded.set(element.value, lengthBytes.length + 1);
    } else if (element.type === AsnTag.Null) {
      encoded = new Uint8Array(2);
    } else if (element.type === AsnTag.ObjectIdentifier) {
      let subidentifiers = element.value.split('.').map(Number);
      const firstByte = subidentifiers[0] * 40 + subidentifiers[1];
      subidentifiers = subidentifiers.slice(2);
      let encodedIdentifiers: number[] = [];
      for (let id of subidentifiers) {
        const encodedId: number[] = [];
        do {
          encodedId.unshift(id & 0x7F);
          id >>= 7;
        } while (id > 0);
        encodedId[encodedId.length - 1] |= 0x80;
        encodedIdentifiers = encodedIdentifiers.concat(encodedId);
      }
      encoded = new Uint8Array(lengthBytes.length + encodedIdentifiers.length + 1);
      encoded.set(lengthBytes, 1);
      encoded[1 + lengthBytes.length] = firstByte;
      encoded.set(encodedIdentifiers, 2 + lengthBytes.length);
    } else if (element.type === AsnTag.Sequence || element.type === AsnTag.Set) {
      const subencoded = element.value.map(this.encode);
      const totalLength = subencoded.reduce((acc: number, val: Uint8Array) => acc + val.length, 0);
      encoded = new Uint8Array(lengthBytes.length + totalLength);
      encoded.set(lengthBytes, 1);
      let offset = lengthBytes.length + 1;
      for (let i = 0; i < subencoded.length; i++) {
        encoded.set(subencoded[i], offset);
        offset += subencoded[i].length;
      }
    } else {
      throw new Error('Unsupported ASN.1 type');
    }

    // 返回编码后的字节数组
    encoded.set(tag, 0);
    return encoded;
  }

  // 将字节数组解码成 ASN.1 元素
  static decode(data: Uint8Array): AsnElement {
    let cursor = 0;

    // 解码 ASN.1 标签
    const tag = data[cursor];
    cursor += 1;

    // 解码 ASN.1 长度
    let lengthBytes = 1;
    if ((tag & 0x1F) === 0x1F) {
      // ASN.1 长度的长度超过了一个字节
      lengthBytes = (tag & 0x7F) - 1;
      let remaining = lengthBytes;
      while (remaining > 0) {
        const nextByte = data[cursor];
        cursor += 1;
        lengthBytes = (lengthBytes << 8) + nextByte;
        remaining -= 1;
      }
    } else if ((tag & 0x80) === 0x80) {
      // ASN.1 长度用了多个字节，但是第一个字节指示了长度的长度
      lengthBytes = tag & 0x7F;
      let remaining = lengthBytes;
      while (remaining > 0) {
        const nextByte = data[cursor];
        cursor += 1;
        lengthBytes = (lengthBytes << 8) + nextByte;
        remaining -= 1;
      }
    }

    // 解码 ASN.1 值
    let value: Uint8Array | AsnElement[] | string | boolean | null;
    if (tag === AsnTag.Boolean) {
      value = (data[cursor] !== 0x00);
      cursor += 1;
    } else if (tag === AsnTag.Integer || tag === AsnTag.BitString || tag === AsnTag.OctetString) {
      value = data.slice(cursor, cursor + lengthBytes);
      cursor += lengthBytes;
    } else if (tag === AsnTag.Null) {
      value = null;
    } else if (tag === AsnTag.ObjectIdentifier) {
      const subidentifiers: number[] = [];
      const firstByte = data[cursor];
      subidentifiers.push((firstByte / 40) | 0);
      subidentifiers.push(firstByte % 40);
      cursor += 1;
      let nextByte;
      while (cursor < data.length) {
        let subidentifier = 0;
        do {
          nextByte = data[cursor];
          cursor += 1;
          subidentifier = (subidentifier << 7) + (nextByte & 0x7F);
        } while ((nextByte & 0x80) === 0x80);
        subidentifiers.push(subidentifier);
      }
      value = subidentifiers.join('.');
    } else if (tag === AsnTag.Sequence || tag === AsnTag.Set) {
      value = [];
      const endPos = cursor + lengthBytes;
      while (cursor < endPos) {
        const subencoded = data.subarray(cursor);
        const subelement = this.decode(subencoded);
        value.push(subelement);
        cursor += subencoded.length - subelement.length;
      }
    } else {
      throw new Error('Unsupported ASN.1 type');
    }

    // 返回解码后的 ASN.1 元素
    return { type: tag, length: lengthBytes, value };
  }
}
// // 编码 ASN.1 序列
// const encoded = AsnEncoder.encode({
//   type: AsnTag.Sequence,
//   length: 34,
//   value: [
//     {
//       type: AsnTag.Integer,
//       length: 2,
//       value: new Uint8Array([0x01, 0x23]),
//     },
//     {
//       type: AsnTag.ObjectIdentifier,
//       length: 7,
//       value: '1.2.840.113549.1.1.5',
//     },
//     {
//       type: AsnTag.Null,
//       length: 0,
//       value: null,
//     },
//     {
//       type: AsnTag.Sequence,
//       length: 11,
//       value: [
//         {
//           type: AsnTag.OctetString,
//           length: 3,
//           value: new Uint8Array([0x01, 0x02, 0x03]),
//         },
//         {
//           type: AsnTag.Boolean,
//           length: 1,
//           value: true,
//         },
//       ],
//     },
//   ],
// });
// console.log(encoded); // 打印编码后的字节数组
//
// // 解码 ASN.1 序列
// const decoded = AsnEncoder.decode(encoded);
// console.log(decoded); // 打印解码后的 ASN.1 元素
