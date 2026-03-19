/**
 * WindowTool: Click on a wall to insert a window opening.
 *
 * How it works:
 *  1. User activates the tool, sets window width in the left panel.
 *  2. As user hovers over the canvas, walls under the cursor are highlighted.
 *  3. Click on a wall to place a window at that position.
 *  4. The window is drawn as a group: a gap in visual terms + the window symbol
 *     (parallel lines representing glass panes).
 *  5. The window is placed as a child object on top of the wall.
 */
export class WindowTool {
  constructor(app) {
    this.app = app;
    this.hoveredWall = null;
    this.previewWindow = null;

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
    this.clearPreview();
  }

  getWindowWidth() {
    const el = document.getElementById('input-window-width');
    return el ? parseInt(el.value) || 1000 : 1000;
  }

  onMouseMove(opt) {
    if (this.app.zoomPan.spaceDown || this.app.zoomPan.isPanning) return;

    const canvas = this.app.canvas;
    const pointer = canvas.getPointer(opt.e);
    const wall = this.findWallAt(pointer.x, pointer.y);

    this.clearPreview();

    if (wall) {
      canvas.defaultCursor = 'pointer';
      this.hoveredWall = wall;
      this.drawPreview(wall, pointer);
    } else {
      canvas.defaultCursor = 'crosshair';
      this.hoveredWall = null;
    }
  }

  onMouseDown(opt) {
    if (opt.e && opt.e.button && opt.e.button !== 0) return; // Only left-click
    if (this.app.zoomPan.spaceDown || this.app.zoomPan.isPanning) return;

    const canvas = this.app.canvas;
    const pointer = canvas.getPointer(opt.e);
    const wall = this.findWallAt(pointer.x, pointer.y);

    if (!wall) return;

    this.clearPreview();
    this.placeWindow(wall, pointer);
  }

  /**
   * Find a wall object under (or very near) the given canvas point.
   */
  findWallAt(px, py) {
    const canvas = this.app.canvas;
    const scale = this.app.scale;
    const hitThreshold = (this.app.wallThickness * scale) / 2 + 5;
    let best = null;
    let bestDist = hitThreshold;

    canvas.forEachObject(obj => {
      if (!obj.isWall) return;

      const dist = this.distPointToWallCenterline(px, py, obj);
      if (dist < bestDist) {
        bestDist = dist;
        best = obj;
      }
    });

    return best;
  }

  /**
   * Distance from a point to the centerline segment of a wall.
   */
  distPointToWallCenterline(px, py, wallObj) {
    const endpoints = this.getWallEndpoints(wallObj);
    const [a, b] = endpoints;
    return this.distPointToSegment(px, py, a.x, a.y, b.x, b.y);
  }

  distPointToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - ax, py - ay);
    let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    const projX = ax + t * dx;
    const projY = ay + t * dy;
    return Math.hypot(px - projX, py - projY);
  }

  /**
   * Get wall centerline endpoints — same logic as WallTool.
   */
  getWallEndpoints(wallObj) {
    const wd = wallObj.wallData;
    const scale = this.app.scale;

    if (wd && wd.endX !== undefined) {
      // New-style (centered origin, possibly angled)
      const cx = wallObj.left;
      const cy = wallObj.top;
      const halfLen = (wallObj.width * (wallObj.scaleX || 1)) / 2;
      const rad = (wallObj.angle || 0) * Math.PI / 180;
      return [
        { x: cx - Math.cos(rad) * halfLen, y: cy - Math.sin(rad) * halfLen },
        { x: cx + Math.cos(rad) * halfLen, y: cy + Math.sin(rad) * halfLen },
      ];
    }

    // Old-style fallback
    const l = wallObj.left;
    const t = wallObj.top;
    const w = wallObj.width * (wallObj.scaleX || 1);
    const h = wallObj.height * (wallObj.scaleY || 1);
    if (w > h) {
      const cy = t + h / 2;
      return [{ x: l, y: cy }, { x: l + w, y: cy }];
    } else {
      const cx = l + w / 2;
      return [{ x: cx, y: t }, { x: cx, y: t + h }];
    }
  }

  /**
   * Project a point onto the wall centerline; returns { t, x, y }
   * where t is 0..1 along the wall.
   */
  projectOnWall(px, py, wallObj) {
    const [a, b] = this.getWallEndpoints(wallObj);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return { t: 0, x: a.x, y: a.y };
    let t = ((px - a.x) * dx + (py - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return { t, x: a.x + t * dx, y: a.y + t * dy };
  }

  drawPreview(wall, pointer) {
    const canvas = this.app.canvas;
    const scale = this.app.scale;
    const windowWidthPx = this.getWindowWidth() * scale;
    const thickness = this.app.wallThickness * scale;

    const proj = this.projectOnWall(pointer.x, pointer.y, wall);
    const [a, b] = this.getWallEndpoints(wall);
    const wallAngle = Math.atan2(b.y - a.y, b.x - a.x);
    const angleDeg = wallAngle * 180 / Math.PI;

    // Build window preview group at the projected center
    const windowGroup = this.buildWindowGraphic(windowWidthPx, thickness, '#6c8eef');
    windowGroup.set({
      left: proj.x,
      top: proj.y,
      angle: angleDeg,
      originX: 'center',
      originY: 'center',
      opacity: 0.7,
      selectable: false,
      evented: false,
    });

    this.previewWindow = windowGroup;
    canvas.add(windowGroup);
    canvas.renderAll();
  }

  placeWindow(wall, pointer) {
    const canvas = this.app.canvas;
    const scale = this.app.scale;
    const windowWidthMm = this.getWindowWidth();
    const windowWidthPx = windowWidthMm * scale;
    const thickness = this.app.wallThickness * scale;

    const proj = this.projectOnWall(pointer.x, pointer.y, wall);
    const [a, b] = this.getWallEndpoints(wall);
    const wallAngle = Math.atan2(b.y - a.y, b.x - a.x);
    const angleDeg = wallAngle * 180 / Math.PI;

    // Create window graphic
    const windowGroup = this.buildWindowGraphic(windowWidthPx, thickness, '#333');
    windowGroup.set({
      left: proj.x,
      top: proj.y,
      angle: angleDeg,
      originX: 'center',
      originY: 'center',
      isWindow: true,
      customType: 'window-on-wall',
      windowData: {
        widthMm: windowWidthMm,
        wallAngleDeg: angleDeg,
      },
    });

    canvas.add(windowGroup);
    canvas.renderAll();
    this.app.history.saveState();
  }

  /**
   * Builds the window symbol: a filled rectangle (same color as background to
   * "cut" the wall visually) overlaid with the window symbol (two parallel
   * lines for glass panes).
   */
  buildWindowGraphic(widthPx, thicknessPx, strokeColor) {
    const halfW = widthPx / 2;
    const halfH = thicknessPx / 2;

    // Background rect to mask the wall
    const bg = new fabric.Rect({
      left: -halfW,
      top: -halfH,
      width: widthPx,
      height: thicknessPx,
      fill: '#1a1a2e', // match canvas background
      stroke: 'transparent',
      strokeWidth: 0,
    });

    // Outer frame lines (top and bottom of wall thickness)
    const frameTop = new fabric.Line([-halfW, -halfH, halfW, -halfH], {
      stroke: strokeColor, strokeWidth: 1.5,
    });
    const frameBottom = new fabric.Line([-halfW, halfH, halfW, halfH], {
      stroke: strokeColor, strokeWidth: 1.5,
    });

    // Glass pane lines (two lines inside, spaced)
    const paneOffset = thicknessPx * 0.2;
    const pane1 = new fabric.Line([-halfW, -paneOffset, halfW, -paneOffset], {
      stroke: strokeColor, strokeWidth: 0.8,
    });
    const pane2 = new fabric.Line([-halfW, paneOffset, halfW, paneOffset], {
      stroke: strokeColor, strokeWidth: 0.8,
    });

    // Center divider (vertical line splitting the window)
    const divider = new fabric.Line([0, -halfH, 0, halfH], {
      stroke: strokeColor, strokeWidth: 0.5,
    });

    // End caps
    const capLeft = new fabric.Line([-halfW, -halfH, -halfW, halfH], {
      stroke: strokeColor, strokeWidth: 1,
    });
    const capRight = new fabric.Line([halfW, -halfH, halfW, halfH], {
      stroke: strokeColor, strokeWidth: 1,
    });

    return new fabric.Group([bg, frameTop, frameBottom, pane1, pane2, divider, capLeft, capRight], {
      originX: 'center',
      originY: 'center',
    });
  }

  clearPreview() {
    if (this.previewWindow) {
      this.app.canvas.remove(this.previewWindow);
      this.previewWindow = null;
      this.app.canvas.renderAll();
    }
  }

  cancel() {
    this.clearPreview();
  }
}
