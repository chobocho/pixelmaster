export interface UIRefs {
  header: HTMLElement;
  menuButton: HTMLButtonElement;
  undoButton: HTMLButtonElement;
  redoButton: HTMLButtonElement;
  canvas: HTMLCanvasElement;
  canvasWrap: HTMLElement;
  toolbar: HTMLElement;
  paletteButton: HTMLButtonElement;
  layerButton: HTMLButtonElement;
  sizeButton: HTMLButtonElement;
  exportButton: HTMLButtonElement;
  statusBar: HTMLElement;
}

/**
 * dotpict 풍의 단순한 수직 레이아웃:
 *   상단 헤더 | 풀폭 캔버스 | 도구 + 패널 트리거 바 | 상태표시줄
 * 색상·레이어·크기·내보내기 패널은 모두 팝오버로 띄운다.
 */
export function buildUILayout(root: HTMLElement): UIRefs {
  root.innerHTML = '';
  root.classList.add('pm-root');

  const header = create('header', 'pm-header');
  const menuButton = iconButton('☰', 'Menu');
  const title = create('span', 'pm-title', 'PixelMaster');
  const headerSpacer = create('span', 'pm-header-spacer');
  const undoButton = iconButton('↶', 'Undo');
  const redoButton = iconButton('↷', 'Redo');
  header.append(menuButton, title, headerSpacer, undoButton, redoButton);

  const canvasWrap = create('main', 'pm-canvas-wrap');
  const canvas = document.createElement('canvas');
  canvas.id = 'app-canvas';
  canvas.className = 'pm-canvas';
  canvasWrap.appendChild(canvas);

  const bottomBar = create('div', 'pm-bottom-bar');
  const toolbar = create('nav', 'pm-toolbar');
  const extras = create('div', 'pm-toolbar-extras');
  const paletteButton = iconButton('🎨', 'Palette');
  const layerButton = iconButton('📑', 'Layers');
  const sizeButton = iconButton('📐', 'Canvas size');
  const exportButton = iconButton('💾', 'Export');
  extras.append(paletteButton, layerButton, sizeButton, exportButton);
  bottomBar.append(toolbar, extras);

  const statusBar = create('footer', 'pm-status-bar');

  root.append(header, canvasWrap, bottomBar, statusBar);

  return {
    header,
    menuButton,
    undoButton,
    redoButton,
    canvas,
    canvasWrap,
    toolbar,
    paletteButton,
    layerButton,
    sizeButton,
    exportButton,
    statusBar,
  };
}

function create(tag: string, className: string, text?: string): HTMLElement {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

function iconButton(emoji: string, label: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'pm-icon-btn';
  b.textContent = emoji;
  b.title = label;
  b.setAttribute('aria-label', label);
  return b;
}
