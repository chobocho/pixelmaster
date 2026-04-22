import { formatStatusBar, type StatusBarInfo } from './formatStatusBar.js';

export class StatusBar {
  constructor(private readonly root: HTMLElement) {
    this.root.classList.add('status-bar');
  }

  update(info: StatusBarInfo): void {
    this.root.textContent = formatStatusBar(info);
  }
}
