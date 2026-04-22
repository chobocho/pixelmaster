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
import { SelectTool } from './tools/SelectTool.js';
import { MoveTool } from './tools/MoveTool.js';
import { MarqueeRenderer } from './renderer/MarqueeRenderer.js';
import type { PointerButton, ToolContext, ToolId } from './tools/Tool.js';
import { mapToPixel } from './ui/pointerMapping.js';
import { KeyboardShortcuts, isEditingContext } from './ui/KeyboardShortcuts.js';
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
import { SizePanel } from './ui/SizePanel.js';
import { showModal } from './ui/Modal.js';
import { PngExporter } from './io/PngExporter.js';
import { Popover } from './ui/Popover.js';
import { InlinePalette } from './ui/InlinePalette.js';
import { rgbaToHex } from './color/conversions.js';

const DEFAULT_SIZE: CanvasSize = 32;
const TOOL_KEY_BINDINGS: ReadonlyArray<readonly [string, ToolId]> = [
  ['p', 'pencil'],
  ['e', 'eraser'],
  ['f', 'fill'],
  ['i', 'eyedropper'],
  ['l', 'line'],
  ['r', 'rect'],
  ['o', 'ellipse'],
  ['s', 'select'],
  ['m', 'move'],
];

export class App {
  private readonly canvasEl: HTMLCanvasElement;
  private readonly renderer: Renderer;
  private readonly blitter: PixelBlitter;
  private readonly checker: CheckerboardRenderer;
  private readonly grid: GridRenderer;
  private readonly marquee: MarqueeRenderer;
  private readonly viewport: Viewport;
  private readonly state: EditorState;
  private readonly toolManager: ToolManager;
  private readonly history: HistoryManager<EditorSnapshot>;
  private readonly storage: ProjectStorage;
  private readonly autoSaver: AutoSaver;
  private readonly shortcuts: KeyboardShortcuts;

  private readonly toolbar: Toolbar;
  private readonly layerPanel: LayerPanel;
  private readonly statusBar: StatusBar;
  private readonly sizePanel: SizePanel;
  private readonly inlinePalette: InlinePalette;
  private readonly palettePopoverPanel: PalettePanel;
  private readonly resizeObserver: ResizeObserver | null;

  private lastSyncedW = 0;
  private lastSyncedH = 0;

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
    this.marquee = new MarqueeRenderer();
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
    this.toolManager.register(new SelectTool());
    this.toolManager.register(new MoveTool());
    this.toolManager.setActive('pencil');

    this.history = new HistoryManager<EditorSnapshot>();
    this.history.push(this.state.takeSnapshot());

    this.storage = new IndexedDBProjectStorage();
    this.autoSaver = new AutoSaver(() => this.saveProject(), 1000);
    this.shortcuts = this.buildShortcuts();

    const refreshUI = (): void => this.refreshUI();
    this.toolbar = new Toolbar(ui.toolbar, this.toolManager, refreshUI);
    this.statusBar = new StatusBar(ui.statusBar);

    // 색상 선택은 화면에 상시 표시.
    // FG 스왓치 탭 → HEX 입력 팝업.
    this.inlinePalette = new InlinePalette(
      ui.colorStrip,
      this.state,
      () => this.openHexInput(),
      refreshUI,
    );

    // 레이어/크기/내보내기는 팝오버.
    const layerPopover = new Popover('Layers');
    this.layerPanel = new LayerPanel(layerPopover.content, this.state, refreshUI);

    const sizePopover = new Popover('Canvas Size');
    this.sizePanel = new SizePanel(sizePopover.content, this.state.size, (next) => {
      sizePopover.close();
      this.requestSizeChange(next);
    });

    const exportPopover = new Popover('Export');
    new ExportPanel(exportPopover.content, this.state);

    // HEX 입력 기능이 필요할 때 쓸 수 있는 전체 팔레트 패널 (팝오버 안).
    const palettePopover = new Popover('Palette');
    this.palettePopoverPanel = new PalettePanel(palettePopover.content, this.state, refreshUI);

    ui.layerButton.addEventListener('click', () => layerPopover.toggle());
    ui.sizeButton.addEventListener('click', () => sizePopover.toggle());
    ui.exportButton.addEventListener('click', () => exportPopover.toggle());
    ui.undoButton.addEventListener('click', () => this.undo());
    ui.redoButton.addEventListener('click', () => this.redo());
    ui.menuButton.addEventListener('click', () => {
      this.toggleGrid();
      this.refreshUI();
    });

    void this.loadLatestProject();

    this.syncToElementSize();
    window.addEventListener('resize', this.syncToElementSize);
    window.addEventListener('keydown', this.onKeyDown);

    // 캔버스를 감싼 부모가 리사이즈되면(폴드 펼침, 팝업 조정 등) 즉시 재적용.
    const wrap = this.canvasEl.parentElement;
    if (typeof ResizeObserver !== 'undefined' && wrap !== null) {
      this.resizeObserver = new ResizeObserver(() => this.syncToElementSize());
      this.resizeObserver.observe(wrap);
    } else {
      this.resizeObserver = null;
    }

