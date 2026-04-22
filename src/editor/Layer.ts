import type { CanvasSize } from './CanvasSize.js';
import { PixelCanvas } from './PixelCanvas.js';

export class Layer {
  readonly id: string;
  readonly pixels: PixelCanvas;
  name: string;
  visible: boolean = true;
  opacity: number = 1;

  constructor(id: string, name: string, size: CanvasSize) {
    this.id = id;
    this.name = name;
    this.pixels = new PixelCanvas(size);
  }
}
