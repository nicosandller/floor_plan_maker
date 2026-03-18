export class PropertiesPanel {
  constructor(app) {
    this.app = app;
    this.setup();
  }

  setup() {
    const canvas = this.app.canvas;

    canvas.on('selection:created', () => this.showProperties());
    canvas.on('selection:updated', () => this.showProperties());
    canvas.on('selection:cleared', () => this.hideProperties());
    canvas.on('object:modified', () => this.showProperties());
    canvas.on('object:moving', () => this.updatePropertiesLive());
    canvas.on('object:scaling', () => this.updatePropertiesLive());
    canvas.on('object:rotating', () => this.updatePropertiesLive());

    // Input handlers
    const propIds = ['prop-x', 'prop-y', 'prop-w', 'prop-h', 'prop-angle'];
    propIds.forEach(id => {
      document.getElementById(id).addEventListener('change', () => this.applyProperties());
    });

    // Delete button
    document.getElementById('btn-delete').addEventListener('click', () => {
      this.app.keyboard.deleteSelected();
    });

    // Duplicate button
    document.getElementById('btn-duplicate').addEventListener('click', () => {
      this.app.keyboard.duplicate();
    });
  }

  showProperties() {
    const canvas = this.app.canvas;
    const active = canvas.getActiveObject();
    if (!active) return;

    const scale = this.app.scale;

    document.getElementById('props-content').style.display = 'flex';
    document.getElementById('props-hint').style.display = 'none';

    const bounds = active.getBoundingRect(true);
    document.getElementById('prop-x').value = Math.round(active.left / scale);
    document.getElementById('prop-y').value = Math.round(active.top / scale);
    document.getElementById('prop-w').value = Math.round((active.width * (active.scaleX || 1)) / scale);
    document.getElementById('prop-h').value = Math.round((active.height * (active.scaleY || 1)) / scale);
    document.getElementById('prop-angle').value = Math.round(active.angle || 0);
  }

  updatePropertiesLive() {
    this.showProperties();
  }

  hideProperties() {
    document.getElementById('props-content').style.display = 'none';
    document.getElementById('props-hint').style.display = 'block';
  }

  applyProperties() {
    const canvas = this.app.canvas;
    const active = canvas.getActiveObject();
    if (!active) return;

    const scale = this.app.scale;

    const x = parseFloat(document.getElementById('prop-x').value) * scale;
    const y = parseFloat(document.getElementById('prop-y').value) * scale;
    const w = parseFloat(document.getElementById('prop-w').value) * scale;
    const h = parseFloat(document.getElementById('prop-h').value) * scale;
    const angle = parseFloat(document.getElementById('prop-angle').value);

    active.set({
      left: x,
      top: y,
      scaleX: w / active.width,
      scaleY: h / active.height,
      angle: angle,
    });

    active.setCoords();
    canvas.renderAll();
    this.app.history.saveState();
  }
}
