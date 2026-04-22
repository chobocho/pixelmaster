import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatStatusBar } from '../src/ui/formatStatusBar.js';

test('formatStatusBar shows size and zoom', () => {
  assert.equal(formatStatusBar({ width: 32, height: 32, zoom: 1 }), '32×32 │ 100%');
});

test('formatStatusBar rounds fractional zoom percent', () => {
  assert.equal(formatStatusBar({ width: 16, height: 16, zoom: 2.5 }), '16×16 │ 250%');
});

test('formatStatusBar appends cursor when provided', () => {
  assert.equal(
    formatStatusBar({ width: 32, height: 32, zoom: 1, cursor: { x: 5, y: 10 } }),
    '32×32 │ 100% │ (5, 10)',
  );
});

test('formatStatusBar appends tool when provided', () => {
  assert.equal(
    formatStatusBar({ width: 16, height: 16, zoom: 4, tool: 'pencil' }),
    '16×16 │ 400% │ pencil',
  );
});

test('formatStatusBar appends layers summary (1-based active)', () => {
  assert.equal(
    formatStatusBar({ width: 16, height: 16, zoom: 1, layers: { total: 3, active: 1 } }),
    '16×16 │ 100% │ L 2/3',
  );
});

test('formatStatusBar combines all fields in canonical order', () => {
  assert.equal(
    formatStatusBar({
      width: 64,
      height: 64,
      zoom: 8,
      cursor: { x: 3, y: 4 },
      tool: 'fill',
      layers: { total: 5, active: 2 },
    }),
    '64×64 │ 800% │ (3, 4) │ fill │ L 3/5',
  );
});
