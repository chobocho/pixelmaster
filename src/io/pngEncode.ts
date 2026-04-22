import { crc32 } from './crc32.js';
import { zlibEncode } from './zlibEncode.js';

const PNG_SIGNATURE = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * 8-bit RGBA 픽셀을 최소 PNG 파일로 인코딩한다.
 * 필터 타입은 None(0) 만 사용하며 zlib 블록은 비압축 저장 타입.
 */
export function pngEncode(
  width: number,
  height: number,
  rgba: Uint8ClampedArray,
): Uint8Array {
  if (width <= 0 || height <= 0) {
    throw new Error(`Invalid image dimensions: ${width}x${height}`);
  }
  if (rgba.length !== width * height * 4) {
    throw new Error(
      `RGBA length ${rgba.length} does not match ${width}x${height}x4 = ${width * height * 4}`,
    );
  }

  const ihdr = buildIhdr(width, height);
  const idat = buildIdat(width, height, rgba);
  const iend = new Uint8Array(0);

  return concatBytes([
    PNG_SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', iend),
  ]);
}

function buildIhdr(width: number, height: number): Uint8Array {
  const ihdr = new Uint8Array(13);
  writeUint32BE(ihdr, 0, width);
  writeUint32BE(ihdr, 4, height);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type = RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  return ihdr;
}

function buildIdat(width: number, height: number, rgba: Uint8ClampedArray): Uint8Array {
  const rowBytes = width * 4;
  const raw = new Uint8Array(height * (rowBytes + 1));
  for (let y = 0; y < height; y++) {
    const rawOffset = y * (rowBytes + 1);
    raw[rawOffset] = 0; // filter None
    const srcOffset = y * rowBytes;
    for (let i = 0; i < rowBytes; i++) {
      raw[rawOffset + 1 + i] = rgba[srcOffset + i];
    }
  }
  return zlibEncode(raw);
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  if (type.length !== 4) {
    throw new Error(`PNG chunk type must be 4 ASCII chars: ${type}`);
  }
  const typeBytes = new Uint8Array(4);
  for (let i = 0; i < 4; i++) typeBytes[i] = type.charCodeAt(i);

  const crcInput = new Uint8Array(typeBytes.length + data.length);
  crcInput.set(typeBytes, 0);
  crcInput.set(data, typeBytes.length);
  const crc = crc32(crcInput);

  const out = new Uint8Array(4 + 4 + data.length + 4);
  writeUint32BE(out, 0, data.length);
  out.set(typeBytes, 4);
  out.set(data, 8);
  writeUint32BE(out, 8 + data.length, crc);
  return out;
}

function writeUint32BE(buf: Uint8Array, offset: number, value: number): void {
  buf[offset] = (value >>> 24) & 0xff;
  buf[offset + 1] = (value >>> 16) & 0xff;
  buf[offset + 2] = (value >>> 8) & 0xff;
  buf[offset + 3] = value & 0xff;
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
