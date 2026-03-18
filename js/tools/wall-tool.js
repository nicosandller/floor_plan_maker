export class WallTool {
  constructor(app) {
    this.app = app;
    this.isDrawing = false;
    this.startPoint = null;
    this.previewWall = null;
    this.previewLabel = null;
    this.previewEndpoint = null;

    // Angle stickiness: how close (in degrees) to a cardinal direction before snapping
    this.stickyAngleThreshold = 8; // degrees
    // Minimum wall length in px before accepting
    this.minWallLength = 3;

    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
    // Listen for wall label edits globally
    this.setupLabelEditListener();
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

    // Show green endpoint handles on all existing walls
    this.showAllEndpointHandles();
  }

  deactivate() {
    const canvas = this.app.canvas;
    canvas.off('mouse:down', this.onMouseDown);
    canvas.off('mouse:move', this.onMouseMove);
    this.clearEndpointHandles();
    this.cancel();
  }

  onMouseDown(opt) {
    if (this.app.zoomPan.spaceDown || this.app.zoomPan.isPanning) return;

    const canvas = this.app.canvas;
    const pointer = canvas.getPointer(opt.e);
    const snapped = this.app.grid.snapPoint(pointer.x, pointer.y);

    // Try snapping to nearby wall endpoints first
    const wallSnap = this.snapToWallEndpoint(snapped.x, snapped.y);
    const pt = wallSnap || snapped;

    if (!this.isDrawing) {
      this.isDrawing = true;
      this.startPoint = pt;
    } else {
      const endPt = this.computeEndPoint(pt);
      this.finishWall(endPt);
    }
  }

  onMouseMove(opt) {
    if (!this.isDrawing) return;

    const canvas = this.app.canvas;
    const pointer = canvas.getPointer(opt.e);
    const snapped = this.app.grid.snapPoint(pointer.x, pointer.y);

    // Try wall endpoint snap
    const wallSnap = this.snapToWallEndpoint(snapped.x, snapped.y);
    const rawEnd = wallSnap || snapped;
    const endPt = this.computeEndPoint(rawEnd);

    this.drawPreview(endPt);
  }

  /**
   * Computes the final end point, applying axis stickiness.
   * The wall can go in any direction, but if the angle is close to
   * 0°, 90°, 180°, or 270° it snaps to that axis.
   */
  computeEndPoint(rawEnd) {
    const dx = rawEnd.x - this.startPoint.x;
    const dy = rawEnd.y - this.startPoint.y;
    const len = Math.hypot(dx, dy);
    if (len < 1) return rawEnd;

    const angleDeg = Math.atan2(dy, dx) * 180 / Math.PI; // -180..180
    const threshold = this.stickyAngleThreshold;

    // Check cardinal snapping
    const cardinals = [0, 90, 180, -180, -90];
    for (const card of cardinals) {
      let diff = angleDeg - card;
      // Normalise to -180..180
      while (diff > 180) diff -= 360;
      while (diff < -180) diff += 360;
      if (Math.abs(diff) < threshold) {
        // Snap to this cardinal
        const snapRad = card * Math.PI / 180;
        return {
          x: this.startPoint.x + Math.cos(snapRad) * len,
          y: this.startPoint.y + Math.sin(snapRad) * len,
        };
      }
    }

    // No sticky snap — use free angle
    return rawEnd;
  }

  drawPreview(endPt) {
    const canvas = this.app.canvas;
    const scale = this.app.scale;
    const thickness = this.app.wallThickness * scale;

    // Remove old previews
    if (this.previewWall) canvas.remove(this.previewWall);
    if (this.previewLabel) canvas.remove(this.previewLabel);
    if (this.previewEndpoint) canvas.remove(this.previewEndpoint);
    this.previewWall = null;
    this.previewLabel = null;
    this.previewEndpoint = null;

    const dx = endPt.x - this.startPoint.x;
    const dy = endPt.y - this.startPoint.y;
    const len = Math.hypot(dx, dy);
    if (len < 1) return;

    const angle = Math.atan2(dy, dx); // radians

    // Build wall as a rotated rectangle centred on the midpoint
    const midX = (this.startPoint.x + endPt.x) / 2;
    const midY = (this.startPoint.y + endPt.y) / 2;

    this.previewWall = new fabric.Rect({
      left: midX,
      top: midY,
      width: len,
      height: thickness,
      angle: angle * 180 / Math.PI,
      originX: 'center',
      originY: 'center',
      fill: this.app.wallColor + '80',
      stroke: this.app.wallColor,
      strokeWidth: 1,
      selectable: false,
      evented: false,
    });

    // Dimension label
    const lengthMm = Math.round(len / scale);
    const labelOffset = thickness / 2 + 14;
    // Place label above the wall (perpendicular offset)
    const perpX = -Math.sin(angle) * labelOffset;
    const perpY = Math.cos(angle) * labelOffset;

    this.previewLabel = new fabric.Text(lengthMm + 'mm', {
      left: midX + perpX,
      top: midY + perpY,
      fontSize: 11,
      fill: '#6c8eef',
      fontFamily: 'sans-serif',
      angle: angle * 180 / Math.PI,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    });

    // Endpoint indicator
    this.previewEndpoint = new fabric.Circle({
      left: endPt.x - 3,
      top: endPt.y - 3,
      radius: 3,
      fill: '#6c8eef',
      stroke: '#fff',
      strokeWidth: 1,
      selectable: false,
      evented: false,
    });

    canvas.add(this.previewWall);
    canvas.add(this.previewLabel);
    canvas.add(this.previewEndpoint);
    canvas.renderAll();
  }

  finishWall(endPt) {
    const canvas = this.app.canvas;
    const scale = this.app.scale;
    const thickness = this.app.wallThickness * scale;

    const dx = endPt.x - this.startPoint.x;
    const dy = endPt.y - this.startPoint.y;
    const len = Math.hypot(dx, dy);

    if (len < this.minWallLength) {
      this.cancel();
      return;
    }

    const angle = Math.atan2(dy, dx);
    const angleDeg = angle * 180 / Math.PI;
    const midX = (this.startPoint.x + endPt.x) / 2;
    const midY = (this.startPoint.y + endPt.y) / 2;

    // Remove previews
    this.clearPreviews();

    const lengthMm = Math.round(len / scale);

    const wall = new fabric.Rect({
      left: midX,
      top: midY,
      width: len,
      height: thickness,
      angle: angleDeg,
      originX: 'center',
      originY: 'center',
      fill: this.app.wallColor,
      stroke: '#222',
      strokeWidth: 0.5,
      isWall: true,
      wallData: {
        startX: Math.round(this.startPoint.x / scale),
        startY: Math.round(this.startPoint.y / scale),
        endX: Math.round(endPt.x / scale),
        endY: Math.round(endPt.y / scale),
        lengthMm,
        thicknessMm: this.app.wallThickness,
        angleDeg,
      },
    });

    canvas.add(wall);

    // Create attached dimension label (on the underside of the wall)
    const dimLabel = this.createWallLabel(wall);

    // Link wall and label to each other
    wall.dimLabel = dimLabel;
    dimLabel.wallRef = wall;

    canvas.add(dimLabel);

    // Rebuild the unified wall visuals (polylines with miter joins)
    this.app.rebuildWalls();

    // Refresh endpoint handles to include the new wall's endpoints
    this.showAllEndpointHandles();

    canvas.renderAll();
    this.app.history.saveState();

    // Continue wall from this endpoint (allows chain-drawing)
    this.startPoint = { x: endPt.x, y: endPt.y };
    // Keep isDrawing = true so user can continue clicking
  }

  /**
   * Creates an IText label for a wall, positioned centered on its underside.
   */
  createWallLabel(wall) {
    const scale = this.app.scale;
    const zoom = this.app.canvas.getZoom();
    const thickness = this.app.wallThickness * scale;
    const angle = (wall.angle || 0) * Math.PI / 180;
    const midX = wall.left;
    const midY = wall.top;
    const lengthMm = wall.wallData.lengthMm;

    // Offset to the underside — scale gap inversely with zoom so it
    // looks the same distance on-screen regardless of zoom level.
    const gapPx = 10 / zoom;
    const labelOffset = thickness / 2 + gapPx;
    const perpX = -Math.sin(angle) * labelOffset;
    const perpY = Math.cos(angle) * labelOffset;

    // Normalise display angle so text is never upside-down
    let displayAngle = wall.angle || 0;
    while (displayAngle < 0) displayAngle += 360;
    while (displayAngle >= 360) displayAngle -= 360;
    if (displayAngle > 90 && displayAngle < 270) {
      displayAngle += 180;
    }

    // Font size is zoom-compensated so it always appears 12px on-screen
    const fontSize = 12 / zoom;

    const dimLabel = new fabric.Text(lengthMm + '', {
      left: midX + perpX,
      top: midY + perpY,
      fontSize,
      fill: '#bbb',
      fontFamily: 'sans-serif',
      angle: displayAngle,
      originX: 'center',
      originY: 'center',
      selectable: true,
      evented: true,
      hasControls: false,
      hasBorders: false,
      lockMovementX: true,
      lockMovementY: true,
      lockRotation: true,
      lockScalingX: true,
      lockScalingY: true,
      customType: 'wallDimension',
      objectCaching: false,
      hoverCursor: 'pointer',
    });

    return dimLabel;
  }

  /**
   * Repositions a wall's dimension label after the wall has been moved/resized.
   */
  updateWallLabel(wall) {
    const dimLabel = wall.dimLabel;
    if (!dimLabel) return;

    const scale = this.app.scale;
    const zoom = this.app.canvas.getZoom();
    const thickness = this.app.wallThickness * scale;
    const angle = (wall.angle || 0) * Math.PI / 180;
    const midX = wall.left;
    const midY = wall.top;

    // Offset scales inversely with zoom for consistent screen gap
    const gapPx = 10 / zoom;
    const labelOffset = thickness / 2 + gapPx;
    const perpX = -Math.sin(angle) * labelOffset;
    const perpY = Math.cos(angle) * labelOffset;

    // Recalculate length from wall dimensions
    const len = wall.width * (wall.scaleX || 1);
    const lengthMm = Math.round(len / scale);
    wall.wallData.lengthMm = lengthMm;

    let displayAngle = wall.angle || 0;
    while (displayAngle < 0) displayAngle += 360;
    while (displayAngle >= 360) displayAngle -= 360;
    if (displayAngle > 90 && displayAngle < 270) {
      displayAngle += 180;
    }

    // Font size compensated for zoom
    const fontSize = 12 / zoom;

    dimLabel.set({
      left: midX + perpX,
      top: midY + perpY,
      angle: displayAngle,
      text: lengthMm + '',
      fontSize,
    });
    dimLabel.setCoords();
  }

  /**
   * Listen for double-click on wall dimension labels to open edit popup.
   */
  setupLabelEditListener() {
    const canvas = this.app.canvas;

    canvas.on('mouse:dblclick', (opt) => {
      const target = opt.target;
      if (!target || target.customType !== 'wallDimension' || !target.wallRef) return;

      this.openLabelEditor(target);
    });
  }

  /**
   * Opens the wall length popup editor for a dimension label.
   */
  openLabelEditor(label) {
    const wall = label.wallRef;
    const popup = document.getElementById('wall-input-popup');
    const input = document.getElementById('wall-length-input');
    const okBtn = document.getElementById('wall-length-ok');
    const cancelBtn = document.getElementById('wall-length-cancel');

    // Position popup near the label in screen coords
    const canvas = this.app.canvas;
    const zoom = canvas.getZoom();
    const vpt = canvas.viewportTransform;
    const screenX = label.left * zoom + vpt[4];
    const screenY = label.top * zoom + vpt[5];
    const container = document.getElementById('canvas-container');
    const rect = container.getBoundingClientRect();

    popup.style.left = Math.min(screenX, rect.width - 200) + 'px';
    popup.style.top = Math.min(screenY + 20, rect.height - 50) + 'px';
    popup.style.display = 'flex';
    input.value = wall.wallData.lengthMm;
    input.focus();
    input.select();

    const cleanup = () => {
      popup.style.display = 'none';
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      input.removeEventListener('keydown', onKey);
    };

    const onOk = () => {
      const newMm = parseInt(input.value, 10);
      if (newMm && newMm > 0) {
        this.resizeWallToLength(wall, newMm);
        this.updateWallLabel(wall);
        this.app.rebuildWalls();
        canvas.renderAll();
        this.app.history.saveState();
      }
      cleanup();
    };

    const onCancel = () => cleanup();

    const onKey = (e) => {
      if (e.key === 'Enter') onOk();
      if (e.key === 'Escape') onCancel();
    };

    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    input.addEventListener('keydown', onKey);
  }

  /**
   * Resize a wall to a new length (in mm), extending from its start point
   * along its original direction of travel.
   */
  resizeWallToLength(wall, newLengthMm) {
    const scale = this.app.scale;
    const newLenPx = newLengthMm * scale;
    const angleRad = (wall.angle || 0) * Math.PI / 180;

    // Compute start point (the end that was placed first)
    const cx = wall.left;
    const cy = wall.top;
    const halfOldLen = (wall.width * (wall.scaleX || 1)) / 2;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);

    // Start point is the "backward" end
    const startX = cx - cosA * halfOldLen;
    const startY = cy - sinA * halfOldLen;

    // New end point
    const endX = startX + cosA * newLenPx;
    const endY = startY + sinA * newLenPx;

    // New center
    const newCx = (startX + endX) / 2;
    const newCy = (startY + endY) / 2;

    wall.set({
      left: newCx,
      top: newCy,
      width: newLenPx,
      scaleX: 1,
    });
    wall.setCoords();

    // Update wallData
    wall.wallData.lengthMm = newLengthMm;
    wall.wallData.endX = Math.round(endX / scale);
    wall.wallData.endY = Math.round(endY / scale);
  }

  /**
   * Returns all endpoints of all walls on the canvas.
   * For angled walls stored with origin center, we compute the two ends.
   */
  getWallEndpoints(wallObj) {
    const scale = this.app.scale;
    const wd = wallObj.wallData;
    if (!wd) {
      // Fallback for old-style walls (axis-aligned, left/top origin)
      const l = wallObj.left;
      const t = wallObj.top;
      const w = wallObj.width * (wallObj.scaleX || 1);
      const h = wallObj.height * (wallObj.scaleY || 1);
      const thickness = this.app.wallThickness * scale;
      if (w > h) {
        const cy = t + h / 2;
        return [{ x: l, y: cy }, { x: l + w, y: cy }];
      } else {
        const cx = l + w / 2;
        return [{ x: cx, y: t }, { x: cx, y: t + h }];
      }
    }

    // New-style walls (centered origin, may be rotated)
    const cx = wallObj.left;
    const cy = wallObj.top;
    const halfLen = (wallObj.width * (wallObj.scaleX || 1)) / 2;
    const rad = (wallObj.angle || 0) * Math.PI / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    return [
      { x: cx - cosA * halfLen, y: cy - sinA * halfLen },
      { x: cx + cosA * halfLen, y: cy + sinA * halfLen },
    ];
  }

  snapToWallEndpoint(x, y) {
    const canvas = this.app.canvas;
    const scale = this.app.scale;
    const zoom = canvas.getZoom();
    // 15 screen-pixels snap radius, converted to canvas coords
    const snapThreshold = Math.max(15 / zoom, 50 * scale);
    let closest = null;
    let minDist = snapThreshold;

    canvas.forEachObject(obj => {
      if (!obj.isWall) return;

      const endpoints = this.getWallEndpoints(obj);
      for (const ep of endpoints) {
        const dist = Math.hypot(ep.x - x, ep.y - y);
        if (dist < minDist) {
          minDist = dist;
          closest = ep;
        }
      }
    });

    return closest;
  }

  clearPreviews() {
    const canvas = this.app.canvas;
    if (this.previewWall) canvas.remove(this.previewWall);
    if (this.previewLabel) canvas.remove(this.previewLabel);
    if (this.previewEndpoint) canvas.remove(this.previewEndpoint);
    this.previewWall = null;
    this.previewLabel = null;
    this.previewEndpoint = null;
  }

  cancel() {
    this.clearPreviews();
    this.isDrawing = false;
    this.startPoint = null;
    this.app.canvas.renderAll();
  }

  /* ------------------------------------------------------------------ */
  /*  Endpoint handles shown during wall drawing                        */
  /* ------------------------------------------------------------------ */

  /**
   * Show green + circles on all existing wall endpoints so the user
   * can visually target and snap to them while drawing.
   */
  showAllEndpointHandles() {
    this.clearEndpointHandles();
    const canvas = this.app.canvas;
    const zoom = canvas.getZoom();
    const radius = 7 / zoom;
    const fontSize = 9 / zoom;
    const strokeW = 1.5 / zoom;

    if (!this._endpointHandles) this._endpointHandles = [];

    canvas.forEachObject(obj => {
      if (!obj.isWall) return;
      const endpoints = this.getWallEndpoints(obj);
      for (const ep of endpoints) {
        // Avoid duplicate handles at the same position (shared endpoints)
        const dup = this._endpointHandles.some(h =>
          h.type === 'circle' && Math.hypot(h.epX - ep.x, h.epY - ep.y) < 2
        );
        if (dup) continue;

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
          evented: false,
          hasControls: false,
          hasBorders: false,
          isEndpointHandle: true,
          epX: ep.x,
          epY: ep.y,
          objectCaching: false,
        });

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
        this._endpointHandles.push(circle, plus);
      }
    });

    canvas.renderAll();
  }

  clearEndpointHandles() {
    if (!this._endpointHandles) return;
    const canvas = this.app.canvas;
    for (const h of this._endpointHandles) {
      canvas.remove(h);
    }
    this._endpointHandles = [];
  }
}
