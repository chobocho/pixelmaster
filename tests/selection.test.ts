import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Selection } from '../src/editor/Selection.js';

test('Selection starts inactive', () => {
  const s = new Selection();
  assert.equal(s.rect, null);
  assert.equal(s.isActive, false);
});

test('Selection setRect activates and stores a copy', () => {
  const s = new Selection();
  const r = { x: 1, y: 2, width: 3, height: 4 };
  s.setRect(r);
  assert.equal(s.isActive, true);
  assert.deepEqual(s.rect, r);
  assert.notStrictEqual(s.rect, r); // defensive copy
});

test('Selection contains returns true only inside bounds', () => {
  const s = new Selection();
  s.setRect({ x: 5, y: 5, width: 3, height: 3 });
  assert.equal(s.contains(5, 5), true);
  assert.equal(s.contains(7, 7), true);
  assert.equal(s.contains(8, 8), false);
  assert.equal(s.contains(4, 5), false);
});

test('Selection clear removes active rect', () => {
  const s = new Selection();
  s.setRect({ x: 0, y: 0, width: 1, height: 1 });
  s.clear();
  assert.equal(s.isActive, false);
  assert.equal(s.contains(0, 0), false);
});
