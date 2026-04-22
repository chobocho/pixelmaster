/**
 * dotpict 류의 바닥 시트 스타일 팝오버.
 * 컨텐츠 영역은 생성 시점에 고정되어 있고 open/close 는 오버레이만 DOM 에 붙였다 뗀다.
 * 컨텐츠는 항상 메모리에 유지되므로 내부 패널의 이벤트 리스너가 끊어지지 않는다.
 */
export class Popover {
  private overlay: HTMLElement | null = null;
  private readonly card: HTMLElement;
  private readonly contentEl: HTMLElement;

  constructor(title: string) {
    this.card = document.createElement('div');
    this.card.className = 'pm-popover-card';

    const header = document.createElement('div');
    header.className = 'pm-popover-header';

    const titleEl = document.createElement('h3');
    titleEl.className = 'pm-popover-title';
    titleEl.textContent = title;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'pm-popover-close';
    closeBtn.textContent = '✕';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.addEventListener('click', () => this.close());

    header.append(titleEl, closeBtn);

    this.contentEl = document.createElement('div');
    this.contentEl.className = 'pm-popover-content';

    this.card.append(header, this.contentEl);
  }

  get content(): HTMLElement {
    return this.contentEl;
  }

  get isOpen(): boolean {
    return this.overlay !== null;
  }

  open(): void {
    if (this.overlay !== null) return;
    const overlay = document.createElement('div');
    overlay.className = 'pm-popover-overlay';
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.close();
    });
    overlay.appendChild(this.card);
    document.body.appendChild(overlay);
    this.overlay = overlay;
  }

  close(): void {
    if (this.overlay === null) return;
    this.overlay.remove();
    this.overlay = null;
  }

  toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }
}
