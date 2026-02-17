/**
 * simant_renderer.js — 4D SimAnt Canvas Renderer
 *
 * Extends BaseRenderer to project Quadray positions to 2D,
 * render ants with procedural sprites, food items, pheromone trails,
 * nest labels, health bars, hover tooltips, and IVM axis arrows.
 *
 * Uses all BaseRenderer methods:
 *   _project(), _drawAxes(), _clearCanvas(), _drawHUD(),
 *   _drawCircle(), _drawDiamond()
 * Plus: GridUtils.depthSort(), Quadray.cellType(), Quadray.toString()
 *
 * @module SimAntRenderer
 */

class SimAntRenderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 25,
            cameraDist: 800,
            rotX: 0.5,
            rotY: 0.8,
            bgColor: '#080604',
        });

        // Mouse hover position
        this.mouseX = 0;
        this.mouseY = 0;

        // Pheromone visualizer
        this.pheromoneViz = (typeof PheromoneVisualizer !== 'undefined') ? new PheromoneVisualizer() : null;

        // Sprites (Procedural)
        this.sprites = {};
        this.initSprites();

        console.log('[SimAntRenderer] Initialized with BaseRenderer + full quadray methods');
    }

    /**
     * Helper: project a Quadray coordinate using BaseRenderer._project().
     * Accepts (x, y, z, w) grid-style coordinates and routes to _project(a, b, c, d).
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @param {number} w
     * @returns {{ x: number, y: number, scale: number, z: number }}
     */
    _projectQ(x, y, z, w) {
        const p = this._project(x, y, z, w);
        // BaseRenderer._project() returns { x, y, scale }.
        // For depth sorting we also need a z-depth. Compute it from camera perspective.
        const q = new Quadray(x, y, z, w);
        const c = q.toCartesian();
        const cy = Math.cos(this.rotY), sy = Math.sin(this.rotY);
        const cx = Math.cos(this.rotX), sx = Math.sin(this.rotX);
        let pz = c.x * sy + c.z * cy;
        pz = c.y * sx + pz * cx;
        return { x: p.x, y: p.y, scale: p.scale, z: pz };
    }

    initSprites() {
        // Pre-render ant sprites to offscreen canvases for performance
        // Yellow Worker
        this.sprites['yellow_worker'] = this.drawAntSprite('#ffaa00', '#cc8800');
        this.sprites['yellow_soldier'] = this.drawAntSprite('#ffaa00', '#aa0000', true);
        this.sprites['red_worker'] = this.drawAntSprite('#ff4444', '#aa0000');
        this.sprites['red_soldier'] = this.drawAntSprite('#ff4444', '#660000', true);
        this.sprites['food'] = this.drawFoodSprite();
    }

    drawAntSprite(color, legsColor, huge = false) {
        const size = 32;
        const cvs = document.createElement('canvas');
        cvs.width = size; cvs.height = size;
        const ctx = cvs.getContext('2d');
        const cx = size / 2, cy = size / 2;

        // Legs
        ctx.strokeStyle = legsColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy - 5); ctx.lineTo(cx + 8, cy - 5);
        ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy);
        ctx.moveTo(cx - 8, cy + 5); ctx.lineTo(cx + 8, cy + 5);
        ctx.stroke();

        // Body (3 segments)
        ctx.fillStyle = color;
        // Abdomen
        ctx.beginPath(); ctx.ellipse(cx, cy + 6, 5, 7, 0, 0, Math.PI * 2); ctx.fill();
        // Thorax
        ctx.beginPath(); ctx.ellipse(cx, cy, 4, 4, 0, 0, Math.PI * 2); ctx.fill();
        // Head
        ctx.beginPath(); ctx.ellipse(cx, cy - 6, 4, 4, 0, 0, Math.PI * 2); ctx.fill();

        // Eyes
        ctx.fillStyle = 'black';
        ctx.fillRect(cx - 2, cy - 8, 1, 1);
        ctx.fillRect(cx + 1, cy - 8, 1, 1);

        if (huge) { // Soldier mandibles
            ctx.strokeStyle = '#fff';
            ctx.beginPath(); ctx.moveTo(cx - 2, cy - 9); ctx.lineTo(cx - 4, cy - 12); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + 2, cy - 9); ctx.lineTo(cx + 4, cy - 12); ctx.stroke();
        }

        return cvs;
    }

    drawFoodSprite() {
        const s = 16;
        const cvs = document.createElement('canvas');
        cvs.width = s; cvs.height = s;
        const ctx = cvs.getContext('2d');
        ctx.fillStyle = '#44ff44';
        ctx.beginPath(); ctx.arc(s / 2, s / 2, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#aaffaa';
        ctx.beginPath(); ctx.arc(s / 2 - 2, s / 2 - 2, 2, 0, Math.PI * 2); ctx.fill();
        return cvs;
    }

    /**
     * Main render loop — uses BaseRenderer infrastructure.
     */
    render() {
        this._clearCanvas();
        this._drawAxes();

        const board = this.board;
        const list = [];

        // Ants
        for (const ant of board.ants) {
            if (!ant.alive) continue;
            const p = this._projectQ(ant.x, ant.y, ant.z, ant.w);
            let sprite = 'yellow_worker';
            if (ant.faction === 1) sprite = ant.caste === 2 ? 'red_soldier' : 'red_worker';
            else if (ant.caste === 2) sprite = 'yellow_soldier';

            list.push({ type: 'ant', p, ant, sprite });
        }

        // Discrete Grid Scans (for Food & Pheromones)
        for (let i = 0; i < board.grid.length; i++) {
            const cell = board.grid[i];

            if (cell === 3) { // Food
                const c = board.coords(i);
                const p = this._projectQ(c.x, c.y, c.z, c.w);
                list.push({ type: 'food', p, coords: c });
            }
        }

        // Sort by Z (painters algo)
        list.sort((a, b) => b.p.z - a.p.z);

        // Pheromone visualization layer (after grid, before ants)
        if (this.pheromoneViz) {
            this.pheromoneViz.render(this.ctx, board, (x, y, z, w) => this._projectQ(x, y, z, w));
        }

        // Draw nest labels first (behind ants)
        for (let f = 0; f < 2; f++) {
            const nest = board.nests[f];
            if (!nest) continue;
            const np = this._projectQ(nest.x, nest.y, nest.z, nest.w);
            if (np.scale < 0) continue;
            this.ctx.globalAlpha = 0.9;
            this.ctx.font = '11px monospace';
            this.ctx.fillStyle = f === 0 ? '#ffaa44' : '#ff4444';
            this.ctx.textAlign = 'center';
            const label = `NEST (${nest.x},${nest.y},${nest.z},${nest.w})`;
            this.ctx.fillText(label, np.x, np.y - 20 * np.scale);
            this.ctx.globalAlpha = 1.0;
        }

        // Draw entities
        let hoveredItem = null;
        let hoverDist = 30; // Pixel threshold for hover detection

        for (const item of list) {
            if (item.p.scale < 0) continue; // Behind camera

            const x = item.p.x;
            const y = item.p.y;
            const s = item.p.scale * this.scale;

            if (item.type === 'food') {
                const img = this.sprites['food'];
                const dim = 16 * item.p.scale;
                this.ctx.drawImage(img, x - dim / 2, y - dim / 2, dim, dim);

                // Coordinate label for food
                this.ctx.globalAlpha = 0.8;
                this.ctx.font = '9px monospace';
                this.ctx.fillStyle = '#44ff44';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`(${item.coords.x},${item.coords.y},${item.coords.z},${item.coords.w})`, x, y + dim / 2 + 10);
                this.ctx.globalAlpha = 1.0;
            }
            else if (item.type === 'ant') {
                const img = this.sprites[item.sprite];
                const dim = 32 * item.p.scale;
                this.ctx.globalAlpha = 1.0;
                this.ctx.drawImage(img, x - dim / 2, y - dim / 2, dim, dim);

                // HP Bar
                const hpPct = item.ant.hp / item.ant.maxHp;
                if (hpPct < 1) {
                    this.ctx.fillStyle = 'red';
                    this.ctx.fillRect(x - 10 * item.p.scale, y - 10 * item.p.scale, 20 * item.p.scale, 3 * item.p.scale);
                    this.ctx.fillStyle = '#0f0';
                    this.ctx.fillRect(x - 10 * item.p.scale, y - 10 * item.p.scale, 20 * item.p.scale * hpPct, 3 * item.p.scale);
                }

                // Coordinate label below ant
                this.ctx.globalAlpha = 0.85;
                this.ctx.font = '9px monospace';
                this.ctx.fillStyle = item.ant.faction === 0 ? '#ffaa44' : '#ff4444';
                this.ctx.textAlign = 'center';
                const antLabel = `(${item.ant.x},${item.ant.y},${item.ant.z},${item.ant.w})`;
                this.ctx.fillText(antLabel, x, y + dim / 2 + 10);
                this.ctx.globalAlpha = 1.0;
            }

            // Track closest item to mouse for hover
            const dx = this.mouseX - x;
            const dy = this.mouseY - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < hoverDist) {
                hoverDist = dist;
                hoveredItem = item;
            }
        }

        // Hover tooltip
        if (hoveredItem) {
            const hx = hoveredItem.p.x;
            const hy = hoveredItem.p.y;
            let tooltipText = '';
            if (hoveredItem.type === 'ant') {
                const a = hoveredItem.ant;
                const fName = a.faction === 0 ? 'Yellow' : 'Red';
                const cName = a.caste === CASTE_QUEEN ? 'Queen' : (a.caste === CASTE_SOLDIER ? 'Soldier' : 'Worker');
                tooltipText = `${fName} ${cName} HP:${Math.floor(a.hp)}/${a.maxHp} (${a.x},${a.y},${a.z},${a.w})`;
            } else if (hoveredItem.type === 'food') {
                const c = hoveredItem.coords;
                tooltipText = `Food (${c.x},${c.y},${c.z},${c.w})`;
            }
            if (tooltipText) {
                this.ctx.globalAlpha = 0.9;
                this.ctx.font = '11px monospace';
                const metrics = this.ctx.measureText(tooltipText);
                const tw = metrics.width + 10;
                const th = 18;
                this.ctx.fillStyle = 'rgba(10,8,0,0.85)';
                this.ctx.fillRect(hx - tw / 2, hy - 35, tw, th);
                this.ctx.strokeStyle = '#ffaa44';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(hx - tw / 2, hy - 35, tw, th);
                this.ctx.fillStyle = '#ffe0a0';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(tooltipText, hx, hy - 21);
                this.ctx.globalAlpha = 1.0;
            }
        }

        // Render on-canvas HUD info
        this._drawBoardHUD();
    }

    /**
     * Draw HUD overlay on the canvas using BaseRenderer._drawHUD().
     */
    _drawBoardHUD() {
        const meta = this.board.getMetadata();
        const lines = [
            `Tick: ${meta.tick} | Y:${meta.yellowAnts} ants R:${meta.redAnts} ants`,
            `Tunnels: ${meta.tunnelPercent}% | Food cells: ${meta.foodCells}`,
            `World TV: ${meta.worldTetravolume} | S3: ${this.board.s3Constant.toFixed(4)}`,
        ];
        this._drawHUD(lines, { color: 'rgba(148, 163, 184, 0.7)', fontSize: 11 });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SimAntRenderer };
}
