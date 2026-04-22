import type { PixelCanvas } from '../editor/PixelCanvas.js';
import type { RGBA } from '../color/Color.js';

export type PointerButton = 'left' | 'right' | 'middle';

export type ToolId =
  | 'pencil'
  | 'eraser'
  | 'fill'
  | 'eyedropper'
  | 'line'
  | 'rect'
  | 'ellipse'
  | 'select'
  | 'move';

export interface ToolPointerEvent {
  readonly x: number;
  readonly y: number;
  readonly button: PointerButton;
}

export interface ToolContext {
  readonly canvas: PixelCanvas;
  readonly foregroundColor: RGBA;
  readonly backgroundColor: RGBA;
  /** 전경색 갱신. 스포이드 등에서 사용. */
  readonly setForegroundColor?: (color: RGBA) => void;
  /** 배경색 갱신. 스포이드 등에서 사용. */
  readonly setBackgroundColor?: (color: RGBA) => void;
}

export interface Tool {
  readonly id: ToolId;
  onPointerDown(ctx: ToolContext, event: ToolPointerEvent): void;
  onPointerMove(ctx: ToolContext, event: ToolPointerEvent): void;
  onPointerUp(ctx: ToolContext, event: ToolPointerEvent): void;
}
