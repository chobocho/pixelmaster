import { test } from 'node:test';
import assert from 'node:assert/strict';
import { strokeLine } from '../src/tools/strokeLine.js';

function collect(x0: number, y0: number, x1: number, y1: number): string[] {
  const points: string[] = [];
  strokeLine(x0, y0, x1, y1, (x, y) => points.push(`${x},${y}`));
  return points;
}

test('strokeLine on a single point plots once', () => {
  assert.deepEqual(collect(3, 3, 3, 3), ['3,3']);
});

test('strokeLine horizontal line covers all cells', () => {
  assert.deepEqual(collect(0, 0, 4, 0), ['0,0', '1,0', '2,0', '3,0', '4,0']);
});

test('strokeLine vertical line covers all cells', () => {
  assert.deepEqual(collect(2, 0, 2, 3), ['2,0', '2,1', '2,2', '2,3']);
});

test('strokeLine 45-degree diagonal', () => {
  assert.deepEqual(collect(0, 0, 3, 3), ['0,0', '1,1', '2,2', '3,3']);
});

test('strokeLine handles reversed direction', () => {
  assert.deepEqual(collect(3, 0, 0, 0), ['3,0', '2,0', '1,0', '0,0']);
});

test('strokeLine steep slope symmetry', () => {
  // from (0,0) to (2,5): Bresenham picks nearest-grid line
  const pts = collect(0, 0, 2, 5);
  assert.equal(pts[0], '0,0');
  assert.equal(pts[pts.length - 1], '2,5');
  assert.equal(pts.length, 6);
});
