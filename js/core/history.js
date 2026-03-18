export class History {
  constructor(app) {
    this.app = app;
    this.undoStack = [];
    this.redoStack = [];
    this.maxStates = 50;
    this.locked = false;
  }

  saveState() {
    if (this.locked) return;
    const canvas = this.app.canvas;
    const json = canvas.toJSON(['isGrid', 'wallData', 'furnitureType', 'furnitureCategory',
      'excludeFromExport', 'customType', 'dimensionData', 'isWall', 'isFurniture', 'isCustomShape']);
    // Remove grid lines from saved state
    json.objects = json.objects.filter(o => !o.isGrid);
    this.undoStack.push(JSON.stringify(json));
    if (this.undoStack.length > this.maxStates) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    this.updateButtons();
  }

  async undo() {
    if (this.undoStack.length <= 1) return;
    this.locked = true;
    const current = this.undoStack.pop();
    this.redoStack.push(current);
    const prev = this.undoStack[this.undoStack.length - 1];
    await this.loadState(prev);
    this.locked = false;
    this.updateButtons();
  }

  async redo() {
    if (this.redoStack.length === 0) return;
    this.locked = true;
    const state = this.redoStack.pop();
    this.undoStack.push(state);
    await this.loadState(state);
    this.locked = false;
    this.updateButtons();
  }

  async loadState(stateStr) {
    const canvas = this.app.canvas;
    this.app.grid.clear();
    const state = JSON.parse(stateStr);
    await new Promise(resolve => {
      canvas.loadFromJSON(state, () => {
        canvas.renderAll();
        resolve();
      });
    });
    this.app.grid.draw();
  }

  updateButtons() {
    const undoBtn = document.getElementById('btn-undo');
    const redoBtn = document.getElementById('btn-redo');
    if (undoBtn) undoBtn.disabled = this.undoStack.length <= 1;
    if (redoBtn) redoBtn.disabled = this.redoStack.length === 0;
  }

  init() {
    this.saveState();
  }
}
