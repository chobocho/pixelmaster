export interface UIRefs {
  header: HTMLElement;
  toolbar: HTMLElement;
  canvas: HTMLCanvasElement;
  canvasWrap: HTMLElement;
  colorPanel: HTMLElement;
  palettePanel: HTMLElement;
  layerPanel: HTMLElement;
  exportPanel: HTMLElement;
  statusBar: HTMLElement;
}

/** 루트 DOM 안에 앱의 기본 UI 구조를 생성하고 각 영역의 엘리먼트 참조를 반환한다. */
export function buildUILayout(root: HTMLElement): UIRefs {
  root.innerHTML = '';
  root.classList.add('pm-root');

  const header = create('header', 'pm-header', 'PixelMaster');
  const main = create('div', 'pm-main');
  const toolbar = create('aside', 'pm-toolbar');
  const canvasWrap = create('main', 'pm-canvas-wrap');
  const canvas = document.createElement('canvas');
  canvas.id = 'app-canvas';
  canvas.className = 'pm-canvas';
  canvasWrap.appendChild(canvas);

  const rightPanel = create('aside', 'pm-right-panel');
  const colorPanel = create('section', 'pm-color-panel');
  const palettePanel = create('section', 'pm-palette-panel');
  const layerPanel = create('section', 'pm-layer-panel');
  const exportPanel = create('section', 'pm-export-panel');
  rightPanel.append(colorPanel, palettePanel, layerPanel, exportPanel);

  main.append(toolbar, canvasWrap, rightPanel);

  const statusBar = create('footer', 'pm-status-bar');

  root.append(header, main, statusBar);

  return {
    header,
    toolbar,
    canvas,
    canvasWrap,
    colorPanel,
    palettePanel,
    layerPanel,
    exportPanel,
    statusBar,
  };
}

function create(tag: string, className: string, text?: string): HTMLElement {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
