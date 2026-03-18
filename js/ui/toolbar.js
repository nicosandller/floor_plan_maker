export class Toolbar {
  constructor(app) {
    this.app = app;
    this.setup();
  }

  setup() {
    // Tool buttons
    const toolButtons = document.querySelectorAll('.tool-btn');
    toolButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const toolId = btn.id.replace('tool-', '');
        this.app.setTool(toolId);
      });
    });

    // Undo/Redo
    document.getElementById('btn-undo').addEventListener('click', () => this.app.history.undo());
    document.getElementById('btn-redo').addEventListener('click', () => this.app.history.redo());

    // Zoom
    document.getElementById('btn-zoom-in').addEventListener('click', () => this.app.zoomPan.zoomIn());
    document.getElementById('btn-zoom-out').addEventListener('click', () => this.app.zoomPan.zoomOut());
    document.getElementById('btn-zoom-fit').addEventListener('click', () => this.app.zoomPan.zoomFit());

    // Export
    document.getElementById('btn-export-png').addEventListener('click', () => this.app.exportManager.exportPNG());
    document.getElementById('btn-export-jpg').addEventListener('click', () => this.app.exportManager.exportJPG());
    document.getElementById('btn-export-svg').addEventListener('click', () => this.app.exportManager.exportSVG());

    // Save/Load
    document.getElementById('btn-save').addEventListener('click', () => this.app.exportManager.saveProject());
    document.getElementById('btn-load').addEventListener('click', () => {
      document.getElementById('file-load').click();
    });
    document.getElementById('file-load').addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.app.exportManager.loadProject(e.target.files[0]);
        e.target.value = '';
      }
    });
  }

  updateActiveButton(toolName) {
    document.querySelectorAll('.tool-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.getElementById('tool-' + toolName);
    if (btn) btn.classList.add('active');
  }
}
