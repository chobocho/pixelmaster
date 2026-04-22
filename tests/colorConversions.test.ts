import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hsvToRgb, rgbToHsv, rgbaToHex, hexToRgba } from '../src/color/conversions.js';

test('hsvToRgb primary colors', () => {
  assert.deepEqual(hsvToRgb(0, 1, 1), { r: 255, g: 0, b: 0 });
  assert.deepEqual(hsvToRgb(120, 1, 1), { r: 0, g: 255, b: 0 });
  assert.deepEqual(hsvToRgb(240, 1, 1), { r: 0, g: 0, b: 255 });
});

test('hsvToRgb black and white', () => {
  assert.deepEqual(hsvToRgb(0, 0, 0), { r: 0, g: 0, b: 0 });
  assert.deepEqual(hsvToRgb(0, 0, 1), { r: 255, g: 255, b: 255 });
});

test('hsvToRgb normalizes negative and overflow hue', () => {
  assert.deepEqual(hsvToRgb(-240, 1, 1), hsvToRgb(120, 1, 1));
  assert.deepEqual(hsvToRgb(480, 1, 1), hsvToRgb(120, 1, 1));
});

test('rgbToHsv primary colors', () => {
  assert.deepEqual(rgbToHsv(255, 0, 0), { h: 0, s: 1, v: 1 });
  assert.deepEqual(rgbToHsv(0, 255, 0), { h: 120, s: 1, v: 1 });
  assert.deepEqual(rgbToHsv(0, 0, 255), { h: 240, s: 1, v: 1 });
});

test('HSV → RGB → HSV round-trip preserves values within rounding', () => {
  for (const h of [30, 60, 90, 180, 270]) {
    for (const s of [0.25, 0.5, 0.75, 1]) {
      for (const v of [0.25, 0.5, 0.75, 1]) {
        const rgb = hsvToRgb(h, s, v);
        const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
        assert.ok(Math.abs(hsv.h - h) < 2, `h expected ~${h}, got ${hsv.h}`);
        assert.ok(Math.abs(hsv.s - s) < 0.02, `s expected ~${s}, got ${hsv.s}`);
        assert.ok(Math.abs(hsv.v - v) < 0.02, `v expected ~${v}, got ${hsv.v}`);
      }
    }
  }
});

test('rgbaToHex formats opaque as 6-digit and translucent as 8-digit', () => {
  assert.equal(rgbaToHex({ r: 255, g: 0, b: 0, a: 255 }), '#ff0000');
  assert.equal(rgbaToHex({ r: 0, g: 0, b: 0, a: 255 }), '#000000');
  assert.equal(rgbaToHex({ r: 255, g: 128, b: 64, a: 128 }), '#ff804080');
});

test('hexToRgba accepts #RGB / #RGBA / #RRGGBB / #RRGGBBAA with or without #', () => {
  assert.deepEqual(hexToRgba('#f00'), { r: 255, g: 0, b: 0, a: 255 });
  assert.deepEqual(hexToRgba('f00'), { r: 255, g: 0, b: 0, a: 255 });
  assert.deepEqual(hexToRgba('#f008'), { r: 255, g: 0, b: 0, a: 136 });
  assert.deepEqual(hexToRgba('#ff0000'), { r: 255, g: 0, b: 0, a: 255 });
  assert.deepEqual(hexToRgba('#ff000080'), { r: 255, g: 0, b: 0, a: 128 });
});

test('hexToRgba returns null for invalid input', () => {
  assert.equal(hexToRgba('#xyz'), null);
  assert.equal(hexToRgba('ff'), null);
  assert.equal(hexToRgba('#1234567'), null);
  assert.equal(hexToRgba(''), null);
});

test('rgbaToHex → hexToRgba round-trip', () => {
  const colors = [
    { r: 0, g: 0, b: 0, a: 255 },
    { r: 123, g: 45, b: 200, a: 255 },
    { r: 255, g: 128, b: 64, a: 50 },
  ];
  for (const c of colors) {
    assert.deepEqual(hexToRgba(rgbaToHex(c)), c);
  }
});
