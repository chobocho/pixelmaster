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
import { EyedropperTool } from './tools/EyedropperTool.js';
import { LineTool } from './tools/LineTool.js';
import { RectTool } from './tools/RectTool.js';
import { EllipseTool } from './tools/EllipseTool.js';
import type { PointerButton, ToolContext, ToolId } from './tools/Tool.js';
import { mapToPixel } from './ui/pointerMapping.js';
import { HistoryManager } from './editor/HistoryManager.js';
import type { EditorSnapshot } from './editor/snapshot.js';
import { IndexedDBProjectStorage } from './storage/IndexedDBProjectStorage.js';
import type { ProjectStorage } from './storage/ProjectStorage.js';
import { AutoSaver } from './storage/AutoSaver.js';
import {
  applyProjectRecord,
  projectRecordFromState,
} from './storage/ProjectRecord.js';
import type { UIRefs } from './ui/UILayout.js';
import { Toolbar } from './ui/Toolbar.js';
import { PalettePanel } from './ui/PalettePanel.js';
import { LayerPanel } from './ui/LayerPanel.js';
import { ExportPanel } from './ui/ExportPanel.js';
import { StatusBar } from './ui/StatusBar.js';

const DEFAULT_SIZE: CanvasSize = 32;
const TOOL_SHORTCUTS: Readonly<Record<string, ToolId>> = {
  p: 'pencil',
  e: 'eraser',
  f: 'fill',
  i: 'eyedropper',
  l: 'line',
  r: 'rect',
  o: 'ellipse',
};

export class App {
  private readonly canvasEl: HTMLCanvasElement;
  private readonly renderer: Renderer;
  private readonly blitter: PixelBlitter;
  private readonly checker: CheckerboardRenderer;
  private readonly grid: GridRenderer;
  private readonly viewport: Viewport;
  private readonly state: EditorState;
  private readonly toolManager: ToolManager;
  private readonly history: HistoryManager<EditorSnapshot>;
  private readonly storage: ProjectStorage;
  private readonly autoSaver: AutoSaver;

  private readonly toolbar: Toolbar;
  private readonly palette: PalettePanel;
  private readonly layerPanel: LayerPanel;
  private readonly statusBar: StatusBar;

  private projectId = 'default';
  private projectName = 'Untitled';

  private running = false;
  private rafHandle = 0;
  private needsFit = true;
  private lastPixel: { x: number; y: number } | null = null;
  private hoverPixel: { x: number; y: number } | null = null;

  constructor(ui: UIRefs) {
    const canvas = ui.canvas;
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
    this.toolManager.register(new EyedropperTool());
    this.toolManager.register(new LineTool());
    this.toolManager.register(new RectTool());
    this.toolManager.register(new EllipseTool());
    this.toolManager.setActive('pencil');

    this.history = new HistoryManager<EditorSnapshot>();
    this.history.push(this.state.takeSnapshot());

    this.storage = new IndexedDBProjectStorage();
    this.autoSaver = new AutoSaver(() => this.saveProject(), 1000);

    const refreshUI = (): void => this.refreshUI();
    this.toolbar = new Toolbar(ui.toolbar, this.toolManager, refreshUI);
    this.palette = new PalettePanel(ui.colorPanel, this.state, refreshUI);
    this.layerPanel = new LayerPanel(ui.layerPanel, this.state, refreshUI);
    new ExportPanel(ui.exportPanel, this.state);
    this.statusBar = new StatusBar(ui.statusBar);
    // Palette panel hosts both FG/BG swatches and grid in colorPanel;
    // We also render a minimal palette grid inside palettePanel for space.
    new PalettePanel(ui.palettePanel, this.state, refreshUI);

    void this.loadLatestProject();

    this.syncToElementSize();
    window.addEventListener('resize', this.syncToElementSize);
    window.addEventListener('keydown', this.onKeyDown);
    this.bindPointerEvents();
    this.refreshUI();
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

  undo(): boolean {
    const snap = this.history.undo();
    if (snap === null) return false;
    this.state.restoreSnapshot(snap);
    this.refreshUI();
    this.autoSaver.schedule();
    return true;
  }

  redo(): boolean {
    const snap = this.history.redo();
    if (snap === null) return false;
    this.state.restoreSnapshot(snap);
    this.refreshUI();
    this.autoSaver.schedule();
    return true;
  }

  private refreshUI(): void {
    this.toolbar.render();
    this.palette.render();
    this.layerPanel.render();
    this.updateStatus();
  }

  private updateStatus(): void {
    this.statusBar.update({
      width: this.state.activeCanvas.width,
      height: this.state.activeCanvas.height,
      zoom: this.viewport.zoom,
      cursor: this.hoverPixel ?? undefined,
      tool: this.toolManager.activeId ?? undefined,
      layers: {
        total: this.state.layers.count,
        active: this.state.layers.activeIndex,
      },
    });
  }

  private async loadLatestProject(): Promise<void> {
    try {
      const list = await this.storage.list();
      if (list.length === 0) return;
      const latest = list[0];
      const record = await this.storage.load(latest.id);
      if (record === null) return;
      if (record.snapshot.size !== this.state.size) return;
      this.projectId = record.id;
      this.projectName = record.name;
      applyProjectRecord(this.state, record);
      this.history.clear();
      this.history.push(this.state.takeSnapshot());
      this.refreshUI();
    } catch (err) {
      console.warn('Failed to load project', err);
    }
  }

  private async saveProject(): Promise<void> {
    try {
      const record = projectRecordFromState(this.state, {
        id: this.projectId,
        name: this.projectName,
      });
      await this.storage.save(record);
    } catch (err) {
      console.warn('Failed to save project', err);
    }
  }

  private bindPointerEvents(): void {
    this.canvasEl.addEventListener('contextmenu', (e) => e.preventDefault());
    this.canvasEl.addEventListener('pointerdown', this.onPointerDown);
    this.canvasEl.addEventListener('pointermove', this.onPointerMove);
    this.canvasEl.addEventListener('pointerup', this.onPointerUp);
    this.canvasEl.addEventListener('pointercancel', this.onPointerUp);
    this.canvasEl.addEventListener('wheel', this.onWheel, { passive: false });
    this.canvasEl.addEventListener('pointerleave', () => {
      this.hoverPixel = null;
      this.updateStatus();
    });
  }

  private gridWidth(): number {
    return this.state.activeCanvas.width;
  }

  private gridHeight(): number {
    return this.state.activeCanvas.height;
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
      canvas: this.state.activeCanvas,
      foregroundColor: this.state.foregroundColor,
      backgroundColor: this.state.backgroundColor,
      setForegroundColor: (c) => {
        this.state.setForegroundColor(c);
        this.refreshUI();
      },
      setBackgroundColor: (c) => {
        this.state.setBackgroundColor(c);
        this.refreshUI();
      },
    };
  }

