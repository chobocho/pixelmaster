import type { PixelCanvas } from '../editor/PixelCanvas.js';
import type { RGBA } from '../color/Color.js';
import { colorEquals } from '../color/Color.js';

/**
 * 4방향 BFS Flood Fill.
 * - 시작 픽셀이 범위 밖이면 아무 일도 하지 않는다.
 * - 시작 픽셀 색이 fillColor 와 같으면 즉시 반환(무한 루프 방지).
 * - 재귀 DFS 대신 큐 기반 BFS 로 구현하여 64×64 에서도 스택 안전하다.
 */
export function floodFill(
  canvas: PixelCanvas,
  startX: number,
  startY: number,
  fillColor: RGBA,
): void {
  if (!canvas.isInBounds(startX, startY)) return;
  const target = canvas.getPixel(startX, startY);
  if (colorEquals(target, fillColor)) return;

  const width = canvas.width;
  const height = canvas.height;
  const visited = new Uint8Array(width * height);

  // 원형 버퍼 대신 head/tail 기반 배열 — shift() 는 O(n) 이므로 index 포인터 사용.
  const queueX: number[] = [startX];
  const queueY: number[] = [startY];
  let head = 0;

  while (head < queueX.length) {
    const x = queueX[head];
    const y = queueY[head];
    head += 1;

    const idx = y * width + x;
    if (visited[idx] !== 0) continue;
    visited[idx] = 1;

    if (!colorEquals(canvas.getPixel(x, y), target)) continue;
    canvas.setPixel(x, y, fillColor);

    if (x > 0) {
      queueX.push(x - 1);
      queueY.push(y);
    }
    if (x < width - 1) {
      queueX.push(x + 1);
      queueY.push(y);
    }
    if (y > 0) {
      queueX.push(x);
      queueY.push(y - 1);
    }
    if (y < height - 1) {
      queueX.push(x);
      queueY.push(y + 1);
    }
  }
}
