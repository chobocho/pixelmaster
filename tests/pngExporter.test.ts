import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { EditorState } from '../src/editor/EditorState.js';
import { PngExporter } from '../src/io/PngExporter.js';
import type { RGBA } from '../src/color/Color.js';

const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };

function readUint32BE(data: Uint8Array, offset: number): number {
  return (
    (data[offset] << 24) |
    (data[offset + 1] << 16) |
    (data[offset + 2] << 8) |
    data[offset + 3]
  ) >>> 0;
}

function findChunk(png: Uint8Array, type: string): Uint8Array {
  let offset = 8;
  while (offset < png.length) {
    const len = readUint32BE(png, offset);
    const chunkType = String.fromCharCode(
      png[offset + 4],
      png[offset + 5],
      png[offset + 6],
      png[offset + 7],
    );
    if (chunkType === type) return png.slice(offset + 8, offset + 8 + len);
    offset += 12 + len;
  }
  throw new Error(`Chunk ${type} not found`);
}

test('PngExporter encode at scale 1 matches editor size', () => {
  const s = new EditorState(16);
  const png = new PngExporter().encode(s, 1);
  const ihdr = findChunk(png, 'IHDR');
  assert.equal(readUint32BE(ihdr, 0), 16);
  assert.equal(readUint32BE(ihdr, 4), 16);
});

test('PngExporter encode at scale 2 doubles dimensions', () => {
  const s = new EditorState(32);
  const png = new PngExporter().encode(s, 2);
  const ihdr = findChunk(png, 'IHDR');
  assert.equal(readUint32BE(ihdr, 0), 64);
  assert.equal(readUint32BE(ihdr, 4), 64);
});

test('PngExporter encode at scale 8 multiplies dimensions by 8', () => {
  const s = new EditorState(10);
  const png = new PngExporter().encode(s, 8);
  const ihdr = findChunk(png, 'IHDR');
  assert.equal(readUint32BE(ihdr, 0), 80);
  assert.equal(readUint32BE(ihdr, 4), 80);
});

test('PngExporter encodes composited layers, not just active', () => {
  const s = new EditorState(10);
  s.layers.addLayer();
  s.layers.getLayer(0).pixels.setPixel(0, 0, RED);
  s.layers.setActive(1);
  const png = new PngExporter().encode(s, 1);
  const idat = findChunk(png, 'IDAT');
  const raw = new Uint8Array(inflateSync(Buffer.from(idat)));
  // First pixel should be red (from layer 0)
  assert.equal(raw[1], 255); // r
  assert.equal(raw[2], 0); // g
  assert.equal(raw[3], 0); // b
  assert.equal(raw[4], 255); // a
});
