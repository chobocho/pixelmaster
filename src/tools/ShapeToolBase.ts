import type { Tool, ToolContext, ToolPointerEvent } from './Tool.js';
import { PixelCanvas } from '../editor/PixelCanvas.js';
import type { RGBA } from '../color/Color.js';

/**
 * 셰이프 툴 공용 로직.
 * 드래그 중에는 pointerdown 시점의 캔버스 스냅샷을 복원한 후
 * 현재 끝점까지의 도형을 미리보기로 그리고, pointerup 시 그대로 확정한다.
 */
export abstract class ShapeToolBase implements Tool {
  abstract readonly id: Tool['id'];

  private snapshot: PixelCanvas | null = null;
  private startX = 0;
  private startY = 0;
  private activeColor: RGBA | null = null;

  onPointerDown(ctx: ToolContext, e: ToolPointerEvent): void {
    if (e.button !== 'left' && e.button !== 'right') return;
    if (!ctx.canvas.isInBounds(e.x, e.y)) return;
    this.snapshot = ctx.canvas.clone();
    this.startX = e.x;
    this.startY = e.y;
    this.activeColor = e.button === 'left' ? ctx.foregroundColor : ctx.backgroundColor;
    this.drawPreview(ctx, e.x, e.y);
  }

  onPointerMove(ctx: ToolContext, e: ToolPointerEvent): void {
    if (this.snapshot === null) return;
    this.drawPreview(ctx, e.x, e.y);
  }

  onPointerUp(ctx: ToolContext, e: ToolPointerEvent): void {
    if (this.snapshot === null) return;
    this.drawPreview(ctx, e.x, e.y);
    this.snapshot = null;
    this.activeColor = null;
  }

  protected abstract drawShape(
    canvas: PixelCanvas,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    color: RGBA,
  ): void;

  private drawPreview(ctx: ToolContext, endX: number, endY: number): void {
    if (this.snapshot === null || this.activeColor === null) return;
    ctx.canvas.copyFrom(this.snapshot);
    this.drawShape(ctx.canvas, this.startX, this.startY, endX, endY, this.activeColor);
  }
}
