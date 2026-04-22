import type { EditorState } from '../editor/EditorState.js';
import type { RGBA } from '../color/Color.js';
import { rgbaToHex, hexToRgba } from '../color/conversions.js';

/**
 * FG/BG 스왓치 + 팔레트 그리드.
 * 팔레트 클릭: 좌=FG, 우=BG.
 * HEX 입력: FG 지정.
 */
export class PalettePanel {
  private gridEl: HTMLElement;
  private fgSwatch: HTMLElement;
  private bgSwatch: HTMLElement;
  private hexInput: HTMLInputElement;

  constructor(
    private readonly root: HTMLElement,
    private readonly state: EditorState,
    private readonly onChange: () => void,
  ) {
    this.root.innerHTML = '';
    this.root.classList.add('palette-panel');

    const swatches = document.createElement('div');
    swatches.className = 'swatches';
    this.fgSwatch = document.createElement('div');
    this.fgSwatch.className = 'swatch fg';
    this.bgSwatch = document.createElement('div');
    this.bgSwatch.className = 'swatch bg';
    swatches.append(this.fgSwatch, this.bgSwatch);

    this.hexInput = document.createElement('input');
    this.hexInput.type = 'text';
    this.hexInput.placeholder = '#RRGGBB';
    this.hexInput.className = 'hex-input';
    this.hexInput.addEventListener('change', () => {
      const parsed = hexToRgba(this.hexInput.value);
      if (parsed !== null) {
        this.state.setForegroundColor(parsed);
        this.onChange();
      }
    });

    this.gridEl = document.createElement('div');
    this.gridEl.className = 'palette-grid';

    this.root.append(swatches, this.hexInput, this.gridEl);
    this.renderGrid();
    this.render();
  }

  render(): void {
    this.fgSwatch.style.backgroundColor = rgbaToHex(this.state.foregroundColor);
    this.bgSwatch.style.backgroundColor = rgbaToHex(this.state.backgroundColor);
    this.hexInput.value = rgbaToHex(this.state.foregroundColor);
  }

  private renderGrid(): void {
    this.gridEl.innerHTML = '';
    for (let i = 0; i < this.state.palette.count; i++) {
      const c = this.state.palette.get(i);
      const cell = document.createElement('button');
      cell.className = 'palette-cell';
      cell.style.backgroundColor = rgbaToHex(c);
      cell.title = rgbaToHex(c);
      cell.addEventListener('click', () => {
        this.state.setForegroundColor(c);
        this.onChange();
      });
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.state.setBackgroundColor(c);
        this.onChange();
      });
      this.gridEl.appendChild(cell);
    }
  }

  /** 외부에서 팔레트 콘텐츠가 바뀌었을 때 호출. */
  refreshGrid(): void {
    this.renderGrid();
  }

  /** PalettePanel 이 사용하는 FG 변경 콜백을 PalettePanel 외부에서도 호출. */
  setForegroundFromColor(color: RGBA): void {
    this.state.setForegroundColor(color);
    this.onChange();
  }
}
