import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Viewport } from '../src/renderer/Viewport.js';
import { MAX_ZOOM, MIN_ZOOM } from '../src/editor/CanvasSize.js';

test('Viewport starts at zoom 1, offset 0, grid visible', () => {
  const vp = new Viewport();
  assert.equal(vp.zoom, 1);
  assert.equal(vp.offsetX, 0);
  assert.equal(vp.offsetY, 0);
  assert.equal(vp.showGrid, true);
});

test('Viewport setZoom clamps to [MIN_ZOOM, MAX_ZOOM]', () => {
  const vp = new Viewport();
  vp.setZoom(0);
  assert.equal(vp.zoom, MIN_ZOOM);
  vp.setZoom(100);
  assert.equal(vp.zoom, MAX_ZOOM);
  vp.setZoom(-5);
  assert.equal(vp.zoom, MIN_ZOOM);
});

test('Viewport fitToViewport uses exact (float) scale fitting the shorter dimension', () => {
  const vp = new Viewport();
  vp.fitToViewport(500, 400, 32, 32);
  // min(500/32=15.625, 400/32=12.5) → 12.5
  assert.equal(vp.zoom, 12.5);
});

test('Viewport fitToViewport 에서 긴 쪽은 여백, 짧은 쪽은 꽉 참', () => {
  const vp = new Viewport();
  vp.fitToViewport(749, 612, 192, 192); // Fold 가로 모드 근사치
  // 612/192 = 3.1875 → 짧은 변(세로)이 꽉 참
  assert.equal(vp.zoom, 612 / 192);
});

test('Viewport centerIn centers the grid', () => {
  const vp = new Viewport();
  vp.setZoom(10);
  vp.centerIn(500, 400, 32, 32);
  assert.equal(vp.offsetX, Math.floor((500 - 320) / 2));
  assert.equal(vp.offsetY, Math.floor((400 - 320) / 2));
});

test('Viewport getBlitRegion reflects zoom and offset', () => {
  const vp = new Viewport();
  vp.setZoom(8);
  vp.setOffset(10, 20);
  const r = vp.getBlitRegion(32, 32);
  assert.deepEqual(r, { x: 10, y: 20, width: 256, height: 256 });
});

test('Viewport zoomAt keeps anchor grid coordinate stationary', () => {
  const vp = new Viewport();
  vp.setZoom(4);
  vp.setOffset(100, 100);
  // Anchor at viewport pixel (120, 120) → grid pixel ((120-100)/4, (120-100)/4) = (5, 5)
  vp.zoomAt(4, 120, 120); // zoom 4 → 8

  assert.equal(vp.zoom, 8);
  // grid (5,5) should map to viewport (120,120) at new zoom
  const newGridX = (120 - vp.offsetX) / 8;
  const newGridY = (120 - vp.offsetY) / 8;
  assert.equal(newGridX, 5);
  assert.equal(newGridY, 5);
});

test('Viewport zoomAt 은 실수 zoom 을 반올림 후 정수 단위로 증감', () => {
  const vp = new Viewport();
  vp.fitToViewport(749, 612, 192, 192); // zoom = 3.1875
  vp.zoomAt(1, 0, 0); // round(3.19) + 1 = 4
  assert.equal(vp.zoom, 4);
});

test('Viewport zoomAt respects MIN/MAX clamping', () => {
  const vp = new Viewport();
  vp.setZoom(MIN_ZOOM);
  vp.zoomAt(-5, 0, 0);
  assert.equal(vp.zoom, MIN_ZOOM);

  vp.setZoom(MAX_ZOOM);
  vp.zoomAt(10, 0, 0);
  assert.equal(vp.zoom, MAX_ZOOM);
});

test('Viewport pan updates offset', () => {
  const vp = new Viewport();
  vp.setOffset(10, 20);
  vp.pan(5, -10);
  assert.equal(vp.offsetX, 15);
  assert.equal(vp.offsetY, 10);
});

test('Viewport toggleGrid flips showGrid', () => {
  const vp = new Viewport();
  assert.equal(vp.showGrid, true);
  vp.toggleGrid();
  assert.equal(vp.showGrid, false);
  vp.toggleGrid();
  assert.equal(vp.showGrid, true);
});
