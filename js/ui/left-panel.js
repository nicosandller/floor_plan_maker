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

    // Door settings
    const doorTypeEl = document.getElementById('input-door-type');
    if (doorTypeEl) {
      doorTypeEl.addEventListener('change', (e) => {
        const doorTool = this.app.tools.door;
        if (doorTool) doorTool.doorType = e.target.value;
      });
    }
    const flipBtn = document.getElementById('btn-flip-door');
    if (flipBtn) {
      flipBtn.addEventListener('click', () => {
        const doorTool = this.app.tools.door;
        if (doorTool) {
          doorTool.flipped = !doorTool.flipped;
          flipBtn.textContent = doorTool.flipped ? 'Flip orientation (flipped)' : 'Flip orientation';
        }
      });
    }
  }

  showSettings(toolName) {
    const wallSettings = document.querySelector('.wall-settings');
    const shapeSettings = document.querySelector('.shape-settings');
    const windowSettings = document.querySelector('.window-settings');
    const doorSettings = document.querySelector('.door-settings');

    wallSettings.style.display = toolName === 'wall' ? 'block' : 'none';
    shapeSettings.style.display = ['rect', 'circle', 'line'].includes(toolName) ? 'block' : 'none';
    if (windowSettings) windowSettings.style.display = toolName === 'window' ? 'block' : 'none';
    if (doorSettings) doorSettings.style.display = toolName === 'door' ? 'block' : 'none';
  }
}
