/**
 * DoorTool: Click on a wall to place a door.
 *
 * Door types:
 *  - single:  Standard hinged door with 90° arc
 *  - double:  Two hinged doors opening outward with two arcs
 *  - sliding: Sliding door shown as arrow along wall
 *
 * Doors can be flipped to open to either side of the wall.
 */
export class DoorTool {
  constructor(app) {
    this.app = app;
    this.hoveredWall = null;
    this.previewDoor = null;

    // State
    this.doorType = 'single'; // 'single' | 'double' | 'sliding'
    this.flipped = false;     // which side of the wall the door opens toward

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

  getDoorWidth() {
    const el = document.getElementById('input-door-width');
    return el ? parseInt(el.value) || 900 : 900;
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
    if (opt.e.button !== 0) return;
    if (this.app.zoomPan.spaceDown || this.app.zoomPan.isPanning) return;

    const canvas = this.app.canvas;
    const pointer = canvas.getPointer(opt.e);
    const wall = this.findWallAt(pointer.x, pointer.y);

    if (!wall) return;

    this.clearPreview();
    this.placeDoor(wall, pointer);
  }

  /* ------------------------------------------------------------------ */
  /*  Wall geometry helpers (same as WindowTool)                         */
  /* ------------------------------------------------------------------ */

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

  distPointToWallCenterline(px, py, wallObj) {
    const [a, b] = this.getWallEndpoints(wallObj);
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

  getWallEndpoints(wallObj) {
    const wd = wallObj.wallData;
    if (wd && wd.endX !== undefined) {
      const cx = wallObj.left;
      const cy = wallObj.top;
      const halfLen = (wallObj.width * (wallObj.scaleX || 1)) / 2;
      const rad = (wallObj.angle || 0) * Math.PI / 180;
      return [
        { x: cx - Math.cos(rad) * halfLen, y: cy - Math.sin(rad) * halfLen },
        { x: cx + Math.cos(rad) * halfLen, y: cy + Math.sin(rad) * halfLen },
      ];
    }
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

  /* ------------------------------------------------------------------ */
  /*  Preview & placement                                                */
  /* ------------------------------------------------------------------ */

  drawPreview(wall, pointer) {
    const canvas = this.app.canvas;
    const scale = this.app.scale;
    const doorWidthPx = this.getDoorWidth() * scale;
    const thickness = this.app.wallThickness * scale;

    const proj = this.projectOnWall(pointer.x, pointer.y, wall);
    const [a, b] = this.getWallEndpoints(wall);
    const wallAngle = Math.atan2(b.y - a.y, b.x - a.x);
    const angleDeg = wallAngle * 180 / Math.PI;

    const doorGroup = this.buildDoorGraphic(doorWidthPx, thickness, this.doorType, this.flipped, '#6c8eef');
    doorGroup.set({
      left: proj.x,
      top: proj.y,
      angle: angleDeg,
      originX: 'center',
      originY: 'center',
      opacity: 0.7,
      selectable: false,
      evented: false,
    });

    this.previewDoor = doorGroup;
    canvas.add(doorGroup);
    canvas.renderAll();
  }

  placeDoor(wall, pointer) {
    const canvas = this.app.canvas;
    const scale = this.app.scale;
    const doorWidthMm = this.getDoorWidth();
    const doorWidthPx = doorWidthMm * scale;
    const thickness = this.app.wallThickness * scale;

    const proj = this.projectOnWall(pointer.x, pointer.y, wall);
    const [a, b] = this.getWallEndpoints(wall);
    const wallAngle = Math.atan2(b.y - a.y, b.x - a.x);
    const angleDeg = wallAngle * 180 / Math.PI;

    const doorGroup = this.buildDoorGraphic(doorWidthPx, thickness, this.doorType, this.flipped, '#888');
    doorGroup.set({
      left: proj.x,
      top: proj.y,
      angle: angleDeg,
      originX: 'center',
      originY: 'center',
      isDoor: true,
      customType: 'door-on-wall',
      doorData: {
        widthMm: doorWidthMm,
        doorType: this.doorType,
        flipped: this.flipped,
        wallAngleDeg: angleDeg,
      },
    });

    canvas.add(doorGroup);
    canvas.renderAll();
    this.app.history.saveState();
  }

  /* ------------------------------------------------------------------ */
  /*  Door graphics                                                      */
  /* ------------------------------------------------------------------ */

  buildDoorGraphic(widthPx, thicknessPx, type, flipped, color) {
    switch (type) {
      case 'double':  return this.buildDoubleDoor(widthPx, thicknessPx, flipped, color);
      case 'sliding': return this.buildSlidingDoor(widthPx, thicknessPx, flipped, color);
      default:        return this.buildSingleDoor(widthPx, thicknessPx, flipped, color);
    }
  }

  /**
   * Single hinged door: wall gap + 90° swing arc on one side.
   * The arc indicates which direction the door opens.
   */
  buildSingleDoor(widthPx, thicknessPx, flipped, color) {
    const halfW = widthPx / 2;
    const halfH = thicknessPx / 2;
    const sign = flipped ? -1 : 1;

    const objects = [];

    // Background rect to mask the wall
    objects.push(new fabric.Rect({
      left: -halfW,
      top: -halfH,
      width: widthPx,
      height: thicknessPx,
      fill: '#1a1a2e',
      stroke: 'transparent',
      strokeWidth: 0,
    }));

    // Door leaf line (the door panel itself, from hinge to tip)
    // Hinge is at -halfW, door swings perpendicular
    const hingeX = -halfW;
    const tipX = -halfW;
    const tipY = sign * widthPx;
    objects.push(new fabric.Line([hingeX, 0, tipX, tipY], {
      stroke: color,
      strokeWidth: 1.5,
    }));

    // Arc path (quarter circle from door-closed to door-open position)
    const arcRadius = widthPx;
    const arcPath = this.buildArcPath(hingeX, 0, arcRadius, flipped, false);
    objects.push(new fabric.Path(arcPath, {
      fill: 'transparent',
      stroke: color,
      strokeWidth: 1,
      strokeDashArray: [3, 2],
    }));

    // End caps (wall cuts)
    objects.push(new fabric.Line([-halfW, -halfH, -halfW, halfH], {
      stroke: color, strokeWidth: 1,
    }));
    objects.push(new fabric.Line([halfW, -halfH, halfW, halfH], {
      stroke: color, strokeWidth: 1,
    }));

    return new fabric.Group(objects, {
      originX: 'center',
      originY: 'center',
    });
  }

  /**
   * Double door: two leaves opening from center outward.
   */
  buildDoubleDoor(widthPx, thicknessPx, flipped, color) {
    const halfW = widthPx / 2;
    const halfH = thicknessPx / 2;
    const sign = flipped ? -1 : 1;
    const leafLen = widthPx / 2;

    const objects = [];

    // Background rect to mask the wall
    objects.push(new fabric.Rect({
      left: -halfW,
      top: -halfH,
      width: widthPx,
      height: thicknessPx,
      fill: '#1a1a2e',
      stroke: 'transparent',
      strokeWidth: 0,
    }));

    // Left leaf (hinge at -halfW, opens to sign side)
    objects.push(new fabric.Line([-halfW, 0, -halfW, sign * leafLen], {
      stroke: color, strokeWidth: 1.5,
    }));
    const arcLeft = this.buildArcPath(-halfW, 0, leafLen, flipped, false);
    objects.push(new fabric.Path(arcLeft, {
      fill: 'transparent',
      stroke: color,
      strokeWidth: 1,
      strokeDashArray: [3, 2],
    }));

    // Right leaf (hinge at +halfW, opens to sign side)
    objects.push(new fabric.Line([halfW, 0, halfW, sign * leafLen], {
      stroke: color, strokeWidth: 1.5,
    }));
    const arcRight = this.buildArcPath(halfW, 0, leafLen, flipped, true);
    objects.push(new fabric.Path(arcRight, {
      fill: 'transparent',
      stroke: color,
      strokeWidth: 1,
      strokeDashArray: [3, 2],
    }));

    // Center divider
    objects.push(new fabric.Line([0, -halfH, 0, halfH], {
      stroke: color, strokeWidth: 0.5,
    }));

    // End caps
    objects.push(new fabric.Line([-halfW, -halfH, -halfW, halfH], {
      stroke: color, strokeWidth: 1,
    }));
    objects.push(new fabric.Line([halfW, -halfH, halfW, halfH], {
      stroke: color, strokeWidth: 1,
    }));

    return new fabric.Group(objects, {
      originX: 'center',
      originY: 'center',
    });
  }

  /**
   * Sliding door: door panel slides along the wall.
   * Shown as a rectangle with an arrow indicating slide direction.
   */
  buildSlidingDoor(widthPx, thicknessPx, flipped, color) {
    const halfW = widthPx / 2;
    const halfH = thicknessPx / 2;
    const sign = flipped ? -1 : 1;

    const objects = [];

    // Background rect to mask the wall
    objects.push(new fabric.Rect({
      left: -halfW,
      top: -halfH,
      width: widthPx,
      height: thicknessPx,
      fill: '#1a1a2e',
      stroke: 'transparent',
      strokeWidth: 0,
    }));

    // Door panel (thinner rect, offset to one side)
    const panelH = thicknessPx * 0.4;
    const panelY = sign * (halfH - panelH / 2);
    objects.push(new fabric.Rect({
      left: -halfW,
      top: panelY - panelH / 2,
      width: widthPx,
      height: panelH,
      fill: 'transparent',
      stroke: color,
      strokeWidth: 1.5,
    }));

    // Arrow showing slide direction (points right)
    const arrowY = panelY;
    const arrowLen = widthPx * 0.5;
    const arrowStart = -arrowLen / 2;
    const arrowEnd = arrowLen / 2;
    const arrowHeadSize = Math.min(widthPx * 0.1, 6);

    objects.push(new fabric.Line([arrowStart, arrowY, arrowEnd, arrowY], {
      stroke: color, strokeWidth: 1,
    }));
    objects.push(new fabric.Line(
      [arrowEnd - arrowHeadSize, arrowY - arrowHeadSize, arrowEnd, arrowY],
      { stroke: color, strokeWidth: 1 }
    ));
    objects.push(new fabric.Line(
      [arrowEnd - arrowHeadSize, arrowY + arrowHeadSize, arrowEnd, arrowY],
      { stroke: color, strokeWidth: 1 }
    ));

    // Track lines (top and bottom rails)
    objects.push(new fabric.Line([-halfW, -halfH, halfW, -halfH], {
      stroke: color, strokeWidth: 0.8,
    }));
    objects.push(new fabric.Line([-halfW, halfH, halfW, halfH], {
      stroke: color, strokeWidth: 0.8,
    }));

    // End caps
    objects.push(new fabric.Line([-halfW, -halfH, -halfW, halfH], {
      stroke: color, strokeWidth: 1,
    }));
    objects.push(new fabric.Line([halfW, -halfH, halfW, halfH], {
      stroke: color, strokeWidth: 1,
    }));

    return new fabric.Group(objects, {
      originX: 'center',
      originY: 'center',
    });
  }

  /**
   * Build an SVG arc path for a quarter-circle door swing.
   * @param {number} cx - Hinge x
   * @param {number} cy - Hinge y
   * @param {number} r  - Door leaf length (= arc radius)
   * @param {boolean} flipped - Which side of wall
   * @param {boolean} mirrorX - Mirror the arc for right-side hinge (double door)
   */
  buildArcPath(cx, cy, r, flipped, mirrorX) {
    const sign = flipped ? -1 : 1;
    const dir = mirrorX ? -1 : 1;

    // Start: door perpendicular to wall (pointing to sign side)
    const startX = cx;
    const startY = cy + sign * r;
    // End: door parallel to wall (pointing along wall in dir direction)
    const endX = cx + dir * r;
    const endY = cy;

    // Sweep flag depends on flipped and mirrorX
    const sweep = (flipped === mirrorX) ? 0 : 1;

    return `M ${startX} ${startY} A ${r} ${r} 0 0 ${sweep} ${endX} ${endY}`;
  }

  clearPreview() {
    if (this.previewDoor) {
      this.app.canvas.remove(this.previewDoor);
      this.previewDoor = null;
      this.app.canvas.renderAll();
    }
  }

  cancel() {
    this.clearPreview();
  }
}
