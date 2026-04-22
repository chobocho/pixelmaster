import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SelectTool } from '../src/tools/SelectTool.js';
import { PixelCanvas } from '../src/editor/PixelCanvas.js';
import { Selection } from '../src/editor/Selection.js';
import type { ToolContext } from '../src/tools/Tool.js';

function makeCtx(canvas: PixelCanvas, selection: Selection): ToolContext {
  return {
    canvas,
    foregroundColor: { r: 0, g: 0, b: 0, a: 255 },
    backgroundColor: { r: 255, g: 255, b: 255, a: 255 },
    selection,
  };
}

test('SelectTool drag sets normalized rectangle', () => {
  const c = new PixelCanvas(16);
  const sel = new Selection();
  const tool = new SelectTool();
  const ctx = makeCtx(c, sel);
  tool.onPointerDown(ctx, { x: 2, y: 3, button: 'left' });
  tool.onPointerUp(ctx, { x: 6, y: 8, button: 'left' });
  assert.deepEqual(sel.rect, { x: 2, y: 3, width: 5, height: 6 });
});

test('SelectTool accepts reversed drag direction', () => {
  const c = new PixelCanvas(16);
  const sel = new Selection();
  const tool = new SelectTool();
  const ctx = makeCtx(c, sel);
  tool.onPointerDown(ctx, { x: 10, y: 10, button: 'left' });
  tool.onPointerUp(ctx, { x: 3, y: 4, button: 'left' });
  assert.deepEqual(sel.rect, { x: 3, y: 4, width: 8, height: 7 });
});

test('SelectTool clamps to canvas bounds', () => {
  const c = new PixelCanvas(10);
  const sel = new Selection();
  const tool = new SelectTool();
  const ctx = makeCtx(c, sel);
  tool.onPointerDown(ctx, { x: -5, y: -5, button: 'left' });
  tool.onPointerUp(ctx, { x: 20, y: 20, button: 'left' });
  assert.deepEqual(sel.rect, { x: 0, y: 0, width: 10, height: 10 });
});

test('SelectTool pointer move updates selection during drag', () => {
  const c = new PixelCanvas(16);
  const sel = new Selection();
  const tool = new SelectTool();
  const ctx = makeCtx(c, sel);
  tool.onPointerDown(ctx, { x: 2, y: 2, button: 'left' });
  tool.onPointerMove(ctx, { x: 4, y: 4, button: 'left' });
  assert.deepEqual(sel.rect, { x: 2, y: 2, width: 3, height: 3 });
});

test('SelectTool ignores non-left buttons', () => {
  const c = new PixelCanvas(16);
  const sel = new Selection();
  const tool = new SelectTool();
  const ctx = makeCtx(c, sel);
  tool.onPointerDown(ctx, { x: 0, y: 0, button: 'right' });
  tool.onPointerUp(ctx, { x: 5, y: 5, button: 'right' });
  assert.equal(sel.rect, null);
});
