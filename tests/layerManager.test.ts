import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LayerManager } from '../src/editor/LayerManager.js';
import type { RGBA } from '../src/color/Color.js';

const RED: RGBA = { r: 255, g: 0, b: 0, a: 255 };
const BLUE: RGBA = { r: 0, g: 0, b: 255, a: 255 };

test('LayerManager starts empty and no active layer', () => {
  const m = new LayerManager(16);
  assert.equal(m.count, 0);
  assert.equal(m.activeIndex, -1);
  assert.throws(() => m.active, /No active/);
});

test('addLayer becomes active when first added', () => {
  const m = new LayerManager(16);
  m.addLayer();
  assert.equal(m.count, 1);
  assert.equal(m.activeIndex, 0);
});

test('addLayer assigns unique IDs and default names', () => {
  const m = new LayerManager(16);
  const a = m.addLayer();
  const b = m.addLayer();
  assert.notEqual(a.id, b.id);
  assert.equal(a.name, 'Layer 1');
  assert.equal(b.name, 'Layer 2');
});

test('removeLayer throws if only one layer remains', () => {
  const m = new LayerManager(16);
  m.addLayer();
  assert.throws(() => m.removeLayer(0), /last remaining/);
});

test('removeLayer adjusts activeIndex when active is removed', () => {
  const m = new LayerManager(16);
  m.addLayer();
  m.addLayer();
  m.setActive(1);
  m.removeLayer(1);
  assert.equal(m.activeIndex, 0);
});

test('removeLayer below active shifts activeIndex down', () => {
  const m = new LayerManager(16);
  m.addLayer();
  m.addLayer();
  m.addLayer();
  m.setActive(2);
  m.removeLayer(0);
  assert.equal(m.activeIndex, 1);
});

test('moveLayer reorders and keeps activeIndex on the moved layer', () => {
  const m = new LayerManager(16);
  const a = m.addLayer('A');
  m.addLayer('B');
  m.addLayer('C');
  m.setActive(0);
  m.moveLayer(0, 2);
  assert.equal(m.getLayer(2), a);
  assert.equal(m.activeIndex, 2);
});

test('moveLayer keeps activeIndex valid for non-active moves', () => {
  const m = new LayerManager(16);
  m.addLayer('A');
  m.addLayer('B');
  m.addLayer('C');
  m.setActive(1);
  m.moveLayer(0, 2); // move A from bottom to top
  // Active B was at index 1, now at index 0 (A shifted down)
  assert.equal(m.getLayer(0).name, 'B');
  assert.equal(m.activeIndex, 0);
});

test('setVisible and setOpacity update layer state', () => {
  const m = new LayerManager(16);
  m.addLayer();
  m.setVisible(0, false);
  m.setOpacity(0, 0.5);
  assert.equal(m.getLayer(0).visible, false);
  assert.equal(m.getLayer(0).opacity, 0.5);
});

test('setOpacity rejects out-of-range values', () => {
  const m = new LayerManager(16);
  m.addLayer();
  assert.throws(() => m.setOpacity(0, -0.1), RangeError);
  assert.throws(() => m.setOpacity(0, 1.5), RangeError);
});

test('mergeDown merges pixels into lower and removes upper', () => {
  const m = new LayerManager(16);
  const lower = m.addLayer('lower');
  const upper = m.addLayer('upper');
  lower.pixels.setPixel(0, 0, BLUE);
  upper.pixels.setPixel(0, 0, RED);
  m.mergeDown(1);
  assert.equal(m.count, 1);
  assert.deepEqual(m.getLayer(0).pixels.getPixel(0, 0), RED);
});

test('mergeDown respects invisible upper (no composite)', () => {
  const m = new LayerManager(16);
  const lower = m.addLayer();
  const upper = m.addLayer();
  lower.pixels.setPixel(0, 0, BLUE);
  upper.pixels.setPixel(0, 0, RED);
  m.setVisible(1, false);
  m.mergeDown(1);
  assert.deepEqual(m.getLayer(0).pixels.getPixel(0, 0), BLUE);
});

test('mergeDown throws for bottom layer', () => {
  const m = new LayerManager(16);
  m.addLayer();
  m.addLayer();
  assert.throws(() => m.mergeDown(0), /bottom/);
});

test('flattenAll produces a single layer with composited pixels', () => {
  const m = new LayerManager(16);
  const bottom = m.addLayer();
  const top = m.addLayer();
  bottom.pixels.setPixel(0, 0, BLUE);
  top.pixels.setPixel(1, 1, RED);
  m.flattenAll();
  assert.equal(m.count, 1);
  assert.equal(m.activeIndex, 0);
  assert.deepEqual(m.getLayer(0).pixels.getPixel(0, 0), BLUE);
  assert.deepEqual(m.getLayer(0).pixels.getPixel(1, 1), RED);
});
