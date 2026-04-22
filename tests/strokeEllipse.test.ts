import { test } from 'node:test';
import assert from 'node:assert/strict';
import { strokeEllipse } from '../src/tools/strokeEllipse.js';

function collect(x0: number, y0: number, x1: number, y1: number): Set<string> {
  const s = new Set<string>();
  strokeEllipse(x0, y0, x1, y1, (x, y) => s.add(`${x},${y}`));
  return s;
}

test('strokeEllipse produces pixels within the bounding box', () => {
  const s = collect(0, 0, 10, 10);
  for (const key of s) {
    const [xs, ys] = key.split(',');
    const x = Number(xs);
    const y = Number(ys);
    assert.ok(x >= 0 && x <= 10, `x=${x} out of bbox`);
    assert.ok(y >= 0 && y <= 10, `y=${y} out of bbox`);
  }
});

test('strokeEllipse is 4-way symmetric across bbox center for square bbox', () => {
  const s = collect(0, 0, 10, 10);
  const cx = 5;
  const cy = 5;
  for (const key of s) {
    const [xs, ys] = key.split(',');
    const x = Number(xs);
    const y = Number(ys);
    const mirrorX = `${2 * cx - x},${y}`;
    const mirrorY = `${x},${2 * cy - y}`;
    assert.ok(s.has(mirrorX), `missing mirror-x for ${key}`);
    assert.ok(s.has(mirrorY), `missing mirror-y for ${key}`);
  }
});

test('strokeEllipse includes the 4 extreme points of the bbox', () => {
  const s = collect(0, 0, 10, 6);
  // Top and bottom midpoints, left/right midpoints should exist
  assert.ok(s.has('0,3'));
  assert.ok(s.has('10,3'));
  assert.ok(s.has('5,0'));
  assert.ok(s.has('5,6'));
});

test('strokeEllipse handles degenerate square bbox (1x1)', () => {
  const s = collect(3, 3, 3, 3);
  assert.ok(s.size >= 1);
  assert.ok(s.has('3,3'));
});

test('strokeEllipse does not fill interior', () => {
  const s = collect(0, 0, 20, 20);
  // center (10,10) should be empty
  assert.ok(!s.has('10,10'));
});

test('strokeEllipse handles reversed bbox corners', () => {
  const forward = collect(2, 2, 10, 8);
  const reversed = collect(10, 8, 2, 2);
  assert.deepEqual(reversed, forward);
});

test('strokeEllipse flat bbox (height=0) still plots a horizontal span', () => {
  const s = collect(0, 3, 10, 3);
  assert.ok(s.has('0,3'));
  assert.ok(s.has('10,3'));
});

test('strokeEllipse flat bbox (width=0) produces only x=5 pixels without crashing', () => {
  const s = collect(5, 0, 5, 10);
  assert.ok(s.size > 0);
  for (const key of s) {
    const [xs] = key.split(',');
    assert.equal(xs, '5');
  }
});
