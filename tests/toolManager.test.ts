import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ToolManager } from '../src/tools/ToolManager.js';
import { PencilTool } from '../src/tools/PencilTool.js';
import { EraserTool } from '../src/tools/EraserTool.js';
import { PixelCanvas } from '../src/editor/PixelCanvas.js';
import type { ToolContext } from '../src/tools/Tool.js';
import type { RGBA } from '../src/color/Color.js';

const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };
const TRANSPARENT: RGBA = { r: 0, g: 0, b: 0, a: 0 };

function makeCtx(canvas: PixelCanvas): ToolContext {
  return { canvas, foregroundColor: RED, backgroundColor: RED };
}

test('ToolManager activates first registered tool by default', () => {
  const mgr = new ToolManager();
  mgr.register(new PencilTool());
  mgr.register(new EraserTool());
  assert.equal(mgr.activeId, 'pencil');
});

test('ToolManager setActive switches dispatch target', () => {
  const mgr = new ToolManager();
  mgr.register(new PencilTool());
  mgr.register(new EraserTool());
  const canvas = new PixelCanvas(16);
  canvas.fill(RED);

  mgr.setActive('eraser');
  assert.equal(mgr.activeId, 'eraser');
  mgr.onPointerDown(makeCtx(canvas), { x: 0, y: 0, button: 'left' });
  assert.deepEqual(canvas.getPixel(0, 0), TRANSPARENT);
});

test('ToolManager setActive throws for unregistered id', () => {
  const mgr = new ToolManager();
  mgr.register(new PencilTool());
  assert.throws(() => mgr.setActive('eraser'), /not registered/);
});

test('ToolManager has no active tool when empty', () => {
  const mgr = new ToolManager();
  assert.equal(mgr.active, null);
  assert.equal(mgr.activeId, null);
  // Dispatching with no active tool is safe
  const canvas = new PixelCanvas(16);
  mgr.onPointerDown(makeCtx(canvas), { x: 0, y: 0, button: 'left' });
});

test('ToolManager registeredIds returns all registered tools', () => {
  const mgr = new ToolManager();
  mgr.register(new PencilTool());
  mgr.register(new EraserTool());
  assert.deepEqual([...mgr.registeredIds].sort(), ['eraser', 'pencil']);
});
