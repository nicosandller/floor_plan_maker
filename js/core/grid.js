export class Grid {
  constructor(app) {
    this.app = app;
    this.gridLines = [];
    this.visible = true;
  }

  draw() {
    this.clear();
    if (!this.visible) return;

    const canvas = this.app.canvas;
    const vpt = canvas.viewportTransform;
    const zoom = canvas.getZoom();
    const scale = this.app.scale;
    const gridMm = this.app.gridSize;
    const gridPx = gridMm * scale;

    // Determine visible area in canvas coords
    const w = canvas.width / zoom;
    const h = canvas.height / zoom;
    const offsetX = -vpt[4] / zoom;
    const offsetY = -vpt[5] / zoom;

    // Adjust grid granularity based on zoom
    let step = gridPx;
    const minScreenStep = 15;
    while (step * zoom < minScreenStep) step *= 5;

    const startX = Math.floor(offsetX / step) * step;
    const startY = Math.floor(offsetY / step) * step;
    const endX = offsetX + w;
    const endY = offsetY + h;

    const lines = [];

    // Major grid every 5 steps
    const majorStep = step * 5;

    for (let x = startX; x <= endX; x += step) {
      const isMajor = Math.abs(x % majorStep) < 0.01;
      lines.push(new fabric.Line([x, offsetY, x, offsetY + h], {
        stroke: isMajor ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
        strokeWidth: isMajor ? 1 / zoom : 0.5 / zoom,
        selectable: false,
        evented: false,
        excludeFromExport: true,
        isGrid: true,
      }));
    }

    for (let y = startY; y <= endY; y += step) {
      const isMajor = Math.abs(y % majorStep) < 0.01;
      lines.push(new fabric.Line([offsetX, y, offsetX + w, y], {
        stroke: isMajor ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
        strokeWidth: isMajor ? 1 / zoom : 0.5 / zoom,
        selectable: false,
        evented: false,
        excludeFromExport: true,
        isGrid: true,
      }));
    }

    this.gridLines = lines;
    lines.forEach(l => canvas.add(l));
    lines.forEach(l => canvas.sendToBack(l));
  }

  clear() {
    const canvas = this.app.canvas;
    this.gridLines.forEach(l => canvas.remove(l));
    this.gridLines = [];
  }

  snapToGrid(value) {
    if (!this.app.snapEnabled) return value;
    const step = this.app.gridSize * this.app.scale;
    return Math.round(value / step) * step;
  }

  snapPoint(x, y) {
    return {
      x: this.snapToGrid(x),
      y: this.snapToGrid(y),
    };
  }

  toggle() {
    this.visible = !this.visible;
    this.draw();
  }
}
