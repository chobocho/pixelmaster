import { buildIndexedImage, paletteSizeBits, type IndexedImage } from './colorTable.js';
import { lzwEncodeGifSubBlocks } from './lzw.js';

export interface GifFrame {
  readonly width: number;
  readonly height: number;
  readonly rgba: Uint8ClampedArray;
  /** 프레임 지연 시간 (100분의 1초 단위, GIF spec). */
  readonly delayCentiseconds: number;
}

/** 한 장 이상의 프레임으로 GIF89a 바이트를 만든다. 루프 무한 반복 포함. */
export function encodeGif(frames: readonly GifFrame[]): Uint8Array {
  if (frames.length === 0) throw new Error('GIF requires at least one frame');
  const width = frames[0].width;
  const height = frames[0].height;
  for (const f of frames) {
    if (f.width !== width || f.height !== height) {
      throw new Error('All GIF frames must share the same dimensions');
    }
  }

  const indexedFrames: IndexedImage[] = frames.map((f) =>
    buildIndexedImage(f.width, f.height, f.rgba),
  );

  const parts: Uint8Array[] = [];
  parts.push(signature());
  parts.push(logicalScreenDescriptor(width, height));

  if (frames.length > 1) parts.push(netscapeLoopExtension());

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const indexed = indexedFrames[i];
    parts.push(graphicControlExtension(frame.delayCentiseconds, indexed.transparentIndex));
    parts.push(imageDescriptor(width, height, indexed.paletteSize));
    parts.push(indexed.palette);
    const minCodeSize = Math.max(2, paletteSizeBits(indexed.paletteSize) + 1);
    parts.push(new Uint8Array([minCodeSize]));
    parts.push(lzwEncodeGifSubBlocks(indexed.indices, minCodeSize));
  }

  parts.push(new Uint8Array([0x3b])); // trailer

  return concat(parts);
}

function signature(): Uint8Array {
  return new Uint8Array([
    0x47, 0x49, 0x46, 0x38, 0x39, 0x61, // "GIF89a"
  ]);
}

function logicalScreenDescriptor(width: number, height: number): Uint8Array {
  // No global color table in this implementation; per-frame local tables used.
  const buf = new Uint8Array(7);
  writeUint16LE(buf, 0, width);
  writeUint16LE(buf, 2, height);
  buf[4] = 0x00; // packed: no GCT
  buf[5] = 0x00; // background color index
  buf[6] = 0x00; // pixel aspect ratio
  return buf;
}

function netscapeLoopExtension(): Uint8Array {
  // 0x21 0xFF 0x0B "NETSCAPE2.0" 0x03 0x01 LOOP_LO LOOP_HI 0x00
  const id = new TextEncoder().encode('NETSCAPE2.0');
  return new Uint8Array([
    0x21, 0xff,
    0x0b,
    ...id,
    0x03,
    0x01,
    0x00, 0x00, // loop count = 0 (infinite)
    0x00,
  ]);
}

function graphicControlExtension(delay: number, transparentIndex: number): Uint8Array {
  const buf = new Uint8Array(8);
  buf[0] = 0x21;
  buf[1] = 0xf9;
  buf[2] = 0x04; // block size
  // packed: disposal method 0 | user input 0 | transparent flag
  const transparentFlag = transparentIndex >= 0 ? 0x01 : 0x00;
  buf[3] = transparentFlag;
  writeUint16LE(buf, 4, Math.max(0, Math.floor(delay)));
  buf[6] = transparentIndex >= 0 ? transparentIndex & 0xff : 0x00;
  buf[7] = 0x00; // block terminator
  return buf;
}

function imageDescriptor(width: number, height: number, paletteSize: number): Uint8Array {
  const buf = new Uint8Array(10);
  buf[0] = 0x2c;
  writeUint16LE(buf, 1, 0); // left
  writeUint16LE(buf, 3, 0); // top
  writeUint16LE(buf, 5, width);
  writeUint16LE(buf, 7, height);
  const sizeBits = paletteSizeBits(paletteSize);
  buf[9] = 0x80 | (sizeBits & 0x07); // Local Color Table flag + size
  return buf;
}

function writeUint16LE(buf: Uint8Array, offset: number, value: number): void {
  buf[offset] = value & 0xff;
  buf[offset + 1] = (value >>> 8) & 0xff;
}

function concat(parts: readonly Uint8Array[]): Uint8Array {
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
