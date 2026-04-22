import type { CanvasSize } from './CanvasSize.js';

export interface LayerSnapshot {
  readonly name: string;
  readonly visible: boolean;
  readonly opacity: number;
  readonly data: Uint8ClampedArray;
}

export interface EditorSnapshot {
  readonly size: CanvasSize;
  readonly activeIndex: number;
  readonly layers: readonly LayerSnapshot[];
}
