import { FURNITURE_CATEGORIES } from '../furniture/library.js';
import { FurnitureRenderer } from '../furniture/renderer.js';

export class RightPanel {
  constructor(app) {
    this.app = app;
    this.renderer = new FurnitureRenderer(app.scale);
    this.build();
    this.setupCanvasDrop();
  }

  build() {
    const container = document.getElementById('furniture-categories');
    container.innerHTML = '';

    for (const category of FURNITURE_CATEGORIES) {
      const catDiv = document.createElement('div');
      catDiv.className = 'furniture-category';

      const header = document.createElement('div');
      header.className = 'category-header';
      header.innerHTML = `<span class="arrow">&#9654;</span> ${category.name}`;
      header.addEventListener('click', () => {
        header.classList.toggle('open');
      });

      const itemsDiv = document.createElement('div');
      itemsDiv.className = 'category-items';

      for (const item of category.items) {
        const itemEl = document.createElement('div');
        itemEl.className = 'furniture-item';
        itemEl.draggable = true;
        itemEl.dataset.itemId = item.id;
        itemEl.dataset.categoryId = category.id;

        itemEl.innerHTML = `
          <div class="item-icon">${this.getItemIcon(item)}</div>
          <div class="item-info">
            <div class="item-name">${item.name}</div>
            <div class="item-size">${item.width}x${item.height}mm</div>
          </div>
        `;

        itemEl.addEventListener('dragstart', (e) => {
          e.dataTransfer.setData('text/plain', JSON.stringify({
            itemId: item.id,
            categoryId: category.id,
            width: item.width,
            height: item.height,
            name: item.name,
          }));
          e.dataTransfer.effectAllowed = 'copy';
        });

        // Double-click to add at center
        itemEl.addEventListener('dblclick', () => {
          this.addFurnitureAtCenter(item, category.id);
        });

        itemsDiv.appendChild(itemEl);
      }

      catDiv.appendChild(header);
      catDiv.appendChild(itemsDiv);
      container.appendChild(catDiv);
    }
  }

  getItemIcon(item) {
    // Simple SVG icons based on type
    const icons = {
      'table': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="3" y="6" width="18" height="12" rx="1"/></svg>',
      'round-table': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><circle cx="12" cy="12" r="8"/></svg>',
      'desk': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="2" y="7" width="20" height="10" rx="1"/><line x1="14" y1="9" x2="14" y2="15"/></svg>',
      'side-table': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>',
      'chair': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="6" y="4" width="12" height="4"/><rect x="6" y="8" width="12" height="12"/></svg>',
      'sofa': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="2" y="6" width="20" height="12" rx="2"/><line x1="8" y1="10" x2="8" y2="16"/><line x1="16" y1="10" x2="16" y2="16"/></svg>',
      'armchair': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="3"/></svg>',
      'counter': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="3" y="6" width="18" height="12"/><rect x="5" y="8" width="14" height="8"/></svg>',
      'island': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="2" y="6" width="20" height="12"/><line x1="9" y1="8" x2="9" y2="16"/><line x1="15" y1="8" x2="15" y2="16"/></svg>',
      'fridge': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="5" y="2" width="14" height="20"/><line x1="5" y1="9" x2="19" y2="9"/></svg>',
      'oven': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="4" y="4" width="16" height="16"/><circle cx="9" cy="9" r="2"/><circle cx="15" cy="9" r="2"/><circle cx="9" cy="15" r="2"/><circle cx="15" cy="15" r="2"/></svg>',
      'dishwasher': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="4" y="4" width="16" height="16" rx="1"/><line x1="8" y1="7" x2="16" y2="7"/></svg>',
      'washer': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="4" y="4" width="16" height="16"/><circle cx="12" cy="13" r="5"/></svg>',
      'bathtub': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="2" y="6" width="20" height="12" rx="4"/><rect x="4" y="8" width="16" height="8" rx="3"/></svg>',
      'toilet': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="7" y="3" width="10" height="5" rx="1"/><ellipse cx="12" cy="15" rx="5" ry="6"/></svg>',
      'sink': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="4" y="6" width="16" height="12"/><circle cx="12" cy="13" r="4"/></svg>',
      'shower': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="4" y="4" width="16" height="16"/><circle cx="12" cy="12" r="2"/></svg>',
      'shelf': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="2" y="8" width="20" height="8"/><line x1="7" y1="10" x2="7" y2="14"/><line x1="12" y1="10" x2="12" y2="14"/><line x1="17" y1="10" x2="17" y2="14"/></svg>',
      'closet': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="3" y="4" width="18" height="16"/><line x1="12" y1="6" x2="12" y2="18"/></svg>',
      'door': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><line x1="4" y1="20" x2="20" y2="20"/><path d="M 20 20 A 16 16 0 0 0 4 4" stroke-dasharray="3 3"/></svg>',
      'door-double': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><line x1="2" y1="20" x2="22" y2="20"/><path d="M 12 20 A 10 10 0 0 0 2 10" stroke-dasharray="3 3"/><path d="M 12 20 A 10 10 0 0 1 22 10" stroke-dasharray="3 3"/></svg>',
      'sliding-door': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="2" y="10" width="20" height="4"/><line x1="12" y1="10" x2="12" y2="14" stroke-dasharray="2 2"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
      'window': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="2" y="8" width="20" height="8" fill="#e8f4ff" fill-opacity="0.3"/><line x1="12" y1="8" x2="12" y2="16"/></svg>',
      'stairs': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="6" y="2" width="12" height="20"/><line x1="8" y1="5" x2="18" y2="5"/><line x1="8" y1="8" x2="18" y2="8"/><line x1="8" y1="11" x2="18" y2="11"/><line x1="8" y1="14" x2="18" y2="14"/><line x1="8" y1="17" x2="18" y2="17"/></svg>',
      'bed': '<svg viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5"><rect x="3" y="3" width="18" height="18"/><rect x="5" y="5" width="14" height="4" rx="1"/></svg>',
    };
    return icons[item.icon] || icons['table'];
  }

  setupCanvasDrop() {
    const canvasContainer = document.getElementById('canvas-container');

    canvasContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });

    canvasContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const canvas = this.app.canvas;

      // Get pointer position accounting for canvas offset, zoom, and pan
      const rect = canvas.upperCanvasEl.getBoundingClientRect();
      const pointer = canvas.getPointer({
        clientX: e.clientX,
        clientY: e.clientY,
        target: canvas.upperCanvasEl,
      });

      const snapped = this.app.grid.snapPoint(pointer.x, pointer.y);
      this.addFurniture(data, snapped.x, snapped.y);
    });
  }

  addFurnitureAtCenter(item, categoryId) {
    const canvas = this.app.canvas;
    const center = canvas.getCenter();
    const pointer = canvas.getPointer({ clientX: center.left, clientY: center.top, target: canvas.upperCanvasEl });
    this.addFurniture({
      itemId: item.id,
      categoryId,
      width: item.width,
      height: item.height,
      name: item.name,
    }, pointer.x || center.left, pointer.y || center.top);
  }

  addFurniture(data, x, y) {
    const canvas = this.app.canvas;
    const renderer = new FurnitureRenderer(this.app.scale);
    const group = renderer.create({
      id: data.itemId,
      width: data.width,
      height: data.height,
      category: data.categoryId,
    }, this.app.scale);

    group.set({
      left: x,
      top: y,
      originX: 'center',
      originY: 'center',
    });

    canvas.add(group);
    canvas.setActiveObject(group);
    canvas.renderAll();
    this.app.history.saveState();

    // Switch to select tool after placing
    this.app.setTool('select');
  }
}
