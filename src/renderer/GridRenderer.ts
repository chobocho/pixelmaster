import type { BlitRegion } from '../ui/pointerMapping.js';

/** 격자 라인 렌더러. 픽셀 당 CSS 배율이 임계치 이상일 때만 그린다. */
export class GridRenderer {
  constructor(
    private readonly lineColor: string = 'rgba(0,0,0,0.35)',
    private readonly minScaleForGrid: number = 4,
  ) {}

  render(
    ctx: CanvasRenderingContext2D,
    region: BlitRegion,
    gridWidth: number,
    gridHeight: number,
    scale: number,
  ): void {
    if (scale < this.minScaleForGrid) return;

    ctx.save();
    ctx.strokeStyle = this.lineColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i <= gridWidth; i++) {
      const x = region.x + i * scale + 0.5;
      ctx.moveTo(x, region.y);
      ctx.lineTo(x, region.y + region.height);
    }
    for (let j = 0; j <= gridHeight; j++) {
      const y = region.y + j * scale + 0.5;
      ctx.moveTo(region.x, y);
      ctx.lineTo(region.x + region.width, y);
    }
    ctx.stroke();
    ctx.restore();
  }
}
