export class ShapeTool {
  constructor(app) {
    this.app = app;
    this.shapeType = 'rect'; // 'rect', 'circle', 'line'
    this.isDrawing = false;
    this.startPoint = null;
    this.preview = null;

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
  }

  activate(type) {
    this.shapeType = type || this.shapeType;
    const canvas = this.app.canvas;
    canvas.selection = false;
    canvas.defaultCursor = 'crosshair';
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
    this.cancel();
  }

  onMouseDown(opt) {
    if (this.app.zoomPan.spaceDown || this.app.zoomPan.isPanning) return;

    const canvas = this.app.canvas;
    const pointer = canvas.getPointer(opt.e);
    const snapped = this.app.grid.snapPoint(pointer.x, pointer.y);

    this.isDrawing = true;
    this.startPoint = snapped;
  }

  onMouseMove(opt) {
    if (!this.isDrawing) return;

    const canvas = this.app.canvas;
    const pointer = canvas.getPointer(opt.e);
    const snapped = this.app.grid.snapPoint(pointer.x, pointer.y);

    if (this.preview) canvas.remove(this.preview);

    const fill = document.getElementById('input-shape-fill').value;
    const stroke = document.getElementById('input-shape-stroke').value;
    const strokeWidth = parseFloat(document.getElementById('input-shape-stroke-width').value) || 1;

    if (this.shapeType === 'rect') {
      const left = Math.min(this.startPoint.x, snapped.x);
      const top = Math.min(this.startPoint.y, snapped.y);
      const width = Math.abs(snapped.x - this.startPoint.x);
      const height = Math.abs(snapped.y - this.startPoint.y);

      this.preview = new fabric.Rect({
        left, top, width, height,
        fill: fill + '80',
        stroke,
        strokeWidth,
        selectable: false,
        evented: false,
      });
    } else if (this.shapeType === 'circle') {
      const radius = Math.hypot(snapped.x - this.startPoint.x, snapped.y - this.startPoint.y) / 2;
      const cx = (this.startPoint.x + snapped.x) / 2;
      const cy = (this.startPoint.y + snapped.y) / 2;

      this.preview = new fabric.Circle({
        left: cx - radius,
        top: cy - radius,
        radius,
        fill: fill + '80',
        stroke,
        strokeWidth,
        selectable: false,
        evented: false,
      });
    } else if (this.shapeType === 'line') {
      this.preview = new fabric.Line(
        [this.startPoint.x, this.startPoint.y, snapped.x, snapped.y],
        {
          stroke,
          strokeWidth,
          selectable: false,
          evented: false,
        }
      );
    }

    if (this.preview) {
      canvas.add(this.preview);
      canvas.renderAll();
    }
  }

  onMouseUp(opt) {
    if (!this.isDrawing) return;
    this.isDrawing = false;

    const canvas = this.app.canvas;
    if (this.preview) {
      canvas.remove(this.preview);
    }

    const pointer = canvas.getPointer(opt.e);
    const snapped = this.app.grid.snapPoint(pointer.x, pointer.y);

    const fill = document.getElementById('input-shape-fill').value;
    const stroke = document.getElementById('input-shape-stroke').value;
    const strokeWidth = parseFloat(document.getElementById('input-shape-stroke-width').value) || 1;

    let shape;
    if (this.shapeType === 'rect') {
      const left = Math.min(this.startPoint.x, snapped.x);
      const top = Math.min(this.startPoint.y, snapped.y);
      const width = Math.abs(snapped.x - this.startPoint.x);
      const height = Math.abs(snapped.y - this.startPoint.y);
      if (width < 3 && height < 3) return;

      shape = new fabric.Rect({
        left, top, width, height,
        fill, stroke, strokeWidth,
        isCustomShape: true,
        customType: 'rect',
      });
    } else if (this.shapeType === 'circle') {
      const radius = Math.hypot(snapped.x - this.startPoint.x, snapped.y - this.startPoint.y) / 2;
      if (radius < 2) return;
      const cx = (this.startPoint.x + snapped.x) / 2;
      const cy = (this.startPoint.y + snapped.y) / 2;

      shape = new fabric.Circle({
        left: cx - radius,
        top: cy - radius,
        radius,
        fill, stroke, strokeWidth,
        isCustomShape: true,
        customType: 'circle',
      });
    } else if (this.shapeType === 'line') {
      if (Math.hypot(snapped.x - this.startPoint.x, snapped.y - this.startPoint.y) < 3) return;

      shape = new fabric.Line(
        [this.startPoint.x, this.startPoint.y, snapped.x, snapped.y],
        {
          stroke, strokeWidth: Math.max(strokeWidth, 1),
          isCustomShape: true,
          customType: 'line',
          padding: 6, // easier to select thin lines
        }
      );
    }

    if (shape) {
      canvas.add(shape);
      canvas.renderAll();
      this.app.history.saveState();
    }

    this.preview = null;
    this.startPoint = null;
  }

  cancel() {
    const canvas = this.app.canvas;
    if (this.preview) canvas.remove(this.preview);
    this.preview = null;
    this.isDrawing = false;
    this.startPoint = null;
    canvas.renderAll();
  }
}
