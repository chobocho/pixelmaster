import type { RGBA } from './Color.js';
import { MAX_PALETTE_COLORS } from '../editor/CanvasSize.js';

/** 팔레트(색상 목록) 관리. 최대 색상 수 제한, JSON 직렬화/역직렬화 지원. */
export class PaletteManager {
  private colors: RGBA[] = [];
  private readonly maxColors: number;

  constructor(maxColors: number = MAX_PALETTE_COLORS) {
    if (maxColors <= 0) {
      throw new Error(`maxColors must be positive: ${maxColors}`);
    }
    this.maxColors = maxColors;
  }

  get count(): number {
    return this.colors.length;
  }

  get capacity(): number {
    return this.maxColors;
  }

  get all(): readonly RGBA[] {
    return this.colors;
  }

  get(index: number): RGBA {
    this.assertIndex(index);
    const c = this.colors[index];
    return { r: c.r, g: c.g, b: c.b, a: c.a };
  }

  add(color: RGBA): void {
    if (this.colors.length >= this.maxColors) {
      throw new Error(`Palette is full (max ${this.maxColors} colors)`);
    }
    this.colors.push({ r: color.r, g: color.g, b: color.b, a: color.a });
  }

  replace(index: number, color: RGBA): void {
    this.assertIndex(index);
    this.colors[index] = { r: color.r, g: color.g, b: color.b, a: color.a };
  }

  remove(index: number): void {
    this.assertIndex(index);
    this.colors.splice(index, 1);
  }

  clear(): void {
    this.colors = [];
  }

  toJSON(): RGBA[] {
    return this.colors.map((c) => ({ r: c.r, g: c.g, b: c.b, a: c.a }));
  }

  loadJSON(data: readonly RGBA[]): void {
    if (data.length > this.maxColors) {
      throw new Error(`Cannot load ${data.length} colors into palette of capacity ${this.maxColors}`);
    }
    this.colors = data.map((c) => ({ r: c.r, g: c.g, b: c.b, a: c.a }));
  }

  private assertIndex(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.colors.length) {
      throw new RangeError(`Palette index ${index} out of range (count=${this.colors.length})`);
    }
  }
}
