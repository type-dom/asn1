import { ASN1DOM } from './dom';
import { Base64 } from './base64';
import { Hex } from './hex';
const reHex = /^\s*(?:[0-9A-Fa-f][0-9A-Fa-f]\s*)+$/;

function decode(der: Uint8Array, offset?: number) {
  offset = offset || 0;
  try {
    const asn1 = ASN1DOM.decode(der, offset);
  } catch (e) {
    console.error('decode error is ', e);
  }
}
function decodeText(val: string) {
  try {
    let der = reHex.test(val) ? Hex.decode(val) : Base64.unarmor(val);
    decode(der);
  } catch (e) {
    console.error('decodeText error is ', e);
  }
}
