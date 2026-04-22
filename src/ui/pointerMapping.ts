export interface BlitRegion {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * 캔버스 내 CSS 좌표를 격자 픽셀 좌표로 변환한다.
 * blit 영역 바깥이면 null 을 반환.
 */
export function mapToPixel(
  clientX: number,
  clientY: number,
  region: BlitRegion,
  gridWidth: number,
  gridHeight: number,
): { x: number; y: number } | null {
  if (clientX < region.x || clientY < region.y) return null;
  if (clientX >= region.x + region.width) return null;
  if (clientY >= region.y + region.height) return null;
  const px = Math.floor(((clientX - region.x) / region.width) * gridWidth);
  const py = Math.floor(((clientY - region.y) / region.height) * gridHeight);
  return { x: px, y: py };
}

/**
 * 뷰포트 안에 격자가 정수 배율로 가운데 맞춤되도록 blit 영역을 계산한다.
 * 격자가 뷰포트보다 크면 scale=1 로 클리핑된다.
 */
export function centeredIntegerFit(
  viewportWidth: number,
  viewportHeight: number,
  gridWidth: number,
  gridHeight: number,
): BlitRegion {
  const scale = Math.max(
    1,
    Math.floor(Math.min(viewportWidth / gridWidth, viewportHeight / gridHeight)),
  );
  const w = gridWidth * scale;
  const h = gridHeight * scale;
  return {
    x: Math.floor((viewportWidth - w) / 2),
    y: Math.floor((viewportHeight - h) / 2),
    width: w,
    height: h,
  };
}
