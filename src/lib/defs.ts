// ASN.1 RFC definitions matcher
// Copyright (c) 2023-2023 Lapo Luchini <lapo@lapo.it>

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

// (typeof define != 'undefined' ? define : function (factory) { 'use strict';
//     if (typeof module == 'object') module.exports = factory(function (name) { return require(name); });
//     else window.defs = factory(function (name) { return window[name.substring(2)]; });
// })(function (require) {
// 'use strict';

// const rfc: Record<string, any> = {}; // require('./rfcdef');
import { ASN1 } from './asn1';
import { IModule, IType, rfcdef as rfc } from './rfcdef';
function translate(def: any, tn?: string) {
  const id = def?.id;
  if (def?.type === 'tag' && !def.explicit) {
    // def.type = def.content[0].type;
    def = def?.content[0].type;
  }
  while (def?.type === 'defined' || def?.type?.type === 'defined') {
    const name = def?.type?.type ? def.type.name : def.name;
    def = Object.assign({}, def);
    def.type = Defs.searchType(name).type;
  }
  if (def?.type?.name === 'CHOICE') {
    for (let c of def.type.content) {
      c = translate(c);
      if (tn === c.type.name || tn === c.name) {
        def = Object.assign({}, def);
        def.type = c.type.name ? c.type : c;
        break;
      }
    }
  }
  if (id) def = Object.assign({}, def, { id }) as IType;
  return def ?? { type: {}};
}

function firstUpper(s: string[]) {
  return s[0].toUpperCase() + s.slice(1);
}

export class Defs {
  static moduleAndType(mod: any, name: string): IModule {
    return Object.assign({ module: { oid: mod.oid, name: mod.name, source: mod.source }}, mod.types[name]);
  }

  static searchType(name: string): any {
    for (const mod of Object.values(rfc)) {
      if (name in mod.types) {
        // console.log(name + ' found in ' + r.name);
        // return r.types[name];
        return Defs.moduleAndType(mod, name);
      }
    }
    throw Error('Type not found: ' + name);
  }

  static match(value: ASN1, def: any, stats: { defs: any; total: number; recognized: number } = { total: 0, recognized: 0, defs: {}}): any {
    value.def = {};
    const tn = value.typeName();
    def = translate(def, tn);
    ++stats.total;
    if (def?.type) {
      value.def = def;
      if (def.id || def.name) ++stats.recognized;
    }
    if (value.sub !== null) {
      if (def?.type?.type) def = def.type;
      let j = def?.content ? 0 : -1;
      for (const subval of value.sub) {
        let type;
        if (j >= 0) {
          if (def.typeOf) { type = def.content[0] }
          else {
            // let tn = subval.typeName().replaceAll('_', ' ');
            const tn = subval.typeName()?.replace('_/g', ' ');
            do {
              type = def.content[j++];
              // type = translate(type, tn);
              if (type?.type?.type) type = type.type;
            } while (type && typeof type == 'object' && ('optional' in type || 'default' in type) && type.name != 'ANY' && type.name != tn);
            if (type?.type == 'builtin' || type?.type == 'defined') {
              let v: string | string[] | null = subval.content();
              if (typeof v == 'string')
                v = v.split(/\n/);
              stats.defs[type.id] = v;
            }else if (type?.definedBy && stats.defs?.[type.definedBy]?.[1]) { // hope current OIDs contain the type name (will need to parse from RFC itself)
              try {
                type = Defs.searchType(firstUpper(stats.defs[type.definedBy][1]));
              } catch (e) {
                console.error(e);
              }
            }
          }
        }
        Defs.match(subval, type, stats);
      }
    }
    return stats;
  }

  static RFC = rfc;
  static commonTypes = [
    [ 'X.509 certificate', '1.3.6.1.5.5.7.0.18', 'Certificate' ],
    [ 'CMS / PKCS#7 envelope', '1.2.840.113549.1.9.16.0.14', 'ContentInfo' ],
    [ 'PKCS#8 encrypted private key', '1.2.840.113549.1.8.1.1', 'EncryptedPrivateKeyInfo' ],
    [ 'PKCS#8 private key', '1.2.840.113549.1.8.1.1', 'PrivateKeyInfo' ],
    [ 'PKCS#10 certification request', '1.2.840.113549.1.10.1.1', 'CertificationRequest' ],
    [ 'CMP PKI Message', '1.3.6.1.5.5.7.0.16', 'PKIMessage' ],
  ].map(arr => ({ description: arr[0], ...Defs.moduleAndType(rfc[arr[1]], arr[2]) }));
}
