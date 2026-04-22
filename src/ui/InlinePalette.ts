import type { EditorState } from '../editor/EditorState.js';
import { rgbaToHex, hexToRgba } from '../color/conversions.js';

/**
 * 화면 하단에 항상 보이는 가로형 색상 스트립.
 * FG / BG 스왓치 + 팔레트 셀을 한 줄에 배치하고 가로 스크롤로 다룬다.
 * FG 스왓치를 탭하면 HEX 입력 팝업을 연다 (부모에서 전달).
 */
export class InlinePalette {
  private readonly fgBtn: HTMLButtonElement;
  private readonly bgBtn: HTMLButtonElement;
  private readonly cellsEl: HTMLElement;

  constructor(
    root: HTMLElement,
    private readonly state: EditorState,
    private readonly onFgTap: () => void,
    private readonly onChange: () => void,
  ) {
    root.innerHTML = '';
    root.classList.add('pm-color-strip');

    this.fgBtn = this.makeSwatch('fg');
    this.fgBtn.setAttribute('aria-label', 'Foreground (HEX 입력)');
    this.fgBtn.addEventListener('click', () => this.onFgTap());

    this.bgBtn = this.makeSwatch('bg');
    this.bgBtn.setAttribute('aria-label', 'Background swap');
    this.bgBtn.addEventListener('click', () => this.swapFgBg());

    const separator = document.createElement('div');
    separator.className = 'pm-color-sep';

    this.cellsEl = document.createElement('div');
    this.cellsEl.className = 'pm-color-cells';

    root.append(this.fgBtn, this.bgBtn, separator, this.cellsEl);
    this.renderCells();
    this.render();
  }

  render(): void {
    this.fgBtn.style.backgroundColor = rgbaToHex(this.state.foregroundColor);
    this.bgBtn.style.backgroundColor = rgbaToHex(this.state.backgroundColor);
  }

  refreshCells(): void {
    this.renderCells();
  }

  /** HEX 입력 다이얼로그에서 호출하기 위해 외부에 노출. */
  applyHex(hex: string): boolean {
    const parsed = hexToRgba(hex);
    if (parsed === null) return false;
    this.state.setForegroundColor(parsed);
    this.onChange();
    return true;
  }

  private renderCells(): void {
    this.cellsEl.innerHTML = '';
    for (let i = 0; i < this.state.palette.count; i++) {
      const c = this.state.palette.get(i);
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'pm-color-cell';
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
      this.cellsEl.appendChild(cell);
    }
  }

  private swapFgBg(): void {
    const fg = this.state.foregroundColor;
    const bg = this.state.backgroundColor;
    this.state.setForegroundColor(bg);
    this.state.setBackgroundColor(fg);
    this.onChange();
  }

  private makeSwatch(kind: 'fg' | 'bg'): HTMLButtonElement {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = `pm-color-swatch ${kind}`;
    return b;
  }
}
