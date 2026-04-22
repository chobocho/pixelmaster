import type { BlitRegion } from '../ui/pointerMapping.js';
import type { Selection } from '../editor/Selection.js';

/** 선택 영역의 "개미 행진" 점선 외곽선을 그린다. 두 색을 엇갈려 그려 가시성을 확보. */
export class MarqueeRenderer {
  render(
    ctx: CanvasRenderingContext2D,
    region: BlitRegion,
    selection: Selection,
    scale: number,
  ): void {
    const rect = selection.rect;
    if (rect === null) return;

    const x = region.x + rect.x * scale;
    const y = region.y + rect.y * scale;
    const w = rect.width * scale;
    const h = rect.height * scale;

    ctx.save();
    ctx.lineWidth = 1;

    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'white';
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    ctx.setLineDash([4, 4]);
    ctx.lineDashOffset = 4;
    ctx.strokeStyle = 'black';
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

    ctx.restore();
  }
}
