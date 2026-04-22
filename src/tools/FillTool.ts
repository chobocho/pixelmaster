import type { Tool, ToolContext, ToolPointerEvent } from './Tool.js';
import { floodFill } from './floodFill.js';

/** 클릭 지점과 연결된 동일 색 영역을 전경색(좌)/배경색(우)으로 채운다. */
export class FillTool implements Tool {
  readonly id = 'fill' as const;

  onPointerDown(ctx: ToolContext, e: ToolPointerEvent): void {
    if (e.button !== 'left' && e.button !== 'right') return;
    const color = e.button === 'left' ? ctx.foregroundColor : ctx.backgroundColor;
    floodFill(ctx.canvas, e.x, e.y, color);
  }

  onPointerMove(_ctx: ToolContext, _e: ToolPointerEvent): void {
    // 연속 이동은 무시 (한 번의 클릭에 한 번의 채우기).
  }

  onPointerUp(_ctx: ToolContext, _e: ToolPointerEvent): void {
    // 상태 없음.
  }
}
