/**
 * connect_four_renderer.js — 4D Connect Four Canvas Renderer
 *
 * Extends BaseRenderer to project Quadray positions to 2D,
 * draw tetrahedral/octahedral cell shapes with parity coloring,
 * ghost-piece previews, drop animations, win-line glow, particle
 * effects, depth-based alpha, and IVM grid wireframe.
 *
 * Uses all BaseRenderer methods:
 *   _project(), _drawAxes(), _clearCanvas(), _drawHUD(),
 *   _drawCircle(), _drawDiamond()
 * Plus: GridUtils.depthSort(), Quadray.cellType(), Quadray.toString()
 *
 * @module ConnectFourRenderer
 */

class ConnectFourRenderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 45,
            cameraDist: 600,
            rotX: 0.4,
            rotY: 0.6,
            bgColor: '#070725',
        });
        this.cellRadius = 12;
        this.projectedColumns = [];
        this.hoverColumn = null;        // { b, c, d } for ghost preview
        this.animationTime = 0;
        this.glowPhase = 0;

        // Drop animation queue
        this.dropAnimations = [];       // { b, c, d, landingRow, player, cellType, startTime, duration }

        // Particle system for landing effects
        this.particles = [];            // { x, y, vx, vy, life, maxLife, color, size }

        console.log('[ConnectFourRenderer] Initialized with drop animations, particles, and win-line glow');
    }

    /**
     * Queue a drop animation for a piece.
     * @param {number} b
     * @param {number} c
     * @param {number} d
     * @param {number} landingRow
     * @param {number} player
     * @param {string} cellType
     */
    addDropAnimation(b, c, d, landingRow, player, cellType) {
        this.dropAnimations.push({
            b, c, d, landingRow, player, cellType,
            startTime: this.animationTime,
            duration: 0.4 + landingRow * 0.08, // Higher drops take longer
            currentRow: this.board.height - 1,  // Start from top
        });
    }

    /**
     * Spawn landing particles at screen position.
     * @param {number} x - Screen X
     * @param {number} y - Screen Y
     * @param {string} color
     */
    _spawnParticles(x, y, color) {
        const count = 12;
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const speed = 1.5 + Math.random() * 3;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                life: 1.0,
                maxLife: 0.5 + Math.random() * 0.3,
                color,
                size: 2 + Math.random() * 3,
            });
        }
    }

    /**
     * Update and draw active particles.
     */
    _updateParticles() {
        const { ctx } = this;
        const dt = 0.03;

        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15; // gravity
            p.life -= dt / p.maxLife;
            if (p.life <= 0) return false;

            ctx.save();
            ctx.globalAlpha = p.life * 0.8;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            return true;
        });
    }

    /**
     * Main render loop — uses BaseRenderer infrastructure.
     */
    render() {
        this._clearCanvas();
        this._drawAxes();

        this.animationTime += 0.03;
        this.glowPhase = (Math.sin(this.animationTime * 3) + 1) / 2;

        this._drawGridWireframe();
        this._drawColumnHighlight();
        this._drawColumnSlots();
        this._drawGhostPiece();
        this._drawPlacedPieces();
        this._drawDropAnimations();
        this._drawWinLine();
        this._updateParticles();
        this._drawBoardHUD();
    }

    /**
     * Draw IVM grid wireframe connecting slot positions.
     * Shows the tetrahedral structure along all 4 axes.
     */
    _drawGridWireframe() {
        const { ctx } = this;

        for (let b = 0; b < this.board.width; b++) {
            for (let c = 0; c < this.board.depthC; c++) {
                for (let d = 0; d < this.board.depthD; d++) {
                    for (let a = 0; a < this.board.height; a++) {
                        const p1 = this._project(a, b, c, d);
                        // Depth-based line alpha
                        const depthAlpha = Math.max(0.03, 0.12 * (p1.scale || 1));

                        ctx.strokeStyle = `rgba(71, 85, 105, ${depthAlpha})`;
                        ctx.lineWidth = 0.5;

                        // A axis (vertical)
                        if (a + 1 < this.board.height) {
                            const p2 = this._project(a + 1, b, c, d);
                            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                        }
                        // B axis
                        if (b + 1 < this.board.width) {
                            const p2 = this._project(a, b + 1, c, d);
                            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                        }
                        // C axis
                        if (c + 1 < this.board.depthC) {
                            const p2 = this._project(a, b, c + 1, d);
                            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                        }
                        // D axis
                        if (d + 1 < this.board.depthD) {
                            const p2 = this._project(a, b, c, d + 1);
                            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
                        }
                    }
                }
            }
        }
    }

    /**
     * Draw a glowing column highlight over the hovered column.
     */
    _drawColumnHighlight() {
        if (!this.hoverColumn || this.board.gameOver) return;
        const { ctx } = this;
        const { b, c, d } = this.hoverColumn;

        const playerColor = this.board.currentPlayer === 1
            ? 'rgba(239, 68, 68, 0.06)'
            : 'rgba(251, 191, 36, 0.06)';

        // Draw a translucent strip over the full column height
        for (let a = 0; a < this.board.height; a++) {
            const p = this._project(a, b, c, d);
            const r = this.cellRadius * (p.scale || 1) * 1.8;
            ctx.save();
            ctx.fillStyle = playerColor;
            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    /**
     * Draw column slot indicators (empty positions).
     * Uses _drawDiamond() for tetra cells, circles for octa cells.
     * Depth-based alpha for better 3D perception.
     */
    _drawColumnSlots() {
        this.projectedColumns = [];
        const cols = this.board.getColumns();

        for (const col of cols) {
            for (let a = 0; a < this.board.height; a++) {
                const p = this._project(a, col.b, col.c, col.d);
                const r = this.cellRadius * (p.scale || 1);
                const parity = Quadray.cellType(a, col.b, col.c, col.d);
                const depthAlpha = Math.max(0.1, (p.scale || 1));

                if (parity === 'tetra') {
                    this._drawDiamond(p.x, p.y, r * 0.8,
                        `rgba(30, 41, 59, ${0.25 * depthAlpha})`,
                        `rgba(71, 85, 105, ${0.2 * depthAlpha})`);
                } else {
                    this.ctx.fillStyle = `rgba(30, 41, 59, ${0.2 * depthAlpha})`;
                    this.ctx.strokeStyle = `rgba(71, 85, 105, ${0.15 * depthAlpha})`;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.stroke();
                }
            }
            // Store top position for hit testing
            const topP = this._project(this.board.height - 1, col.b, col.c, col.d);
            this.projectedColumns.push({
                ...col, px: topP.x, py: topP.y, pScale: topP.scale
            });
        }
    }

    /**
     * Draw ghost piece preview at the hover column.
     */
    _drawGhostPiece() {
        if (!this.hoverColumn || this.board.gameOver) return;
        const { b, c, d } = this.hoverColumn;

        // Find the landing row
        let landingRow = -1;
        for (let a = 0; a < this.board.height; a++) {
            const pos = Quadray.toIVM(new Quadray(a, b, c, d));
            if (!this.board.grid.has(pos.toKey())) {
                landingRow = a;
                break;
            }
        }
        if (landingRow === -1) return;

        const p = this._project(landingRow, b, c, d);
        const r = this.cellRadius * (p.scale || 1);
        const color = this.board.currentPlayer === 1 ? 'rgba(239, 68, 68, 0.35)' : 'rgba(251, 191, 36, 0.35)';
        const parity = Quadray.cellType(landingRow, b, c, d);

        this.ctx.save();
        this.ctx.globalAlpha = 0.5 + this.glowPhase * 0.3;
        if (parity === 'tetra') {
            this._drawDiamond(p.x, p.y, r * 0.9, color);
        } else {
            this._drawCircle(p.x, p.y, r, color);
        }
        this.ctx.restore();

        // Draw coordinate label
        this.ctx.save();
        this.ctx.font = '10px monospace';
        this.ctx.fillStyle = 'rgba(148, 163, 184, 0.6)';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`(${landingRow},${b},${c},${d})`, p.x, p.y + r + 14);
        this.ctx.restore();
    }

    /**
     * Draw active drop animations (pieces falling from top).
     */
    _drawDropAnimations() {
        const { ctx } = this;

        this.dropAnimations = this.dropAnimations.filter(anim => {
            const elapsed = this.animationTime - anim.startTime;
            const t = Math.min(1, elapsed / anim.duration);

            // Ease-out bounce
            const eased = t < 0.8
                ? 1 - Math.pow(1 - (t / 0.8), 3)
                : 1 + Math.sin((t - 0.8) * Math.PI * 5) * 0.03 * (1 - t);

            const currentA = this.board.height - 1 - (this.board.height - 1 - anim.landingRow) * eased;
            const p = this._project(currentA, anim.b, anim.c, anim.d);
            const r = this.cellRadius * (p.scale || 1);
            const color = anim.player === 1 ? '#ef4444' : '#fbbf24';

            ctx.save();
            ctx.globalAlpha = 0.9;
            ctx.shadowColor = color;
            ctx.shadowBlur = 8;
            if (anim.cellType === 'tetra') {
                this._drawDiamond(p.x, p.y, r, color);
            } else {
                this._drawCircle(p.x, p.y, r, color);
            }
            ctx.restore();

            // Animation complete — spawn particles
            if (t >= 1) {
                const landP = this._project(anim.landingRow, anim.b, anim.c, anim.d);
                this._spawnParticles(landP.x, landP.y, color);
                return false;
            }
            return true;
        });
    }

    /**
     * Draw all placed pieces with depth sorting.
     * Uses GridUtils.depthSort() for proper back-to-front order.
     * Tetra cells → diamond shape, Octa cells → circle shape.
     * Depth-based alpha for 3D perception.
     */
    _drawPlacedPieces() {
        const cells = this.board.getCells();
        if (cells.length === 0) return;

        // Use GridUtils.depthSort() for rendering order
        const sorted = GridUtils.depthSort(cells, (a, b, c, d) => this._project(a, b, c, d));

        for (const cell of sorted) {
            const r = this.cellRadius * (cell.pScale || 1);
            if (r < 1) continue;

            const depthAlpha = Math.max(0.4, Math.min(1, (cell.pScale || 1) * 1.2));

            this.ctx.save();
            this.ctx.globalAlpha = depthAlpha;

            // Win glow animation
            if (cell.isWinCell) {
                this.ctx.shadowColor = cell.color;
                this.ctx.shadowBlur = 10 + this.glowPhase * 15;
                this.ctx.globalAlpha = 1;
                const pulseR = r * (1 + this.glowPhase * 0.15);
                this._drawPieceShape(cell.px, cell.py, pulseR, cell);
            } else {
                this._drawPieceShape(cell.px, cell.py, r, cell);
            }

            // Outline
            this.ctx.strokeStyle = `rgba(255,255,255,${0.25 * depthAlpha})`;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            this.ctx.restore();

            // Move number label (small, on piece)
            if (cell.moveNum && r > 6) {
                this.ctx.save();
                this.ctx.font = `${Math.max(7, r * 0.7)}px monospace`;
                this.ctx.fillStyle = `rgba(0,0,0,${0.5 * depthAlpha})`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(cell.moveNum, cell.px, cell.py);
                this.ctx.restore();
            }
        }
    }

    /**
     * Draw a glowing line connecting the 4 winning pieces.
     */
    _drawWinLine() {
        if (this.board.winLine.length < 4) return;
        const { ctx } = this;

        // Project win line positions
        const points = this.board.winLine.map(q => {
            const p = this._project(q.a, q.b, q.c, q.d);
            return { x: p.x, y: p.y };
        });

        // Sort by x to draw in order
        points.sort((a, b) => a.x - b.x);

        const winColor = this.board.winner === 1 ? '#ef4444' : '#fbbf24';

        // Outer glow line
        ctx.save();
        ctx.strokeStyle = winColor;
        ctx.lineWidth = 4 + this.glowPhase * 3;
        ctx.shadowColor = winColor;
        ctx.shadowBlur = 15 + this.glowPhase * 10;
        ctx.globalAlpha = 0.5 + this.glowPhase * 0.3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        ctx.restore();

        // Inner bright line
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.4 + this.glowPhase * 0.3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        ctx.restore();
    }

    /**
     * Draw a piece with shape based on cellType parity.
     * @param {number} x
     * @param {number} y
     * @param {number} r
     * @param {Object} cell
     */
    _drawPieceShape(x, y, r, cell) {
        if (cell.cellType === 'tetra') {
            // Diamond shape for tetrahedral cells
            this._drawDiamond(x, y, r, cell.color);
        } else {
            // Circle for octahedral cells
            this._drawCircle(x, y, r, cell.color);
        }
    }

    /**
     * Draw HUD overlay on the canvas using BaseRenderer._drawHUD().
     */
    _drawBoardHUD() {
        const meta = this.board.getMetadata();
        const status = meta.gameOver
            ? (meta.winner > 0 ? `Player ${meta.winner} wins!` : 'Draw!')
            : `Player ${meta.currentPlayer}'s turn`;

        const lines = [
            `${status} | Move: ${meta.moveCount}`,
            `Tetra: ${meta.tetraCount} | Octa: ${meta.octaCount}`,
            `Vol T:O:C=${meta.volumeRatios.tetra}:${meta.volumeRatios.octa}:${meta.volumeRatios.cubo}`,
        ];
        this._drawHUD(lines, { color: 'rgba(148, 163, 184, 0.7)', fontSize: 11 });
    }

    /**
     * Hit-test a screen coordinate against projected columns.
     * @param {number} sx - Screen X
     * @param {number} sy - Screen Y
     * @returns {{ b: number, c: number, d: number }|null}
     */
    hitTest(sx, sy) {
        let closest = null;
        let minDist = Infinity;
        for (const col of this.projectedColumns) {
            if (col.full) continue;
            const dx = col.px - sx, dy = col.py - sy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const r = this.cellRadius * (col.pScale || 1) * 2.5;
            if (dist < r && dist < minDist) {
                minDist = dist;
                closest = { b: col.b, c: col.c, d: col.d };
            }
        }
        return closest;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConnectFourRenderer };
}
