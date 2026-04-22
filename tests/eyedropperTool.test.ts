import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EyedropperTool } from '../src/tools/EyedropperTool.js';
import { PixelCanvas } from '../src/editor/PixelCanvas.js';
import type { RGBA } from '../src/color/Color.js';
import type { ToolContext } from '../src/tools/Tool.js';

const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };
const BLUE: RGBA = { r: 0, g: 0, b: 255, a: 255 };

test('EyedropperTool left click sets foreground to picked pixel color', () => {
  const canvas = new PixelCanvas(16);
  canvas.setPixel(3, 3, RED);
  let fg: RGBA | null = null;
  const ctx: ToolContext = {
    canvas,
    foregroundColor: BLUE,
    backgroundColor: BLUE,
    setForegroundColor: (c) => {
      fg = c;
    },
  };
  new EyedropperTool().onPointerDown(ctx, { x: 3, y: 3, button: 'left' });
  assert.deepEqual(fg, RED);
});

test('EyedropperTool right click sets background to picked pixel color', () => {
  const canvas = new PixelCanvas(16);
  canvas.setPixel(5, 5, RED);
  let bg: RGBA | null = null;
  const ctx: ToolContext = {
    canvas,
    foregroundColor: BLUE,
    backgroundColor: BLUE,
    setBackgroundColor: (c) => {
      bg = c;
    },
  };
  new EyedropperTool().onPointerDown(ctx, { x: 5, y: 5, button: 'right' });
  assert.deepEqual(bg, RED);
});

test('EyedropperTool out-of-bounds click is ignored', () => {
  const canvas = new PixelCanvas(16);
  let changed = false;
  const ctx: ToolContext = {
    canvas,
    foregroundColor: BLUE,
    backgroundColor: BLUE,
    setForegroundColor: () => {
      changed = true;
    },
  };
  new EyedropperTool().onPointerDown(ctx, { x: 20, y: 20, button: 'left' });
  assert.equal(changed, false);
});

test('EyedropperTool works without setters (no-op)', () => {
  const canvas = new PixelCanvas(16);
  canvas.setPixel(1, 1, RED);
  const ctx: ToolContext = {
    canvas,
    foregroundColor: BLUE,
    backgroundColor: BLUE,
  };
  // Must not throw
  new EyedropperTool().onPointerDown(ctx, { x: 1, y: 1, button: 'left' });
});
