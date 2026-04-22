import { test } from 'node:test';
import assert from 'node:assert/strict';
import { strokeRect } from '../src/tools/strokeRect.js';

function collectSet(x0: number, y0: number, x1: number, y1: number): Set<string> {
  const s = new Set<string>();
  strokeRect(x0, y0, x1, y1, (x, y) => s.add(`${x},${y}`));
  return s;
}

test('strokeRect paints only the 4 edges, not interior', () => {
  const s = collectSet(0, 0, 3, 3);
  // 4x4 box: 4*4 - (4-2)^2 = 16 - 4 = 12 border pixels
  assert.equal(s.size, 12);
  assert.ok(s.has('0,0'));
  assert.ok(s.has('3,3'));
  assert.ok(s.has('0,3'));
  assert.ok(s.has('3,0'));
  // interior should not be painted
  assert.ok(!s.has('1,1'));
  assert.ok(!s.has('2,2'));
});

test('strokeRect handles single point (x0==x1 && y0==y1)', () => {
  const s = collectSet(5, 5, 5, 5);
  assert.equal(s.size, 1);
  assert.ok(s.has('5,5'));
});

test('strokeRect handles horizontal line (y0==y1)', () => {
  const s = collectSet(0, 5, 3, 5);
  assert.equal(s.size, 4);
  for (let x = 0; x <= 3; x++) assert.ok(s.has(`${x},5`));
});

test('strokeRect handles vertical line (x0==x1)', () => {
  const s = collectSet(3, 0, 3, 4);
  assert.equal(s.size, 5);
  for (let y = 0; y <= 4; y++) assert.ok(s.has(`3,${y}`));
});

test('strokeRect accepts reversed corners', () => {
  assert.deepEqual([...collectSet(3, 3, 0, 0)].sort(), [...collectSet(0, 0, 3, 3)].sort());
});
