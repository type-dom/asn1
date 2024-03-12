//
// interface ILength {
//   length: number,
//   numBytes: number
// }
//
// interface ITLV {
//   tag: number,
//   length: ILength,
//   value: string,
// }
// interface IElement {
//   tag: number,
//   length: ILength,
//   value: ITLV[],
// }
//
// interface ISignerInfo {
//   name?: string,
//   certificate: string,
//   time: Date,
//   email?: string
// }
// interface ISignatureValue {
//   algorithm: string,
//   value: string
// }
// interface ISignedValue {
//   signer: ISignerInfo,
//   digest: ISignatureValue,
//   signature: ISignatureValue
// }
// export function parseSignedValue(signedData: string): ISignedValue {
//   // Base64解码
//   const binaryData = atob(signedData);
//
//   // 解析DER编码的ASN.1结构
//   const asn1Data = parseASN1(binaryData);
//
//   // 解析签名信息
//   const signerInfo = parseSignerInfo(asn1Data);
//
//   // 解析签名数据
//   const signedDigest = parseSignedDigest(asn1Data);
//
//   // 解析签名值
//   const signatureValue = parseSignatureValue(asn1Data);
//
//   return {
//     signer: signerInfo,
//     digest: signedDigest,
//     signature: signatureValue
//   };
// }
//
// function parseASN1(binaryData: string): IElement[] {
//   // 解析ASN.1的TLV结构
//   const tlv = parseTLV(binaryData);
//
//   // 解析SEQUENCE结构
//   const seq = parseSEQUENCE(tlv.value);
//
//   // 将SEQUENCE结构的每个元素解析成TLV结构
//   const elements = seq.map(item => parseTLV(item.value)) as IElement[];
//
//   return elements;
// }
// function parseTLV(binaryData: string): ITLV {
//   // 解析Tag和Length
//   const tag = binaryData.charCodeAt(0);
//   const length = parseLength(binaryData.substr(1));
//
//   // 取出Value字段
//   const value = binaryData.substr(1 + length.length, length.numBytes);
//
//   return {
//     tag: tag,
//     length: length,
//     value: value
//   };
// }
// function parseLength(binaryData: string): ILength {
//   let length = 0;
//   let numBytes = binaryData.charCodeAt(0);
//
//   if (numBytes < 128) {
//     // short form
//     length = numBytes;
//   } else {
//     // long form
//     numBytes -= 128;
//
//     for (let i = 0; i < numBytes; i++) {
//       length = (length * 256) + binaryData.charCodeAt(i + 1);
//     }
//   }
//
//   return {
//     length: length,
//     numBytes: numBytes + 1
//   };
// }
//
// function parseSEQUENCE(binaryData: string): ITLV[] {
//   const elements: ITLV[] = [];
//
//   while (binaryData.length > 0) {
//     const tlv = parseTLV(binaryData);
//     elements.push(tlv);
//     binaryData = binaryData.substr(tlv.length.numBytes + tlv.length.numBytes);
//   }
//
//   return elements;
// }
//
// function parseSignerInfo(asn1Data: IElement[]): ISignerInfo {
//   // 解析签名者信息
//   const signerInfo = parseSEQUENCE(asn1Data[0].value as string) as IElement[];
//   const issuer: IElement[] = signerInfo[0].value.map(item => parseTLV(item.value)) as IElement[];
//
//   return {
//     name: getAttributeByName(issuer, '2.5.4.3'),
//     email: getAttributeByName(issuer, '1.2.840.113549.1.9.1'),
//     certificate: btoa(signerInfo[1].value),
//     time: parseTime(signerInfo[2].value)
//   };
// }
//
// function parseSignedDigest(asn1Data: IElement[]): ISignatureValue {
//   // 解析签名数据
//   const signedData = parseSEQUENCE(asn1Data[1].value as string);
//   const signedDigest = parseSEQUENCE(signedData[2].value as string);
//   const digestAlgorithm = parseAlgorithmIdentifier(signedDigest[0].value as string);
//
//   return {
//     algorithm: digestAlgorithm,
//     value: signedDigest[1].value as string,
//   };
// }
//
// function parseSignatureValue(asn1Data: IElement[]): ISignatureValue {
//   // 解析签名值
//   const signatureValue = parseTLV(asn1Data[2].value as string);
//   const signatureAlgorithm = parseAlgorithmIdentifier(signatureValue.value.substr(0, 8));
//
//   return {
//     algorithm: signatureAlgorithm,
//     value: signatureValue.value.substr(8)
//   };
// }
//
// function parseAlgorithmIdentifier(encodedData: string): string {
//   const tlv = parseTLV(encodedData);
//   const oid = parseTLV(tlv.value).value;
//
//   return oid;
// }
//
// function getAttributeByName(attributes: IElement[], name: string) {
//   const attribute = attributes.find(item => item[0].value === name);
//   return attribute ? attribute.value : undefined;
// }
//
// function parseTime(binaryData: string) {
//   const dateStr = parseTLV(binaryData).value;
//   const year = dateStr.substr(0, 4);
//   const month = dateStr.substr(4, 2);
//   const day = dateStr.substr(6, 2);
//   const hour = dateStr.substr(8, 2);
//   const minute = dateStr.substr(10, 2);
//   const second = dateStr.substr(12, 2);
//   return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}Z`);
// }
// //
// // // 使用示例
// // const signedData = 'base64-encoded-signed-data';
// // const signedValue = parseSignedValue(signedData);
// // console.log(signedValue);
