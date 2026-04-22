import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULT_PALETTE } from '../src/color/defaultPalette.js';
import { hexToRgba } from '../src/color/conversions.js';
import { MAX_PALETTE_COLORS } from '../src/editor/CanvasSize.js';

test('DEFAULT_PALETTE fits within capacity and has valid colors', () => {
  assert.ok(DEFAULT_PALETTE.length > 0);
  assert.ok(DEFAULT_PALETTE.length <= MAX_PALETTE_COLORS);
  for (const c of DEFAULT_PALETTE) {
    assert.ok(c.r >= 0 && c.r <= 255);
    assert.ok(c.g >= 0 && c.g <= 255);
    assert.ok(c.b >= 0 && c.b <= 255);
    assert.ok(c.a >= 0 && c.a <= 255);
  }
});

test('data/default-palettes.json parses and contains valid hex entries', () => {
  const raw = readFileSync(new URL('../../data/default-palettes.json', import.meta.url), 'utf8');
  const parsed = JSON.parse(raw) as {
    palettes: Array<{ name: string; description?: string; colors: string[] }>;
  };
  assert.ok(Array.isArray(parsed.palettes));
  assert.ok(parsed.palettes.length > 0);
  for (const palette of parsed.palettes) {
    assert.ok(typeof palette.name === 'string' && palette.name.length > 0);
    assert.ok(palette.colors.length > 0 && palette.colors.length <= MAX_PALETTE_COLORS);
    for (const hex of palette.colors) {
      assert.ok(hexToRgba(hex) !== null, `Invalid hex ${hex}`);
    }
  }
});
