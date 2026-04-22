import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { pngEncode } from '../src/io/pngEncode.js';

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function readUint32BE(data: Uint8Array, offset: number): number {
  return (
    (data[offset] << 24) |
    (data[offset + 1] << 16) |
    (data[offset + 2] << 8) |
    data[offset + 3]
  ) >>> 0;
}

interface Chunk {
  type: string;
  data: Uint8Array;
}

function parseChunks(png: Uint8Array): Chunk[] {
  const chunks: Chunk[] = [];
  let offset = 8; // skip signature
  while (offset < png.length) {
    const len = readUint32BE(png, offset);
    const type = String.fromCharCode(png[offset + 4], png[offset + 5], png[offset + 6], png[offset + 7]);
    const data = png.slice(offset + 8, offset + 8 + len);
    chunks.push({ type, data });
    offset += 12 + len;
  }
  return chunks;
}

test('pngEncode starts with PNG signature', () => {
  const rgba = new Uint8ClampedArray([255, 0, 0, 255]);
  const png = pngEncode(1, 1, rgba);
  assert.deepEqual(Array.from(png.slice(0, 8)), PNG_SIGNATURE);
});

test('pngEncode produces IHDR / IDAT / IEND in order', () => {
  const rgba = new Uint8ClampedArray(2 * 2 * 4);
  const png = pngEncode(2, 2, rgba);
  const chunks = parseChunks(png);
  assert.equal(chunks.length, 3);
  assert.equal(chunks[0].type, 'IHDR');
  assert.equal(chunks[1].type, 'IDAT');
  assert.equal(chunks[2].type, 'IEND');
});

test('pngEncode IHDR encodes width/height/color fields correctly', () => {
  const rgba = new Uint8ClampedArray(5 * 3 * 4);
  const png = pngEncode(5, 3, rgba);
  const ihdr = parseChunks(png)[0].data;
  assert.equal(readUint32BE(ihdr, 0), 5);
  assert.equal(readUint32BE(ihdr, 4), 3);
  assert.equal(ihdr[8], 8);  // bit depth
  assert.equal(ihdr[9], 6);  // color type RGBA
  assert.equal(ihdr[10], 0); // compression
  assert.equal(ihdr[11], 0); // filter
  assert.equal(ihdr[12], 0); // interlace
});

test('pngEncode IDAT decompresses to filtered scanlines matching input', () => {
  const rgba = new Uint8ClampedArray([
    10, 20, 30, 255, 40, 50, 60, 255,
    70, 80, 90, 255, 100, 110, 120, 255,
  ]);
  const png = pngEncode(2, 2, rgba);
  const idat = parseChunks(png).find((c) => c.type === 'IDAT')!.data;
  const raw = new Uint8Array(inflateSync(Buffer.from(idat)));
  // Each scanline prefixed by 0 (filter None), then 2*4 = 8 bytes of RGBA
  assert.equal(raw.length, 2 * (1 + 8));
  assert.equal(raw[0], 0); // filter byte
  assert.deepEqual(Array.from(raw.slice(1, 9)), [10, 20, 30, 255, 40, 50, 60, 255]);
  assert.equal(raw[9], 0); // filter byte
  assert.deepEqual(Array.from(raw.slice(10, 18)), [70, 80, 90, 255, 100, 110, 120, 255]);
});

test('pngEncode rejects invalid dimensions and mismatched data length', () => {
  assert.throws(() => pngEncode(0, 0, new Uint8ClampedArray(0)), /dimensions/);
  assert.throws(() => pngEncode(2, 2, new Uint8ClampedArray(3)), /length/);
});

test('pngEncode handles larger canvas (64x64 transparent)', () => {
  const png = pngEncode(64, 64, new Uint8ClampedArray(64 * 64 * 4));
  const chunks = parseChunks(png);
  const idat = chunks.find((c) => c.type === 'IDAT')!.data;
  const raw = new Uint8Array(inflateSync(Buffer.from(idat)));
  assert.equal(raw.length, 64 * (1 + 64 * 4));
});
