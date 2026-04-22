import type { ToolManager } from '../tools/ToolManager.js';
import type { ToolId } from '../tools/Tool.js';

interface ToolButton {
  id: ToolId;
  emoji: string;
  label: string;
  shortcut: string;
}

const TOOL_BUTTONS: readonly ToolButton[] = [
  { id: 'pencil', emoji: '✏️', label: 'Pencil', shortcut: 'P' },
  { id: 'eraser', emoji: '🧽', label: 'Eraser', shortcut: 'E' },
  { id: 'fill', emoji: '🪣', label: 'Fill', shortcut: 'F' },
  { id: 'eyedropper', emoji: '💉', label: 'Eyedropper', shortcut: 'I' },
  { id: 'line', emoji: '📏', label: 'Line', shortcut: 'L' },
  { id: 'rect', emoji: '▭', label: 'Rect', shortcut: 'R' },
  { id: 'ellipse', emoji: '○', label: 'Ellipse', shortcut: 'O' },
  { id: 'select', emoji: '⬚', label: 'Select', shortcut: 'S' },
  { id: 'move', emoji: '✋', label: 'Move', shortcut: 'M' },
];

export class Toolbar {
  constructor(
    private readonly root: HTMLElement,
    private readonly tools: ToolManager,
    private readonly onChange: () => void,
  ) {
    this.build();
  }

  render(): void {
    const activeId = this.tools.activeId;
    for (const btn of this.root.querySelectorAll<HTMLButtonElement>('button[data-tool-id]')) {
      btn.classList.toggle('active', btn.dataset.toolId === activeId);
    }
  }

  private build(): void {
    this.root.innerHTML = '';
    const registered = new Set<ToolId>(this.tools.registeredIds);
    for (const def of TOOL_BUTTONS) {
      if (!registered.has(def.id)) continue;
      const btn = document.createElement('button');
      btn.dataset.toolId = def.id;
      btn.title = `${def.label} (${def.shortcut})`;
      btn.textContent = def.emoji;
      btn.addEventListener('click', () => {
        this.tools.setActive(def.id);
        this.onChange();
      });
      this.root.appendChild(btn);
    }
    this.render();
  }
}
