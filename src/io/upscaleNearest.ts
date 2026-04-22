import type { PixelCanvas } from '../editor/PixelCanvas.js';

export interface RawImage {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
}

/** PixelCanvas 를 정수 배율로 nearest-neighbor 업스케일한 RGBA 버퍼를 반환. */
export function upscaleNearest(src: PixelCanvas, scale: number): RawImage {
  if (!Number.isInteger(scale) || scale < 1) {
    throw new Error(`scale must be a positive integer: ${scale}`);
  }
  const srcW = src.width;
  const srcH = src.height;
  const w = srcW * scale;
  const h = srcH * scale;
  const data = new Uint8ClampedArray(w * h * 4);
  const sd = src.data;

  for (let y = 0; y < h; y++) {
    const sy = (y / scale) | 0;
    for (let x = 0; x < w; x++) {
      const sx = (x / scale) | 0;
      const si = (sy * srcW + sx) * 4;
      const di = (y * w + x) * 4;
      data[di] = sd[si];
      data[di + 1] = sd[si + 1];
      data[di + 2] = sd[si + 2];
      data[di + 3] = sd[si + 3];
    }
  }

  return { width: w, height: h, data };
}
