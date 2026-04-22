import { ShapeToolBase } from './ShapeToolBase.js';
import { strokeRect } from './strokeRect.js';
import type { PixelCanvas } from '../editor/PixelCanvas.js';
import type { RGBA } from '../color/Color.js';

export class RectTool extends ShapeToolBase {
  readonly id = 'rect' as const;

  protected drawShape(
    canvas: PixelCanvas,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: RGBA,
  ): void {
    strokeRect(x0, y0, x1, y1, (x, y) => {
      if (canvas.isInBounds(x, y)) canvas.setPixel(x, y, color);
    });
  }
}
