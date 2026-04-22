import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EditorState } from '../src/editor/EditorState.js';
import type { RGBA } from '../src/color/Color.js';

const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };

test('EditorState starts with one active layer and a default palette', () => {
  const s = new EditorState(16);
  assert.equal(s.layers.count, 1);
  assert.equal(s.layers.activeIndex, 0);
  assert.ok(s.palette.count > 0);
});

test('EditorState.activeCanvas returns active layer pixels', () => {
  const s = new EditorState(16);
  s.layers.addLayer();
  s.activeCanvas.setPixel(0, 0, RED);
  // First layer is still active (was 0), so writing to activeCanvas matches layer 0
  assert.deepEqual(s.layers.getLayer(0).pixels.getPixel(0, 0), RED);
});

test('EditorState.updateComposite merges visible layers into compositeBuffer', () => {
  const s = new EditorState(16);
  s.layers.addLayer();
  s.layers.getLayer(0).pixels.setPixel(1, 1, RED);
  s.updateComposite();
  assert.deepEqual(s.compositeBuffer.getPixel(1, 1), RED);
});

test('EditorState.updateComposite skips invisible layers', () => {
  const s = new EditorState(16);
  s.layers.getLayer(0).pixels.setPixel(0, 0, RED);
  s.layers.setVisible(0, false);
  s.updateComposite();
  assert.deepEqual(s.compositeBuffer.getPixel(0, 0), { r: 0, g: 0, b: 0, a: 0 });
});

test('EditorState setForegroundColor copies components defensively', () => {
  const s = new EditorState(16);
  const c: RGBA = { r: 1, g: 2, b: 3, a: 4 };
  s.setForegroundColor(c);
  assert.deepEqual(s.foregroundColor, c);
  assert.notStrictEqual(s.foregroundColor, c);
});

test('EditorState.isEmpty is true for a fresh state and false after painting', () => {
  const s = new EditorState(16);
  assert.equal(s.isEmpty(), true);
  s.activeCanvas.setPixel(0, 0, RED);
  assert.equal(s.isEmpty(), false);
});

test('EditorState.isEmpty treats alpha=0 pixels as empty even when RGB is set', () => {
  const s = new EditorState(16);
  s.activeCanvas.setPixel(0, 0, { r: 255, g: 0, b: 0, a: 0 });
  assert.equal(s.isEmpty(), true);
});

test('EditorState.updateComposite blends layers with opacity', () => {
  const s = new EditorState(16);
  s.activeCanvas.fill({ r: 0, g: 0, b: 255, a: 255 }); // bottom: blue
  s.layers.addLayer();
  s.layers.setActive(1);
  s.activeCanvas.fill(RED); // top: red
  s.layers.setOpacity(1, 0.5);
  s.updateComposite();
  const px = s.compositeBuffer.getPixel(0, 0);
  // 0.5 red over opaque blue → mixed RGB, alpha 255
  assert.equal(px.a, 255);
  assert.ok(px.r > 100 && px.r < 200, `mid-red expected, got ${px.r}`);
  assert.ok(px.b > 100 && px.b < 200, `mid-blue expected, got ${px.b}`);
});
