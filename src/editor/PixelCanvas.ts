import type { CanvasSize } from './CanvasSize.js';
import type { RGBA } from '../color/Color.js';
import { TRANSPARENT } from '../color/Color.js';

/** resize 시 기존 픽셀 처리 방식. */
export type ResizeMode = 'preserve' | 'clear';

/**
 * 고정 사이즈 정사각형 픽셀 캔버스.
 * 내부 저장은 RGBA 인터리브된 Uint8ClampedArray (length = size * size * 4).
 */
export class PixelCanvas {
  private sizeValue: CanvasSize;
  private dataArr: Uint8ClampedArray;

  constructor(size: CanvasSize) {
    this.sizeValue = size;
    this.dataArr = new Uint8ClampedArray(size * size * 4);
  }

  get size(): CanvasSize {
    return this.sizeValue;
  }

  get width(): number {
    return this.sizeValue;
  }

  get height(): number {
    return this.sizeValue;
  }

  /** 내부 RGBA 인터리브 버퍼. 외부 렌더링·직렬화에서 직접 참조한다. */
  get data(): Uint8ClampedArray {
    return this.dataArr;
  }

  isInBounds(x: number, y: number): boolean {
    return x >= 0 && x < this.sizeValue && y >= 0 && y < this.sizeValue;
  }

  getPixel(x: number, y: number): RGBA {
    const i = this.indexOf(x, y);
    return {
      r: this.dataArr[i],
      g: this.dataArr[i + 1],
      b: this.dataArr[i + 2],
      a: this.dataArr[i + 3],
    };
  }

  setPixel(x: number, y: number, color: RGBA): void {
    const i = this.indexOf(x, y);
    this.dataArr[i] = color.r;
    this.dataArr[i + 1] = color.g;
    this.dataArr[i + 2] = color.b;
    this.dataArr[i + 3] = color.a;
  }

  /** 모든 픽셀을 주어진 색으로 덮어쓴다. */
  fill(color: RGBA): void {
    const len = this.dataArr.length;
    for (let i = 0; i < len; i += 4) {
      this.dataArr[i] = color.r;
      this.dataArr[i + 1] = color.g;
      this.dataArr[i + 2] = color.b;
      this.dataArr[i + 3] = color.a;
    }
  }

  /** 모든 픽셀을 완전 투명(0,0,0,0)으로 초기화. */
  clear(): void {
    this.fill(TRANSPARENT);
  }

  /** 동일한 데이터를 가진 독립 인스턴스를 반환. */
  clone(): PixelCanvas {
    const copy = new PixelCanvas(this.sizeValue);
    copy.dataArr.set(this.dataArr);
    return copy;
  }

  /**
   * 사이즈를 변경한다.
   * - `preserve`: 좌상단을 기준으로 기존 픽셀을 복사한다.
   *   확대 시 나머지 영역은 투명으로 채워지고, 축소 시 우/하단은 잘린다.
   * - `clear`: 전체를 투명으로 초기화한다.
   * 같은 사이즈로 호출하면 아무 일도 하지 않는다.
   */
  resize(newSize: CanvasSize, mode: ResizeMode): void {
    if (newSize === this.sizeValue) return;

    const newData = new Uint8ClampedArray(newSize * newSize * 4);
    if (mode === 'preserve') {
      const oldSize = this.sizeValue;
      const copyRows = Math.min(oldSize, newSize);
      const copyCols = Math.min(oldSize, newSize);
      const rowBytes = copyCols * 4;
      for (let y = 0; y < copyRows; y++) {
        const oldStart = y * oldSize * 4;
        const newStart = y * newSize * 4;
        newData.set(this.dataArr.subarray(oldStart, oldStart + rowBytes), newStart);
      }
    }

    this.sizeValue = newSize;
    this.dataArr = newData;
  }

  private indexOf(x: number, y: number): number {
    if (!this.isInBounds(x, y)) {
      throw new RangeError(
        `Pixel (${x}, ${y}) out of bounds for ${this.sizeValue}x${this.sizeValue}`,
      );
    }
    return (y * this.sizeValue + x) * 4;
  }
}
