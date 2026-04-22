import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EditorState } from '../src/editor/EditorState.js';
import type { RGBA } from '../src/color/Color.js';

const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };
const TRANSPARENT: RGBA = { r: 0, g: 0, b: 0, a: 0 };

test('EditorState.isEmpty returns true for fresh state', () => {
  const s = new EditorState(16);
  assert.equal(s.isEmpty(), true);
});

test('EditorState.isEmpty returns false after drawing any opaque pixel', () => {
  const s = new EditorState(16);
  s.activeCanvas.setPixel(0, 0, RED);
  assert.equal(s.isEmpty(), false);
});

test('EditorState.isEmpty ignores fully-transparent pixels', () => {
  const s = new EditorState(16);
  s.activeCanvas.setPixel(0, 0, TRANSPARENT);
  assert.equal(s.isEmpty(), true);
});

test('EditorState.isEmpty checks all layers', () => {
  const s = new EditorState(16);
  s.layers.addLayer();
  // Paint on the second (non-active) layer
  s.layers.getLayer(1).pixels.setPixel(0, 0, RED);
  assert.equal(s.isEmpty(), false);
});

test('EditorState.resize with clear mode changes size and drops content', () => {
  const s = new EditorState(16);
  s.activeCanvas.setPixel(0, 0, RED);
  s.resize(32, 'clear');
  assert.equal(s.size, 32);
  assert.equal(s.activeCanvas.width, 32);
  assert.deepEqual(s.activeCanvas.getPixel(0, 0), TRANSPARENT);
});

test('EditorState.resize with preserve mode keeps top-left pixels when growing', () => {
  const s = new EditorState(16);
  s.activeCanvas.setPixel(0, 0, RED);
  s.activeCanvas.setPixel(15, 15, RED);
  s.resize(32, 'preserve');
  assert.equal(s.size, 32);
  assert.deepEqual(s.activeCanvas.getPixel(0, 0), RED);
  assert.deepEqual(s.activeCanvas.getPixel(15, 15), RED);
  // New area is transparent
  assert.deepEqual(s.activeCanvas.getPixel(16, 16), TRANSPARENT);
});

test('EditorState.resize to same size is a no-op', () => {
  const s = new EditorState(16);
  s.activeCanvas.setPixel(0, 0, RED);
  s.resize(16, 'clear');
  assert.deepEqual(s.activeCanvas.getPixel(0, 0), RED);
});

test('EditorState.resize clears active selection', () => {
  const s = new EditorState(16);
  s.selection.setRect({ x: 1, y: 1, width: 3, height: 3 });
  s.resize(32, 'clear');
  assert.equal(s.selection.isActive, false);
});

test('EditorState.resize reallocates composite buffer to new size', () => {
  const s = new EditorState(16);
  s.resize(64, 'clear');
  assert.equal(s.compositeBuffer.width, 64);
  assert.equal(s.compositeBuffer.height, 64);
});

test('EditorState.resize resizes all layers, not just the active one', () => {
  const s = new EditorState(16);
  s.layers.addLayer();
  s.resize(32, 'clear');
  for (const layer of s.layers.all) {
    assert.equal(layer.pixels.width, 32);
    assert.equal(layer.pixels.height, 32);
  }
});

test('EditorState.resize followed by addLayer uses the new size', () => {
  const s = new EditorState(16);
  s.resize(32, 'clear');
  const newLayer = s.layers.addLayer();
  assert.equal(newLayer.pixels.width, 32);
});
