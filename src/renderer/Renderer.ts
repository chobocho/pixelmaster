/**
 * HiDPI(devicePixelRatio) 대응 Canvas 2D 렌더러.
 *
 * 물리 해상도는 CSS 픽셀 × DPR 로 설정하고, 컨텍스트에 DPR 스케일을 적용하여
 * 이후 모든 드로우 명령이 CSS 단위로 수행되도록 한다.
 */
export class Renderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private dpr: number;

  private cssWidthValue = 0;
  private cssHeightValue = 0;

  constructor(canvas: HTMLCanvasElement, devicePixelRatio: number) {
    const ctx = canvas.getContext('2d');
    if (ctx === null) {
      throw new Error('Canvas 2D context is not available');
    }
    this.canvas = canvas;
    this.ctx = ctx;
    this.dpr = validateDevicePixelRatio(devicePixelRatio);
  }

  /** 적용된 devicePixelRatio */
  get devicePixelRatio(): number {
    return this.dpr;
  }

  /** 디바이스 배율이 바뀐 경우 다음 resize 에 반영할 값을 갱신한다. */
  setDevicePixelRatio(devicePixelRatio: number): void {
    this.dpr = validateDevicePixelRatio(devicePixelRatio);
  }

  /** 현재 CSS 폭(px). resize 전에는 0. */
  get cssWidth(): number {
    return this.cssWidthValue;
  }

  /** 현재 CSS 높이(px). resize 전에는 0. */
  get cssHeight(): number {
    return this.cssHeightValue;
  }

  /** 내부 2D 컨텍스트. 외부 드로우 코드에서 사용. */
  get context(): CanvasRenderingContext2D {
    return this.ctx;
  }

  /**
   * CSS 단위의 논리 크기를 받아 물리 픽셀 해상도와 스케일을 재설정한다.
   * 반복 호출 시 변환 행렬을 초기화한 뒤 DPR 스케일을 다시 적용한다.
   */
  resize(cssWidth: number, cssHeight: number): void {
    if (cssWidth <= 0 || cssHeight <= 0) {
      throw new Error(`Renderer size must be positive: ${cssWidth}x${cssHeight}`);
    }
    this.cssWidthValue = cssWidth;
    this.cssHeightValue = cssHeight;

    this.canvas.width = Math.floor(cssWidth * this.dpr);
    this.canvas.height = Math.floor(cssHeight * this.dpr);
    this.canvas.style.width = `${cssWidth}px`;
    this.canvas.style.height = `${cssHeight}px`;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(this.dpr, this.dpr);
  }

  /** CSS 단위 전체 영역을 지운다. */
  clear(): void {
    this.ctx.clearRect(0, 0, this.cssWidthValue, this.cssHeightValue);
  }
}

function validateDevicePixelRatio(devicePixelRatio: number): number {
  if (!(devicePixelRatio > 0) || !Number.isFinite(devicePixelRatio)) {
    throw new Error(`Invalid devicePixelRatio: ${devicePixelRatio}`);
  }
  return devicePixelRatio;
}
