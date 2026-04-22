import { MAX_ZOOM, MIN_ZOOM } from '../editor/CanvasSize.js';
import type { BlitRegion } from '../ui/pointerMapping.js';

/**
 * 격자(픽셀 캔버스) → 화면 매핑 상태.
 * zoom 은 한 픽셀의 한 변이 차지하는 CSS 픽셀 수. 사용자의 수동 조작(휠)은
 * 정수 단위로 증감하지만, fitToViewport 는 화면에 꽉 차도록 실수 배율을
 * 허용한다. image-rendering: pixelated 가 적용되어 있어 실수 배율에서도
 * nearest-neighbor 로 선명하게 렌더된다.
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

  /** 정수 단위로 맞춘 줌 (수동 조작용). */
  setZoom(zoom: number): void {
    this.zoomValue = clampIntZoom(zoom);
  }

  setOffset(x: number, y: number): void {
    this.offsetXValue = x;
    this.offsetYValue = y;
  }

  /**
   * 격자가 뷰포트의 짧은 변에 꼭 맞도록 fit 한다.
   * 결과 zoom 은 실수일 수 있다 (예: 3.19).
   * 픽셀 에디터의 관용대로 작은 쪽 변이 뷰포트에 꽉 차고 긴 변은 여백을 남긴다.
   */
  fitToViewport(viewportW: number, viewportH: number, gridW: number, gridH: number): void {
    const raw = Math.min(viewportW / gridW, viewportH / gridH);
    this.zoomValue = clampFloatZoom(raw);
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
   * 현재 zoom 이 실수라도 반올림 후 정수 단위로 증감한다.
   */
  zoomAt(delta: number, anchorX: number, anchorY: number): void {
    const oldZoom = this.zoomValue;
    const baseline = Math.round(oldZoom);
    const newZoom = clampIntZoom(baseline + delta);
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

function clampIntZoom(zoom: number): number {
  const rounded = Math.floor(zoom);
  if (rounded < MIN_ZOOM) return MIN_ZOOM;
  if (rounded > MAX_ZOOM) return MAX_ZOOM;
  return rounded;
}

function clampFloatZoom(zoom: number): number {
  if (!Number.isFinite(zoom) || zoom < MIN_ZOOM) return MIN_ZOOM;
  if (zoom > MAX_ZOOM) return MAX_ZOOM;
  return zoom;
}
