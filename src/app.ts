import { Renderer } from './renderer/Renderer.js';
import { PixelBlitter } from './renderer/PixelBlitter.js';
import { EditorState } from './editor/EditorState.js';
import type { CanvasSize } from './editor/CanvasSize.js';
import { ToolManager } from './tools/ToolManager.js';
import { PencilTool } from './tools/PencilTool.js';
import { EraserTool } from './tools/EraserTool.js';
import type { PointerButton, ToolContext } from './tools/Tool.js';
import { centeredIntegerFit, mapToPixel, type BlitRegion } from './ui/pointerMapping.js';

const DEFAULT_SIZE: CanvasSize = 32;

/** 애플리케이션 진입점. Renderer·EditorState·ToolManager 를 연결하고 렌더 루프를 돌린다. */
export class App {
  private readonly canvasEl: HTMLCanvasElement;
  private readonly renderer: Renderer;
  private readonly blitter: PixelBlitter;
  private readonly state: EditorState;
  private readonly toolManager: ToolManager;

  private running = false;
  private rafHandle = 0;

  constructor(canvas: HTMLCanvasElement) {
    const dpr = window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
    this.canvasEl = canvas;
    this.renderer = new Renderer(canvas, dpr);
    this.blitter = new PixelBlitter();
    this.state = new EditorState(DEFAULT_SIZE);
    this.toolManager = new ToolManager();
    this.toolManager.register(new PencilTool());
    this.toolManager.register(new EraserTool());
    this.toolManager.setActive('pencil');

    this.syncToElementSize();
    window.addEventListener('resize', this.syncToElementSize);
    this.bindPointerEvents();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.rafHandle = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    if (this.rafHandle !== 0) {
      cancelAnimationFrame(this.rafHandle);
      this.rafHandle = 0;
    }
  }

  private bindPointerEvents(): void {
    this.canvasEl.addEventListener('contextmenu', (e) => e.preventDefault());
    this.canvasEl.addEventListener('pointerdown', this.onPointerDown);
    this.canvasEl.addEventListener('pointermove', this.onPointerMove);
    this.canvasEl.addEventListener('pointerup', this.onPointerUp);
    this.canvasEl.addEventListener('pointercancel', this.onPointerUp);
  }

  private getRegion(): BlitRegion {
    return centeredIntegerFit(
      this.renderer.cssWidth,
      this.renderer.cssHeight,
      this.state.canvas.width,
      this.state.canvas.height,
    );
  }

  private toPixel(ev: PointerEvent): { x: number; y: number } | null {
    const rect = this.canvasEl.getBoundingClientRect();
    const localX = ev.clientX - rect.left;
    const localY = ev.clientY - rect.top;
    const region = this.getRegion();
    return mapToPixel(localX, localY, region, this.state.canvas.width, this.state.canvas.height);
  }

  private static toButton(ev: PointerEvent): PointerButton | null {
    switch (ev.button) {
      case 0:
        return 'left';
      case 1:
        return 'middle';
      case 2:
        return 'right';
      default:
        return null;
    }
  }

  private buildContext(): ToolContext {
    return {
      canvas: this.state.canvas,
      foregroundColor: this.state.foregroundColor,
      backgroundColor: this.state.backgroundColor,
    };
  }

  private readonly onPointerDown = (ev: PointerEvent): void => {
    ev.preventDefault();
    const button = App.toButton(ev);
    const pt = this.toPixel(ev);
    if (button === null || pt === null) return;
    this.canvasEl.setPointerCapture(ev.pointerId);
    this.toolManager.onPointerDown(this.buildContext(), { x: pt.x, y: pt.y, button });
  };

  private readonly onPointerMove = (ev: PointerEvent): void => {
    const pt = this.toPixel(ev);
    if (pt === null) return;
    const button = App.toButton(ev) ?? 'left';
    this.toolManager.onPointerMove(this.buildContext(), { x: pt.x, y: pt.y, button });
  };

  private readonly onPointerUp = (ev: PointerEvent): void => {
    const button = App.toButton(ev) ?? 'left';
    const pt = this.toPixel(ev);
    if (this.canvasEl.hasPointerCapture(ev.pointerId)) {
      this.canvasEl.releasePointerCapture(ev.pointerId);
    }
    this.toolManager.onPointerUp(this.buildContext(), {
      x: pt?.x ?? 0,
      y: pt?.y ?? 0,
      button,
    });
  };

  private readonly tick = (): void => {
    if (!this.running) return;
    this.renderer.clear();
    const region = this.getRegion();
    this.blitter.blit(
      this.renderer.context,
      this.state.canvas,
      region.x,
      region.y,
      region.width,
      region.height,
    );
    this.rafHandle = requestAnimationFrame(this.tick);
  };

  private readonly syncToElementSize = (): void => {
    const el = this.canvasEl;
    const w = el.clientWidth || el.parentElement?.clientWidth || 0;
    const h = el.clientHeight || el.parentElement?.clientHeight || 0;
    if (w > 0 && h > 0) {
      this.renderer.resize(w, h);
    }
  };
}
