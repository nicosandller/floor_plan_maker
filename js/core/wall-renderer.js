/**
 * WallRenderer
 *
 * Finds connected wall segments, groups them into chains, and draws each
 * chain as a single thick stroke with `strokeLineJoin: 'miter'`.
 *
 * - Open chains → fabric.Polyline
 * - Closed loops → fabric.Polygon  (proper miter join at the closing corner)
 *
 * Individual wall Rect objects become invisible hit-targets (selectable but
 * visually hidden). The polyline/polygon provides the unified perimeter look.
 *
 * Call `rebuild()` after any wall is added, removed, or modified.
 */
export class WallRenderer {
  constructor(app) {
    this.app = app;
    this.visualObjects = [];    // polyline/polygon fabric objects
    this.SNAP_THRESHOLD = 3;    // px — how close endpoints must be to merge
  }

  /* ------------------------------------------------------------------ */
  /*  Public API                                                        */
  /* ------------------------------------------------------------------ */

  rebuild() {
    const canvas = this.app.canvas;

    // 1. Remove previous visuals
    this.clearVisuals();

    // 2. Collect every wall on the canvas
    const walls = canvas.getObjects().filter(o => o.isWall);
    if (walls.length === 0) return;

    const scale  = this.app.scale;
    const thickness = this.app.wallThickness * scale;

    // 3. Extract centerline segments [{wall, p1, p2}, …]
    const segments = walls.map(w => {
      const eps = this.getCenterline(w);
      return { wall: w, p1: eps[0], p2: eps[1] };
    });

    // 4. Build a node graph and find chains of connected segments
    const chains = this.findChains(segments);

    // 5. Draw each chain — use Polygon for closed loops, Polyline for open chains
    for (const chain of chains) {
      const isClosed = chain.length >= 4 &&
        Math.hypot(chain[0].x - chain[chain.length - 1].x,
                   chain[0].y - chain[chain.length - 1].y) < this.SNAP_THRESHOLD;

      let visual;
      if (isClosed) {
        // Remove the duplicate closing point — Polygon closes automatically
        const pts = chain.slice(0, -1);
        visual = new fabric.Polygon(pts, {
          fill:             'transparent',
          stroke:           this.app.wallColor,
          strokeWidth:      thickness,
          strokeLineJoin:   'miter',
          strokeMiterLimit: 20,
          selectable:       false,
          evented:          false,
          isWallVisual:     true,
          objectCaching:    false,
        });
      } else {
        visual = new fabric.Polyline(chain, {
          fill:             'transparent',
          stroke:           this.app.wallColor,
          strokeWidth:      thickness,
          strokeLineJoin:   'miter',
          strokeMiterLimit: 20,
          strokeLineCap:    'butt',
          selectable:       false,
          evented:          false,
          isWallVisual:     true,
          objectCaching:    false,
        });
      }
      canvas.add(visual);
      this.visualObjects.push(visual);
    }

    // 6. Make individual wall rects invisible but keep them selectable
    walls.forEach(w => {
      w.set({
        fill:        'transparent',
        stroke:      'transparent',
        opacity:     1,
        selectable:  true,
        evented:     true,
        hasBorders:  true,
        hasControls: true,
        borderColor: '#6c8eef',
        cornerColor: '#6c8eef',
        cornerSize:  6,
        padding:     2,   // small padding to avoid overlapping hit areas
      });
    });

    // 7. Reorder: grid → wall visuals → dimension labels → everything else
    this.reorder();
    canvas.renderAll();
  }

  clearVisuals() {
    const canvas = this.app.canvas;
    for (const obj of this.visualObjects) {
      canvas.remove(obj);
    }
    this.visualObjects = [];
  }

  /* ------------------------------------------------------------------ */
  /*  Centerline extraction                                             */
  /* ------------------------------------------------------------------ */

  getCenterline(wallObj) {
    const wd = wallObj.wallData;

    if (wd && wd.endX !== undefined) {
      // New-style wall (origin center, possibly rotated)
      const cx = wallObj.left;
      const cy = wallObj.top;
      const halfLen = (wallObj.width * (wallObj.scaleX || 1)) / 2;
      const rad = (wallObj.angle || 0) * Math.PI / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);
      return [
        { x: cx - cos * halfLen, y: cy - sin * halfLen },
        { x: cx + cos * halfLen, y: cy + sin * halfLen },
      ];
    }

