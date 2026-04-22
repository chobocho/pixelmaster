import type { PixelCanvas } from '../editor/PixelCanvas.js';

/**
 * PixelCanvas 를 HTMLCanvasElement 컨텍스트에 nearest-neighbor 로 그린다.
 * 내부 오프스크린 캔버스에 putImageData 후 drawImage 로 스케일 업.
 */
export class PixelBlitter {
  private readonly offscreen: HTMLCanvasElement;
  private readonly offctx: CanvasRenderingContext2D;

  constructor() {
    this.offscreen = document.createElement('canvas');
    const ctx = this.offscreen.getContext('2d');
    if (ctx === null) {
      throw new Error('Offscreen 2D context not available');
    }
    this.offctx = ctx;
  }

  /**
   * @param targetCtx 목적지 2D 컨텍스트 (이미 DPR 스케일 적용됨)
   * @param pixelCanvas 원본 픽셀 데이터
   * @param dx 대상 영역 좌측 X (CSS 단위)
   * @param dy 대상 영역 상단 Y (CSS 단위)
   * @param dw 대상 영역 폭 (CSS 단위)
   * @param dh 대상 영역 높이 (CSS 단위)
   */
  blit(
    targetCtx: CanvasRenderingContext2D,
    pixelCanvas: PixelCanvas,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ): void {
    if (
      this.offscreen.width !== pixelCanvas.width ||
      this.offscreen.height !== pixelCanvas.height
    ) {
      this.offscreen.width = pixelCanvas.width;
      this.offscreen.height = pixelCanvas.height;
    }
    const imageData = this.offctx.createImageData(pixelCanvas.width, pixelCanvas.height);
    imageData.data.set(pixelCanvas.data);
    this.offctx.putImageData(imageData, 0, 0);

    const prev = targetCtx.imageSmoothingEnabled;
    targetCtx.imageSmoothingEnabled = false;
    targetCtx.drawImage(this.offscreen, dx, dy, dw, dh);
    targetCtx.imageSmoothingEnabled = prev;
  }
}
