import { Renderer } from './renderer/Renderer.js';
import { PixelBlitter } from './renderer/PixelBlitter.js';
import { CheckerboardRenderer } from './renderer/CheckerboardRenderer.js';
import { GridRenderer } from './renderer/GridRenderer.js';
import { Viewport } from './renderer/Viewport.js';
import { EditorState } from './editor/EditorState.js';
import type { CanvasSize } from './editor/CanvasSize.js';
import { ToolManager } from './tools/ToolManager.js';
import { PencilTool } from './tools/PencilTool.js';
import { EraserTool } from './tools/EraserTool.js';
import { FillTool } from './tools/FillTool.js';
import type { PointerButton, ToolContext } from './tools/Tool.js';
import { mapToPixel } from './ui/pointerMapping.js';

const DEFAULT_SIZE: CanvasSize = 32;

export class App {
  private readonly canvasEl: HTMLCanvasElement;
  private readonly renderer: Renderer;
  private readonly blitter: PixelBlitter;
  private readonly checker: CheckerboardRenderer;
  private readonly grid: GridRenderer;
  private readonly viewport: Viewport;
  private readonly state: EditorState;
  private readonly toolManager: ToolManager;

  private running = false;
  private rafHandle = 0;
  private needsFit = true;

  constructor(canvas: HTMLCanvasElement) {
    const dpr = window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
    this.canvasEl = canvas;
    this.renderer = new Renderer(canvas, dpr);
    this.blitter = new PixelBlitter();
    this.checker = new CheckerboardRenderer();
    this.grid = new GridRenderer();
    this.viewport = new Viewport();
    this.state = new EditorState(DEFAULT_SIZE);
    this.toolManager = new ToolManager();
    this.toolManager.register(new PencilTool());
    this.toolManager.register(new EraserTool());
    this.toolManager.register(new FillTool());
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

  toggleGrid(): void {
    this.viewport.toggleGrid();
  }

  private bindPointerEvents(): void {
    this.canvasEl.addEventListener('contextmenu', (e) => e.preventDefault());
    this.canvasEl.addEventListener('pointerdown', this.onPointerDown);
    this.canvasEl.addEventListener('pointermove', this.onPointerMove);
    this.canvasEl.addEventListener('pointerup', this.onPointerUp);
    this.canvasEl.addEventListener('pointercancel', this.onPointerUp);
    this.canvasEl.addEventListener('wheel', this.onWheel, { passive: false });
  }

  private gridWidth(): number {
    return this.state.canvas.width;
  }

  private gridHeight(): number {
    return this.state.canvas.height;
  }

  private toLocal(ev: { clientX: number; clientY: number }): { x: number; y: number } {
    const rect = this.canvasEl.getBoundingClientRect();
    return { x: ev.clientX - rect.left, y: ev.clientY - rect.top };
  }

  private toPixel(ev: PointerEvent): { x: number; y: number } | null {
    const local = this.toLocal(ev);
    const region = this.viewport.getBlitRegion(this.gridWidth(), this.gridHeight());
    return mapToPixel(local.x, local.y, region, this.gridWidth(), this.gridHeight());
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

  private readonly onWheel = (ev: WheelEvent): void => {
    ev.preventDefault();
    const local = this.toLocal(ev);
    const delta = ev.deltaY > 0 ? -1 : 1;
    this.viewport.zoomAt(delta, local.x, local.y);
  };

  private readonly tick = (): void => {
    if (!this.running) return;
    if (this.needsFit) {
      this.viewport.fitToViewport(
        this.renderer.cssWidth,
        this.renderer.cssHeight,
        this.gridWidth(),
        this.gridHeight(),
      );
      this.needsFit = false;
    }
    this.renderer.clear();
    const region = this.viewport.getBlitRegion(this.gridWidth(), this.gridHeight());
    this.checker.render(this.renderer.context, region);
    this.blitter.blit(
      this.renderer.context,
      this.state.canvas,
      region.x,
      region.y,
      region.width,
      region.height,
    );
    if (this.viewport.showGrid) {
      this.grid.render(
        this.renderer.context,
        region,
        this.gridWidth(),
        this.gridHeight(),
        this.viewport.zoom,
      );
    }
    this.rafHandle = requestAnimationFrame(this.tick);
  };

  private readonly syncToElementSize = (): void => {
    const el = this.canvasEl;
    const w = el.clientWidth || el.parentElement?.clientWidth || 0;
    const h = el.clientHeight || el.parentElement?.clientHeight || 0;
    if (w > 0 && h > 0) {
      this.renderer.resize(w, h);
      this.needsFit = true;
    }
  };
}
