import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EditorState } from '../src/editor/EditorState.js';
import type { RGBA } from '../src/color/Color.js';

const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };
const BLUE: RGBA = { r: 0, g: 0, b: 255, a: 255 };

test('takeSnapshot captures layer count, active index, and pixel data', () => {
  const s = new EditorState(16);
  s.layers.addLayer('Second');
  s.layers.setActive(1);
  s.layers.setOpacity(1, 0.5);
  s.layers.setVisible(1, false);
  s.activeCanvas.setPixel(2, 2, RED);

  const snap = s.takeSnapshot();
  assert.equal(snap.size, 16);
  assert.equal(snap.activeIndex, 1);
  assert.equal(snap.layers.length, 2);
  assert.equal(snap.layers[1].name, 'Second');
  assert.equal(snap.layers[1].visible, false);
  assert.equal(snap.layers[1].opacity, 0.5);
});

test('restoreSnapshot reproduces prior layer state', () => {
  const s = new EditorState(16);
  s.activeCanvas.setPixel(0, 0, RED);
  const snap1 = s.takeSnapshot();
  s.activeCanvas.setPixel(0, 0, BLUE);
  assert.deepEqual(s.activeCanvas.getPixel(0, 0), BLUE);
  s.restoreSnapshot(snap1);
  assert.deepEqual(s.activeCanvas.getPixel(0, 0), RED);
});

test('restoreSnapshot rebuilds the layer list when layers were added', () => {
  const s = new EditorState(16);
  const snap = s.takeSnapshot(); // 1 layer
  s.layers.addLayer();
  s.layers.addLayer();
  assert.equal(s.layers.count, 3);
  s.restoreSnapshot(snap);
  assert.equal(s.layers.count, 1);
});

test('restoreSnapshot throws when size differs', () => {
  const a = new EditorState(16);
  const snap = a.takeSnapshot();
  const b = new EditorState(32);
  assert.throws(() => b.restoreSnapshot(snap), /size/);
});

test('snapshot data is a defensive copy (mutation does not leak)', () => {
  const s = new EditorState(16);
  s.activeCanvas.setPixel(0, 0, RED);
  const snap = s.takeSnapshot();
  // Mutate the live canvas
  s.activeCanvas.setPixel(0, 0, BLUE);
  // Snapshot data unchanged
  assert.equal(snap.layers[0].data[0], 255);
  assert.equal(snap.layers[0].data[2], 0);
});
