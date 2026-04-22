import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GridRenderer } from '../src/renderer/GridRenderer.js';

interface LineOp {
  name: 'moveTo' | 'lineTo';
  args: [number, number];
}

function mockCtx(): {
  ctx: CanvasRenderingContext2D;
  ops: LineOp[];
  saveCount: number;
  restoreCount: number;
  strokeCount: number;
} {
  const ops: LineOp[] = [];
  let saveCount = 0;
  let restoreCount = 0;
  let strokeCount = 0;
  const ctx = {
    strokeStyle: '',
    lineWidth: 0,
    save() {
      saveCount += 1;
    },
    restore() {
      restoreCount += 1;
    },
    beginPath() {},
    moveTo(x: number, y: number) {
      ops.push({ name: 'moveTo', args: [x, y] });
    },
    lineTo(x: number, y: number) {
      ops.push({ name: 'lineTo', args: [x, y] });
    },
    stroke() {
      strokeCount += 1;
    },
  };
  return {
    ctx: ctx as unknown as CanvasRenderingContext2D,
    ops,
    get saveCount() {
      return saveCount;
    },
    get restoreCount() {
      return restoreCount;
    },
    get strokeCount() {
      return strokeCount;
    },
  };
}

test('GridRenderer skips drawing when scale is below threshold', () => {
  const renderer = new GridRenderer('#000', 4);
  const m = mockCtx();
  renderer.render(m.ctx, { x: 0, y: 0, width: 64, height: 64 }, 32, 32, 2);
  assert.equal(m.ops.length, 0);
  assert.equal(m.strokeCount, 0);
});

test('GridRenderer draws N+1 vertical and horizontal lines when scale is large', () => {
  const renderer = new GridRenderer('#000', 4);
  const m = mockCtx();
  renderer.render(m.ctx, { x: 0, y: 0, width: 40, height: 40 }, 10, 10, 4);
  // 11 vertical + 11 horizontal = 22 moveTo + 22 lineTo
  const moveTos = m.ops.filter((o) => o.name === 'moveTo');
  const lineTos = m.ops.filter((o) => o.name === 'lineTo');
  assert.equal(moveTos.length, 22);
  assert.equal(lineTos.length, 22);
  assert.equal(m.strokeCount, 1);
  assert.equal(m.saveCount, 1);
  assert.equal(m.restoreCount, 1);
});

test('GridRenderer uses crisp 0.5 offset for 1px strokes', () => {
  const renderer = new GridRenderer('#000', 4);
  const m = mockCtx();
  renderer.render(m.ctx, { x: 10, y: 20, width: 40, height: 40 }, 10, 10, 4);
  // First vertical line at region.x + 0 * 4 + 0.5 = 10.5
  assert.deepEqual(m.ops[0]?.args, [10.5, 20]);
});
