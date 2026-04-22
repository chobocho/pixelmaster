/**
 * RGBA 픽셀 색상. 각 성분은 0..255 범위.
 * Uint8ClampedArray로 저장될 때 자동 클램핑되지만, 관용 상 값도 범위 내로 유지한다.
 */
export interface RGBA {
  readonly r: number;
  readonly g: number;
  readonly b: number;
  readonly a: number;
}

export const TRANSPARENT: RGBA = { r: 0, g: 0, b: 0, a: 0 };
