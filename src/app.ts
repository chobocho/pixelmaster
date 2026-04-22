import { Renderer } from './renderer/Renderer.js';

/**
 * 애플리케이션 수명주기를 관리하는 최상위 클래스.
 * 현재 스캐폴드 단계에서는 Renderer 초기화와 기본 렌더 루프만 제공한다.
 */
export class App {
  private readonly renderer: Renderer;
  private running = false;
  private rafHandle = 0;

  constructor(canvas: HTMLCanvasElement) {
    const dpr = window.devicePixelRatio > 0 ? window.devicePixelRatio : 1;
    this.renderer = new Renderer(canvas, dpr);
    this.syncToElementSize();

    window.addEventListener('resize', this.syncToElementSize);
  }

  /** requestAnimationFrame 기반 렌더 루프를 시작한다. */
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

  private readonly tick = (): void => {
    if (!this.running) return;
    this.renderer.clear();
    // 이후 이슈에서 실제 드로우 파이프라인이 여기에 연결된다.
    this.rafHandle = requestAnimationFrame(this.tick);
  };

  private readonly syncToElementSize = (): void => {
    const canvas = this.renderer.context.canvas;
    const w = canvas.clientWidth || canvas.parentElement?.clientWidth || 0;
    const h = canvas.clientHeight || canvas.parentElement?.clientHeight || 0;
    if (w > 0 && h > 0) {
      this.renderer.resize(w, h);
    }
  };
}
