import type { EditorState } from '../editor/EditorState.js';
import { PngExporter, type ExportScale } from '../io/PngExporter.js';

const SCALES: readonly ExportScale[] = [1, 2, 4, 8];

export class ExportPanel {
  private readonly exporter = new PngExporter();

  constructor(root: HTMLElement, state: EditorState) {
    root.innerHTML = '';
    root.classList.add('export-panel');

    const header = document.createElement('div');
    header.className = 'panel-header';
    header.textContent = 'Export PNG';
    root.appendChild(header);

    const row = document.createElement('div');
    row.className = 'export-buttons';
    for (const s of SCALES) {
      const btn = document.createElement('button');
      btn.textContent = `${s}×`;
      btn.title = `Export PNG ×${s}`;
      btn.addEventListener('click', () => {
        this.exporter.triggerDownload(state, s, `pixelmaster-${s}x.png`);
      });
      row.appendChild(btn);
    }
    root.appendChild(row);
  }
}
