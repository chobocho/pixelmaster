import type { Tool, ToolContext, ToolPointerEvent } from './Tool.js';
import type { PixelCanvas } from '../editor/PixelCanvas.js';
import type { SelectionRect } from '../editor/Selection.js';

/** 마우스 드래그로 정수 격자 사각형 선택 영역을 지정. */
export class SelectTool implements Tool {
  readonly id = 'select' as const;

  private dragging = false;
  private startX = 0;
  private startY = 0;

  onPointerDown(ctx: ToolContext, e: ToolPointerEvent): void {
    if (e.button !== 'left') return;
    if (ctx.selection === undefined) return;
    this.dragging = true;
    this.startX = clamp(e.x, 0, ctx.canvas.width - 1);
    this.startY = clamp(e.y, 0, ctx.canvas.height - 1);
    ctx.selection.setRect(null);
  }

  onPointerMove(ctx: ToolContext, e: ToolPointerEvent): void {
    if (!this.dragging || ctx.selection === undefined) return;
    ctx.selection.setRect(SelectTool.makeRect(this.startX, this.startY, e.x, e.y, ctx.canvas));
  }

  onPointerUp(ctx: ToolContext, e: ToolPointerEvent): void {
    if (!this.dragging) return;
    this.dragging = false;
    if (ctx.selection === undefined) return;
    const rect = SelectTool.makeRect(this.startX, this.startY, e.x, e.y, ctx.canvas);
    if (rect.width <= 0 || rect.height <= 0) {
      ctx.selection.setRect(null);
    } else {
      ctx.selection.setRect(rect);
    }
  }

  private static makeRect(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    canvas: PixelCanvas,
  ): SelectionRect {
    const cx0 = clamp(x0, 0, canvas.width - 1);
    const cy0 = clamp(y0, 0, canvas.height - 1);
    const cx1 = clamp(x1, 0, canvas.width - 1);
    const cy1 = clamp(y1, 0, canvas.height - 1);
    const minX = Math.min(cx0, cx1);
    const maxX = Math.max(cx0, cx1);
    const minY = Math.min(cy0, cy1);
    const maxY = Math.max(cy0, cy1);
    return { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
  }
}

function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}
