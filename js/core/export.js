export class ExportManager {
  constructor(app) {
    this.app = app;
  }

  prepareForExport() {
    this.app.grid.clear();
    this.app.canvas.discardActiveObject();
    this.app.canvas.renderAll();
  }

  restoreAfterExport() {
    this.app.grid.draw();
  }

  exportPNG() {
    this.prepareForExport();
    const canvas = this.app.canvas;
    const dataURL = canvas.toDataURL({
      format: 'png',
      multiplier: 2,
    });
    this.restoreAfterExport();
    const link = document.createElement('a');
    link.download = 'floorplan.png';
    link.href = dataURL;
    link.click();
  }

  exportJPG() {
    this.prepareForExport();
    const canvas = this.app.canvas;
    // Add white background for JPG
    const bgRect = new fabric.Rect({
      left: 0,
      top: 0,
      width: canvas.width,
      height: canvas.height,
      fill: '#ffffff',
      selectable: false,
      evented: false,
    });
    canvas.add(bgRect);
    canvas.sendToBack(bgRect);
    canvas.renderAll();

    const dataURL = canvas.toDataURL({
      format: 'jpeg',
      quality: 0.95,
      multiplier: 2,
    });

    canvas.remove(bgRect);
    this.restoreAfterExport();

    const link = document.createElement('a');
    link.download = 'floorplan.jpg';
    link.href = dataURL;
    link.click();
  }

  exportSVG() {
    this.prepareForExport();
    const canvas = this.app.canvas;
    const svg = canvas.toSVG();
    this.restoreAfterExport();

    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    saveAs(blob, 'floorplan.svg');
  }

  saveProject() {
    const canvas = this.app.canvas;
    this.app.grid.clear();
    const json = canvas.toJSON(['wallData', 'furnitureType', 'furnitureCategory',
      'customType', 'dimensionData', 'isWall', 'isFurniture', 'isCustomShape']);
    json.objects = json.objects.filter(o => !o.isGrid);
    // Save app settings
    json.appSettings = {
      scale: this.app.scale,
      gridSize: this.app.gridSize,
      wallThickness: this.app.wallThickness,
    };
    this.app.grid.draw();

    const blob = new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' });
    saveAs(blob, 'floorplan.floorplan');
  }

  async loadProject(file) {
    const text = await file.text();
    const json = JSON.parse(text);

    if (json.appSettings) {
      this.app.scale = json.appSettings.scale;
      this.app.gridSize = json.appSettings.gridSize;
      this.app.wallThickness = json.appSettings.wallThickness;
      document.getElementById('input-scale').value = this.app.scale;
      document.getElementById('input-grid').value = this.app.gridSize;
      document.getElementById('input-wall-thickness').value = this.app.wallThickness;
    }

    this.app.grid.clear();
    await new Promise(resolve => {
      this.app.canvas.loadFromJSON(json, () => {
        this.app.canvas.renderAll();
        resolve();
      });
    });
    this.app.grid.draw();
    this.app.history.saveState();
  }
}
