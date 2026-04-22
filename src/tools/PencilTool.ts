import type { Tool, ToolContext, ToolPointerEvent } from './Tool.js';
import { strokeLine } from './strokeLine.js';
import type { RGBA } from '../color/Color.js';

/**
 * 좌클릭은 전경색, 우클릭은 배경색으로 픽셀을 칠한다.
 * 드래그 시 Bresenham 직선으로 이전 위치와 현재 위치 사이 간격을 채운다.
 */
export class PencilTool implements Tool {
  readonly id = 'pencil' as const;

  private drawing = false;
  private activeColor: RGBA | null = null;
  private lastX = 0;
  private lastY = 0;

  onPointerDown(ctx: ToolContext, e: ToolPointerEvent): void {
    if (e.button !== 'left' && e.button !== 'right') return;
    this.drawing = true;
    this.activeColor = e.button === 'left' ? ctx.foregroundColor : ctx.backgroundColor;
    this.plot(ctx, e.x, e.y);
    this.lastX = e.x;
    this.lastY = e.y;
  }

  onPointerMove(ctx: ToolContext, e: ToolPointerEvent): void {
    if (!this.drawing) return;
    strokeLine(this.lastX, this.lastY, e.x, e.y, (x, y) => this.plot(ctx, x, y));
    this.lastX = e.x;
    this.lastY = e.y;
  }

  onPointerUp(_ctx: ToolContext, _e: ToolPointerEvent): void {
    this.drawing = false;
    this.activeColor = null;
  }

  private plot(ctx: ToolContext, x: number, y: number): void {
    if (this.activeColor === null) return;
    if (!ctx.canvas.isInBounds(x, y)) return;
    ctx.canvas.setPixel(x, y, this.activeColor);
  }
}
