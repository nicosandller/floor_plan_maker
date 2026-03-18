export class ZoomPan {
  constructor(app) {
    this.app = app;
    this.isPanning = false;
    this.spaceDown = false;
    this.lastPosX = 0;
    this.lastPosY = 0;
    this.minZoom = 0.1;
    this.maxZoom = 10;
    this.setup();
  }

  setup() {
    const canvas = this.app.canvas;

    canvas.on('mouse:wheel', (opt) => {
      const e = opt.e;
      e.preventDefault();
      e.stopPropagation();

      const delta = e.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      zoom = Math.min(Math.max(zoom, this.minZoom), this.maxZoom);

      canvas.zoomToPoint({ x: e.offsetX, y: e.offsetY }, zoom);
      this.app.updateZoomDisplay();
      this.app.grid.draw();
    });

    canvas.on('mouse:down', (opt) => {
      const e = opt.e;
      if (this.spaceDown || e.button === 1) {
        this.isPanning = true;
        this.lastPosX = e.clientX;
        this.lastPosY = e.clientY;
        canvas.selection = false;
        canvas.setCursor('grabbing');
        opt.e.preventDefault();
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (this.isPanning) {
        const e = opt.e;
        const vpt = canvas.viewportTransform;
        vpt[4] += e.clientX - this.lastPosX;
        vpt[5] += e.clientY - this.lastPosY;
        canvas.requestRenderAll();
        this.lastPosX = e.clientX;
        this.lastPosY = e.clientY;
      }
    });

    canvas.on('mouse:up', () => {
      if (this.isPanning) {
        this.isPanning = false;
        canvas.selection = this.app.activeTool === 'select';
        canvas.setCursor(this.spaceDown ? 'grab' : 'default');
        this.app.grid.draw();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.repeat && !this.isInputFocused()) {
        e.preventDefault();
        this.spaceDown = true;
        canvas.setCursor('grab');
        canvas.selection = false;
        // Disable active tool temporarily
        canvas.defaultCursor = 'grab';
      }
    });

    document.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        this.spaceDown = false;
        canvas.setCursor('default');
        canvas.defaultCursor = 'default';
        if (this.app.activeTool === 'select') {
          canvas.selection = true;
        }
      }
    });
  }

  isInputFocused() {
    const el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA');
  }

  zoomIn() {
    const canvas = this.app.canvas;
    let zoom = canvas.getZoom() * 1.2;
    zoom = Math.min(zoom, this.maxZoom);
    const center = canvas.getCenter();
    canvas.zoomToPoint({ x: center.left, y: center.top }, zoom);
    this.app.updateZoomDisplay();
    this.app.grid.draw();
  }

  zoomOut() {
    const canvas = this.app.canvas;
    let zoom = canvas.getZoom() / 1.2;
    zoom = Math.max(zoom, this.minZoom);
    const center = canvas.getCenter();
    canvas.zoomToPoint({ x: center.left, y: center.top }, zoom);
    this.app.updateZoomDisplay();
    this.app.grid.draw();
  }

  zoomFit() {
    const canvas = this.app.canvas;
    canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    this.app.updateZoomDisplay();
    this.app.grid.draw();
  }
}
