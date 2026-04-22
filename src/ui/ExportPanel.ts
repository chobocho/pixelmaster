import type { EditorState } from '../editor/EditorState.js';
import { PngExporter, type ExportScale } from '../io/PngExporter.js';
import { GifExporter } from '../io/GifExporter.js';

const SCALES: readonly ExportScale[] = [1, 2, 4, 8];

export class ExportPanel {
  private readonly pngExporter = new PngExporter();
  private readonly gifExporter = new GifExporter();

  constructor(root: HTMLElement, state: EditorState) {
    root.innerHTML = '';
    root.classList.add('export-panel');

    const pngHeader = document.createElement('div');
    pngHeader.className = 'panel-header';
    pngHeader.textContent = 'Export PNG';
    root.appendChild(pngHeader);

    const pngRow = document.createElement('div');
    pngRow.className = 'export-buttons';
    for (const s of SCALES) {
      const btn = document.createElement('button');
      btn.textContent = `${s}×`;
      btn.title = `Export PNG ×${s}`;
      btn.addEventListener('click', () => {
        this.pngExporter.triggerDownload(state, s, `pixelmaster-${s}x.png`);
      });
      pngRow.appendChild(btn);
    }
    root.appendChild(pngRow);

    const gifHeader = document.createElement('div');
    gifHeader.className = 'panel-header';
    gifHeader.style.marginTop = '8px';
    gifHeader.textContent = 'Export GIF';
    root.appendChild(gifHeader);

    const gifRow = document.createElement('div');
    gifRow.className = 'export-buttons';
    const gifBtn = document.createElement('button');
    gifBtn.textContent = 'GIF';
    gifBtn.title = 'Export single-frame GIF';
    gifBtn.addEventListener('click', () => {
      this.gifExporter.triggerDownload(state, 'pixelmaster.gif');
    });
    gifRow.appendChild(gifBtn);
    root.appendChild(gifRow);
  }
}
