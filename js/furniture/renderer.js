// Factory functions to create Fabric.js groups for each furniture type
export class FurnitureRenderer {
  constructor(scale) {
    this.scale = scale;
  }

  create(itemDef, scale) {
    const s = scale || this.scale;
    const w = itemDef.width * s;
    const h = itemDef.height * s;
    const method = this.getFactory(itemDef.id);
    const group = method.call(this, w, h, s);

    group.set({
      isFurniture: true,
      furnitureType: itemDef.id,
      furnitureCategory: itemDef.category || '',
    });

    return group;
  }

  getFactory(id) {
    const factories = {
      'dining-table': this.makeDiningTable,
      'round-table': this.makeRoundTable,
      'desk': this.makeDesk,
      'side-table': this.makeSideTable,
      'chair': this.makeChair,
      'sofa-2': this.makeSofa,
      'sofa-3': this.makeSofa,
      'armchair': this.makeArmchair,
      'counter': this.makeCounter,
      'counter-long': this.makeCounter,
      'island': this.makeIsland,
      'fridge': this.makeFridge,
      'oven-range': this.makeOven,
      'dishwasher': this.makeDishwasher,
      'washing-machine': this.makeWasher,
      'bathtub': this.makeBathtub,
      'toilet': this.makeToilet,
      'sink': this.makeSink,
      'shower': this.makeShower,
      'shoe-shelf': this.makeShelf,
      'bookshelf': this.makeShelf,
      'closet': this.makeCloset,
      'door-single': this.makeDoor,
      'door-double': this.makeDoorDouble,
      'sliding-door': this.makeSlidingDoor,
      'window': this.makeWindow,
      'stairs-straight': this.makeStairs,
      'bed-single': this.makeBed,
      'bed-double': this.makeBed,
      'bed-queen': this.makeBed,
    };
    return factories[id] || this.makeGenericRect;
  }

