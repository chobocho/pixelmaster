import { PixelCanvas } from './PixelCanvas.js';

/**
 * `src` 를 `dest` 위에 "source over" 합성한다. (Porter-Duff)
 * `opacity` 는 source 의 전역 알파 배율(0..1).
 * 두 캔버스는 같은 크기여야 한다.
 */
export function compositeOver(src: PixelCanvas, dest: PixelCanvas, opacity: number): void {
  if (src.width !== dest.width || src.height !== dest.height) {
    throw new Error('compositeOver size mismatch');
  }
  if (opacity <= 0) return;
  const sd = src.data;
  const dd = dest.data;
  const n = sd.length;
  for (let i = 0; i < n; i += 4) {
    const sa = (sd[i + 3] / 255) * opacity;
    if (sa <= 0) continue;
    const da = dd[i + 3] / 255;
    const outA = sa + da * (1 - sa);
    if (outA <= 0) {
      dd[i] = 0;
      dd[i + 1] = 0;
      dd[i + 2] = 0;
      dd[i + 3] = 0;
      continue;
    }
    dd[i] = Math.round((sd[i] * sa + dd[i] * da * (1 - sa)) / outA);
    dd[i + 1] = Math.round((sd[i + 1] * sa + dd[i + 1] * da * (1 - sa)) / outA);
    dd[i + 2] = Math.round((sd[i + 2] * sa + dd[i + 2] * da * (1 - sa)) / outA);
    dd[i + 3] = Math.round(outA * 255);
  }
}
