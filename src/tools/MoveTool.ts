import type { Tool, ToolContext, ToolPointerEvent } from './Tool.js';
import { PixelCanvas } from '../editor/PixelCanvas.js';
import type { SelectionRect } from '../editor/Selection.js';

/**
 * 활성 선택 영역의 픽셀을 드래그하여 옮긴다.
 * pointerdown 시 원본 캔버스 스냅샷을 저장하고, 이동 중에는
 * 스냅샷을 기준으로 선택 영역을 (0,0,0,0) 으로 지우고 대체 위치에 다시 그린다.
 */
export class MoveTool implements Tool {
  readonly id = 'move' as const;

  private dragging = false;
  private startX = 0;
  private startY = 0;
  private snapshot: PixelCanvas | null = null;
  private liftedData: Uint8ClampedArray | null = null;
  private sourceRect: SelectionRect | null = null;

  onPointerDown(ctx: ToolContext, e: ToolPointerEvent): void {
    if (e.button !== 'left') return;
    const sel = ctx.selection;
    if (sel === undefined) return;
    const rect = sel.rect;
    if (rect === null) return;
    this.dragging = true;
    this.startX = e.x;
    this.startY = e.y;
    this.snapshot = ctx.canvas.clone();
    this.liftedData = MoveTool.extractPixels(ctx.canvas, rect);
    this.sourceRect = { ...rect };
  }

  onPointerMove(ctx: ToolContext, e: ToolPointerEvent): void {
    if (!this.dragging) return;
    this.render(ctx, e.x, e.y);
  }

  onPointerUp(ctx: ToolContext, e: ToolPointerEvent): void {
    if (!this.dragging) return;
    this.render(ctx, e.x, e.y);

    const src = this.sourceRect;
    if (src !== null && ctx.selection !== undefined) {
      const dx = e.x - this.startX;
      const dy = e.y - this.startY;
      ctx.selection.setRect({
        x: src.x + dx,
        y: src.y + dy,
        width: src.width,
        height: src.height,
      });
    }
    this.dragging = false;
    this.snapshot = null;
    this.liftedData = null;
    this.sourceRect = null;
  }

  private render(ctx: ToolContext, endX: number, endY: number): void {
    if (this.snapshot === null || this.liftedData === null || this.sourceRect === null) return;
    ctx.canvas.copyFrom(this.snapshot);
    MoveTool.clearRect(ctx.canvas, this.sourceRect);
    const dx = endX - this.startX;
    const dy = endY - this.startY;
    MoveTool.paintPixels(
      ctx.canvas,
      this.liftedData,
      this.sourceRect,
      this.sourceRect.x + dx,
      this.sourceRect.y + dy,
    );
  }

  private static extractPixels(canvas: PixelCanvas, rect: SelectionRect): Uint8ClampedArray {
    const out = new Uint8ClampedArray(rect.width * rect.height * 4);
    const stride = canvas.width * 4;
    for (let row = 0; row < rect.height; row++) {
      const srcStart = ((rect.y + row) * canvas.width + rect.x) * 4;
      const dstStart = row * rect.width * 4;
      out.set(canvas.data.subarray(srcStart, srcStart + rect.width * 4), dstStart);
    }
    void stride;
    return out;
  }

  private static clearRect(canvas: PixelCanvas, rect: SelectionRect): void {
    for (let row = 0; row < rect.height; row++) {
      for (let col = 0; col < rect.width; col++) {
        const x = rect.x + col;
        const y = rect.y + row;
        if (!canvas.isInBounds(x, y)) continue;
        canvas.setPixel(x, y, { r: 0, g: 0, b: 0, a: 0 });
      }
    }
  }

  private static paintPixels(
    canvas: PixelCanvas,
    data: Uint8ClampedArray,
    rect: SelectionRect,
    destX: number,
    destY: number,
  ): void {
    for (let row = 0; row < rect.height; row++) {
      for (let col = 0; col < rect.width; col++) {
        const x = destX + col;
        const y = destY + row;
        if (!canvas.isInBounds(x, y)) continue;
        const i = (row * rect.width + col) * 4;
        canvas.setPixel(x, y, {
          r: data[i],
          g: data[i + 1],
          b: data[i + 2],
          a: data[i + 3],
        });
      }
    }
  }
}
