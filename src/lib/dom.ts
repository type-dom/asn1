// ASN.1 JavaScript decoder
// Copyright (c) 2008-2023 Lapo Luchini <lapo@lapo.it>

// Permission to use, copy, modify, and/or distribute this software for any
// purpose with or without fee is hereby granted, provided that the above
// copyright notice and this permission notice appear in all copies.
//
// THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
// WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
// ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
// WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
// ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
// OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
import { ASN1 } from './asn1';
// import { oids } from './oids';
import { Stream } from './stream';
import { ASN1Tag } from './asn1-tag';
// const ASN1 = require('./asn1'),
//     oids = require('./oids'),
// const lineLength = 80;
// const contentLength = 8 * lineLength;
const DOM = {
  ellipsis: '\u2026',
  tag: function (nodeName: string, className: string): HTMLElement {
    const t = document.createElement(nodeName);
    t.className = className;
    return t;
  },
  text: function (str: string) {
    return document.createTextNode(str);
  },
  space: function () {
    const t = document.createElement('span');
    t.className = 'spaces';
    t.innerHTML = ' ';
    return t;
  },
  breakLines: function (str: string, length: number) {
    const lines = str.split(/\r?\n/);
    let o = '';
    for (let i = 0; i < lines.length; ++i) {
      let line = lines[i];
      if (i > 0) o += '\n';
      while (line.length > length) {
        o += line.substring(0, length);
        o += '\n';
        line = line.substring(length);
      }
      o += line;
    }
    return o;
  }
};
export class ASN1DOM extends ASN1 {
  // def: any;
  // private node: any;
  // private head: any;
  // sub: ASN1DOM[];
  // toNode(spaces?: string) {
  //   spaces = spaces || '';
  //   let isOID = (typeof oids === 'object') && (this.tag?.isUniversal() && (this.tag.tagNumber === 0x06) || (this.tag?.tagNumber === 0x0D));
  //   let node = new XmlNode('root');
  //   // node.asn1 = this;
  //   let head = new XmlNode('head');
  //   // const spacesNode = new XmlNode(spaces);
  //   // spaces.nodeValue = this.typeName()?.replace(/_/g, ' ');
  //   // head.innerHTML = "<span class='spaces'>" + spaces + '</span>' + this.typeName()?.replace(/_/g, ' ');
  //   if (this.def && this.def.id) {
  //     let name = new XmlNode('name');
  //     name.nodeValue = this.def.id + ' ';
  //     // head.prepend(name);
  //     head.children.unshift(name);
  //   }
  //   let content = this.content(contentLength);
  //   let oid;
  //   if (content !== null) {
  //     let preview = new XmlNode('preview'); // DOM.tag('span', 'preview');
  //     let shortContent;
  //     if (isOID) content = content.split('\n', 1)[0];
  //     shortContent = (content.length > lineLength) ? content.substring(0, lineLength) + DOM.ellipsis : content;
  //     preview.children.push(DOM.space());
  //     preview.children.push(DOM.text(shortContent));
  //     if (isOID) {
  //       oid = oids[content];
  //       if (oid) {
  //         if (oid.d) {
  //           // preview.children.push('  ');
  //           let oidd = new XmlNode('oid description');
  //           oidd.children.push(new XmlNode('#text', oid.d));
  //           preview.children.push(oidd);
  //         }
  //         if (oid.c) {
  //           // preview.children.push(DOM.space());
  //           let oidc = new XmlNode('oid comment'); // DOM.tag('span', 'oid comment');
  //           oidc.appendChild(DOM.text('(' + oid.c + ')'));
  //           preview.appendChild(oidc);
  //         }
  //       }
  //     }
  //     head.appendChild(preview);
  //     content = DOM.breakLines(content, lineLength);
  //     content = content.replace(/</g, '&lt;');
  //     content = content.replace(/\n/g, '<br>');
  //   }
  //   node.appendChild(head);
  //   this.node = node;
  //   this.head = head;
  //   let value = DOM.tag('div', 'value');
  //   let s = 'Offset: ' + this.stream.pos + '<br>';
  //   s += 'Length: ' + this.header + '+';
  //   if (this.length >= 0) s += this.length;
  //   else s += (-this.length) + ' (undefined)';
  //   if (this.tag?.tagConstructed) s += '<br>(constructed)';
  //   else if ((this.tag?.isUniversal() && ((this.tag.tagNumber === 0x03) || (this.tag.tagNumber === 0x04))) && (this.sub !== null)) s += '<br>(encapsulates)';
  //   // TODO if (this.tag.isUniversal() && this.tag.tagNumber == 0x03) s += "Unused bits: "
  //   if (content !== null) {
  //     s += '<br>Value:<br><b>' + content + '</b>';
  //     if (isOID && oid) {
  //       if (oid.d) s += '<br>' + oid.d;
  //       if (oid.c) s += '<br>' + oid.c;
  //       if (oid.w) s += '<br>(warning!)';
  //     }
  //   }
  //   value.innerHTML = s;
  //   node.appendChild(value);
  //   let sub = DOM.tag('div', 'sub');
  //   if (this.sub !== null) {
  //     spaces += '\xA0 ';
  //     for (let i = 0, max = this.sub.length; i < max; ++i) sub.appendChild((this.sub[i] as ASN1DOM).toDOM(spaces));
  //   }
  //   node.appendChild(sub);
  //   return node;
  // }
  // toHexDOM_sub(node: Node, className: string, stream: Stream, start: number, end: number) {
  //   if (start >= end) return;
  //   const sub = DOM.tag('span', className);
  //   sub.appendChild(DOM.text(stream.hexDump(start, end)));
  //   node.appendChild(sub);
  // }
  // toHexDOM(root?: any, , trim=true) {
  //   const node = DOM.tag('span', 'hex');
  //   if (root === undefined) root = node;
  //   this.head.hexNode = node;
  //   this.head.onmouseover = function () { this.hexNode.className = 'hexCurrent' };
  //   this.head.onmouseout = function () { this.hexNode.className = 'hex' };
  //   node.asn1 = this;
  //   node.onmouseover = function () {
  //     const current = !root.selected;
  //     if (current) {
  //       root.selected = this.asn1;
  //       this.className = 'hexCurrent';
  //     }
  //     this.asn1.fakeHover(current);
  //   };
  //   node.onmouseout = function () {
  //     const current = (root.selected === this.asn1);
  //     this.asn1.fakeOut(current);
  //     if (current) {
  //       root.selected = null;
  //       this.className = 'hex';
  //     }
  //   };
  //   if (root === node) {
  //     const lineStart = this.posStart() & 0xF;
  //     if (lineStart !== 0) {
  //       const skip = DOM.tag('span', 'skip');
  //       let skipStr = '';
  //       for (let j = lineStart; j > 0; --j) skipStr += '   ';
  //       if (lineStart >= 8) skipStr += ' ';
  //       skip.innerText = skipStr;
  //       node.appendChild(skip);
  //     }
  //   }
  //   this.toHexDOM_sub(node, 'tag', this.stream, this.posStart(), this.posLen());
  //   this.toHexDOM_sub(node, (this.length >= 0) ? 'dlen' : 'ulen', this.stream, this.posLen(), this.posContent());
  //   if (this.sub === null) {
  //     const start = this.posContent();
  //     const end = this.posEnd();
  //     if (!trim || end - start < 10 * 16) { node.appendChild(DOM.text(
  //       this.stream.hexDump(start, end))); }
  //     else {
  //       const end1 = start + 5 * 16 - (start & 0xF);
  //       const start2 = end - 16 - (end & 0xF);
  //       node.appendChild(DOM.text(
  //         this.stream.hexDump(start, end1)));
  //       const sub = DOM.tag('span', 'skip');
  //       sub.appendChild(DOM.text('\u2026 skipping ' + (start2 - end1) + ' bytes \u2026\n'));
  //       node.appendChild(sub);
  //       node.appendChild(DOM.text(
  //         this.stream.hexDump(start2, end)));
  //     }
  //   } else if (this.sub.length > 0) {
  //     const first = this.sub[0];
  //     const last = this.sub[this.sub.length - 1];
  //     this.toHexDOM_sub(node, 'intro', this.stream, this.posContent(), first.posStart());
  //     for (let i = 0, max = this.sub.length; i < max; ++i) node.appendChild((this.sub[i] as ASN1DOM).toHexDOM(root, trim));
  //     this.toHexDOM_sub(node, 'outro', this.stream, last.posEnd(), this.posEnd());
  //   } else { this.toHexDOM_sub(node, 'outro', this.stream, this.posContent(), this.posEnd()) }
  //   return node;
  // }
  static decode(stream1: Stream | Uint8Array, offset = 0): ASN1DOM {
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
          throw Error('Container at offset ' + start + ' has a length of ' + len + ', which is past the end of the stream');
        }
        while (stream.pos < end) {
          sub[sub.length] = ASN1DOM.decode(stream);
        }
        if (stream.pos !== end) {
          throw Error('Content size is not correct for container at offset ' + start);
        }
      } else {
        // undefined length
        try {
          for (; ;) {
            const s = ASN1DOM.decode(stream);
            if (s.tag?.isEOC()) {
              break;
            }
            sub[sub.length] = s;
          }
          len = start - stream.pos; // undefined lengths are represented as negative values
        } catch (e) {
          throw Error('Exception while decoding undefined length content at offset ' + start + ': ' + e);
        }
      }
      return sub;
    };
    if (tag.tagConstructed) {
      // must have valid content
      getSub();
    } else if (tag.isUniversal() && ((tag.tagNumber === 0x03) || (tag.tagNumber === 0x04))) {
      // sometimes BitString and OctetString are used to encapsulate ASN.1
      try {
        if (tag.tagNumber === 0x03) {
          if (stream.get() !== 0) {
            throw Error('BIT STRINGs with unused bits cannot encapsulate.');
          }
        }
        sub = getSub();
        // todo sub作为全局变量，已经变为 ASN1[] 了；不可能为null;
        for (let i = 0; i < sub.length; ++i) {
          if (sub[i].tag?.isEOC()) throw Error('EOC is not supposed to be actual content.');
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
        throw Error('We can\'t skip over an invalid tag with undefined length at offset ' + start);
      }
      sub = []; // todo add by xjf ??why??  this.sub为数组
      stream.pos = start + Math.abs(len);
    }
    // eslint-disable-next-line new-cap
    return new ASN1DOM(streamStart, header, len!, tag, tagLen, sub);
  }
}
