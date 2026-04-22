import type { EditorState } from '../editor/EditorState.js';

export class LayerPanel {
  private listEl: HTMLElement;

  constructor(
    private readonly root: HTMLElement,
    private readonly state: EditorState,
    private readonly onChange: () => void,
  ) {
    this.root.innerHTML = '';
    this.root.classList.add('layer-panel');

    const header = document.createElement('div');
    header.className = 'panel-header';
    const title = document.createElement('span');
    title.textContent = 'Layers';
    const addBtn = document.createElement('button');
    addBtn.textContent = '+';
    addBtn.title = 'Add layer';
    addBtn.addEventListener('click', () => {
      this.state.layers.addLayer();
      this.state.layers.setActive(this.state.layers.count - 1);
      this.onChange();
    });
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '−';
    removeBtn.title = 'Remove active layer';
    removeBtn.addEventListener('click', () => {
      if (this.state.layers.count <= 1) return;
      this.state.layers.removeLayer(this.state.layers.activeIndex);
      this.onChange();
    });
    header.append(title, addBtn, removeBtn);

    this.listEl = document.createElement('div');
    this.listEl.className = 'layer-list';

    this.root.append(header, this.listEl);
    this.render();
  }

  render(): void {
    this.listEl.innerHTML = '';
    // Display in reverse order (topmost first)
    for (let i = this.state.layers.count - 1; i >= 0; i--) {
      const layer = this.state.layers.getLayer(i);
      const row = document.createElement('div');
      row.className = 'layer-row';
      if (i === this.state.layers.activeIndex) row.classList.add('active');

      const visBtn = document.createElement('button');
      visBtn.className = 'layer-visibility';
      visBtn.textContent = layer.visible ? '👁' : '⬚';
      visBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.state.layers.setVisible(i, !layer.visible);
        this.onChange();
      });

      const label = document.createElement('span');
      label.className = 'layer-name';
      label.textContent = layer.name;

      const opacity = document.createElement('input');
      opacity.type = 'range';
      opacity.min = '0';
      opacity.max = '100';
      opacity.value = String(Math.round(layer.opacity * 100));
      opacity.className = 'layer-opacity';
      opacity.addEventListener('input', () => {
        this.state.layers.setOpacity(i, Number(opacity.value) / 100);
        this.onChange();
      });

      row.append(visBtn, label, opacity);
      row.addEventListener('click', () => {
        this.state.layers.setActive(i);
        this.onChange();
      });

      this.listEl.appendChild(row);
    }
  }
}
