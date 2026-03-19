export class KeyboardManager {
  constructor(app) {
    this.app = app;
    this.clipboard = null;
    this.setup();
  }

  isInputFocused() {
    const el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
  }

  setup() {
    document.addEventListener('keydown', (e) => {
      if (this.isInputFocused()) return;

      const ctrl = e.ctrlKey || e.metaKey;

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        this.deleteSelected();
      }

      // Escape - cancel current tool action
      if (e.key === 'Escape') {
        this.app.cancelCurrentTool();
        this.app.setTool('select');
      }

      // Undo
      if (ctrl && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        this.app.history.undo();
      }

      // Redo
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        this.app.history.redo();
      }

      // Copy
      if (ctrl && e.key === 'c') {
        e.preventDefault();
        this.copy();
      }

      // Paste
      if (ctrl && e.key === 'v') {
        e.preventDefault();
        this.paste();
      }

      // Duplicate
      if (ctrl && e.key === 'd') {
        e.preventDefault();
        this.duplicate();
      }

      // Arrow key panning
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const panStep = 50; // pixels per press
        const canvas = this.app.canvas;
        const vpt = canvas.viewportTransform;
        switch (e.key) {
          case 'ArrowUp':    vpt[5] += panStep; break;
          case 'ArrowDown':  vpt[5] -= panStep; break;
          case 'ArrowLeft':  vpt[4] += panStep; break;
          case 'ArrowRight': vpt[4] -= panStep; break;
        }
        canvas.requestRenderAll();
        this.app.grid.draw();
        this.app.updateZoomDisplay();
        return;
      }

      // Tool shortcuts
      if (!ctrl) {
        switch (e.key.toLowerCase()) {
          case 'v': this.app.setTool('select'); break;
          case 'w': this.app.setTool('wall'); break;
          case 'r': this.app.setTool('rect'); break;
          case 'c': this.app.setTool('circle'); break;
          case 'l': this.app.setTool('line'); break;
          case 't': this.app.setTool('text'); break;
          case 'n': this.app.setTool('window'); break;
          case 'o': this.app.setTool('door'); break;
          case 'd': this.app.setTool('dimension'); break;
        }
      }
    });
  }

  deleteSelected() {
    const canvas = this.app.canvas;
    const active = canvas.getActiveObjects();
    if (active.length === 0) return;
    let hasWall = false;

    // Collect walls and their labels first
    const toRemove = [];
    active.forEach(obj => {
      if (obj.isGrid || obj.isWallVisual || obj.isEndpointHandle) return;
      // Skip dimension labels — they'll be removed with their wall
      if (obj.customType === 'wallDimension') return;

      if (obj.isWall) {
        hasWall = true;
        // Queue the wall's attached label for removal
        if (obj.dimLabel && obj.dimLabel.canvas) {
          toRemove.push(obj.dimLabel);
          obj.dimLabel = null;
        }
      }
      toRemove.push(obj);
    });

    canvas.discardActiveObject();
    for (const obj of toRemove) {
      canvas.remove(obj);
    }

    // Safety sweep: remove any orphaned dimension labels whose wall is gone
    const orphanedLabels = canvas.getObjects().filter(obj =>
      obj.customType === 'wallDimension' && (!obj.wallRef || !obj.wallRef.canvas)
    );
    for (const label of orphanedLabels) {
      canvas.remove(label);
    }

    if (hasWall) this.app.rebuildWalls();
    canvas.renderAll();
    this.app.history.saveState();
  }

  copy() {
    const canvas = this.app.canvas;
    const active = canvas.getActiveObject();
    if (!active) return;
    active.clone((cloned) => {
      this.clipboard = cloned;
    }, ['wallData', 'furnitureType', 'furnitureCategory', 'customType', 'isWall', 'isFurniture', 'isCustomShape']);
  }

  paste() {
    if (!this.clipboard) return;
    const canvas = this.app.canvas;
    this.clipboard.clone((cloned) => {
      canvas.discardActiveObject();
      cloned.set({
        left: cloned.left + 20,
        top: cloned.top + 20,
        evented: true,
      });
      if (cloned.type === 'activeSelection') {
        cloned.canvas = canvas;
        cloned.forEachObject((obj) => canvas.add(obj));
        cloned.setCoords();
      } else {
        canvas.add(cloned);
      }
      this.clipboard.top += 20;
      this.clipboard.left += 20;
      canvas.setActiveObject(cloned);
      canvas.renderAll();
      this.app.history.saveState();
    }, ['wallData', 'furnitureType', 'furnitureCategory', 'customType', 'isWall', 'isFurniture', 'isCustomShape']);
  }

  duplicate() {
    this.copy();
    setTimeout(() => this.paste(), 50);
  }
}
