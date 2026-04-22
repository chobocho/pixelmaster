export interface IndexedImage {
  readonly indices: Uint8Array;
  /** 각 엔트리는 [R, G, B] 3바이트. 크기는 2의 거듭제곱으로 패딩된 상태. */
  readonly palette: Uint8Array;
  /** 팔레트 엔트리 수 (2의 거듭제곱). */
  readonly paletteSize: number;
  /** 투명 픽셀의 팔레트 인덱스. 없으면 -1. */
  readonly transparentIndex: number;
}

const ALPHA_THRESHOLD = 128;

/**
 * RGBA 픽셀을 최대 256색의 인덱스 이미지로 변환한다.
 * 알파 < 128 은 투명 인덱스 0 으로 통일, 나머지는 RGB 그대로 양자화 없이 고유 색 수집.
 * 고유 색이 255 를 초과하면 에러 (사전 양자화 필요).
 */
export function buildIndexedImage(width: number, height: number, rgba: Uint8ClampedArray): IndexedImage {
  if (rgba.length !== width * height * 4) {
    throw new Error(`RGBA length ${rgba.length} does not match ${width}x${height}x4`);
  }

  const indices = new Uint8Array(width * height);
  const palette: number[] = [0, 0, 0]; // index 0 = transparent slot (color value irrelevant)
  const colorIndex = new Map<number, number>(); // key = (r<<16)|(g<<8)|b, value = index

  for (let i = 0; i < width * height; i++) {
    const a = rgba[i * 4 + 3];
    if (a < ALPHA_THRESHOLD) {
      indices[i] = 0;
      continue;
    }
    const r = rgba[i * 4];
    const g = rgba[i * 4 + 1];
    const b = rgba[i * 4 + 2];
    const key = (r << 16) | (g << 8) | b;
    let idx = colorIndex.get(key);
    if (idx === undefined) {
      idx = palette.length / 3;
      if (idx > 255) {
        throw new Error('GIF encoder supports at most 255 opaque colors (plus transparent).');
      }
      palette.push(r, g, b);
      colorIndex.set(key, idx);
    }
    indices[i] = idx;
  }

  // Pad palette to next power of two (minimum 2 entries, max 256)
  const count = palette.length / 3;
  const paddedCount = Math.max(2, nextPowerOfTwo(count));
  while (palette.length / 3 < paddedCount) palette.push(0, 0, 0);

  return {
    indices,
    palette: new Uint8Array(palette),
    paletteSize: paddedCount,
    transparentIndex: 0,
  };
}

function nextPowerOfTwo(n: number): number {
  if (n <= 1) return 1;
  let p = 1;
  while (p < n) p <<= 1;
  return p;
}

/** 팔레트 크기(2의 거듭제곱) 를 컬러 테이블 size bits 로 변환 (GIF 필드용). */
export function paletteSizeBits(paletteSize: number): number {
  let bits = 0;
  let p = paletteSize;
  while (p > 1) {
    p >>= 1;
    bits += 1;
  }
  // GIF LSD / image descriptor stores size-1 as 3-bit field
  // (actual entries = 2^(field+1))
  return Math.max(1, bits - 1);
}
