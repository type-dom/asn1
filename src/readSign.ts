/**
 * 从 DataView 中读取 Int64 类型的值
 * @param {DataView} dataView DataView 对象
 * @param {number} offset 偏移量
 * @return {number} 读取的 Int64 值
 */
function getInt64(dataView: DataView, offset: number) {
  const low = dataView.getUint32(offset, true);
  const high = dataView.getInt32(offset + 4, true);
  return (high << 32) + low;
}

export async function readSign(url: string): Promise<void> {
  // 读取 signedValue.dat 文件内容
  // const url = 'path/to/signedValue.dat';
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const dataView = new DataView(arrayBuffer);
  let offset = 0;

  // 读取签名信息
  const certLen = dataView.getUint32(offset);
  offset += 4;
  const certStr = new TextDecoder().decode(arrayBuffer.slice(offset, offset + certLen));
  const cert = atob(certStr);
  offset += certLen;
  const signTimeLen = dataView.getUint32(offset);
  offset += 4;
  const signTime = new TextDecoder().decode(arrayBuffer.slice(offset, offset + signTimeLen));
  // 输出结果
  console.log('Cert:', cert);
  console.log('Sign Time:', signTime);
  // 解析签章人信息
  const signerNameLength = dataView.getUint16(32);
  const signerNameOffset = dataView.getUint16(34);
  const signerNameArray = new Uint8Array(arrayBuffer.slice(signerNameOffset, signerNameOffset + signerNameLength));
  const signerName = new TextDecoder().decode(signerNameArray);
  console.log(signerName);

  const signerCertLength = dataView.getUint16(36);
  const signerCertOffset = dataView.getUint16(38);
  const signerCertArray = new Uint8Array(arrayBuffer.slice(signerCertOffset, signerCertOffset + signerCertLength));
  const signerCert = new TextDecoder().decode(signerCertArray);
  console.log(signerCert);

  const certIssuerLength = dataView.getUint16(40);
  const certIssuerOffset = dataView.getUint16(42);
  const certIssuerArray = new Uint8Array(arrayBuffer.slice(certIssuerOffset, certIssuerOffset + certIssuerLength));
  const certIssuer = new TextDecoder().decode(certIssuerArray);
  console.log(certIssuer);

  const certSubjectLength = dataView.getUint16(44);
  const certSubjectOffset = dataView.getUint16(46);
  const certSubjectArray = new Uint8Array(arrayBuffer.slice(certSubjectOffset, certSubjectOffset + certSubjectLength));
  const certSubject = new TextDecoder().decode(certSubjectArray);
  console.log(certSubject);

  const signerTime = new Date(getInt64(dataView, 48));
  console.log(signerTime);

  // 解析签章位置
  const x = dataView.getFloat32(0);
  const y = dataView.getFloat32(4);
  const page = dataView.getUint32(8);
  const width = dataView.getFloat32(12);
  const height = dataView.getFloat32(16);
  const pageWidth = dataView.getFloat32(20);
  const pageHeight = dataView.getFloat32(24);

  const position = { x, y, page, width, height, pageWidth, pageHeight };
  console.log(position);

  // 解析签章图片
  const imageDataOffset = 56;
  const imageData = new Uint8Array(arrayBuffer.slice(imageDataOffset));

  const base64ImageData = btoa(String.fromCharCode.apply(null, Array.from(imageData) as number[]));
  // const base64ImageData = stringToBase64(String.fromCharCode.apply(null, imageData));
  console.log(base64ImageData);

  // 解析时间戳信息
  const timestampVersion = dataView.getUint32(imageDataOffset);
  const timestampPolicy = dataView.getUint32(imageDataOffset + 4);

  const timestampIssuerLength = dataView.getUint16(imageDataOffset + 8);
  const timestampIssuerOffset = dataView.getUint16(imageDataOffset + 10);
  const timestampIssuerArray = new Uint8Array(arrayBuffer.slice(imageDataOffset + timestampIssuerOffset, imageDataOffset + timestampIssuerOffset + timestampIssuerLength));
  const timestampIssuer = new TextDecoder().decode(timestampIssuerArray);
  console.log(timestampIssuer);

  const timestampTime = new Date(getInt64(dataView, imageDataOffset + 12));
  console.log(timestampTime);

  const timestampAccuracy = dataView.getFloat32(imageDataOffset + 20);

  const timestampOrdering = dataView.getUint8(imageDataOffset + 24);
  console.log(timestampOrdering);

}
