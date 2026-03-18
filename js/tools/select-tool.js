export class SelectTool {
  constructor(app) {
    this.app = app;
  }

  activate() {
    const canvas = this.app.canvas;
    canvas.selection = true;
    canvas.defaultCursor = 'default';
    canvas.forEachObject(obj => {
      if (!obj.isGrid) {
        obj.selectable = true;
        obj.evented = true;
      }
    });
  }

  deactivate() {
    // Nothing special needed
  }
}
