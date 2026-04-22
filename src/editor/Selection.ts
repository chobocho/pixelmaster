export interface SelectionRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** 현재는 사각형 선택만 지원한다 (추후 마스크 확장 가능). */
export class Selection {
  private rectValue: SelectionRect | null = null;

  get rect(): SelectionRect | null {
    return this.rectValue;
  }

  get isActive(): boolean {
    return this.rectValue !== null;
  }

  setRect(rect: SelectionRect | null): void {
    this.rectValue = rect === null ? null : { ...rect };
  }

  clear(): void {
    this.rectValue = null;
  }

  contains(x: number, y: number): boolean {
    const r = this.rectValue;
    if (r === null) return false;
    return x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height;
  }
}
