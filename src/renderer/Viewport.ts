import { MAX_ZOOM, MIN_ZOOM } from '../editor/CanvasSize.js';
import type { BlitRegion } from '../ui/pointerMapping.js';

/**
 * 격자(픽셀 캔버스) → 화면 매핑 상태.
 * zoom 은 한 픽셀의 한 변이 차지하는 CSS 픽셀 수(정수), offset 은 격자 좌상단의 CSS 좌표.
 */
export class Viewport {
  private zoomValue = 1;
  private offsetXValue = 0;
  private offsetYValue = 0;
  private showGridValue = true;

  get zoom(): number {
    return this.zoomValue;
  }

  get offsetX(): number {
    return this.offsetXValue;
  }

  get offsetY(): number {
    return this.offsetYValue;
  }

  get showGrid(): boolean {
    return this.showGridValue;
  }

  setShowGrid(value: boolean): void {
    this.showGridValue = value;
  }

  toggleGrid(): void {
    this.showGridValue = !this.showGridValue;
  }

  setZoom(zoom: number): void {
    this.zoomValue = clampZoom(zoom);
  }

  setOffset(x: number, y: number): void {
    this.offsetXValue = x;
    this.offsetYValue = y;
  }

  /** 격자가 뷰포트 안에 정수 배율로 완전히 들어가는 최대 줌으로 맞추고 가운데 정렬한다. */
  fitToViewport(viewportW: number, viewportH: number, gridW: number, gridH: number): void {
    const fit = Math.max(1, Math.floor(Math.min(viewportW / gridW, viewportH / gridH)));
    this.setZoom(fit);
    this.centerIn(viewportW, viewportH, gridW, gridH);
  }

  centerIn(viewportW: number, viewportH: number, gridW: number, gridH: number): void {
    const w = gridW * this.zoomValue;
    const h = gridH * this.zoomValue;
    this.offsetXValue = Math.floor((viewportW - w) / 2);
    this.offsetYValue = Math.floor((viewportH - h) / 2);
  }

  pan(dx: number, dy: number): void {
    this.offsetXValue += dx;
    this.offsetYValue += dy;
  }

  /**
   * anchorX/Y(뷰포트 CSS 좌표)가 가리키는 격자 픽셀을 유지한 채 줌을 delta 만큼 변경한다.
   */
  zoomAt(delta: number, anchorX: number, anchorY: number): void {
    const oldZoom = this.zoomValue;
    const newZoom = clampZoom(oldZoom + delta);
    if (newZoom === oldZoom) return;

    const gx = (anchorX - this.offsetXValue) / oldZoom;
    const gy = (anchorY - this.offsetYValue) / oldZoom;

    this.zoomValue = newZoom;
    this.offsetXValue = Math.round(anchorX - gx * newZoom);
    this.offsetYValue = Math.round(anchorY - gy * newZoom);
  }

  getBlitRegion(gridW: number, gridH: number): BlitRegion {
    return {
      x: this.offsetXValue,
      y: this.offsetYValue,
      width: gridW * this.zoomValue,
      height: gridH * this.zoomValue,
    };
  }
}

function clampZoom(zoom: number): number {
  const rounded = Math.floor(zoom);
  if (rounded < MIN_ZOOM) return MIN_ZOOM;
  if (rounded > MAX_ZOOM) return MAX_ZOOM;
  return rounded;
}
