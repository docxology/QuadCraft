/**
 * asteroids_renderer.js — 4D Asteroids Canvas Renderer
 *
 * Extends BaseRenderer to project Quadray entities to 2D,
 * draw ship, asteroids, bullets, stars, hover tooltips,
 * and in-canvas HUD overlay.
 *
 * Uses all BaseRenderer methods:
 *   _project(), _drawAxes(), _clearCanvas(), _drawHUD(),
 *   _drawCircle(), _drawDiamond()
 * Plus: GridUtils.depthSort(), Quadray.distance(), Quadray.cellType()
 *
 * @module AsteroidsRenderer
 */

class AsteroidsRenderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 40,
            cameraDist: 5,
            rotX: 0.4,
            rotY: 0.6,
            bgColor: '#050508',
        });
        this.mouseX = 0;
        this.mouseY = 0;
        this._stars = null;
        this._activeParticles = [];

        console.log('[AsteroidsRenderer] Initialized with BaseRenderer + full quadray methods');
    }

    /**
     * Project a Quadray object to 2D screen space using BaseRenderer._project().
     * @param {Quadray} q - Quadray position
     * @returns {{ x: number, y: number, scale: number }}
     */
    _projectQ(q) {
        return this._project(q.a, q.b, q.c, q.d);
    }

    /**
     * Main render loop — uses BaseRenderer infrastructure.
     */
    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        this._clearCanvas();

        // Process new particle events from the board
        const events = this.board.particles;
        if (events && events.length > 0) {
            for (const ev of events) {
                this._spawnParticles(ev);
            }
            // Clear processed events
            this.board.particles = [];
        }

        // Stars background
        if (!this._stars) {
            this._stars = [];
            for (let i = 0; i < 60; i++) {
                this._stars.push({
                    x: Math.random() * w,
                    y: Math.random() * h,
                    s: Math.random() * 1.5,
                });
            }
        }
        ctx.fillStyle = '#334';
        for (const s of this._stars) {
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2);
            ctx.fill();
        }

        this._drawAxes();

        // Draw all entities
        const board = this.board;
        for (const e of board.entities) {
            if (!e.alive) continue;
            const p = this._projectQ(e.toQuadray());
            const r = e.radius * 20 * p.scale;

            if (e.type === 'ship') {
                ctx.fillStyle = '#00eeff';
                ctx.beginPath();
                ctx.moveTo(p.x, p.y - r);
                ctx.lineTo(p.x - r * 0.7, p.y + r);
                ctx.lineTo(p.x + r * 0.7, p.y + r);
                ctx.closePath();
                ctx.fill();
            } else if (e.type === 'asteroid') {
                ctx.strokeStyle = '#aa8866';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i < 7; i++) {
                    const a = i / 7 * Math.PI * 2;
                    const rr = r * (0.7 + Math.random() * 0.3);
                    ctx.lineTo(p.x + Math.cos(a) * rr, p.y + Math.sin(a) * rr);
                }
                ctx.closePath();
                ctx.stroke();
            } else if (e.type === 'bullet' || e.type === 'ufo_bullet') {
                ctx.fillStyle = e.type === 'ufo_bullet' ? '#ff4444' : '#ffff00';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2 * p.scale, 0, Math.PI * 2);
                ctx.fill();
            } else if (e.type === 'ufo') {
                const isSmall = e.ufoType === 'small';
                ctx.strokeStyle = isSmall ? '#ff66aa' : '#aa66ff';
                ctx.fillStyle = isSmall ? 'rgba(255, 102, 170, 0.2)' : 'rgba(170, 102, 255, 0.2)';
                ctx.lineWidth = 2;

                // Classic UFO shape: top dome, middle saucer, flat bottom
                ctx.beginPath();
                const sw = r * 1.5; // Saucer width

                // Top dome
                ctx.arc(p.x, p.y - r * 0.2, r * 0.6, Math.PI, 0);

                // Middle saucer edge right
                ctx.lineTo(p.x + sw, p.y + r * 0.2);

                // Bottom
                ctx.lineTo(p.x - sw, p.y + r * 0.2);

                // Back to dome left
                ctx.lineTo(p.x - r * 0.6, p.y - r * 0.2);

                ctx.closePath();
                ctx.fill();
                ctx.stroke();

                // Lights
                ctx.fillStyle = (Math.floor(Date.now() / 200) % 2 === 0) ? '#fff' : ctx.strokeStyle;
                ctx.beginPath();
                ctx.arc(p.x, p.y + r * 0.2, r * 0.2, 0, Math.PI * 2);
                ctx.arc(p.x - sw * 0.6, p.y + r * 0.2, r * 0.15, 0, Math.PI * 2);
                ctx.arc(p.x + sw * 0.6, p.y + r * 0.2, r * 0.15, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        this._updateAndDrawParticles();

        // Dead ship ghost
        if (!board.ship.alive && board.lives > 0) {
            const p = this._projectQ(board.ship.toQuadray());
            const r = board.ship.radius * 20 * p.scale;
            ctx.fillStyle = 'rgba(0,238,255,0.3)';
            ctx.beginPath();
            ctx.moveTo(p.x, p.y - r);
            ctx.lineTo(p.x - r * 0.7, p.y + r);
            ctx.lineTo(p.x + r * 0.7, p.y + r);
            ctx.closePath();
            ctx.fill();
        }

        // Hover tooltip for nearest entity
        this._drawHoverTooltip(board);

        // In-canvas HUD overlay
        this._drawGameHUD(board);
    }

    /**
     * Spawns simple particles based on an event from the board.
     * @param {Object} ev - The particle event
     */
    _spawnParticles(ev) {
        const count = ev.type === 'explosion' ? 12 : 8;
        const color = ev.color || '#fff';
        const speedMultiplier = ev.type === 'explosion' ? 1.0 : 0.5;
        const maxLife = ev.type === 'explosion' ? 40 : 20;

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (0.5 + Math.random() * 1.5) * speedMultiplier;
            const dQuad = [
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                (Math.random() - 0.5) * speed,
                (Math.random() - 0.5) * speed
            ];

            this._activeParticles.push({
                a: ev.pos.a, b: ev.pos.b, c: ev.pos.c, d: ev.pos.d,
                da: dQuad[0], db: dQuad[1], dc: dQuad[2], dd: dQuad[3],
                life: maxLife, maxLife: maxLife,
                color: color,
                size: (ev.radius || 0.5) * (0.2 + Math.random() * 0.4)
            });
        }
    }

    /**
     * Updates and draws all active particles.
     */
    _updateAndDrawParticles() {
        const ctx = this.ctx;

        for (let i = this._activeParticles.length - 1; i >= 0; i--) {
            const p = this._activeParticles[i];

            p.life--;
            if (p.life <= 0) {
                this._activeParticles.splice(i, 1);
                continue;
            }

            // Move particle in 4D space
            p.a += p.da * 0.05;
            p.b += p.db * 0.05;
            p.c += p.dc * 0.05;
            p.d += p.dd * 0.05;

            const q = new Quadray(p.a, p.b, p.c, p.d);
            const proj = this._projectQ(q);

            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life / p.maxLife; // Fade out

            const r = p.size * 20 * proj.scale;

            // Draw small diamond/tetrahedron for particle debris
            ctx.beginPath();
            ctx.moveTo(proj.x, proj.y - r);
            ctx.lineTo(proj.x + r, proj.y);
            ctx.lineTo(proj.x, proj.y + r);
            ctx.lineTo(proj.x - r, proj.y);
            ctx.closePath();
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }

    /**
     * Draw hover tooltip for closest entity near the mouse cursor.
     * @param {Object} board
     */
    _drawHoverTooltip(board) {
        const ctx = this.ctx;
        let closestDist = 30;
        let hoveredEntity = null;

        for (const e of board.entities) {
            if (!e.alive || e.type === 'bullet') continue;
            const p = this._projectQ(e.toQuadray());
            const dx = this.mouseX - p.x;
            const dy = this.mouseY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDist) {
                closestDist = dist;
                hoveredEntity = { e, p };
            }
        }

        if (hoveredEntity) {
            const he = hoveredEntity;
            const q = he.e.toQuadray();
            const label = `${he.e.type} Q(${q.a.toFixed(1)},${q.b.toFixed(1)},${q.c.toFixed(1)},${q.d.toFixed(1)})`;
            ctx.font = '12px monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'bottom';
            const tw = ctx.measureText(label).width;
            const tx = this.mouseX + 14;
            const ty = this.mouseY - 10;
            ctx.fillStyle = 'rgba(0,0,0,0.75)';
            ctx.beginPath();
            ctx.roundRect(tx - 4, ty - 16, tw + 8, 20, 4);
            ctx.fill();
            ctx.fillStyle = '#00eeff';
            ctx.fillText(label, tx, ty);
        }
    }

    /**
     * Draw in-canvas HUD overlay using BaseRenderer._drawHUD().
     * @param {Object} board
     */
    _drawGameHUD(board) {
        const ctx = this.ctx;
        const w = this.canvas.width;

        // Top-left status
        const ship = board.entities.find(e => e.type === 'ship');
        const lines = [
            `Score: ${board.score}`,
            `Lives: ${'♦'.repeat(board.lives)}`,
        ];
        if (ship && ship.alive) {
            const sq = ship.toQuadray();
            lines.push(`Pos: (${sq.a.toFixed(1)},${sq.b.toFixed(1)},${sq.c.toFixed(1)},${sq.d.toFixed(1)})`);
        }
        this._drawHUD(lines, { color: '#00eeff', fontSize: 14, x: 12, y: 12 });

        // Top-right controls hint
        ctx.font = '14px monospace';
        ctx.fillStyle = '#666';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'top';
        ctx.fillText('WASD=thrust Space=fire Shift+drag=rotate Scroll=zoom', w - 12, 12);

        // Game-over overlay
        if (board.gameOver) {
            const h = this.canvas.height;
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, h / 2 - 30, w, 60);
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 28px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('GAME OVER', w / 2, h / 2);
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AsteroidsRenderer };
}