  // --- Tables ---
  makeDiningTable(w, h) {
    const outline = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: h, fill: '#fff', stroke: '#333', strokeWidth: 1 });
    // Chair positions indicated by small lines
    const items = [outline];
    const chairSize = Math.min(w, h) * 0.12;
    // Top and bottom chairs
    for (let i = 0; i < 3; i++) {
      const x = -w/2 + w * (i + 1) / 4;
      items.push(new fabric.Rect({ left: x - chairSize/2, top: -h/2 - chairSize - 2, width: chairSize, height: chairSize, fill: 'transparent', stroke: '#888', strokeWidth: 0.5 }));
      items.push(new fabric.Rect({ left: x - chairSize/2, top: h/2 + 2, width: chairSize, height: chairSize, fill: 'transparent', stroke: '#888', strokeWidth: 0.5 }));
    }
    return new fabric.Group(items, { originX: 'center', originY: 'center' });
  }

  makeRoundTable(w, h) {
    const r = Math.min(w, h) / 2;
    const circle = new fabric.Circle({ left: -r, top: -r, radius: r, fill: '#fff', stroke: '#333', strokeWidth: 1 });
    return new fabric.Group([circle], { originX: 'center', originY: 'center' });
  }

  makeDesk(w, h) {
    const outline = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: h, fill: '#fff', stroke: '#333', strokeWidth: 1 });
    // Drawer section
    const drawerW = w * 0.35;
    const drawer = new fabric.Rect({ left: w/2 - drawerW - w*0.05, top: -h/2 + h*0.1, width: drawerW, height: h * 0.8, fill: 'transparent', stroke: '#aaa', strokeWidth: 0.5 });
    const handle = new fabric.Line([w/2 - drawerW/2 - w*0.05 + drawerW/2 - 5, -h/2 + h*0.5, w/2 - drawerW/2 - w*0.05 + drawerW/2 + 5, -h/2 + h*0.5], { stroke: '#aaa', strokeWidth: 0.5 });
    return new fabric.Group([outline, drawer, handle], { originX: 'center', originY: 'center' });
  }

  makeSideTable(w, h) {
    const outline = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: h, fill: '#fff', stroke: '#333', strokeWidth: 1, rx: 2, ry: 2 });
    return new fabric.Group([outline], { originX: 'center', originY: 'center' });
  }

  // --- Seating ---
  makeChair(w, h) {
    const seat = new fabric.Rect({ left: -w/2, top: -h/2 + h*0.2, width: w, height: h * 0.8, fill: '#fff', stroke: '#333', strokeWidth: 1 });
    const back = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: h * 0.2, fill: '#ddd', stroke: '#333', strokeWidth: 1 });
    return new fabric.Group([seat, back], { originX: 'center', originY: 'center' });
  }

  makeSofa(w, h) {
    const base = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: h, fill: '#fff', stroke: '#333', strokeWidth: 1, rx: 3, ry: 3 });
    const backH = h * 0.25;
    const back = new fabric.Rect({ left: -w/2 + 2, top: -h/2 + 2, width: w - 4, height: backH, fill: '#eee', stroke: '#aaa', strokeWidth: 0.5, rx: 2, ry: 2 });
    // Arm rests
    const armW = w * 0.08;
    const armL = new fabric.Rect({ left: -w/2 + 2, top: -h/2 + backH + 2, width: armW, height: h - backH - 4, fill: '#eee', stroke: '#aaa', strokeWidth: 0.5, rx: 1, ry: 1 });
    const armR = new fabric.Rect({ left: w/2 - armW - 2, top: -h/2 + backH + 2, width: armW, height: h - backH - 4, fill: '#eee', stroke: '#aaa', strokeWidth: 0.5, rx: 1, ry: 1 });
    // Cushion lines
    const items = [base, back, armL, armR];
    const cushionArea = w - 2 * armW - 8;
    const numCushions = w > 150 ? 3 : 2;
    for (let i = 1; i < numCushions; i++) {
      const x = -w/2 + armW + 4 + (cushionArea * i / numCushions);
      items.push(new fabric.Line([x, -h/2 + backH + 4, x, h/2 - 4], { stroke: '#ccc', strokeWidth: 0.5 }));
    }
    return new fabric.Group(items, { originX: 'center', originY: 'center' });
  }

  makeArmchair(w, h) {
    const base = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: h, fill: '#fff', stroke: '#333', strokeWidth: 1, rx: 4, ry: 4 });
    const backH = h * 0.25;
    const back = new fabric.Rect({ left: -w/2 + 3, top: -h/2 + 3, width: w - 6, height: backH, fill: '#eee', stroke: '#aaa', strokeWidth: 0.5, rx: 2, ry: 2 });
    const armW = w * 0.15;
    const armL = new fabric.Rect({ left: -w/2 + 3, top: -h/2 + backH + 3, width: armW, height: h - backH - 6, fill: '#eee', stroke: '#aaa', strokeWidth: 0.5 });
    const armR = new fabric.Rect({ left: w/2 - armW - 3, top: -h/2 + backH + 3, width: armW, height: h - backH - 6, fill: '#eee', stroke: '#aaa', strokeWidth: 0.5 });
    return new fabric.Group([base, back, armL, armR], { originX: 'center', originY: 'center' });
  }

  // --- Counters ---
  makeCounter(w, h) {
    const outline = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: h, fill: '#f0f0f0', stroke: '#333', strokeWidth: 1 });
    const inner = new fabric.Rect({ left: -w/2 + 2, top: -h/2 + 2, width: w - 4, height: h - 4, fill: 'transparent', stroke: '#ccc', strokeWidth: 0.5 });
    return new fabric.Group([outline, inner], { originX: 'center', originY: 'center' });
  }

  makeIsland(w, h) {
    const outline = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: h, fill: '#f0f0f0', stroke: '#333', strokeWidth: 1 });
    // Subtle counter lines
    const line1 = new fabric.Line([-w/2 + w*0.33, -h/2 + 3, -w/2 + w*0.33, h/2 - 3], { stroke: '#ddd', strokeWidth: 0.5 });
    const line2 = new fabric.Line([-w/2 + w*0.66, -h/2 + 3, -w/2 + w*0.66, h/2 - 3], { stroke: '#ddd', strokeWidth: 0.5 });
    return new fabric.Group([outline, line1, line2], { originX: 'center', originY: 'center' });
  }

  // --- Appliances ---
  makeFridge(w, h) {
    const outline = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: h, fill: '#f8f8f8', stroke: '#333', strokeWidth: 1 });
    // Door split
    const splitY = -h/2 + h * 0.35;
    const split = new fabric.Line([-w/2 + 2, splitY, w/2 - 2, splitY], { stroke: '#aaa', strokeWidth: 0.5 });
    // Handle
    const handleX = w/2 - w * 0.2;
    const handle1 = new fabric.Line([handleX, -h/2 + 4, handleX, splitY - 4], { stroke: '#999', strokeWidth: 1.5 });
    const handle2 = new fabric.Line([handleX, splitY + 4, handleX, h/2 - 4], { stroke: '#999', strokeWidth: 1.5 });
    return new fabric.Group([outline, split, handle1, handle2], { originX: 'center', originY: 'center' });
  }

  makeOven(w, h) {
    const outline = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: h, fill: '#f8f8f8', stroke: '#333', strokeWidth: 1 });
    // 4 burners
    const items = [outline];
    const burnerR = Math.min(w, h) * 0.15;
    const positions = [
      [-w/4, -h/4], [w/4, -h/4],
      [-w/4, h/4], [w/4, h/4],
    ];
    for (const [cx, cy] of positions) {
      items.push(new fabric.Circle({
        left: cx - burnerR, top: cy - burnerR,
        radius: burnerR, fill: 'transparent', stroke: '#666', strokeWidth: 0.8,
      }));
      items.push(new fabric.Circle({
        left: cx - burnerR * 0.5, top: cy - burnerR * 0.5,
        radius: burnerR * 0.5, fill: 'transparent', stroke: '#999', strokeWidth: 0.5,
      }));
    }
    return new fabric.Group(items, { originX: 'center', originY: 'center' });
  }

  makeDishwasher(w, h) {
    const outline = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: h, fill: '#f8f8f8', stroke: '#333', strokeWidth: 1 });
    const inner = new fabric.Rect({ left: -w/2 + 3, top: -h/2 + 3, width: w - 6, height: h - 6, fill: 'transparent', stroke: '#ccc', strokeWidth: 0.5, rx: 2, ry: 2 });
    const handle = new fabric.Line([-w/4, -h/2 + h*0.15, w/4, -h/2 + h*0.15], { stroke: '#999', strokeWidth: 1.5 });
    const label = new fabric.Text('DW', { left: 0, top: 0, fontSize: Math.min(w, h) * 0.2, fill: '#bbb', fontFamily: 'sans-serif', originX: 'center', originY: 'center' });
    return new fabric.Group([outline, inner, handle, label], { originX: 'center', originY: 'center' });
  }

  makeWasher(w, h) {
    const outline = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: h, fill: '#f8f8f8', stroke: '#333', strokeWidth: 1 });
    const drumR = Math.min(w, h) * 0.32;
    const drum = new fabric.Circle({ left: -drumR, top: -drumR + h*0.05, radius: drumR, fill: 'transparent', stroke: '#888', strokeWidth: 1 });
    const innerDrum = new fabric.Circle({ left: -drumR*0.7, top: -drumR*0.7 + h*0.05, radius: drumR * 0.7, fill: 'transparent', stroke: '#bbb', strokeWidth: 0.5 });
    // Control panel area at top
    const panel = new fabric.Rect({ left: -w/2 + 3, top: -h/2 + 3, width: w - 6, height: h * 0.15, fill: '#eee', stroke: '#ccc', strokeWidth: 0.5 });
    return new fabric.Group([outline, panel, drum, innerDrum], { originX: 'center', originY: 'center' });
  }

  // --- Bathroom ---
  makeBathtub(w, h) {
    const outer = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: h, fill: '#f0f8ff', stroke: '#333', strokeWidth: 1, rx: 8, ry: 8 });
    const inner = new fabric.Rect({ left: -w/2 + 4, top: -h/2 + 4, width: w - 8, height: h - 8, fill: '#e8f4ff', stroke: '#aac', strokeWidth: 0.5, rx: 6, ry: 6 });
    // Drain
    const drain = new fabric.Circle({ left: w/2 - 16, top: -4, radius: 4, fill: '#ccc', stroke: '#999', strokeWidth: 0.5 });
    // Faucet
    const faucet = new fabric.Circle({ left: w/2 - 16, top: -h/2 + 8, radius: 3, fill: '#ddd', stroke: '#999', strokeWidth: 0.5 });
    return new fabric.Group([outer, inner, drain, faucet], { originX: 'center', originY: 'center' });
  }

  makeToilet(w, h) {
    // Tank (back rectangle)
    const tankH = h * 0.25;
    const tank = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: tankH, fill: '#f0f0f0', stroke: '#333', strokeWidth: 1, rx: 2, ry: 2 });
    // Bowl (ellipse)
    const bowlH = h - tankH;
    const bowl = new fabric.Ellipse({
      left: -w/2 + 2, top: -h/2 + tankH,
      rx: (w - 4) / 2, ry: bowlH / 2,
      fill: '#fff', stroke: '#333', strokeWidth: 1,
    });
    // Inner bowl
    const innerBowl = new fabric.Ellipse({
      left: -w/2 + 6, top: -h/2 + tankH + 4,
      rx: (w - 12) / 2, ry: (bowlH - 8) / 2,
      fill: '#f8f8ff', stroke: '#bbb', strokeWidth: 0.5,
    });
    return new fabric.Group([tank, bowl, innerBowl], { originX: 'center', originY: 'center' });
  }

  makeSink(w, h) {
    const outer = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: h, fill: '#f0f0f0', stroke: '#333', strokeWidth: 1 });
    const basinR = Math.min(w, h) * 0.3;
    const basin = new fabric.Circle({ left: -basinR, top: -basinR + h*0.05, radius: basinR, fill: '#e8f0ff', stroke: '#999', strokeWidth: 0.8 });
    // Faucet
    const faucet = new fabric.Circle({ left: -3, top: -h/2 + 4, radius: 3, fill: '#ccc', stroke: '#999', strokeWidth: 0.5 });
    return new fabric.Group([outer, basin, faucet], { originX: 'center', originY: 'center' });
  }

  makeShower(w, h) {
    const outer = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: h, fill: '#f0f8ff', stroke: '#333', strokeWidth: 1 });
    // Diagonal line for door
    const door = new fabric.Line([-w/2, -h/2, w/2, h/2], { stroke: '#aac', strokeWidth: 0.5, strokeDashArray: [3, 3] });
    // Drain
    const drain = new fabric.Circle({ left: -4, top: -4, radius: 4, fill: '#ddd', stroke: '#999', strokeWidth: 0.5 });
    // Shower head indicator
    const head = new fabric.Circle({ left: -w/2 + 6, top: -h/2 + 6, radius: 5, fill: '#e0e0e0', stroke: '#999', strokeWidth: 0.5 });
    return new fabric.Group([outer, door, drain, head], { originX: 'center', originY: 'center' });
  }

  // --- Shelving ---
  makeShelf(w, h) {
    const outline = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: h, fill: '#f8f0e8', stroke: '#333', strokeWidth: 1 });
    // Shelf dividers
    const items = [outline];
    const numShelves = Math.max(2, Math.floor(w / 30));
    for (let i = 1; i < numShelves; i++) {
      const x = -w/2 + (w * i / numShelves);
      items.push(new fabric.Line([x, -h/2 + 2, x, h/2 - 2], { stroke: '#dcc', strokeWidth: 0.5 }));
    }
    return new fabric.Group(items, { originX: 'center', originY: 'center' });
  }

  makeCloset(w, h) {
    const outline = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: h, fill: '#f5f0e8', stroke: '#333', strokeWidth: 1 });
    // Door split
    const split = new fabric.Line([0, -h/2 + 2, 0, h/2 - 2], { stroke: '#bbb', strokeWidth: 0.5 });
    // Handles
    const h1 = new fabric.Line([-4, -2, -4, 2], { stroke: '#999', strokeWidth: 1.5 });
    const h2 = new fabric.Line([4, -2, 4, 2], { stroke: '#999', strokeWidth: 1.5 });
    return new fabric.Group([outline, split, h1, h2], { originX: 'center', originY: 'center' });
  }

  // --- Doors ---
  makeDoor(w, h) {
    const doorWidth = w;
    // Door leaf (line)
    const leaf = new fabric.Line([0, 0, doorWidth, 0], { stroke: '#333', strokeWidth: 2 });
    // Swing arc (quarter circle)
    const arcPath = `M ${doorWidth} 0 A ${doorWidth} ${doorWidth} 0 0 1 0 ${doorWidth}`;
    const arc = new fabric.Path(arcPath, {
      fill: 'transparent',
      stroke: '#999',
      strokeWidth: 0.8,
      strokeDashArray: [3, 3],
    });
    // Wall opening line
    const opening = new fabric.Line([0, 0, 0, 2], { stroke: '#333', strokeWidth: 2 });

    const group = new fabric.Group([arc, leaf, opening], { originX: 'left', originY: 'top' });
    return group;
  }

  makeDoorDouble(w, h) {
    const halfW = w / 2;
    const leaf1 = new fabric.Line([0, 0, halfW, 0], { stroke: '#333', strokeWidth: 2 });
    const leaf2 = new fabric.Line([w, 0, halfW, 0], { stroke: '#333', strokeWidth: 2 });
    const arc1Path = `M ${halfW} 0 A ${halfW} ${halfW} 0 0 1 0 ${halfW}`;
    const arc1 = new fabric.Path(arc1Path, { fill: 'transparent', stroke: '#999', strokeWidth: 0.8, strokeDashArray: [3, 3] });
    const arc2Path = `M ${halfW} 0 A ${halfW} ${halfW} 0 0 0 ${w} ${halfW}`;
    const arc2 = new fabric.Path(arc2Path, { fill: 'transparent', stroke: '#999', strokeWidth: 0.8, strokeDashArray: [3, 3] });
    return new fabric.Group([arc1, arc2, leaf1, leaf2], { originX: 'left', originY: 'top' });
  }

  makeSlidingDoor(w, h) {
    const outline = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: h, fill: 'transparent', stroke: '#333', strokeWidth: 1 });
    // Arrow indicating slide direction
    const arrow = new fabric.Line([-w/4, 0, w/4, 0], { stroke: '#999', strokeWidth: 1 });
    const arrowHead = new fabric.Path(`M ${w/4 - 4} -3 L ${w/4} 0 L ${w/4 - 4} 3`, { fill: 'transparent', stroke: '#999', strokeWidth: 1 });
    // Center line
    const center = new fabric.Line([0, -h/2, 0, h/2], { stroke: '#999', strokeWidth: 0.5, strokeDashArray: [2, 2] });
    return new fabric.Group([outline, center, arrow, arrowHead], { originX: 'center', originY: 'center' });
  }

  makeWindow(w, h) {
    const outline = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: h, fill: '#e8f4ff', stroke: '#333', strokeWidth: 1 });
    // Glass lines
    const line1 = new fabric.Line([0, -h/2, 0, h/2], { stroke: '#aad', strokeWidth: 0.5 });
    const line2 = new fabric.Line([-w/2, 0, w/2, 0], { stroke: '#aad', strokeWidth: 0.5 });
    return new fabric.Group([outline, line1, line2], { originX: 'center', originY: 'center' });
  }

  // --- Stairs ---
  makeStairs(w, h) {
    const outline = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: h, fill: '#fff', stroke: '#333', strokeWidth: 1 });
    const items = [outline];
    // Tread lines
    const numTreads = Math.max(5, Math.floor(h / 15));
    for (let i = 1; i < numTreads; i++) {
      const y = -h/2 + (h * i / numTreads);
      items.push(new fabric.Line([-w/2 + 2, y, w/2 - 2, y], { stroke: '#ccc', strokeWidth: 0.5 }));
    }
    // Direction arrow
    const arrowY1 = h * 0.1;
    const arrowY2 = -h * 0.3;
    items.push(new fabric.Line([0, arrowY1, 0, arrowY2], { stroke: '#888', strokeWidth: 1 }));
    items.push(new fabric.Path(`M -4 ${arrowY2 + 6} L 0 ${arrowY2} L 4 ${arrowY2 + 6}`, { fill: 'transparent', stroke: '#888', strokeWidth: 1 }));
    return new fabric.Group(items, { originX: 'center', originY: 'center' });
  }

  // --- Beds ---
  makeBed(w, h) {
    const frame = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: h, fill: '#fff', stroke: '#333', strokeWidth: 1 });
    // Pillow area
    const pillowH = h * 0.15;
    const pillow = new fabric.Rect({ left: -w/2 + 4, top: -h/2 + 4, width: w - 8, height: pillowH, fill: '#f0f0f0', stroke: '#ccc', strokeWidth: 0.5, rx: 3, ry: 3 });
    // Blanket fold line
    const foldY = -h/2 + pillowH + h * 0.1;
    const fold = new fabric.Line([-w/2 + 4, foldY, w/2 - 4, foldY], { stroke: '#ddd', strokeWidth: 0.5 });
    return new fabric.Group([frame, pillow, fold], { originX: 'center', originY: 'center' });
  }

  // --- Fallback ---
  makeGenericRect(w, h) {
    const rect = new fabric.Rect({ left: -w/2, top: -h/2, width: w, height: h, fill: '#fff', stroke: '#333', strokeWidth: 1 });
    return new fabric.Group([rect], { originX: 'center', originY: 'center' });
  }
}
