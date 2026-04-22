/** 지원하는 캔버스 사이즈 목록 (정사각형, 한 변의 픽셀 수). */
export const CANVAS_SIZES = [16, 24, 32, 48, 64, 128, 160, 192] as const;
export type CanvasSize = (typeof CANVAS_SIZES)[number];

/** 각 캔버스 사이즈별 기본 줌 배율 (편집 영역 ~320px 기준). */
export const DEFAULT_ZOOM: Record<CanvasSize, number> = {
  16: 20,
  24: 14,
  32: 10,
  48: 8,
  64: 6,
  128: 3,
  160: 2,
  192: 2,
};

export const MAX_UNDO_STEPS = 50;
export const TARGET_FPS = 60;
export const MAX_PALETTE_COLORS = 32;
export const MAX_ZOOM = 32;
export const MIN_ZOOM = 1;

/** 런타임에서 숫자가 지원 사이즈인지 판별하는 타입 가드. */
export function isCanvasSize(n: number): n is CanvasSize {
  return (CANVAS_SIZES as readonly number[]).includes(n);
}
