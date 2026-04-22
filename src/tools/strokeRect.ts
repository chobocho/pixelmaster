/** (x0,y0)-(x1,y1) 을 대각선으로 하는 직사각형의 테두리만 plot. */
export function strokeRect(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  plot: (x: number, y: number) => void,
): void {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  for (let x = minX; x <= maxX; x++) {
    plot(x, minY);
    if (minY !== maxY) plot(x, maxY);
  }
  for (let y = minY + 1; y <= maxY - 1; y++) {
    plot(minX, y);
    if (minX !== maxX) plot(maxX, y);
  }
}
