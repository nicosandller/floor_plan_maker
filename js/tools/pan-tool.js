export class PanTool {
  constructor(app) {
    this.app = app;
    this.isPanning = false;
    this.lastX = 0;
    this.lastY = 0;

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  activate() {
    const canvas = this.app.canvas;
    canvas.selection = false;
    canvas.defaultCursor = 'grab';
    canvas.setCursor('grab');
    canvas.forEachObject(obj => {
      if (!obj.isGrid) {
        obj.selectable = false;
        obj.evented = false;
      }
    });

    canvas.on('mouse:down', this.onMouseDown);
    canvas.on('mouse:move', this.onMouseMove);
    canvas.on('mouse:up', this.onMouseUp);
  }

  deactivate() {
    const canvas = this.app.canvas;
    canvas.off('mouse:down', this.onMouseDown);
    canvas.off('mouse:move', this.onMouseMove);
    canvas.off('mouse:up', this.onMouseUp);
    canvas.defaultCursor = 'default';
    canvas.setCursor('default');
    this.isPanning = false;
  }

  onMouseDown(opt) {
    this.isPanning = true;
    this.lastX = opt.e.clientX;
    this.lastY = opt.e.clientY;
    this.app.canvas.setCursor('grabbing');
    opt.e.preventDefault();
  }

  onMouseMove(opt) {
    if (!this.isPanning) return;
    const e = opt.e;
    const canvas = this.app.canvas;
    const vpt = canvas.viewportTransform;
    vpt[4] += e.clientX - this.lastX;
    vpt[5] += e.clientY - this.lastY;
    canvas.requestRenderAll();
    this.lastX = e.clientX;
    this.lastY = e.clientY;
  }

  onMouseUp() {
    this.isPanning = false;
    this.app.canvas.setCursor('grab');
    this.app.grid.draw();
    this.app.updateZoomDisplay();
  }

  cancel() {
    this.isPanning = false;
  }
}
