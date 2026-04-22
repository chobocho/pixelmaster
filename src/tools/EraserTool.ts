import type { Tool, ToolContext, ToolPointerEvent } from './Tool.js';
import { strokeLine } from './strokeLine.js';
import { TRANSPARENT } from '../color/Color.js';

/** 좌클릭으로 픽셀을 완전 투명으로 덮어쓴다. 드래그 중에는 Bresenham 직선으로 연결. */
export class EraserTool implements Tool {
  readonly id = 'eraser' as const;

  private erasing = false;
  private lastX = 0;
  private lastY = 0;

  onPointerDown(ctx: ToolContext, e: ToolPointerEvent): void {
    if (e.button !== 'left') return;
    this.erasing = true;
    this.erase(ctx, e.x, e.y);
    this.lastX = e.x;
    this.lastY = e.y;
  }

  onPointerMove(ctx: ToolContext, e: ToolPointerEvent): void {
    if (!this.erasing) return;
    strokeLine(this.lastX, this.lastY, e.x, e.y, (x, y) => this.erase(ctx, x, y));
    this.lastX = e.x;
    this.lastY = e.y;
  }

  onPointerUp(_ctx: ToolContext, _e: ToolPointerEvent): void {
    this.erasing = false;
  }

  private erase(ctx: ToolContext, x: number, y: number): void {
    if (!ctx.canvas.isInBounds(x, y)) return;
    ctx.canvas.setPixel(x, y, TRANSPARENT);
  }
}
