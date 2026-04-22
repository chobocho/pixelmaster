import { adler32 } from './adler32.js';

const MAX_STORED_BLOCK = 0xffff;

/**
 * zlib 스트림을 "stored"(비압축) DEFLATE 블록으로 만든다.
 * 압축률은 없지만 외부 라이브러리 없이 유효한 zlib/PNG IDAT 을 만들 수 있다.
 */
export function zlibEncode(data: Uint8Array): Uint8Array {
  const CMF = 0x78;
  const FLG = 0x01;

  const parts: Uint8Array[] = [new Uint8Array([CMF, FLG])];

  if (data.length === 0) {
    parts.push(new Uint8Array([0x01, 0x00, 0x00, 0xff, 0xff]));
  } else {
    let offset = 0;
    while (offset < data.length) {
      const remaining = data.length - offset;
      const len = Math.min(MAX_STORED_BLOCK, remaining);
      const isLast = offset + len === data.length;
      const nlen = (~len) & 0xffff;
      parts.push(
        new Uint8Array([
          isLast ? 0x01 : 0x00,
          len & 0xff,
          (len >>> 8) & 0xff,
          nlen & 0xff,
          (nlen >>> 8) & 0xff,
        ]),
      );
      parts.push(data.subarray(offset, offset + len));
      offset += len;
    }
  }

  const checksum = adler32(data);
  parts.push(
    new Uint8Array([
      (checksum >>> 24) & 0xff,
      (checksum >>> 16) & 0xff,
      (checksum >>> 8) & 0xff,
      checksum & 0xff,
    ]),
  );

  return concatBytes(parts);
}

function concatBytes(parts: readonly Uint8Array[]): Uint8Array {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) {
    out.set(p, offset);
    offset += p.length;
  }
  return out;
}
