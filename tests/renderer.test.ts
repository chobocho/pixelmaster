import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Renderer } from '../src/renderer/Renderer.js';

interface MockContext {
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  scale(x: number, y: number): void;
  clearRect(x: number, y: number, w: number, h: number): void;
  calls: { name: string; args: number[] }[];
}

interface MockCanvas {
  width: number;
  height: number;
  style: { width: string; height: string };
  getContext(type: '2d'): MockContext | null;
}

function createMockCanvas(): { canvas: MockCanvas; ctx: MockContext } {
  const calls: { name: string; args: number[] }[] = [];
  const ctx: MockContext = {
    calls,
    setTransform(a, b, c, d, e, f) {
      calls.push({ name: 'setTransform', args: [a, b, c, d, e, f] });
    },
    scale(x, y) {
      calls.push({ name: 'scale', args: [x, y] });
    },
    clearRect(x, y, w, h) {
      calls.push({ name: 'clearRect', args: [x, y, w, h] });
    },
  };
  const canvas: MockCanvas = {
    width: 0,
    height: 0,
    style: { width: '', height: '' },
    getContext(type) {
      return type === '2d' ? ctx : null;
    },
  };
  return { canvas, ctx };
}

test('Renderer.resize sets physical pixels to cssSize * dpr', () => {
  const { canvas } = createMockCanvas();
  const renderer = new Renderer(canvas as unknown as HTMLCanvasElement, 2);
  renderer.resize(320, 240);

  assert.equal(canvas.width, 640);
  assert.equal(canvas.height, 480);
  assert.equal(canvas.style.width, '320px');
  assert.equal(canvas.style.height, '240px');
  assert.equal(renderer.devicePixelRatio, 2);
  assert.equal(renderer.cssWidth, 320);
  assert.equal(renderer.cssHeight, 240);
});

test('Renderer.resize resets transform and applies DPR scale', () => {
  const { canvas, ctx } = createMockCanvas();
  const renderer = new Renderer(canvas as unknown as HTMLCanvasElement, 3);
  renderer.resize(100, 100);

  const setTransformCalls = ctx.calls.filter((c) => c.name === 'setTransform');
  const scaleCalls = ctx.calls.filter((c) => c.name === 'scale');

  assert.equal(setTransformCalls.length, 1);
  assert.deepEqual(setTransformCalls[0]?.args, [1, 0, 0, 1, 0, 0]);
  assert.equal(scaleCalls.length, 1);
  assert.deepEqual(scaleCalls[0]?.args, [3, 3]);
});

test('Renderer.resize floors fractional physical size', () => {
  const { canvas } = createMockCanvas();
  const renderer = new Renderer(canvas as unknown as HTMLCanvasElement, 1.25);
  renderer.resize(100, 100);

  assert.equal(canvas.width, 125);
  assert.equal(canvas.height, 125);
});

test('Renderer.resize called multiple times keeps transform consistent', () => {
  const { canvas, ctx } = createMockCanvas();
  const renderer = new Renderer(canvas as unknown as HTMLCanvasElement, 2);
  renderer.resize(100, 100);
  renderer.resize(200, 150);

  assert.equal(canvas.width, 400);
  assert.equal(canvas.height, 300);
  const scaleCalls = ctx.calls.filter((c) => c.name === 'scale');
  assert.equal(scaleCalls.length, 2);
});

test('Renderer uses updated DPR on the next resize', () => {
  const { canvas } = createMockCanvas();
  const renderer = new Renderer(canvas as unknown as HTMLCanvasElement, 2);
  renderer.resize(100, 100);

  renderer.setDevicePixelRatio(3);
  renderer.resize(100, 100);

  assert.equal(renderer.devicePixelRatio, 3);
  assert.equal(canvas.width, 300);
  assert.equal(canvas.height, 300);
});

test('Renderer.clear clears using CSS dimensions', () => {
  const { canvas, ctx } = createMockCanvas();
  const renderer = new Renderer(canvas as unknown as HTMLCanvasElement, 2);
  renderer.resize(80, 60);
  ctx.calls.length = 0;
  renderer.clear();

  const clearCalls = ctx.calls.filter((c) => c.name === 'clearRect');
  assert.equal(clearCalls.length, 1);
  assert.deepEqual(clearCalls[0]?.args, [0, 0, 80, 60]);
});

test('Renderer throws when 2D context unavailable', () => {
  const canvas: MockCanvas = {
    width: 0,
    height: 0,
    style: { width: '', height: '' },
    getContext: () => null,
  };
  assert.throws(
    () => new Renderer(canvas as unknown as HTMLCanvasElement, 1),
    /2D context/,
  );
});

test('Renderer rejects non-positive DPR', () => {
  const { canvas } = createMockCanvas();
  assert.throws(
    () => new Renderer(canvas as unknown as HTMLCanvasElement, 0),
    /devicePixelRatio/,
  );
  const { canvas: c2 } = createMockCanvas();
  assert.throws(
    () => new Renderer(c2 as unknown as HTMLCanvasElement, -1),
    /devicePixelRatio/,
  );
});

test('Renderer rejects non-positive resize dimensions', () => {
  const { canvas } = createMockCanvas();
  const renderer = new Renderer(canvas as unknown as HTMLCanvasElement, 1);
  assert.throws(() => renderer.resize(0, 100), /positive/);
  assert.throws(() => renderer.resize(100, -5), /positive/);
});
