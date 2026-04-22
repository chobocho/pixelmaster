import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inflateSync } from 'node:zlib';
import { zlibEncode } from '../src/io/zlibEncode.js';

function inflate(bytes: Uint8Array): Uint8Array {
  const inflated = inflateSync(Buffer.from(bytes));
  return new Uint8Array(inflated.buffer, inflated.byteOffset, inflated.byteLength);
}

test('zlibEncode of empty input round-trips via node inflate', () => {
  const out = zlibEncode(new Uint8Array(0));
  const decoded = inflate(out);
  assert.equal(decoded.length, 0);
});

test('zlibEncode of small input round-trips', () => {
  const input = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  const out = zlibEncode(input);
  assert.deepEqual([...inflate(out)], [...input]);
});

test('zlibEncode of 100KB input spans multiple stored blocks', () => {
  const input = new Uint8Array(100_000);
  for (let i = 0; i < input.length; i++) input[i] = i & 0xff;
  const out = zlibEncode(input);
  const decoded = inflate(out);
  assert.equal(decoded.length, input.length);
  for (let i = 0; i < input.length; i++) {
    assert.equal(decoded[i], input[i]);
  }
});

test('zlibEncode starts with standard zlib header bytes', () => {
  const out = zlibEncode(new Uint8Array([0]));
  assert.equal(out[0], 0x78);
  assert.equal(out[1], 0x01);
});
