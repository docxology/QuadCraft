/**
 * minecraft_renderer.js — 4D Minecraft Canvas Renderer
 *
 * Extends BaseRenderer to project Quadray positions to 2D,
 * draw voxel blocks with depth sorting, sky gradient,
 * axis arrows, hover tooltip, and Synergetics overlay HUD.
 *
 * Uses all BaseRenderer methods:
 *   _project(), _drawAxes(), _clearCanvas(), _drawHUD(),
 *   _drawCircle(), _drawDiamond()
 * Plus: GridUtils.depthSort(), GridUtils.parseKey(), Quadray.cellType()
 *
 * @module MinecraftRenderer
 */

class MinecraftRenderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 30,
            cameraDist: 600,
            rotX: 0.6,
            rotY: 0.8,
            bgColor: '#87CEEB',
        });
        this.mouseX = 0;
        this.mouseY = 0;
        this.hoveredBlock = null;

        // Analysis data reference — set by game controller
        this.analysis = null;

        console.log('[MinecraftRenderer] Initialized with BaseRenderer + full quadray methods');
    }

    /**
     * Project a Quadray coordinate to 2D screen space.
     * Convenience wrapper using a Quadray object.
     * @param {Quadray} q
     * @returns {{ x: number, y: number, scale: number }}
     */
    _projectQ(q) {
        return this._project(q.a, q.b, q.c, q.d);
    }

    /**
     * Main render loop — uses BaseRenderer infrastructure.
     */
    render() {
        // Sky gradient background instead of flat clear
        this._drawSkyGradient();
        this._drawAxes();

        this._drawAxisArrows();
        this._drawBlocks();
        this._drawHoverTooltip();
        this._drawSynergeticsHUD();
    }

    /**
     * Draw sky gradient background.
     */
    _drawSkyGradient() {
        const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
        const sky = ctx.createLinearGradient(0, 0, 0, h);

        // Day/night logic based on 24000 tick cycle
        const t = this.board.timeOfDay;
        let isNight = (t > 12000 && t < 23000);
        let top = isNight ? '#0a0a20' : '#1a1a3e';
        let mid = isNight ? '#12122a' : '#4a6fa5';
        let bot = isNight ? '#1a1a3e' : '#87CEEB';

        // Transition times
        if (t >= 11000 && t <= 12000) { // Sunset
            top = '#1a153e'; mid = '#b05b3a'; bot = '#ff8844';
        } else if (t >= 23000 && t <= 24000) { // Sunrise
            top = '#1a1a3e'; mid = '#7a5fa5'; bot = '#ffaa88';
        }

        sky.addColorStop(0, top);
        sky.addColorStop(0.5, mid);
        sky.addColorStop(1, bot);
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);
    }

    /**
     * Draw Quadray basis axis arrows at the origin.
     * Renders arrowheads and labels for each axis.
     */
    _drawAxisArrows() {
        const ctx = this.ctx;
        const origin = this._projectQ(new Quadray(0, 0, 0, 0));
        const basisVecs = [
            { q: new Quadray(1, 0, 0, 0), color: '#ff4444', label: 'A' },
            { q: new Quadray(0, 1, 0, 0), color: '#44ff44', label: 'B' },
            { q: new Quadray(0, 0, 1, 0), color: '#4488ff', label: 'C' },
            { q: new Quadray(0, 0, 0, 1), color: '#ffff44', label: 'D' }
        ];
        for (const axis of basisVecs) {
            const end = this._projectQ(axis.q);
            ctx.beginPath();
            ctx.moveTo(origin.x, origin.y);
            ctx.lineTo(end.x, end.y);
            ctx.strokeStyle = axis.color;
            ctx.lineWidth = 2;
            ctx.stroke();
            // Arrowhead
            const dx = end.x - origin.x, dy = end.y - origin.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 5) {
                const ux = dx / len, uy = dy / len;
                const ax1 = end.x - ux * 8 + uy * 4, ay1 = end.y - uy * 8 - ux * 4;
                const ax2 = end.x - ux * 8 - uy * 4, ay2 = end.y - uy * 8 + ux * 4;
                ctx.beginPath();
                ctx.moveTo(end.x, end.y);
                ctx.lineTo(ax1, ay1);
                ctx.lineTo(ax2, ay2);
                ctx.closePath();
                ctx.fillStyle = axis.color;
                ctx.fill();
            }
            // Label
            ctx.font = 'bold 13px monospace';
            ctx.fillStyle = axis.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const labelX = end.x + (len > 5 ? (dx / len) * 14 : 0);
            const labelY = end.y + (len > 5 ? (dy / len) * 14 : 0);
            ctx.fillText(axis.label, labelX, labelY);
        }
    }

    /**
     * Draw all placed blocks with depth sorting.
     * Uses GridUtils.depthSort() for proper back-to-front order.
     */
    _drawBlocks() {
        const ctx = this.ctx;
        const blocks = this.board.getVisibleBlocks().map(b => {
            const p = this._projectQ(b.pos);
            return { ...b, px: p.x, py: p.y, ps: p.scale };
        }).sort((a, b) => a.ps - b.ps);

        for (const b of blocks) {
            const s = 8 * b.ps;
            const col = BLOCK_COLORS[b.type];
            ctx.fillStyle = col;
            ctx.fillRect(b.px - s, b.py - s, s * 2, s * 2);
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(b.px - s, b.py - s, s * 2, s * 2);
        }

        // Hover detection
        this.hoveredBlock = null;
        let closestDist = 20;
        for (const b of blocks) {
            const dx = this.mouseX - b.px, dy = this.mouseY - b.py;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDist) {
                closestDist = dist;
                this.hoveredBlock = b;
            }
        }
    }

    /**
     * Draw coordinate tooltip near the hovered block.
     */
    _drawHoverTooltip() {
        if (!this.hoveredBlock) return;
        const ctx = this.ctx;
        const hb = this.hoveredBlock;
        const coords = hb.pos;
        const label = `(${coords.a},${coords.b},${coords.c},${coords.d})`;
        ctx.font = '13px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        const tw = ctx.measureText(label).width;
        const tx = this.mouseX + 14, ty = this.mouseY - 10;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        ctx.beginPath();
        ctx.roundRect(tx - 4, ty - 16, tw + 8, 20, 4);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, tx, ty);
    }

    /**
     * Draw Synergetics overlay HUD on canvas.
     * Shows tetravolumes, IVM fill, components, coordination, polyhedra.
     */
    _drawSynergeticsHUD() {
        const ctx = this.ctx, w = this.canvas.width;

        // Top-left basic HUD
        ctx.font = '14px monospace';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`Selected: ${BLOCK_NAMES[this.board.selectedBlock]}`, 12, 12);
        ctx.fillText(`Blocks: ${this.board.blocks.size}`, 12, 32);
        ctx.fillStyle = '#999';
        ctx.textAlign = 'right';
        ctx.fillText('1-8 select | Shift+drag rotate | Scroll zoom', w - 12, 12);

        // Synergetics overlay panel
        const a = this.analysis;
        if (!a) return;

        const px = 12, py = 58, pw = 220, lh = 16;
        const lines = [];
        lines.push(`Tetravolumes: ${a.tetravolume.totalTetravolumes.toFixed(1)}`);
        lines.push(`IVM Fill: ${(a.ivmGrid.fillRatio * 100).toFixed(1)}%`);
        lines.push(`Components: ${a.census.components}`);
        lines.push(`Avg Coord #: ${a.coordination.average.toFixed(1)}`);
        if (a.density) lines.push(`Density: ${(a.density.density * 100).toFixed(1)}%`);
        if (a.centerOfMass) {
            const q = a.centerOfMass.quadray;
            lines.push(`CoM: (${q.a.toFixed(1)},${q.b.toFixed(1)},${q.c.toFixed(1)},${q.d.toFixed(1)})`);
        }

        // Polyhedra line
        const p = a.polyhedra;
        if (p.tetrahedra > 0 || p.octahedra > 0 || p.cuboctahedra > 0) {
            lines.push(`Poly: T:${p.tetrahedra} O:${p.octahedra} C:${p.cuboctahedra}`);
        }

        // Draw panel background
        const ph = lines.length * lh + 12;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.beginPath();
        ctx.roundRect(px - 4, py - 4, pw, ph, 6);
        ctx.fill();

        // Draw text
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        for (let i = 0; i < lines.length; i++) {
            // Gold text for polyhedra line
            if (lines[i].startsWith('Poly:')) {
                ctx.fillStyle = '#FFD700';
            } else {
                ctx.fillStyle = '#d0d8ff';
            }
            ctx.fillText(lines[i], px + 4, py + 2 + i * lh);
        }
    }

    /**
     * Hit-test a screen coordinate against projected blocks.
     * @param {number} sx - Screen X
     * @param {number} sy - Screen Y
     * @returns {Object|null} Block data or null
     */
    hitTest(sx, sy) {
        const blocks = this.board.getVisibleBlocks();
        for (const b of blocks) {
            const p = this._projectQ(b.pos);
            if (Math.hypot(p.x - sx, p.y - sy) < 10 * p.scale) {
                return b;
            }
        }
        return null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MinecraftRenderer };
}
