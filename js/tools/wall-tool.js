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

    // Dimension label (above the wall)
    const labelOffset = thickness / 2 + 10;
    const perpX = -Math.sin(angle) * labelOffset;
    const perpY = Math.cos(angle) * labelOffset;

    const dimLabel = new fabric.Text(lengthMm + '', {
      left: midX + perpX,
      top: midY + perpY,
      fontSize: 10,
      fill: '#888',
      fontFamily: 'sans-serif',
      angle: angleDeg,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
      customType: 'wallDimension',
    });
    canvas.add(dimLabel);

    // Rebuild the unified wall visuals (polylines with miter joins)
    this.app.rebuildWalls();

    canvas.renderAll();
    this.app.history.saveState();

    // Continue wall from this endpoint (allows chain-drawing)
    this.startPoint = { x: endPt.x, y: endPt.y };
    // Keep isDrawing = true so user can continue clicking
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
    const snapThreshold = 50 * scale; // 50mm snap radius
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
}
