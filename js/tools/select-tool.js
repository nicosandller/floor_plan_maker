export class SelectTool {
  constructor(app) {
    this.app = app;
    this.endpointHandles = [];  // green + circles shown on selected wall

    // Pan state (shift + left-click drag)
    this.isPanning = false;
    this.lastPanX = 0;
    this.lastPanY = 0;

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onSelectionCreated = this.onSelectionUpdate.bind(this);
    this.onSelectionUpdated = this.onSelectionUpdate.bind(this);
    this.onSelectionCleared = this.onSelectionCleared.bind(this);
  }

  activate() {
    const canvas = this.app.canvas;
    canvas.selection = true;
    canvas.defaultCursor = 'default';
    canvas.forEachObject(obj => {
      if (obj.isGrid || obj.isEndpointHandle) return;
      // Dimension labels should never be selectable (prevents group-select issues)
      if (obj.customType === 'wallDimension') {
        obj.selectable = false;
        obj.evented = true;  // still respond to double-click for editing
        return;
      }
      obj.selectable = true;
      obj.evented = true;
    });

    canvas.on('mouse:down', this.onMouseDown);
    canvas.on('mouse:move', this.onMouseMove);
    canvas.on('mouse:up', this.onMouseUp);
    canvas.on('selection:created', this.onSelectionCreated);
    canvas.on('selection:updated', this.onSelectionUpdated);
    canvas.on('selection:cleared', this.onSelectionCleared);
  }

  deactivate() {
    const canvas = this.app.canvas;
    canvas.off('mouse:down', this.onMouseDown);
    canvas.off('mouse:move', this.onMouseMove);
    canvas.off('mouse:up', this.onMouseUp);
    canvas.off('selection:created', this.onSelectionCreated);
    canvas.off('selection:updated', this.onSelectionUpdated);
    canvas.off('selection:cleared', this.onSelectionCleared);
    this.clearEndpointHandles();
    this.isPanning = false;
  }

  /* ------------------------------------------------------------------ */
  /*  Mouse handlers                                                     */
  /* ------------------------------------------------------------------ */

  onMouseDown(opt) {
    const canvas = this.app.canvas;
    const e = opt.e;

    // Left-click on endpoint handle → start a new wall from it
    if (opt.target && opt.target.isEndpointHandle && e.button === 0) {
      const pt = { x: opt.target.epX, y: opt.target.epY };
      this.clearEndpointHandles();
      canvas.discardActiveObject();
      // Switch to wall tool and start from this point
      this.app.setTool('wall');
      const wallTool = this.app.tools.wall;
      wallTool.isDrawing = true;
      wallTool.startPoint = pt;
      return;
    }

    // Shift + left-click → start panning
    if (e.button === 0 && e.shiftKey) {
      this.isPanning = true;
      this.lastPanX = e.clientX;
      this.lastPanY = e.clientY;
      canvas.setCursor('grabbing');
      canvas.selection = false;
      canvas.discardActiveObject();
      return;
    }

    // Plain left-click on empty canvas → normal fabric selection
  }

  onMouseMove(opt) {
    if (!this.isPanning) return;
    const e = opt.e;
    const canvas = this.app.canvas;
    const vpt = canvas.viewportTransform;
    vpt[4] += e.clientX - this.lastPanX;
    vpt[5] += e.clientY - this.lastPanY;
    canvas.requestRenderAll();
    this.lastPanX = e.clientX;
    this.lastPanY = e.clientY;
  }

  onMouseUp(opt) {
    if (this.isPanning) {
      this.isPanning = false;
      this.app.canvas.setCursor('default');
      this.app.canvas.selection = true;
      this.app.grid.draw();
      this.app.updateZoomDisplay();
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Endpoint handles (green + circles on selected walls)              */
  /* ------------------------------------------------------------------ */

  onSelectionUpdate(e) {
    this.clearEndpointHandles();
    const target = e.selected && e.selected.length === 1 ? e.selected[0] : null;
    if (target && target.isWall) {
      this.showEndpointHandles(target);
    }
  }

  onSelectionCleared() {
    this.clearEndpointHandles();
  }

  showEndpointHandles(wall) {
    const canvas = this.app.canvas;
    const zoom = canvas.getZoom();
    const wallTool = this.app.tools.wall;
    const endpoints = wallTool.getWallEndpoints(wall);

    // Size inversely with zoom so they look constant on-screen
    const radius = 8 / zoom;
    const fontSize = 10 / zoom;
    const strokeW = 2 / zoom;

    for (const ep of endpoints) {
      // Green circle
      const circle = new fabric.Circle({
        left: ep.x,
        top: ep.y,
        radius,
        fill: '#22c55e',
        stroke: '#16a34a',
        strokeWidth: strokeW,
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: true,
        hasControls: false,
        hasBorders: false,
        isEndpointHandle: true,
        epX: ep.x,
        epY: ep.y,
        hoverCursor: 'crosshair',
        objectCaching: false,
      });

      // + sign
      const plus = new fabric.Text('+', {
        left: ep.x,
        top: ep.y,
        fontSize,
        fill: '#fff',
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        originX: 'center',
        originY: 'center',
        selectable: false,
        evented: false,
        isEndpointHandle: true,
        objectCaching: false,
      });

      canvas.add(circle);
      canvas.add(plus);
      this.endpointHandles.push(circle, plus);
    }
    canvas.renderAll();
  }

  clearEndpointHandles() {
    const canvas = this.app.canvas;
    for (const h of this.endpointHandles) {
      canvas.remove(h);
    }
    this.endpointHandles = [];
  }
}
