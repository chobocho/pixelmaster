import type { CanvasSize } from './CanvasSize.js';
import { PixelCanvas } from './PixelCanvas.js';
import type { RGBA } from '../color/Color.js';

/** 애플리케이션 전역 상태(캔버스·색상 등)의 단일 보관소. */
export class EditorState {
  private canvasValue: PixelCanvas;

  foregroundColor: RGBA = { r: 0, g: 0, b: 0, a: 255 };
  backgroundColor: RGBA = { r: 255, g: 255, b: 255, a: 255 };

  constructor(size: CanvasSize) {
    this.canvasValue = new PixelCanvas(size);
  }

  get canvas(): PixelCanvas {
    return this.canvasValue;
  }

  replaceCanvas(canvas: PixelCanvas): void {
    this.canvasValue = canvas;
  }
}
