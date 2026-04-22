import type { Tool, ToolContext, ToolPointerEvent } from './Tool.js';

/**
 * 클릭한 픽셀의 색을 전경(좌)/배경(우)색으로 지정한다.
 * ToolContext 에 setForegroundColor/setBackgroundColor 가 없으면 조용히 무시.
 */
export class EyedropperTool implements Tool {
  readonly id = 'eyedropper' as const;

  onPointerDown(ctx: ToolContext, e: ToolPointerEvent): void {
    if (!ctx.canvas.isInBounds(e.x, e.y)) return;
    const picked = ctx.canvas.getPixel(e.x, e.y);
    if (e.button === 'left') {
      ctx.setForegroundColor?.(picked);
    } else if (e.button === 'right') {
      ctx.setBackgroundColor?.(picked);
    }
  }

  onPointerMove(_ctx: ToolContext, _e: ToolPointerEvent): void {}

  onPointerUp(_ctx: ToolContext, _e: ToolPointerEvent): void {}
}
