import type { CanvasSize } from './CanvasSize.js';
import { Layer } from './Layer.js';
import { PixelCanvas } from './PixelCanvas.js';
import { compositeOver } from './composite.js';
import type { LayerSnapshot } from './snapshot.js';

/**
 * 레이어 순서는 0번이 최하단, 마지막 인덱스가 최상단이다.
 * 최소 1개 레이어를 항상 유지한다.
 */
export class LayerManager {
  private size: CanvasSize;
  private layers: Layer[] = [];
  private activeIndexValue = -1;
  private nextIdSeq = 1;

  constructor(size: CanvasSize) {
    this.size = size;
  }

  get count(): number {
    return this.layers.length;
  }

  get all(): readonly Layer[] {
    return this.layers;
  }

  get active(): Layer {
    if (this.activeIndexValue < 0) {
      throw new Error('No active layer (LayerManager is empty)');
    }
    return this.layers[this.activeIndexValue];
  }

  get activeIndex(): number {
    return this.activeIndexValue;
  }

  getLayer(index: number): Layer {
    this.assertIndex(index);
    return this.layers[index];
  }

  addLayer(name?: string): Layer {
    const layer = new Layer(
      `layer-${this.nextIdSeq++}`,
      name ?? `Layer ${this.layers.length + 1}`,
      this.size,
    );
    this.layers.push(layer);
    if (this.activeIndexValue < 0) this.activeIndexValue = 0;
    return layer;
  }

  removeLayer(index: number): void {
    this.assertIndex(index);
    if (this.layers.length === 1) {
      throw new Error('Cannot remove the last remaining layer');
    }
    this.layers.splice(index, 1);
    if (this.activeIndexValue >= this.layers.length) {
      this.activeIndexValue = this.layers.length - 1;
    } else if (index < this.activeIndexValue) {
      this.activeIndexValue -= 1;
    }
  }

  moveLayer(from: number, to: number): void {
    this.assertIndex(from);
    if (!Number.isInteger(to) || to < 0 || to >= this.layers.length) {
      throw new RangeError(`Destination index ${to} out of range`);
    }
    if (from === to) return;
    const [moved] = this.layers.splice(from, 1);
    this.layers.splice(to, 0, moved);
    if (from === this.activeIndexValue) {
      this.activeIndexValue = to;
    } else if (from < this.activeIndexValue && to >= this.activeIndexValue) {
      this.activeIndexValue -= 1;
    } else if (from > this.activeIndexValue && to <= this.activeIndexValue) {
      this.activeIndexValue += 1;
    }
  }

  setActive(index: number): void {
    this.assertIndex(index);
    this.activeIndexValue = index;
  }

  setVisible(index: number, visible: boolean): void {
    this.assertIndex(index);
    this.layers[index].visible = visible;
  }

  setOpacity(index: number, opacity: number): void {
    this.assertIndex(index);
    if (!Number.isFinite(opacity) || opacity < 0 || opacity > 1) {
      throw new RangeError(`Opacity ${opacity} must be in [0, 1]`);
    }
    this.layers[index].opacity = opacity;
  }

  /** index 레이어를 index-1 레이어 위에 합성하고 index 를 제거한다. */
  mergeDown(index: number): void {
    this.assertIndex(index);
    if (index === 0) {
      throw new Error('Cannot merge down the bottom layer');
    }
    const upper = this.layers[index];
    const lower = this.layers[index - 1];
    if (upper.visible && upper.opacity > 0) {
      compositeOver(upper.pixels, lower.pixels, upper.opacity);
    }
    this.removeLayer(index);
  }

  /** 보이는 레이어를 모두 합성하여 단일 레이어로 치환한다. */
  flattenAll(): void {
    const flat = new PixelCanvas(this.size);
    for (const layer of this.layers) {
      if (!layer.visible) continue;
      compositeOver(layer.pixels, flat, layer.opacity);
    }
    const flattened = new Layer(`layer-${this.nextIdSeq++}`, 'Flattened', this.size);
    flattened.pixels.copyFrom(flat);
    this.layers = [flattened];
    this.activeIndexValue = 0;
  }

  get canvasSize(): CanvasSize {
    return this.size;
  }

  /** 모든 레이어를 newSize 로 리사이즈한다. mode 는 각 레이어에 전달. */
  resize(newSize: CanvasSize, mode: 'preserve' | 'clear'): void {
    for (const layer of this.layers) {
      layer.pixels.resize(newSize, mode);
    }
    this.size = newSize;
  }

  /** 스냅샷에서 레이어 목록을 완전히 재구성한다. */
  restoreSnapshot(snap: { activeIndex: number; layers: readonly LayerSnapshot[] }): void {
    const rebuilt: Layer[] = snap.layers.map((ls) => {
      const layer = new Layer(`layer-${this.nextIdSeq++}`, ls.name, this.size);
      layer.visible = ls.visible;
      layer.opacity = ls.opacity;
      if (ls.data.length !== layer.pixels.data.length) {
        throw new Error(
          `Snapshot layer data length ${ls.data.length} does not match canvas ${layer.pixels.data.length}`,
        );
      }
      layer.pixels.data.set(ls.data);
      return layer;
    });
    this.layers = rebuilt;
    if (this.layers.length === 0) {
      this.activeIndexValue = -1;
    } else if (snap.activeIndex >= 0 && snap.activeIndex < this.layers.length) {
      this.activeIndexValue = snap.activeIndex;
    } else {
      this.activeIndexValue = 0;
    }
  }

  private assertIndex(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.layers.length) {
      throw new RangeError(`Layer index ${index} out of range (count=${this.layers.length})`);
    }
  }
}
