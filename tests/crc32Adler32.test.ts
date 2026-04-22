import { test } from 'node:test';
import assert from 'node:assert/strict';
import { crc32 } from '../src/io/crc32.js';
import { adler32 } from '../src/io/adler32.js';

// Known test vectors
test('crc32 of empty input is 0', () => {
  assert.equal(crc32(new Uint8Array(0)), 0);
});

test('crc32 of "123456789" matches canonical value', () => {
  const data = new TextEncoder().encode('123456789');
  assert.equal(crc32(data), 0xcbf43926);
});

test('crc32 of "IEND" chunk with empty data matches canonical PNG IEND crc', () => {
  // PNG IEND chunk: crc32("IEND") = 0xae426082
  const data = new TextEncoder().encode('IEND');
  assert.equal(crc32(data), 0xae426082);
});

test('adler32 of empty input is 1', () => {
  assert.equal(adler32(new Uint8Array(0)), 1);
});

test('adler32 of "Wikipedia" matches canonical value', () => {
  const data = new TextEncoder().encode('Wikipedia');
  assert.equal(adler32(data), 0x11e60398);
});
