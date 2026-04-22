import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeGif } from '../src/io/gif/gifEncode.js';

function makeRedFrame(w: number, h: number) {
  const rgba = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    rgba[i * 4] = 255;
    rgba[i * 4 + 3] = 255;
  }
  return { width: w, height: h, rgba, delayCentiseconds: 10 };
}

test('encodeGif output starts with GIF89a signature', () => {
  const bytes = encodeGif([makeRedFrame(2, 2)]);
  const sig = Array.from(bytes.slice(0, 6));
  assert.deepEqual(sig, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
});

test('encodeGif ends with 0x3B trailer', () => {
  const bytes = encodeGif([makeRedFrame(4, 4)]);
  assert.equal(bytes[bytes.length - 1], 0x3b);
});

test('encodeGif includes NETSCAPE loop extension for multi-frame', () => {
  const bytes = encodeGif([makeRedFrame(2, 2), makeRedFrame(2, 2)]);
  // NETSCAPE2.0 as ASCII inside the stream
  const str = Array.from(bytes)
    .map((b) => String.fromCharCode(b))
    .join('');
  assert.ok(str.includes('NETSCAPE2.0'), 'loop extension missing');
});

test('encodeGif throws for zero frames', () => {
  assert.throws(() => encodeGif([]), /at least one/);
});

test('encodeGif rejects frames with differing dimensions', () => {
  assert.throws(() => encodeGif([makeRedFrame(2, 2), makeRedFrame(3, 2)]), /same dimensions/);
});

test('encodeGif single-frame omits NETSCAPE extension', () => {
  const bytes = encodeGif([makeRedFrame(2, 2)]);
  const str = Array.from(bytes)
    .map((b) => String.fromCharCode(b))
    .join('');
  assert.ok(!str.includes('NETSCAPE2.0'));
});
