/**
 * 바운딩 박스 기반 타원 외곽선 (Alois Zingl 의 정수 미드포인트 알고리즘).
 * (x0,y0)-(x1,y1) 은 바운딩 박스의 대각 모서리.
 *
 * Reference: http://members.chello.at/easyfilter/bresenham.html
 */
export function strokeEllipse(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  plot: (x: number, y: number) => void,
): void {
  let a = Math.abs(x1 - x0);
  const b = Math.abs(y1 - y0);
  const b1 = b & 1;

  let dx = 4 * (1 - a) * b * b;
  let dy = 4 * (b1 + 1) * a * a;
  let err = dx + dy + b1 * a * a;

  // bounding box 좌상단/우하단으로 정규화
  if (x0 > x1) {
    x0 = x1;
    x1 = x0 + a;
  }
  if (y0 > y1) {
    y0 = y1;
  }
  y0 += (b + 1) >> 1;
  y1 = y0 - b1;

  const aStep = 8 * a * a;
  const bStep = 8 * b * b;

  do {
    plot(x1, y0);
    plot(x0, y0);
    plot(x0, y1);
    plot(x1, y1);
    const e2 = 2 * err;
    if (e2 <= dy) {
      y0++;
      y1--;
      dy += aStep;
      err += dy;
    }
    if (e2 >= dx || 2 * err > dy) {
      x0++;
      x1--;
      dx += bStep;
      err += dx;
    }
  } while (x0 <= x1);

  // 좁은 타원의 끝 꼭지점 마감
  while (y0 - y1 < b) {
    plot(x0 - 1, y0);
    plot(x1 + 1, y0);
    y0++;
    plot(x0 - 1, y1);
    plot(x1 + 1, y1);
    y1--;
  }
}