  private readonly onPointerDown = (ev: PointerEvent): void => {
    ev.preventDefault();
    const button = App.toButton(ev);
    const pt = this.toPixel(ev);
    if (button === null || pt === null) return;
    this.canvasEl.setPointerCapture(ev.pointerId);
    this.lastPixel = pt;
    this.toolManager.onPointerDown(this.buildContext(), { x: pt.x, y: pt.y, button });
  };

  private readonly onPointerMove = (ev: PointerEvent): void => {
    const pt = this.toPixel(ev);
    this.hoverPixel = pt;
    if (pt === null) {
      this.updateStatus();
      return;
    }
    this.lastPixel = pt;
    const button = App.toButton(ev) ?? 'left';
    this.toolManager.onPointerMove(this.buildContext(), { x: pt.x, y: pt.y, button });
    this.updateStatus();
  };

  private readonly onPointerUp = (ev: PointerEvent): void => {
    const pt = this.toPixel(ev) ?? this.lastPixel;
    if (this.canvasEl.hasPointerCapture(ev.pointerId)) {
      this.canvasEl.releasePointerCapture(ev.pointerId);
    }
    if (pt === null) return;
    const button = App.toButton(ev) ?? 'left';
    this.toolManager.onPointerUp(this.buildContext(), { x: pt.x, y: pt.y, button });
    this.lastPixel = null;
    this.history.push(this.state.takeSnapshot());
    this.autoSaver.schedule();
    this.refreshUI();
  };

  private readonly onWheel = (ev: WheelEvent): void => {
    ev.preventDefault();
    const local = this.toLocal(ev);
    const delta = ev.deltaY > 0 ? -1 : 1;
    this.viewport.zoomAt(delta, local.x, local.y);
    this.updateStatus();
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
      this.updateStatus();
    }
    this.renderer.clear();
    const region = this.viewport.getBlitRegion(this.gridWidth(), this.gridHeight());
    this.checker.render(this.renderer.context, region);
    this.state.updateComposite();
    this.blitter.blit(
      this.renderer.context,
      this.state.compositeBuffer,
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

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    const target = e.target as HTMLElement | null;
    if (target !== null) {
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable) return;
    }
    if (e.ctrlKey || e.metaKey) {
      const k = e.key.toLowerCase();
      if (k === 'z') {
        e.preventDefault();
        if (e.shiftKey) this.redo();
        else this.undo();
        return;
      }
      if (k === 'y') {
        e.preventDefault();
        this.redo();
        return;
      }
      return;
    }
    const id = TOOL_SHORTCUTS[e.key.toLowerCase()];
    if (id !== undefined && this.toolManager.registeredIds.includes(id)) {
      this.toolManager.setActive(id);
      this.refreshUI();
    }
  };
}