    this.bindPointerEvents();
    this.refreshUI();
  }

  private openHexInput(): void {
    const current = rgbaToHex(this.state.foregroundColor);
    const input = window.prompt('전경색 HEX (#RRGGBB)', current);
    if (input === null) return;
    const ok = this.inlinePalette.applyHex(input);
    if (!ok) {
      window.alert(`잘못된 HEX 형식: ${input}`);
    }
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
    this.palettePopoverPanel.render();
    this.inlinePalette.render();
    this.layerPanel.render();
    this.sizePanel.render(this.state.size);
    this.updateStatus();
  }

  /**
   * 사이즈 변경 요청을 처리한다.
   * - 현재 캔버스가 비어 있으면 즉시 변경
   * - 내용이 있으면 저장 여부를 묻는 모달 표시
   */
  private requestSizeChange(newSize: CanvasSize): void {
    if (newSize === this.state.size) return;
    if (this.state.isEmpty()) {
      this.applyCanvasSize(newSize);
      return;
    }
    const previousSize = this.state.size;
    showModal({
      title: '캔버스 크기 변경',
      message: `크기를 ${previousSize}×${previousSize} 에서 ${newSize}×${newSize} 로 바꾸면 현재 작업이 초기화됩니다.`,
      buttons: [
        {
          label: 'PNG 저장 후 변경',
          style: 'primary',
          onClick: () => {
            new PngExporter().triggerDownload(
              this.state,
              1,
              `pixelmaster-${previousSize}x${previousSize}.png`,
            );
            this.applyCanvasSize(newSize);
          },
        },
        {
          label: '저장 없이 변경',
          style: 'danger',
          onClick: () => this.applyCanvasSize(newSize),
        },
        {
          label: '취소',
          style: 'secondary',
          onClick: () => {
            this.sizePanel.render(this.state.size);
          },
        },
      ],
    });
  }

  private applyCanvasSize(newSize: CanvasSize): void {
    this.state.resize(newSize, 'clear');
    this.history.clear();
    this.history.push(this.state.takeSnapshot());
    // 그리드 크기가 바뀌었으니 강제 재-fit.
    this.lastSyncedW = 0;
    this.lastSyncedH = 0;
    this.syncToElementSize();
    this.autoSaver.schedule();
    this.refreshUI();
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
      selection: this.state.selection,
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
    if (this.needsFit && this.renderer.cssWidth > 0 && this.renderer.cssHeight > 0) {
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
    if (this.state.selection.isActive) {
      this.marquee.render(this.renderer.context, region, this.state.selection, this.viewport.zoom);
    }
    this.rafHandle = requestAnimationFrame(this.tick);
  };

  private readonly syncToElementSize = (): void => {
    // 캔버스는 Renderer.resize 에 의해 인라인 style.width/height 가 고정되므로
    // 부모 (pm-canvas-wrap) 의 크기를 직접 측정해야 한다.
    const parent = this.canvasEl.parentElement;
    const w = parent?.clientWidth ?? 0;
    const h = parent?.clientHeight ?? 0;
    if (w <= 0 || h <= 0) return;
    if (w === this.lastSyncedW && h === this.lastSyncedH) return;

    this.renderer.resize(w, h);
    // Renderer 사이즈와 viewport fit 을 같은 동기 호출로 맞춘다.
    // 포인터 이벤트는 항상 현재 cssW/H 기준 region 을 쓰게 되어
    // 좌표 불일치가 한 프레임도 발생하지 않는다.
    this.viewport.fitToViewport(w, h, this.gridWidth(), this.gridHeight());
    this.needsFit = false;
    this.lastSyncedW = w;
    this.lastSyncedH = h;
    this.updateStatus();
  };

  private readonly onKeyDown = (e: KeyboardEvent): void => {
    if (isEditingContext(e.target)) return;
    if (this.shortcuts.handle(e)) {
      e.preventDefault();
    }
  };

  private buildShortcuts(): KeyboardShortcuts {
    const k = new KeyboardShortcuts();
    for (const [key, id] of TOOL_KEY_BINDINGS) {
      k.register(
        key,
        () => {
          if (this.toolManager.registeredIds.includes(id)) {
            this.toolManager.setActive(id);
            this.refreshUI();
          }
        },
        `Tool: ${id}`,
      );
    }
    k.register('Ctrl+Z', () => this.undo(), 'Undo');
    k.register('Ctrl+Shift+Z', () => this.redo(), 'Redo');
    k.register('Ctrl+Y', () => this.redo(), 'Redo');
    k.register('G', () => {
      this.toggleGrid();
      this.refreshUI();
    }, 'Toggle grid');
    k.register('Escape', () => {
      if (this.state.selection.isActive) {
        this.state.selection.clear();
        this.refreshUI();
      }
    }, 'Clear selection');
    return k;
  }
}
