import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CheckerboardRenderer } from '../src/renderer/CheckerboardRenderer.js';

interface FillCall {
  style: string;
  args: [number, number, number, number];
}

function mockCtx(): { ctx: CanvasRenderingContext2D; calls: FillCall[] } {
  const calls: FillCall[] = [];
  let fillStyle = '';
  const ctx = {
    get fillStyle() {
      return fillStyle;
    },
    set fillStyle(value: string) {
      fillStyle = value;
    },
    fillRect(x: number, y: number, w: number, h: number) {
      calls.push({ style: fillStyle, args: [x, y, w, h] });
    },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

test('CheckerboardRenderer paints base then alternating darker cells', () => {
  const renderer = new CheckerboardRenderer(4, '#aaa', '#333');
  const { ctx, calls } = mockCtx();
  renderer.render(ctx, { x: 0, y: 0, width: 8, height: 8 });

  // Base fill first
  assert.equal(calls[0]?.style, '#aaa');
  assert.deepEqual(calls[0]?.args, [0, 0, 8, 8]);

  // 2x2 cell grid → 2 darker cells (positions 1,0 and 0,1 where i+j odd)
  const darker = calls.slice(1);
  assert.equal(darker.length, 2);
  for (const c of darker) {
    assert.equal(c.style, '#333');
  }
});

test('CheckerboardRenderer clips last row/col to region bounds', () => {
  const renderer = new CheckerboardRenderer(4, '#aaa', '#333');
  const { ctx, calls } = mockCtx();
  renderer.render(ctx, { x: 0, y: 0, width: 10, height: 4 });

  // width=10 → 3 columns (4,4,2). One row (4).
  // i+j odd: (1,0) → x=4, w=4. That's the only odd.
  // Base + 1 dark
  assert.equal(calls.length, 2);
  assert.deepEqual(calls[1]?.args, [4, 0, 4, 4]);
});
