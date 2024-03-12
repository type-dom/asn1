import { Int10 } from './int10';
import { Stream } from './stream';
export class ASN1Tag {
  tagClass: number;
  tagConstructed: boolean;
  tagNumber: number | Int10;
  constructor(stream: Stream) {
    let buf = stream.get();
    this.tagClass = buf >> 6;
    this.tagConstructed = ((buf & 0x20) !== 0);
    this.tagNumber = buf & 0x1F;
    if (this.tagNumber === 0x1F) { // long tag
      let n = new Int10();
      do {
        buf = stream.get();
        n.mulAdd(128, buf & 0x7F);
      } while (buf & 0x80);
      this.tagNumber = n.simplify();
    }
  }
  isUniversal(): boolean {
    return this.tagClass === 0x00;
  }
  isEOC(): boolean {
    return this.tagClass === 0x00 && this.tagNumber === 0x00;
  }
}
