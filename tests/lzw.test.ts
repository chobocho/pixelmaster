import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lzwEncodeBytes, lzwEncodeGifSubBlocks } from '../src/io/gif/lzw.js';

test('lzwEncodeBytes produces a bounded byte stream for small input', () => {
  const indices = new Uint8Array([0, 1, 0, 1, 0, 1, 0, 1]);
  const bytes = lzwEncodeBytes(indices, 2);
  assert.ok(bytes.length > 0 && bytes.length < 1000);
});

test('lzwEncodeGifSubBlocks ends with zero terminator byte', () => {
  const indices = new Uint8Array([0, 0, 1, 1, 0, 0, 1]);
  const packed = lzwEncodeGifSubBlocks(indices, 2);
  assert.equal(packed[packed.length - 1], 0);
});

test('lzwEncodeGifSubBlocks uses max 255-byte chunks', () => {
  // Need enough entropy-free bytes to exceed 255 in LZW output
  const indices = new Uint8Array(10000);
  for (let i = 0; i < indices.length; i++) indices[i] = i & 0xff;
  const packed = lzwEncodeGifSubBlocks(indices, 8);

  let offset = 0;
  while (offset < packed.length) {
    const len = packed[offset];
    if (len === 0) {
      // Terminator must be the very last byte
      assert.equal(offset, packed.length - 1);
      break;
    }
    assert.ok(len <= 255);
    offset += 1 + len;
  }
});

test('lzwEncodeBytes enforces valid minCodeSize', () => {
  assert.throws(() => lzwEncodeBytes(new Uint8Array([0, 1]), 1), /minCodeSize/);
  assert.throws(() => lzwEncodeBytes(new Uint8Array([0, 1]), 9), /minCodeSize/);
});
