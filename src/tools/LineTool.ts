import { ShapeToolBase } from './ShapeToolBase.js';
import { strokeLine } from './strokeLine.js';
import type { PixelCanvas } from '../editor/PixelCanvas.js';
import type { RGBA } from '../color/Color.js';

export class LineTool extends ShapeToolBase {
  readonly id = 'line' as const;

  protected drawShape(
    canvas: PixelCanvas,
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    color: RGBA,
  ): void {
    strokeLine(x0, y0, x1, y1, (x, y) => {
      if (canvas.isInBounds(x, y)) canvas.setPixel(x, y, color);
    });
  }
}
