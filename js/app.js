import { Grid } from './core/grid.js';
import { ZoomPan } from './core/zoom-pan.js';
import { History } from './core/history.js';
import { ExportManager } from './core/export.js';
import { KeyboardManager } from './core/keyboard.js';
import { WallRenderer } from './core/wall-renderer.js';
import { SelectTool } from './tools/select-tool.js';
import { WallTool } from './tools/wall-tool.js';
import { ShapeTool } from './tools/shape-tool.js';
import { TextTool, DimensionTool } from './tools/text-tool.js';
import { WindowTool } from './tools/window-tool.js';
import { Toolbar } from './ui/toolbar.js';
import { LeftPanel } from './ui/left-panel.js';
import { RightPanel } from './ui/right-panel.js';
import { PropertiesPanel } from './ui/properties.js';

class FloorPlanApp {
  constructor() {
    // Settings
    this.scale = 0.15; // px per mm
    this.gridSize = 100; // mm
    this.snapEnabled = true;
    this.wallThickness = 150; // mm
    this.wallColor = '#444444';
    this.activeTool = 'select';

    this.initCanvas();
    this.initModules();
    this.initTools();
    this.initUI();

    // Initial state
    this.grid.draw();
    this.history.init();
    this.setTool('select');

    // Save state after object modifications and rebuild wall visuals
    this.canvas.on('object:modified', (e) => {
      if (e.target && e.target.isWall) {
        // Update the attached dimension label position
        const wallTool = this.tools.wall;
        if (wallTool && wallTool.updateWallLabel) {
          wallTool.updateWallLabel(e.target);
        }
        this.rebuildWalls();
      }
      this.history.saveState();
    });

    // Keep wall labels positioned when walls are moved, scaled, or rotated
    const updateLabelOnChange = (e) => {
      if (e.target && e.target.isWall) {
        const wallTool = this.tools.wall;
        if (wallTool && wallTool.updateWallLabel) {
          wallTool.updateWallLabel(e.target);
        }
      }
    };
    this.canvas.on('object:moving', updateLabelOnChange);
    this.canvas.on('object:scaling', updateLabelOnChange);
    this.canvas.on('object:rotating', updateLabelOnChange);

    // Rebuild walls when an object is removed
    this.canvas.on('object:removed', (e) => {
      if (e.target && e.target.isWall) {
        // Defer so the removal completes first
        setTimeout(() => this.rebuildWalls(), 0);
      }
    });
  }

  initCanvas() {
    const container = document.getElementById('canvas-container');
    const canvasEl = document.getElementById('floor-canvas');

    // Set canvas size to container
    canvasEl.width = container.clientWidth;
    canvasEl.height = container.clientHeight;

    this.canvas = new fabric.Canvas('floor-canvas', {
      backgroundColor: '#1a1a2e',
      selection: true,
      preserveObjectStacking: true,
    });

    // Resize observer
    const ro = new ResizeObserver(() => {
      this.canvas.setDimensions({
        width: container.clientWidth,
        height: container.clientHeight,
      });
      this.grid.draw();
    });
    ro.observe(container);
  }

  initModules() {
    this.grid = new Grid(this);
    this.zoomPan = new ZoomPan(this);
    this.history = new History(this);
    this.exportManager = new ExportManager(this);
    this.keyboard = new KeyboardManager(this);
    this.wallRenderer = new WallRenderer(this);
  }

  initTools() {
    this.tools = {
      select: new SelectTool(this),
      wall: new WallTool(this),
      rect: new ShapeTool(this),
      circle: new ShapeTool(this),
      line: new ShapeTool(this),
      text: new TextTool(this),
      window: new WindowTool(this),
      dimension: new DimensionTool(this),
    };
  }

  initUI() {
    this.toolbar = new Toolbar(this);
    this.leftPanel = new LeftPanel(this);
    this.rightPanel = new RightPanel(this);
    this.propertiesPanel = new PropertiesPanel(this);
  }

  setTool(name) {
    // Deactivate current tool
    const currentTool = this.tools[this.activeTool];
    if (currentTool && currentTool.deactivate) {
      currentTool.deactivate();
    }

    this.activeTool = name;

    // Activate new tool
    const newTool = this.tools[name];
    if (newTool) {
      if (name === 'rect') newTool.activate('rect');
      else if (name === 'circle') newTool.activate('circle');
      else if (name === 'line') newTool.activate('line');
      else if (newTool.activate) newTool.activate();
    }

    // Update UI
    this.toolbar.updateActiveButton(name);
    this.leftPanel.showSettings(name);
  }

  cancelCurrentTool() {
    const tool = this.tools[this.activeTool];
    if (tool && tool.cancel) {
      tool.cancel();
    }
  }

  rebuildWalls() {
    this.wallRenderer.rebuild();
  }

  updateZoomDisplay() {
    const zoom = this.canvas.getZoom();
    document.getElementById('zoom-level').textContent = Math.round(zoom * 100) + '%';
    this.updateLabelScales();
  }

  /**
   * Adjust wall dimension label font size so they always appear the same
   * screen size regardless of zoom level.
   */
  updateLabelScales() {
    const zoom = this.canvas.getZoom();
    const baseFontSize = 12;   // desired screen-pixels size
    const scaledSize = baseFontSize / zoom;

    this.canvas.forEachObject(obj => {
      if (obj.customType === 'wallDimension') {
        obj.set({ fontSize: scaledSize });
        obj.setCoords();
      }
    });

    // Also update label offsets so they stay just outside the wall
    const wallTool = this.tools && this.tools.wall;
    if (wallTool) {
      this.canvas.forEachObject(obj => {
        if (obj.isWall && obj.dimLabel) {
          wallTool.updateWallLabel(obj);
        }
      });
    }

    // Refresh endpoint handles if a wall is selected (rescale to new zoom)
    const selectTool = this.tools && this.tools.select;
    if (selectTool && selectTool.endpointHandles.length > 0) {
      const active = this.canvas.getActiveObject();
      if (active && active.isWall) {
        selectTool.clearEndpointHandles();
        selectTool.showEndpointHandles(active);
      }
    }

    this.canvas.requestRenderAll();
  }
}

// Initialize - modules are deferred so DOM is already ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.app = new FloorPlanApp();
  });
} else {
  window.app = new FloorPlanApp();
}
