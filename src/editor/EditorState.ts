import type { CanvasSize } from './CanvasSize.js';
import { PixelCanvas } from './PixelCanvas.js';
import { LayerManager } from './LayerManager.js';
import { compositeOver } from './composite.js';
import type { RGBA } from '../color/Color.js';
import { PaletteManager } from '../color/PaletteManager.js';
import { DEFAULT_PALETTE } from '../color/defaultPalette.js';

/** 애플리케이션 전역 상태(레이어·색상·팔레트) 단일 보관소. */
export class EditorState {
  readonly layers: LayerManager;
  readonly palette: PaletteManager;

  foregroundColor: RGBA = { r: 0, g: 0, b: 0, a: 255 };
  backgroundColor: RGBA = { r: 255, g: 255, b: 255, a: 255 };

  private readonly compositeBufferValue: PixelCanvas;

  constructor(size: CanvasSize) {
    this.layers = new LayerManager(size);
    this.layers.addLayer('Layer 1');

    this.compositeBufferValue = new PixelCanvas(size);

    this.palette = new PaletteManager();
    this.palette.loadJSON(DEFAULT_PALETTE);
  }

  /** 도구가 직접 수정하는 활성 레이어의 픽셀 버퍼. */
  get activeCanvas(): PixelCanvas {
    return this.layers.active.pixels;
  }

  /** 화면 출력용으로 합성된 픽셀 버퍼. updateComposite() 후 유효. */
  get compositeBuffer(): PixelCanvas {
    return this.compositeBufferValue;
  }

  /** 보이는 모든 레이어를 합성해 compositeBuffer 를 갱신한다. */
  updateComposite(): void {
    this.compositeBufferValue.clear();
    for (const layer of this.layers.all) {
      if (!layer.visible) continue;
      compositeOver(layer.pixels, this.compositeBufferValue, layer.opacity);
    }
  }

  setForegroundColor(color: RGBA): void {
    this.foregroundColor = { r: color.r, g: color.g, b: color.b, a: color.a };
  }

  setBackgroundColor(color: RGBA): void {
    this.backgroundColor = { r: color.r, g: color.g, b: color.b, a: color.a };
  }
}
