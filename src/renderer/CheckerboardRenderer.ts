import type { BlitRegion } from '../ui/pointerMapping.js';

/** 투명 영역을 표현하는 체커보드 배경 렌더러. 셀 한 변은 CSS 단위. */
export class CheckerboardRenderer {
  constructor(
    private readonly cellSize: number = 8,
    private readonly lightColor: string = '#666666',
    private readonly darkColor: string = '#555555',
  ) {}

  render(ctx: CanvasRenderingContext2D, region: BlitRegion): void {
    const size = this.cellSize;
    ctx.fillStyle = this.lightColor;
    ctx.fillRect(region.x, region.y, region.width, region.height);
    ctx.fillStyle = this.darkColor;
    const cols = Math.ceil(region.width / size);
    const rows = Math.ceil(region.height / size);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        if ((i + j) % 2 !== 1) continue;
        const x = region.x + i * size;
        const y = region.y + j * size;
        const w = Math.min(size, region.width - i * size);
        const h = Math.min(size, region.height - j * size);
        ctx.fillRect(x, y, w, h);
      }
    }
  }
}