    // Legacy axis-aligned wall (origin top-left)
    const l = wallObj.left;
    const t = wallObj.top;
    const w = wallObj.width  * (wallObj.scaleX || 1);
    const h = wallObj.height * (wallObj.scaleY || 1);
    if (w > h) {
      const cy = t + h / 2;
      return [{ x: l, y: cy }, { x: l + w, y: cy }];
    } else {
      const cx = l + w / 2;
      return [{ x: cx, y: t }, { x: cx, y: t + h }];
    }
  }

  /* ------------------------------------------------------------------ */
  /*  Chain-finding algorithm                                           */
  /* ------------------------------------------------------------------ */

  /**
   * Groups wall segments into chains of connected points.
   *
   * 1. Merge nearby endpoints into shared *nodes*.
   * 2. Build an adjacency graph of segments <-> nodes.
   * 3. Walk from degree-1 nodes (ends) outward, then handle cycles.
   *
   * Returns an array of chains; each chain is an array of {x, y} points.
   * Closed loops will have first point repeated at the end.
   */
  findChains(segments) {
    const T = this.SNAP_THRESHOLD;

    // --- Step 1: build node list by merging nearby endpoints ----------
    const nodes = [];  // { x, y, segRefs: [{segIdx, end}] }

    const findOrCreateNode = (pt) => {
      for (const node of nodes) {
        if (Math.hypot(node.x - pt.x, node.y - pt.y) < T) {
          return node;
        }
      }
      const node = { x: pt.x, y: pt.y, segRefs: [] };
      nodes.push(node);
      return node;
    };

    // segNodes[i] = [nodeForP1, nodeForP2]
    const segNodes = [];
    for (let i = 0; i < segments.length; i++) {
      const n1 = findOrCreateNode(segments[i].p1);
      n1.segRefs.push({ segIdx: i, end: 'p1' });

      const n2 = findOrCreateNode(segments[i].p2);
      n2.segRefs.push({ segIdx: i, end: 'p2' });

      segNodes.push([n1, n2]);
    }

    // Average node positions for merged endpoints
    for (const node of nodes) {
      if (node.segRefs.length > 1) {
        let sx = 0, sy = 0;
        for (const ref of node.segRefs) {
          const pt = segments[ref.segIdx][ref.end];
          sx += pt.x;
          sy += pt.y;
        }
        node.x = sx / node.segRefs.length;
        node.y = sy / node.segRefs.length;
      }
    }

    // --- Step 2: walk chains -----------------------------------------
    const visitedSegs = new Set();
    const chains = [];

    // Helper: given a segment index and the node we came *from*,
    //         return the node on the other end.
    const otherNode = (segIdx, fromNode) => {
      const [n0, n1] = segNodes[segIdx];
      return n0 === fromNode ? n1 : n0;
    };

    // Helper: from a node, find the next unvisited segment.
    const nextUnvisitedSeg = (node, excludeSeg) => {
      for (const ref of node.segRefs) {
        if (ref.segIdx !== excludeSeg && !visitedSegs.has(ref.segIdx)) {
          return ref.segIdx;
        }
      }
      return -1;
    };

    // Prefer to start from degree-1 nodes (chain endpoints) so we get
    // maximal chains.  Fall back to any unvisited segment for loops.
    const degree1Nodes = nodes.filter(n => n.segRefs.length === 1);
    const startQueue = [
      ...degree1Nodes,
      ...nodes.filter(n => n.segRefs.length > 2),  // branch points
      ...nodes,
    ];

    for (const startNode of startQueue) {
      for (const ref of startNode.segRefs) {
        if (visitedSegs.has(ref.segIdx)) continue;

        // Walk a chain from startNode along ref.segIdx
        const chainPoints = [{ x: startNode.x, y: startNode.y }];
        let curNode  = startNode;
        let curSeg   = ref.segIdx;

        while (curSeg >= 0) {
          visitedSegs.add(curSeg);
          const next = otherNode(curSeg, curNode);
          chainPoints.push({ x: next.x, y: next.y });

          // At a branch (degree > 2), stop — don't walk through intersections
          if (next.segRefs.length > 2) {
            break;
          }

          // If we've returned to the start node, close the loop
          if (next === startNode) {
            break;
          }

          curNode = next;
          curSeg  = nextUnvisitedSeg(next, curSeg);
        }

        if (chainPoints.length >= 2) {
          chains.push(chainPoints);
        }
      }
    }

    return chains;
  }

  /* ------------------------------------------------------------------ */
  /*  Z-order helper                                                    */
  /* ------------------------------------------------------------------ */

  reorder() {
    const canvas = this.app.canvas;

    // Send grid lines to back
    canvas.getObjects().forEach(obj => {
      if (obj.isGrid) canvas.sendToBack(obj);
    });

    // Then wall visuals just above grid
    for (const vis of this.visualObjects) {
      canvas.sendToBack(vis);
    }

    // Grid behind wall visuals
    canvas.getObjects().forEach(obj => {
      if (obj.isGrid) canvas.sendToBack(obj);
    });

    // Bring dimension labels to front so they're always visible
    canvas.getObjects().forEach(obj => {
      if (obj.customType === 'wallDimension') canvas.bringToFront(obj);
    });
  }
}
