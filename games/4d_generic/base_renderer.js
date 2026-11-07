/**
 * base_renderer.js — Base Renderer for QuadCraft 4D Games
 *
 * Provides the common rendering infrastructure shared by all game renderers:
 *   - Canvas/context setup with configurable scale, rotation, camera distance
 *   - Quadray-to-2D projection via projectQuadray (with linear fallback)
 *   - Axis drawing via drawQuadrayAxes
 *   - Canvas clearing with configurable background
 *   - Multi-line HUD text rendering
 *   - Depth-sorted cell rendering pipeline
 *
 * Subclass and override render() and game-specific drawing methods.
 *
 * Usage:
 *   class MyRenderer extends BaseRenderer {
 *       constructor(canvas, board) {
 *           super(canvas, board, { scale: 40, cameraDist: 5 });
 *       }
 *       render() {
 *           this._clearCanvas();
 *           this._drawAxes();
 *           // ... game-specific drawing ...
 *       }
 *   }
 *
 * @module BaseRenderer
 */

class BaseRenderer {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {Object} board — Board instance.
     * @param {Object} [opts]
     * @param {number} [opts.scale=35] — Base projection scale.
     * @param {number} [opts.cameraDist=5] — Camera distance for perspective.
     * @param {number} [opts.rotX=0.5] — Initial X rotation.
     * @param {number} [opts.rotY=0.7] — Initial Y rotation.
     * @param {string} [opts.bgColor='#0f172a'] — Background fill color.
     * @param {string} [opts.fontFamily='monospace'] — HUD font family.
     */
    constructor(canvas, board, opts = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.board = board;

        this.scale = opts.scale ?? 35;
        this.cameraDist = opts.cameraDist ?? 5;
        this.rotX = opts.rotX ?? 0.5;
        this.rotY = opts.rotY ?? 0.7;
        this.bgColor = opts.bgColor ?? '#0f172a';
        this.fontFamily = opts.fontFamily ?? 'monospace';
    }

    /**
     * Fit physical coordinate extents, not raw board labels. A bounding sphere
     * keeps the entire board in front of the perspective camera at any rotation.
     * Call after configuring the renderer, with the board's full playable extent.
     */
    fitToPoints(points, padding = 32) {
        const positions = points.map(q => new Quadray(q.a, q.b, q.c, q.d).toCartesian());
        if (positions.length === 0) throw new RangeError('Camera fit requires points');
        const min = { x: Infinity, y: Infinity, z: Infinity };
        const max = { x: -Infinity, y: -Infinity, z: -Infinity };
        for (const p of positions) {
            for (const axis of ['x', 'y', 'z']) {
                if (!Number.isFinite(p[axis])) throw new RangeError('Camera fit requires finite coordinates');
                min[axis] = Math.min(min[axis], p[axis]);
                max[axis] = Math.max(max[axis], p[axis]);
            }
        }
        this.target = {
            x: (min.x + max.x) / 2,
            y: (min.y + max.y) / 2,
            z: (min.z + max.z) / 2,
        };
        let radius = 0;
        for (const p of positions) {
            radius = Math.max(radius, Math.hypot(
                p.x - this.target.x, p.y - this.target.y, p.z - this.target.z));
        }
        this.cameraDist = Math.max(this.cameraDist, radius * 2, 1);
        if (radius > 0) {
            const projectedRadius = radius * this.cameraDist / (this.cameraDist - radius);
            const available = Math.min(this.canvas.width, this.canvas.height) / 2 - padding;
            if (available <= 0) throw new RangeError('Canvas is too small for camera padding');
            this.scale = Math.min(this.scale, available / projectedRadius);
        }
    }

    /**
     * Project a Quadray coordinate (a, b, c, d) to 2D screen space.
     * Uses the global projectQuadray function if available, otherwise
     * falls back to a simple linear projection.
     *
     * @param {number} a
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @returns {{ x: number, y: number, scale: number }}
     */
    _project(a, b, c, d) {
        if (typeof projectQuadray === 'function' && typeof Quadray !== 'undefined') {
            return projectQuadray(new Quadray(a, b, c, d), {
                rotX: this.rotX, rotY: this.rotY,
                scale: this.scale, cameraDist: this.cameraDist,
                centerX: this.canvas.width / 2,
                centerY: this.canvas.height / 2,
                target: this.target,
            });
        }
        // Linear fallback — simple 2D mapping
        const x = this.canvas.width / 2 + (b - c) * this.scale;
        const y = this.canvas.height / 2 - (a - d) * this.scale * 0.6;
        return { x, y, scale: 1 };
    }

    /**
     * Draw Quadray basis axes on the canvas.
     * Uses the global drawQuadrayAxes function if available.
     */
    _drawAxes() {
        if (typeof drawQuadrayAxes === 'function') {
            drawQuadrayAxes(this.ctx, {
                rotX: this.rotX, rotY: this.rotY,
                scale: this.scale, cameraDist: this.cameraDist,
                centerX: this.canvas.width / 2,
                centerY: this.canvas.height / 2,
                target: this.target,
            });
        }
    }

    /**
     * Clear the canvas with the configured background color.
     * @param {string} [color] — Override background color.
     */
    _clearCanvas(color) {
        const ctx = this.ctx;
        ctx.fillStyle = color || this.bgColor;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Draw a multi-line HUD overlay.
     * @param {string[]} lines — Text lines to display.
     * @param {Object} [opts]
     * @param {string} [opts.color='#94a3b8']
     * @param {number} [opts.fontSize=13]
     * @param {string} [opts.align='left']
     * @param {number} [opts.x=14] — X position.
     * @param {number} [opts.y] — Y start position (default: canvas.height - lines.length * 20 - 10).
     */
    _drawHUD(lines, opts = {}) {
        const ctx = this.ctx;
        const fontSize = opts.fontSize ?? 13;
        const color = opts.color ?? '#94a3b8';
        const x = opts.x ?? 14;
        const lineHeight = fontSize + 6;
        const y = opts.y ?? (this.canvas.height - lines.length * lineHeight - 10);

        ctx.font = `${fontSize}px ${this.fontFamily}`;
        ctx.fillStyle = color;
        ctx.textAlign = opts.align ?? 'left';

        for (let i = 0; i < lines.length; i++) {
            ctx.fillText(lines[i], x, y + i * lineHeight);
        }
    }

    /**
     * Draw a filled circle at screen coordinates.
     * @param {number} x
     * @param {number} y
     * @param {number} radius
     * @param {string} color
     */
    _drawCircle(x, y, radius, color) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
    }

    /**
     * Draw a diamond (rotated square) at screen coordinates.
     * Used for IVM cell rendering.
     * @param {number} x — Center X.
     * @param {number} y — Center Y.
     * @param {number} size — Half-width.
     * @param {string} fillColor
     * @param {string} [strokeColor]
     */
    _drawDiamond(x, y, size, fillColor, strokeColor) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
        ctx.fillStyle = fillColor;
        ctx.fill();
        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    /**
     * Override this in subclasses to implement game-specific rendering.
     */
    render() {
        this._clearCanvas();
        this._drawAxes();
        // Subclasses implement the rest
    }
}

// Dual export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BaseRenderer };
}
