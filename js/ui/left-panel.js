export class LeftPanel {
  constructor(app) {
    this.app = app;
    this.setup();
  }

  setup() {
    document.getElementById('input-scale').addEventListener('change', (e) => {
      const val = parseFloat(e.target.value);
      if (val > 0 && val <= 1) {
        this.app.scale = val;
        this.app.grid.draw();
      }
    });

    document.getElementById('input-grid').addEventListener('change', (e) => {
      const val = parseInt(e.target.value);
      if (val >= 10) {
        this.app.gridSize = val;
        this.app.grid.draw();
      }
    });

    document.getElementById('input-snap').addEventListener('change', (e) => {
      this.app.snapEnabled = e.target.checked;
    });

    document.getElementById('input-wall-thickness').addEventListener('change', (e) => {
      const val = parseInt(e.target.value);
      if (val >= 50 && val <= 500) {
        this.app.wallThickness = val;
      }
    });

    document.getElementById('input-wall-color').addEventListener('input', (e) => {
      this.app.wallColor = e.target.value;
    });
  }

  showSettings(toolName) {
    const wallSettings = document.querySelector('.wall-settings');
    const shapeSettings = document.querySelector('.shape-settings');
    const windowSettings = document.querySelector('.window-settings');

    wallSettings.style.display = toolName === 'wall' ? 'block' : 'none';
    shapeSettings.style.display = ['rect', 'circle', 'line'].includes(toolName) ? 'block' : 'none';
    if (windowSettings) windowSettings.style.display = toolName === 'window' ? 'block' : 'none';
  }
}
