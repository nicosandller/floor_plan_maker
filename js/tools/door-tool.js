/**
 * DoorTool: Click on a wall to place a door.
 *
 * Door types:
 *  - single:  Standard hinged door with 90-degree arc
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
    var canvas = this.app.canvas;
    canvas.selection = false;
    canvas.defaultCursor = 'crosshair';
    canvas.forEachObject(function(obj) {
      if (!obj.isGrid) {
        obj.selectable = false;
        obj.evented = false;
      }
    });

    canvas.on('mouse:down', this.onMouseDown);
    canvas.on('mouse:move', this.onMouseMove);
  }

  deactivate() {
    var canvas = this.app.canvas;
    canvas.off('mouse:down', this.onMouseDown);
    canvas.off('mouse:move', this.onMouseMove);
    this.clearPreview();
  }

  getDoorWidth() {
    var el = document.getElementById('input-door-width');
    return el ? parseInt(el.value) || 900 : 900;
  }

  onMouseMove(opt) {
    if (this.app.zoomPan.spaceDown || this.app.zoomPan.isPanning) return;

    var canvas = this.app.canvas;
    var pointer = canvas.getPointer(opt.e);
    var wall = this.findWallAt(pointer.x, pointer.y);

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
    if (opt.e && opt.e.button && opt.e.button !== 0) return;
    if (this.app.zoomPan.spaceDown || this.app.zoomPan.isPanning) return;

    var canvas = this.app.canvas;
    var pointer = canvas.getPointer(opt.e);
    var wall = this.findWallAt(pointer.x, pointer.y);

    if (!wall) return;

    this.clearPreview();
    this.placeDoor(wall, pointer);
  }

  /* ------------------------------------------------------------------ */
  /*  Wall geometry helpers                                              */
  /* ------------------------------------------------------------------ */

  findWallAt(px, py) {
    var canvas = this.app.canvas;
    var scale = this.app.scale;
    var hitThreshold = (this.app.wallThickness * scale) / 2 + 5;
    var best = null;
    var bestDist = hitThreshold;

    canvas.forEachObject(function(obj) {
      if (!obj.isWall) return;
      var dist = this.distPointToWallCenterline(px, py, obj);
      if (dist < bestDist) {
        bestDist = dist;
        best = obj;
      }
    }.bind(this));

    return best;
  }

  distPointToWallCenterline(px, py, wallObj) {
    var endpoints = this.getWallEndpoints(wallObj);
    return this.distPointToSegment(px, py, endpoints[0].x, endpoints[0].y, endpoints[1].x, endpoints[1].y);
  }

  distPointToSegment(px, py, ax, ay, bx, by) {
    var dx = bx - ax;
    var dy = by - ay;
    var lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return Math.hypot(px - ax, py - ay);
    var t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    var projX = ax + t * dx;
    var projY = ay + t * dy;
    return Math.hypot(px - projX, py - projY);
  }

  getWallEndpoints(wallObj) {
    var wd = wallObj.wallData;
    if (wd && wd.endX !== undefined) {
      var cx = wallObj.left;
      var cy = wallObj.top;
      var halfLen = (wallObj.width * (wallObj.scaleX || 1)) / 2;
      var rad = (wallObj.angle || 0) * Math.PI / 180;
      return [
        { x: cx - Math.cos(rad) * halfLen, y: cy - Math.sin(rad) * halfLen },
        { x: cx + Math.cos(rad) * halfLen, y: cy + Math.sin(rad) * halfLen },
      ];
    }
    var l = wallObj.left;
    var t = wallObj.top;
    var w = wallObj.width * (wallObj.scaleX || 1);
    var h = wallObj.height * (wallObj.scaleY || 1);
    if (w > h) {
      var midY = t + h / 2;
      return [{ x: l, y: midY }, { x: l + w, y: midY }];
    } else {
      var midX = l + w / 2;
      return [{ x: midX, y: t }, { x: midX, y: t + h }];
    }
  }

  projectOnWall(px, py, wallObj) {
    var endpoints = this.getWallEndpoints(wallObj);
    var a = endpoints[0];
    var b = endpoints[1];
    var dx = b.x - a.x;
    var dy = b.y - a.y;
    var lenSq = dx * dx + dy * dy;
    if (lenSq === 0) return { t: 0, x: a.x, y: a.y };
    var t = ((px - a.x) * dx + (py - a.y) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return { t: t, x: a.x + t * dx, y: a.y + t * dy };
  }

  /* ------------------------------------------------------------------ */
  /*  Preview & placement                                                */
  /* ------------------------------------------------------------------ */

  drawPreview(wall, pointer) {
    var canvas = this.app.canvas;
    var scale = this.app.scale;
    var doorWidthPx = this.getDoorWidth() * scale;
    var thickness = this.app.wallThickness * scale;

    var proj = this.projectOnWall(pointer.x, pointer.y, wall);
    var endpoints = this.getWallEndpoints(wall);
    var wallAngle = Math.atan2(endpoints[1].y - endpoints[0].y, endpoints[1].x - endpoints[0].x);
    var angleDeg = wallAngle * 180 / Math.PI;

    var doorGroup = this.buildDoorGraphic(doorWidthPx, thickness, this.doorType, this.flipped, '#6c8eef');
    doorGroup.set({
      left: proj.x,
      top: proj.y,
      angle: angleDeg,
      opacity: 0.7,
      selectable: false,
      evented: false,
      objectCaching: false,
    });

    this.previewDoor = doorGroup;
    canvas.add(doorGroup);
    canvas.renderAll();
  }

  placeDoor(wall, pointer) {
    var canvas = this.app.canvas;
    var scale = this.app.scale;
    var doorWidthMm = this.getDoorWidth();
    var doorWidthPx = doorWidthMm * scale;
    var thickness = this.app.wallThickness * scale;

    var proj = this.projectOnWall(pointer.x, pointer.y, wall);
    var endpoints = this.getWallEndpoints(wall);
    var wallAngle = Math.atan2(endpoints[1].y - endpoints[0].y, endpoints[1].x - endpoints[0].x);
    var angleDeg = wallAngle * 180 / Math.PI;

    var doorGroup = this.buildDoorGraphic(doorWidthPx, thickness, this.doorType, this.flipped, '#ccc');
    doorGroup.set({
      left: proj.x,
      top: proj.y,
      angle: angleDeg,
      isDoor: true,
      customType: 'door-on-wall',
      objectCaching: false,
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
    if (type === 'double') return this.buildDoubleDoor(widthPx, thicknessPx, flipped, color);
    if (type === 'sliding') return this.buildSlidingDoor(widthPx, thicknessPx, flipped, color);
    return this.buildSingleDoor(widthPx, thicknessPx, flipped, color);
  }

  /**
   * Single hinged door: wall gap + 90-degree swing arc on one side.
   *
   * An invisible spacer rect on the opposite side of the arc keeps the
   * fabric.Group centered on the wall centerline.
   */
  buildSingleDoor(widthPx, thicknessPx, flipped, color) {
    var halfW = widthPx / 2;
    var halfH = thicknessPx / 2;
    var sign = flipped ? -1 : 1;
    var objects = [];

    // Background rect to mask the wall
    objects.push(new fabric.Rect({
      left: -halfW, top: -halfH,
      width: widthPx, height: thicknessPx,
      fill: '#1a1a2e', stroke: 'transparent', strokeWidth: 0,
    }));

    // Door leaf line (from hinge perpendicular to wall)
    var hingeX = -halfW;
    objects.push(new fabric.Line([hingeX, 0, hingeX, sign * widthPx], {
      stroke: color, strokeWidth: 2.5,
    }));

    // Arc path (quarter circle showing swing)
    objects.push(new fabric.Path(this.buildArcPath(hingeX, 0, widthPx, flipped, false), {
      fill: 'transparent', stroke: color,
      strokeWidth: 1.5, strokeDashArray: [4, 3],
      objectCaching: false,
    }));

    // End caps (wall cuts)
    objects.push(new fabric.Line([-halfW, -halfH, -halfW, halfH], { stroke: color, strokeWidth: 2 }));
    objects.push(new fabric.Line([halfW, -halfH, halfW, halfH], { stroke: color, strokeWidth: 2 }));

    // Invisible spacer on opposite side to keep group centered on wall
    objects.push(new fabric.Rect({
      left: -1, top: -sign * widthPx - 1,
      width: 2, height: 2,
      fill: 'transparent', stroke: 'transparent', opacity: 0,
    }));

    return new fabric.Group(objects, {
      originX: 'center', originY: 'center',
      objectCaching: false,
    });
  }

  /**
   * Double door: two leaves opening from center outward.
   */
  buildDoubleDoor(widthPx, thicknessPx, flipped, color) {
    var halfW = widthPx / 2;
    var halfH = thicknessPx / 2;
    var sign = flipped ? -1 : 1;
    var leafLen = widthPx / 2;
    var objects = [];

    // Background
    objects.push(new fabric.Rect({
      left: -halfW, top: -halfH,
      width: widthPx, height: thicknessPx,
      fill: '#1a1a2e', stroke: 'transparent', strokeWidth: 0,
    }));

    // Left leaf
    objects.push(new fabric.Line([-halfW, 0, -halfW, sign * leafLen], { stroke: color, strokeWidth: 2.5 }));
    objects.push(new fabric.Path(this.buildArcPath(-halfW, 0, leafLen, flipped, false), {
      fill: 'transparent', stroke: color, strokeWidth: 1.5, strokeDashArray: [4, 3], objectCaching: false,
    }));

    // Right leaf
    objects.push(new fabric.Line([halfW, 0, halfW, sign * leafLen], { stroke: color, strokeWidth: 2.5 }));
    objects.push(new fabric.Path(this.buildArcPath(halfW, 0, leafLen, flipped, true), {
      fill: 'transparent', stroke: color, strokeWidth: 1.5, strokeDashArray: [4, 3], objectCaching: false,
    }));

    // Center divider
    objects.push(new fabric.Line([0, -halfH, 0, halfH], { stroke: color, strokeWidth: 1 }));

    // End caps
    objects.push(new fabric.Line([-halfW, -halfH, -halfW, halfH], { stroke: color, strokeWidth: 2 }));
    objects.push(new fabric.Line([halfW, -halfH, halfW, halfH], { stroke: color, strokeWidth: 2 }));

    // Invisible spacer on opposite side to keep group centered on wall
    objects.push(new fabric.Rect({
      left: -1, top: -sign * leafLen - 1,
      width: 2, height: 2,
      fill: 'transparent', stroke: 'transparent', opacity: 0,
    }));

    return new fabric.Group(objects, {
      originX: 'center', originY: 'center',
      objectCaching: false,
    });
  }

  /**
   * Sliding door: panel slides along the wall with arrow indicator.
   */
  buildSlidingDoor(widthPx, thicknessPx, flipped, color) {
    var halfW = widthPx / 2;
    var halfH = thicknessPx / 2;
    var sign = flipped ? -1 : 1;
    var objects = [];

    // Background
    objects.push(new fabric.Rect({
      left: -halfW, top: -halfH,
      width: widthPx, height: thicknessPx,
      fill: '#1a1a2e', stroke: 'transparent', strokeWidth: 0,
    }));

    // Door panel (thinner rect, offset slightly to one side)
    var panelH = thicknessPx * 0.35;
    var panelOffsetY = sign * (halfH * 0.4);
    objects.push(new fabric.Rect({
      left: -halfW, top: panelOffsetY - panelH / 2,
      width: widthPx, height: panelH,
      fill: 'transparent', stroke: color, strokeWidth: 2,
    }));

    // Arrow showing slide direction
    var arrowY = panelOffsetY;
    var arrowLen = widthPx * 0.4;
    var arrowStart = -arrowLen / 2;
    var arrowEnd = arrowLen / 2;
    var headSize = Math.min(widthPx * 0.1, 8);
    objects.push(new fabric.Line([arrowStart, arrowY, arrowEnd, arrowY], { stroke: color, strokeWidth: 1.5 }));
    objects.push(new fabric.Line([arrowEnd - headSize, arrowY - headSize, arrowEnd, arrowY], { stroke: color, strokeWidth: 1.5 }));
    objects.push(new fabric.Line([arrowEnd - headSize, arrowY + headSize, arrowEnd, arrowY], { stroke: color, strokeWidth: 1.5 }));

    // Track lines (top and bottom of wall)
    objects.push(new fabric.Line([-halfW, -halfH, halfW, -halfH], { stroke: color, strokeWidth: 1.5 }));
    objects.push(new fabric.Line([-halfW, halfH, halfW, halfH], { stroke: color, strokeWidth: 1.5 }));

    // End caps
    objects.push(new fabric.Line([-halfW, -halfH, -halfW, halfH], { stroke: color, strokeWidth: 2 }));
    objects.push(new fabric.Line([halfW, -halfH, halfW, halfH], { stroke: color, strokeWidth: 2 }));

    return new fabric.Group(objects, {
      originX: 'center', originY: 'center',
      objectCaching: false,
    });
  }

  /**
   * Build an SVG arc path for a quarter-circle door swing.
   */
  buildArcPath(cx, cy, r, flipped, mirrorX) {
    var sign = flipped ? -1 : 1;
    var dir = mirrorX ? -1 : 1;

    var startX = cx;
    var startY = cy + sign * r;
    var endX = cx + dir * r;
    var endY = cy;

    var sweep = (flipped === mirrorX) ? 0 : 1;

    // Round to avoid floating-point SVG issues
    var sx = Math.round(startX * 100) / 100;
    var sy = Math.round(startY * 100) / 100;
    var ex = Math.round(endX * 100) / 100;
    var ey = Math.round(endY * 100) / 100;
    var rr = Math.round(r * 100) / 100;

    return 'M ' + sx + ' ' + sy + ' A ' + rr + ' ' + rr + ' 0 0 ' + sweep + ' ' + ex + ' ' + ey;
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
