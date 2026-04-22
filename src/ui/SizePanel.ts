import { CANVAS_SIZES, type CanvasSize } from '../editor/CanvasSize.js';

/** 캔버스 크기 선택 드롭다운. 선택 변경 시 콜백을 호출. */
export class SizePanel {
  private readonly select: HTMLSelectElement;

  constructor(
    private readonly root: HTMLElement,
    private currentSize: CanvasSize,
    private readonly onRequestChange: (newSize: CanvasSize) => void,
  ) {
    this.root.innerHTML = '';
    this.root.classList.add('size-panel');

    const header = document.createElement('div');
    header.className = 'panel-header';
    header.textContent = 'Canvas Size';
    this.root.appendChild(header);

    this.select = document.createElement('select');
    this.select.className = 'size-select';
    for (const size of CANVAS_SIZES) {
      const opt = document.createElement('option');
      opt.value = String(size);
      opt.textContent = `${size} × ${size}`;
      this.select.appendChild(opt);
    }
    this.select.value = String(this.currentSize);
    this.select.addEventListener('change', () => {
      const next = Number(this.select.value) as CanvasSize;
      if (next === this.currentSize) return;
      this.onRequestChange(next);
    });
    this.root.appendChild(this.select);
  }

  /** 현재 실제 사이즈와 UI 를 동기화. 변경이 취소되면 이전 값으로 되돌림. */
  render(currentSize: CanvasSize): void {
    this.currentSize = currentSize;
    this.select.value = String(currentSize);
  }
}
