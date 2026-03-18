export class TextTool {
  constructor(app) {
    this.app = app;
    this.onMouseDown = this.onMouseDown.bind(this);
  }

  activate() {
    const canvas = this.app.canvas;
    canvas.selection = false;
    canvas.defaultCursor = 'text';
    canvas.forEachObject(obj => {
      if (!obj.isGrid) {
        obj.selectable = false;
        obj.evented = false;
      }
    });

    canvas.on('mouse:down', this.onMouseDown);
  }

  deactivate() {
    const canvas = this.app.canvas;
    canvas.off('mouse:down', this.onMouseDown);
  }

  onMouseDown(opt) {
    if (opt.e.button !== 0) return; // Only left-click
    if (this.app.zoomPan.spaceDown || this.app.zoomPan.isPanning) return;

    const canvas = this.app.canvas;
    const pointer = canvas.getPointer(opt.e);
    const snapped = this.app.grid.snapPoint(pointer.x, pointer.y);

    const text = new fabric.IText('Label', {
      left: snapped.x,
      top: snapped.y,
      fontSize: 14,
      fill: '#333',
      fontFamily: 'sans-serif',
      customType: 'label',
      originX: 'center',
      originY: 'center',
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    text.enterEditing();
    canvas.renderAll();

    // Switch to select after placing
    this.app.setTool('select');
    this.app.history.saveState();
  }
}

export class DimensionTool {
  constructor(app) {
    this.app = app;
    this.firstPoint = null;
    this.previewLine = null;

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
  }

  activate() {
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
  }

  deactivate() {
    const canvas = this.app.canvas;
    canvas.off('mouse:down', this.onMouseDown);
    canvas.off('mouse:move', this.onMouseMove);
    this.cancel();
  }

  onMouseDown(opt) {
    if (opt.e.button !== 0) return; // Only left-click
    if (this.app.zoomPan.spaceDown || this.app.zoomPan.isPanning) return;

    const canvas = this.app.canvas;
    const pointer = canvas.getPointer(opt.e);
    const snapped = this.app.grid.snapPoint(pointer.x, pointer.y);

    if (!this.firstPoint) {
      this.firstPoint = snapped;
    } else {
      this.createDimension(this.firstPoint, snapped);
      this.firstPoint = null;
      if (this.previewLine) {
        canvas.remove(this.previewLine);
        this.previewLine = null;
      }
    }
  }

  onMouseMove(opt) {
    if (!this.firstPoint) return;

    const canvas = this.app.canvas;
    const pointer = canvas.getPointer(opt.e);
    const snapped = this.app.grid.snapPoint(pointer.x, pointer.y);

    if (this.previewLine) canvas.remove(this.previewLine);

    this.previewLine = new fabric.Line(
      [this.firstPoint.x, this.firstPoint.y, snapped.x, snapped.y],
      {
        stroke: '#6c8eef',
        strokeWidth: 1,
        strokeDashArray: [4, 4],
        selectable: false,
        evented: false,
      }
    );

    canvas.add(this.previewLine);
    canvas.renderAll();
  }

  createDimension(p1, p2) {
    const canvas = this.app.canvas;
    const scale = this.app.scale;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const lengthPx = Math.hypot(dx, dy);
    const lengthMm = Math.round(lengthPx / scale);
    const angle = Math.atan2(dy, dx);

    const offset = 15; // pixels offset for dimension line
    const perpX = -Math.sin(angle) * offset;
    const perpY = Math.cos(angle) * offset;

    // Dimension line endpoints (offset from measured points)
    const lp1 = { x: p1.x + perpX, y: p1.y + perpY };
    const lp2 = { x: p2.x + perpX, y: p2.y + perpY };

    // Main dimension line
    const dimLine = new fabric.Line(
      [lp1.x, lp1.y, lp2.x, lp2.y],
      {
        stroke: '#555',
        strokeWidth: 0.8,
        selectable: false,
        evented: false,
      }
    );

    // Extension lines
    const ext1 = new fabric.Line(
      [p1.x, p1.y, lp1.x + perpX * 0.3, lp1.y + perpY * 0.3],
      {
        stroke: '#555',
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
      }
    );

    const ext2 = new fabric.Line(
      [p2.x, p2.y, lp2.x + perpX * 0.3, lp2.y + perpY * 0.3],
      {
        stroke: '#555',
        strokeWidth: 0.5,
        selectable: false,
        evented: false,
      }
    );

    // Tick marks at endpoints
    const tickLen = 5;
    const tick1 = new fabric.Line(
      [lp1.x - perpX * tickLen / offset, lp1.y - perpY * tickLen / offset,
       lp1.x + perpX * tickLen / offset, lp1.y + perpY * tickLen / offset],
      {
        stroke: '#555',
        strokeWidth: 0.8,
        selectable: false,
        evented: false,
      }
    );

    const tick2 = new fabric.Line(
      [lp2.x - perpX * tickLen / offset, lp2.y - perpY * tickLen / offset,
       lp2.x + perpX * tickLen / offset, lp2.y + perpY * tickLen / offset],
      {
        stroke: '#555',
        strokeWidth: 0.8,
        selectable: false,
        evented: false,
      }
    );

    // Label
    const midX = (lp1.x + lp2.x) / 2;
    const midY = (lp1.y + lp2.y) / 2;
    const labelAngle = (angle * 180 / Math.PI);
    const displayAngle = labelAngle > 90 || labelAngle < -90 ? labelAngle + 180 : labelAngle;

    const label = new fabric.Text(lengthMm.toString(), {
      left: midX,
      top: midY - 8,
      fontSize: 10,
      fill: '#555',
      fontFamily: 'sans-serif',
      originX: 'center',
      originY: 'center',
      angle: displayAngle,
      selectable: false,
      evented: false,
    });

    // Group everything
    const group = new fabric.Group([dimLine, ext1, ext2, tick1, tick2, label], {
      customType: 'dimension',
      dimensionData: { p1, p2, lengthMm },
      selectable: true,
      evented: true,
    });

    canvas.add(group);
    canvas.renderAll();
    this.app.history.saveState();
  }

  cancel() {
    const canvas = this.app.canvas;
    if (this.previewLine) {
      canvas.remove(this.previewLine);
      this.previewLine = null;
    }
    this.firstPoint = null;
    canvas.renderAll();
  }
}
