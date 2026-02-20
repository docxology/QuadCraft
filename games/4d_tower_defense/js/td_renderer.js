/**
 * TDRenderer.js -- 4D Tower Defense Canvas Renderer
 *
 * Extends BaseRenderer for projection, axes, and canvas clearing.
 * Mouse-draggable 3D projection of the IVM grid with depth fog,
 * glow effects, animated particles, and placement previews.
 *
 * Uses all BaseRenderer methods:
 *   _project(), _drawAxes(), _clearCanvas(), _drawHUD(),
 *   _drawCircle(), _drawDiamond()
 * Plus: GridUtils.depthSort(), Quadray.cellType(), Quadray.distance(),
 *       Quadray.toCartesian(), Quadray.add(), Quadray.BASIS
 *
 * @module TDRenderer
 */
class TDRenderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 70,
            cameraDist: 5,
            rotX: 0.45,
            rotY: 0.65,
            bgColor: '#0c0c1a',
        });

        this.panX = 0;
        this.panY = 0;

        // Mouse interaction state
        this.mousePos = { x: -1, y: -1 };
        this.hoveredNode = null;

        // Animation counter
        this.frame = 0;

        // Pre-compute IVM grid vertices for rendering
        this._gridCache = null;
        this._gridCacheTick = -1;

        // Game reference set later by TDGame
        this.game = null;

        console.log('[TDRenderer] Initialized with BaseRenderer + full quadray projection');
    }

    /**
     * Project a Quadray to 2D screen space.
     * Uses BaseRenderer._project() for the heavy lifting, then applies pan offset.
     * Accepts either (a,b,c,d) numbers or a single Quadray object.
     * @param {Quadray|number} aOrQ
     * @param {number} [b]
     * @param {number} [c]
     * @param {number} [d]
     * @returns {{ x: number, y: number, z: number, scale: number }}
     */
    _projectQ(aOrQ, b, c, d) {
        let a;
        if (typeof aOrQ === 'object' && aOrQ !== null) {
            a = aOrQ.a; b = aOrQ.b; c = aOrQ.c; d = aOrQ.d;
        } else {
            a = aOrQ;
        }

        // Use Quadray.toCartesian() for proper IVM->Cartesian conversion
        const q = new Quadray(a, b, c, d);
        const cart = q.toCartesian();

        const cosY = Math.cos(this.rotY), sinY = Math.sin(this.rotY);
        const cosX = Math.cos(this.rotX), sinX = Math.sin(this.rotX);
        let x = cart.x * cosY - cart.z * sinY;
        let z = cart.x * sinY + cart.z * cosY;
        let y2 = cart.y * cosX - z * sinX;
        let z2 = cart.y * sinX + z * cosX;
        const p = 500 / (500 + z2);
        return {
            x: this.canvas.width / 2 + this.panX + x * this.scale * p,
            y: this.canvas.height / 2 + this.panY - y2 * this.scale * p,
            z: z2,
            scale: p
        };
    }

    // ─── Hover Detection ────────────────────────────────────────────────
    _updateHover() {
        if (this.mousePos.x < 0) { this.hoveredNode = null; return; }
        const candidates = this._getGridNodes();
        let best = 22;
        let bestQ = null;
        for (const q of candidates) {
            const p = this._projectQ(q);
            const d = Math.hypot(p.x - this.mousePos.x, p.y - this.mousePos.y);
            if (d < best) {
                best = d;
                bestQ = q;
            }
        }
        this.hoveredNode = bestQ;
    }

    // ─── Grid Node Generation ───────────────────────────────────────────
    _getGridNodes() {
        if (this._gridCacheTick === this.board.tick && this._gridCache) return this._gridCache;

        const visited = new Set();
        const nodes = [];
        for (const wp of this.board.path) {
            const key = GridUtils.key(wp.a, wp.b, wp.c, wp.d);
            if (!visited.has(key)) {
                visited.add(key);
                nodes.push(wp);
            }
            for (const basis of Quadray.BASIS) {
                const n = wp.add(basis);
                const rn = new Quadray(Math.round(n.a), Math.round(n.b), Math.round(n.c), Math.round(n.d));
                const nk = GridUtils.key(rn.a, rn.b, rn.c, rn.d);
                if (!visited.has(nk)) {
                    visited.add(nk);
                    nodes.push(rn);
                }
                // Second ring neighbors for denser grid
                for (const basis2 of Quadray.BASIS) {
                    const n2 = rn.add(basis2);
                    const rn2 = new Quadray(Math.round(n2.a), Math.round(n2.b), Math.round(n2.c), Math.round(n2.d));
                    const nk2 = GridUtils.key(rn2.a, rn2.b, rn2.c, rn2.d);
                    if (!visited.has(nk2)) {
                        visited.add(nk2);
                        nodes.push(rn2);
                    }
                }
            }
        }
        this._gridCache = nodes;
        this._gridCacheTick = this.board.tick;
        return nodes;
    }

    // ─── Format Helpers ─────────────────────────────────────────────────
    fmtQ(q) { return `(${q.a.toFixed(0)},${q.b.toFixed(0)},${q.c.toFixed(0)},${q.d.toFixed(0)})`; }
    fmtQf(q) { return `(${q.a.toFixed(1)},${q.b.toFixed(1)},${q.c.toFixed(1)},${q.d.toFixed(1)})`; }

    // ─── Main Render ────────────────────────────────────────────────────
    render() {
        this.frame++;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;

        // Background with subtle radial gradient
        const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.7);
        grad.addColorStop(0, '#0c0c1a');
        grad.addColorStop(1, '#050508');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Draw layers in order
        this._drawTDAxes();
        this._drawIVMGrid();
        this._drawPath();
        this._drawTowers();
        this._drawCreeps();
        this._drawProjectiles();
        this._drawParticles();
        this._drawHoverPreview();
        this._drawInCanvasHUD(w, h);

        if (this.board.gameOver) this._drawGameOver(w, h);
    }

    // ─── Axis Arrows ──────────────────────────────────────────────────
    _drawTDAxes() {
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
            ctx.beginPath(); ctx.moveTo(origin.x, origin.y); ctx.lineTo(end.x, end.y);
            ctx.strokeStyle = axis.color; ctx.lineWidth = 2; ctx.stroke();
            const dx = end.x - origin.x, dy = end.y - origin.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 5) {
                const ux = dx / len, uy = dy / len;
                ctx.beginPath(); ctx.moveTo(end.x, end.y);
                ctx.lineTo(end.x - ux * 8 + uy * 4, end.y - uy * 8 - ux * 4);
                ctx.lineTo(end.x - ux * 8 - uy * 4, end.y - uy * 8 + ux * 4);
                ctx.closePath(); ctx.fillStyle = axis.color; ctx.fill();
            }
            ctx.font = 'bold 13px monospace'; ctx.fillStyle = axis.color;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(axis.label, end.x + (len > 5 ? (dx / len) * 14 : 0), end.y + (len > 5 ? (dy / len) * 14 : 0));
        }
    }

    // ─── IVM Grid ───────────────────────────────────────────────────────
    _drawIVMGrid() {
        const ctx = this.ctx;
        const board = this.board;
        const nodes = this._getGridNodes();

        // Draw edges between nodes that are ~1 IVM unit apart
        ctx.lineWidth = 0.6;
        for (let i = 0; i < nodes.length; i++) {
            const p1 = this._projectQ(nodes[i]);
            for (let j = i + 1; j < nodes.length; j++) {
                const dist = Quadray.distance(nodes[i], nodes[j]);
                if (Math.abs(dist - 1.0) < 0.15) {
                    const p2 = this._projectQ(nodes[j]);
                    // Depth-based opacity - enhanced fog
                    const avgZ = (p1.z + p2.z) / 2;
                    const depthAlpha = Math.max(0.01, Math.min(0.4, 0.4 - avgZ * 0.005));
                    ctx.strokeStyle = `rgba(40, 50, 90, ${depthAlpha})`;
                    ctx.beginPath();
                    ctx.moveTo(p1.x, p1.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.stroke();
                }
            }
        }

        // Draw node dots
        for (const n of nodes) {
            const p = this._projectQ(n);
            const depthAlpha = Math.max(0.1, Math.min(0.5, 0.5 - p.z * 0.004));
            const r = 2 * p.scale;
            // Check if on path
            let onPath = false;
            for (const wp of board.path) {
                if (Quadray.distance(n, wp) < 0.1) { onPath = true; break; }
            }
            // Check if has tower
            let hasTower = false;
            for (const t of board.towers) {
                if (Quadray.distance(n, t.pos) < 0.1) { hasTower = true; break; }
            }

            if (!onPath && !hasTower) {
                // Dim dots more aggressively with depth
                const foggedAlpha = Math.max(0.02, depthAlpha - 0.1);
                ctx.fillStyle = `rgba(80, 90, 140, ${foggedAlpha})`;
                ctx.beginPath();
                ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // ─── Path ───────────────────────────────────────────────────────────
    _drawPath() {
        const ctx = this.ctx;
        const board = this.board;

        // Animated flow direction dashes
        const dashOffset = -(this.frame * 0.8) % 20;

        // Glow layer
        ctx.save();
        ctx.strokeStyle = 'rgba(68, 170, 255, 0.08)';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i < board.path.length; i++) {
            const p = this._projectQ(board.path[i]);
            i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.restore();

        // Main path line with animated dashes
        ctx.save();
        ctx.strokeStyle = 'rgba(60, 80, 140, 0.6)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.setLineDash([10, 6]);
        ctx.lineDashOffset = dashOffset;
        ctx.beginPath();
        for (let i = 0; i < board.path.length; i++) {
            const p = this._projectQ(board.path[i]);
            i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();

        // Waypoint markers
        for (let i = 0; i < board.path.length; i++) {
            const wp = board.path[i];
            const p = this._projectQ(wp);

            // Start/End markers
            if (i === 0 || i === board.path.length - 1) {
                const isStart = i === 0;
                ctx.fillStyle = isStart ? 'rgba(68, 255, 68, 0.4)' : 'rgba(255, 68, 68, 0.4)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 8 * p.scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = isStart ? '#44ff44' : '#ff4444';
                ctx.font = `bold ${11 * p.scale}px monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(isStart ? 'S' : 'E', p.x, p.y);
            } else {
                // Regular waypoint dot
                ctx.fillStyle = 'rgba(80, 110, 180, 0.5)';
                ctx.beginPath();
                ctx.arc(p.x, p.y, 3 * p.scale, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // ─── Towers ─────────────────────────────────────────────────────────
    _drawTowers() {
        const ctx = this.ctx;
        const board = this.board;
        const selectedTower = this.game ? this.game.selectedTowerInstance : null;

        for (const t of board.towers) {
            const p = this._projectQ(t.pos);
            const def = TOWER_TYPES[t.type];
            const color = def.color;
            const isSelected = (t === selectedTower);
            const pulse = Math.sin(this.frame * 0.06 + t.pulsePhase) * 0.15 + 0.85;

            // Fire flash
            if (t.fireFlash > 0) t.fireFlash--;
            const flashAlpha = t.fireFlash > 0 ? 0.3 : 0;

            // Range circle (always shown for selected, on hover for others)
            if (isSelected || (this.hoveredNode && Quadray.distance(this.hoveredNode, t.pos) < 0.1)) {
                ctx.save();
                const rangeR = t.range * this.scale * p.scale * 0.32;
                const rangeGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rangeR);
                rangeGrad.addColorStop(0, this._rgba(color, 0.03));
                rangeGrad.addColorStop(0.7, this._rgba(color, 0.06));
                rangeGrad.addColorStop(1, this._rgba(color, 0));
                ctx.fillStyle = rangeGrad;
                ctx.beginPath();
                ctx.arc(p.x, p.y, rangeR, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = this._rgba(color, 0.25);
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.restore();
            }

            // Fire flash glow
            if (flashAlpha > 0) {
                ctx.save();
                ctx.fillStyle = this._rgba(color, flashAlpha);
                ctx.beginPath();
                ctx.arc(p.x, p.y, 18 * p.scale, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            // Tower glow
            ctx.save();
            const glowR = (12 + t.level * 3) * p.scale * pulse;
            const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR);
            glow.addColorStop(0, this._rgba(color, 0.25 * pulse));
            glow.addColorStop(1, this._rgba(color, 0));
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Draw polyhedra shape
            const s = p.scale * (1 + t.level * 0.15);
            if (t.type === 'tetra') this._drawTetra(p.x, p.y, s, color);
            else if (t.type === 'octa') this._drawOcta(p.x, p.y, s, color);
            else if (t.type === 'cubo') this._drawCubo(p.x, p.y, s, color);
            else if (t.type === 'rhombic') this._drawRhombic(p.x, p.y, s, color);

            // Level indicator
            if (t.level > 0) {
                ctx.font = `bold ${8 * p.scale}px sans-serif`;
                ctx.fillStyle = color;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                ctx.fillText('\u2605'.repeat(t.level), p.x, p.y + 12 * s);
            }

            // Selected tower highlight
            if (isSelected) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.beginPath();
                ctx.arc(p.x, p.y, 16 * s, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }

    // ─── Creeps ─────────────────────────────────────────────────────────
    _drawCreeps() {
        const ctx = this.ctx;
        const board = this.board;

        for (const c of board.creeps) {
            if (!c.alive || !c.started) continue;
            const cq = board.getCreepPosition(c);
            const p = this._projectQ(cq);

            // Trail afterimages
            for (let i = 0; i < c.trail.length; i++) {
                const tq = new Quadray(c.trail[i].a, c.trail[i].b, c.trail[i].c, c.trail[i].d);
                const tp = this._projectQ(tq);
                const alpha = (i / c.trail.length) * 0.25;
                ctx.fillStyle = this._rgba(c.color, alpha);
                ctx.beginPath();
                ctx.arc(tp.x, tp.y, 3 * tp.scale, 0, Math.PI * 2);
                ctx.fill();
            }

            // Slow effect indicator
            if (c.slowTimer > 0) {
                ctx.strokeStyle = 'rgba(255, 68, 170, 0.4)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(p.x, p.y, 9 * p.scale, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Creep body -- shape based on type
            const hpRatio = c.hp / c.maxHp;
            const bodyColor = c.color;
            const bodyR = c.type === 'boss' ? 8 * p.scale : (c.type === 'armored' ? 6 * p.scale : 5 * p.scale);

            // Glow
            ctx.save();
            const cGlow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, bodyR * 2);
            cGlow.addColorStop(0, this._rgba(bodyColor, 0.15));
            cGlow.addColorStop(1, this._rgba(bodyColor, 0));
            ctx.fillStyle = cGlow;
            ctx.beginPath();
            ctx.arc(p.x, p.y, bodyR * 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // Body shape
            if (c.type === 'armored') {
                // Square for armored
                ctx.fillStyle = bodyColor;
                ctx.fillRect(p.x - bodyR * 0.7, p.y - bodyR * 0.7, bodyR * 1.4, bodyR * 1.4);
            } else if (c.type === 'fast') {
                // Diamond for fast
                ctx.fillStyle = bodyColor;
                ctx.beginPath();
                ctx.moveTo(p.x, p.y - bodyR);
                ctx.lineTo(p.x + bodyR * 0.7, p.y);
                ctx.lineTo(p.x, p.y + bodyR);
                ctx.lineTo(p.x - bodyR * 0.7, p.y);
                ctx.closePath();
                ctx.fill();
            } else if (c.type === 'boss') {
                // Star for boss
                ctx.fillStyle = bodyColor;
                this._drawStar(p.x, p.y, bodyR, 5);
            } else if (c.type === 'swarm') {
                // 7-point star for swarm
                ctx.fillStyle = bodyColor;
                this._drawStar(p.x, p.y, bodyR, 7);
            } else if (c.type === 'regen') {
                // Plus sign for regen
                ctx.fillStyle = bodyColor;
                ctx.fillRect(p.x - bodyR * 0.8, p.y - bodyR * 0.3, bodyR * 1.6, bodyR * 0.6);
                ctx.fillRect(p.x - bodyR * 0.3, p.y - bodyR * 0.8, bodyR * 0.6, bodyR * 1.6);
            } else {
                // Circle for normal and swarmlet
                ctx.fillStyle = bodyColor;
                ctx.beginPath();
                ctx.arc(p.x, p.y, bodyR, 0, Math.PI * 2);
                ctx.fill();
            }

            // HP bar
            const barW = 20 * p.scale;
            const barH = 3;
            const barY = p.y - bodyR - 5 * p.scale;
            ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
            ctx.fillRect(p.x - barW / 2, barY, barW, barH);
            const hpColor = hpRatio > 0.6 ? '#44dd44' : (hpRatio > 0.3 ? '#dddd44' : '#dd4444');
            ctx.fillStyle = hpColor;
            ctx.fillRect(p.x - barW / 2, barY, barW * hpRatio, barH);
        }
    }

    // ─── Projectiles ────────────────────────────────────────────────────
    _drawProjectiles() {
        const ctx = this.ctx;
        for (const pr of this.board.projectiles) {
            const f = this._projectQ(pr.from);
            const t = this._projectQ(pr.to);
            const alpha = pr.life / 6;
            const color = pr.color || '#ffff00';

            const progress = 1 - (pr.life / 6);
            const hx = f.x + (t.x - f.x) * progress;
            const hy = f.y + (t.y - f.y) * progress;

            const tailP = Math.max(0, progress - 0.4);
            const tx = f.x + (t.x - f.x) * tailP;
            const ty = f.y + (t.y - f.y) * tailP;

            // Bolt glow
            ctx.save();
            ctx.strokeStyle = this._rgba(color, alpha * 0.5);
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(hx, hy);
            ctx.stroke();
            ctx.restore();

            // Bolt core
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(tx, ty);
            ctx.lineTo(hx, hy);
            ctx.stroke();

            // Impact flash
            if (progress > 0.8) {
                ctx.fillStyle = this._rgba(color, alpha * 0.8);
                ctx.beginPath();
                ctx.arc(t.x, t.y, 8 * alpha, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // ─── Particles (death explosions) ───────────────────────────────────
    _drawParticles() {
        const ctx = this.ctx;
        for (const p of this.board.particles) {
            // Apply drag
            p.vx *= 0.95; // drag
            p.vy *= 0.95; // drag
            p.vz *= 0.95; // drag

            // Move particle
            p.x += p.vx;
            p.y += p.vy;
            p.z += p.vz;
            const q = new Quadray(p.x, p.y, p.z, p.w);
            const sp = this._projectQ(q);
            const alpha = p.life / 25;
            const dynR = (2 + (Math.abs(p.x) * 10 % 2)) * alpha * sp.scale;

            // Glow
            ctx.fillStyle = this._rgba(p.color, alpha * 0.8);
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, dynR * 2, 0, Math.PI * 2);
            ctx.fill();

            // Core
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(sp.x, sp.y, dynR, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // ─── Hover Preview ──────────────────────────────────────────────────
    _drawHoverPreview() {
        if (!this.hoveredNode || !this.game || !this.game.selectedTowerType) return;
        if (this.game.selectedTowerInstance) return; // don't show preview if inspecting a tower

        const q = this.hoveredNode;
        const board = this.board;
        // Check if valid placement
        let onPath = false;
        for (const wp of board.path) {
            if (Quadray.distance(q, wp) < 0.1) { onPath = true; break; }
        }
        let hasTower = false;
        for (const t of board.towers) {
            if (Quadray.distance(q, t.pos) < 0.1) { hasTower = true; break; }
        }

        const p = this._projectQ(q);
        const def = TOWER_TYPES[this.game.selectedTowerType];
        const valid = !onPath && !hasTower && board.gold >= def.cost;
        const color = valid ? def.color : '#ff3333';

        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = 0.4 + Math.sin(this.frame * 0.1) * 0.1;

        // Ghost tower shape
        if (this.game.selectedTowerType === 'tetra') this._drawTetra(p.x, p.y, p.scale, color);
        else if (this.game.selectedTowerType === 'octa') this._drawOcta(p.x, p.y, p.scale, color);
        else if (this.game.selectedTowerType === 'cubo') this._drawCubo(p.x, p.y, p.scale, color);
        else if (this.game.selectedTowerType === 'rhombic') this._drawRhombic(p.x, p.y, p.scale, color);

        // Range preview
        const rangeR = def.range * this.scale * p.scale * 0.32;
        ctx.strokeStyle = this._rgba(color, 0.3);
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(p.x, p.y, rangeR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Coordinate label
        ctx.font = '10px monospace';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(this.fmtQ(q), p.x, p.y + 15 * p.scale);

        ctx.restore();
    }

    // ─── HUD (in-canvas) ────────────────────────────────────────────────
    _drawInCanvasHUD(w, h) {
        const ctx = this.ctx;
        const board = this.board;

        // Wave / Lives / Gold / Score
        ctx.font = 'bold 13px "Outfit", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';

        const hudY = 14;
        let x = 14;

        // Wave
        ctx.fillStyle = '#44aaff';
        ctx.fillText(`Wave ${board.wave}`, x, hudY);
        x += ctx.measureText(`Wave ${board.wave}`).width + 16;

        // Lives
        ctx.fillStyle = board.lives <= 5 ? '#ff4444' : '#55cc55';
        ctx.fillText(`\u2665 ${board.lives}`, x, hudY);
        x += ctx.measureText(`\u2665 ${board.lives}`).width + 16;

        // Gold
        ctx.fillStyle = '#ffdd44';
        ctx.fillText(`\u25C6 ${board.gold}`, x, hudY);
        x += ctx.measureText(`\u25C6 ${board.gold}`).width + 16;

        // Score
        ctx.fillStyle = '#aabbcc';
        ctx.fillText(`Score: ${board.score}`, x, hudY);
        x += ctx.measureText(`Score: ${board.score}`).width + 16;

        // Kills
        ctx.fillStyle = '#cc8888';
        ctx.fillText(`Kills: ${board.totalKills}`, x, hudY);

        // Speed indicator
        ctx.textAlign = 'right';
        ctx.fillStyle = board.speed > 1 ? '#ffaa22' : '#667';
        ctx.fillText(`${board.speed}x`, w - 14, hudY);

        // Wave countdown
        if (!board.waveActive && board.waveCountdown > 0) {
            const secs = Math.ceil(board.waveCountdown / 60);
            ctx.fillStyle = '#aab';
            ctx.textAlign = 'center';
            ctx.fillText(`Next wave in ${secs}s`, w / 2, hudY);
        }

        // Event log (bottom-left)
        ctx.font = '11px "Outfit", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        for (let i = 0; i < board.log.length; i++) {
            const entry = board.log[board.log.length - 1 - i];
            const age = board.tick - entry.tick;
            const alpha = Math.max(0.1, 1 - age / 600);
            ctx.fillStyle = `rgba(150, 160, 190, ${alpha})`;
            ctx.fillText(entry.msg, 14, h - 14 - i * 16);
        }
    }

    // ─── Game Over Overlay ──────────────────────────────────────────────
    _drawGameOver(w, h) {
        const ctx = this.ctx;
        ctx.fillStyle = 'rgba(5, 5, 10, 0.7)';
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.shadowColor = '#ff2222';
        ctx.shadowBlur = 30;
        ctx.font = 'bold 36px "Outfit", sans-serif';
        ctx.fillStyle = '#ff4444';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('GAME OVER', w / 2, h / 2 - 20);

        ctx.shadowBlur = 0;
        ctx.font = '16px "Outfit", sans-serif';
        ctx.fillStyle = '#aab';
        ctx.fillText(`Score: ${this.board.score}  |  Waves: ${this.board.wave}  |  Kills: ${this.board.totalKills}`, w / 2, h / 2 + 20);

        ctx.font = '14px "Outfit", sans-serif';
        ctx.fillStyle = '#667';
        ctx.fillText('Click Restart to play again', w / 2, h / 2 + 50);
        ctx.restore();
    }

    // ─── Polyhedra Shapes ───────────────────────────────────────────────
    _drawTetra(px, py, s, color) {
        const ctx = this.ctx;
        const r = 9 * s;
        const pts = [];
        for (let i = 0; i < 3; i++) {
            const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
            pts.push({ x: px + Math.cos(angle) * r, y: py + Math.sin(angle) * r });
        }
        // Fill with gradient
        const g = ctx.createLinearGradient(px, py - r, px, py + r);
        g.addColorStop(0, color);
        g.addColorStop(1, this._rgba(color, 0.4));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        ctx.lineTo(pts[1].x, pts[1].y);
        ctx.lineTo(pts[2].x, pts[2].y);
        ctx.closePath();
        ctx.fill();
        // Edges
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Inner lines
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#ffffff';
        for (const p of pts) {
            ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(p.x, p.y); ctx.stroke();
        }
        ctx.globalAlpha = 1.0;
    }

    _drawOcta(px, py, s, color) {
        const ctx = this.ctx;
        const r = 11 * s;
        const pts = [
            { x: px, y: py - r },
            { x: px + r * 0.8, y: py },
            { x: px, y: py + r },
            { x: px - r * 0.8, y: py }
        ];
        const g = ctx.createLinearGradient(px, py - r, px, py + r);
        g.addColorStop(0, color);
        g.addColorStop(1, this._rgba(color, 0.4));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < 4; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();
        // Cross
        ctx.globalAlpha = 0.25;
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[2].x, pts[2].y); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(pts[1].x, pts[1].y); ctx.lineTo(pts[3].x, pts[3].y); ctx.stroke();
        ctx.globalAlpha = 1.0;
    }

    _drawCubo(px, py, s, color) {
        const ctx = this.ctx;
        const r = 14 * s;
        // Outer ring with gradient
        const g = ctx.createRadialGradient(px, py, 0, px, py, r);
        g.addColorStop(0, this._rgba(color, 0.6));
        g.addColorStop(1, this._rgba(color, 0.15));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // Radial lines (12 vertices of cuboctahedron)
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#ffffff';
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(px + Math.cos(angle) * r, py + Math.sin(angle) * r);
            ctx.stroke();
        }
        // Inner hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const ix = px + Math.cos(angle) * r * 0.55;
            const iy = py + Math.sin(angle) * r * 0.55;
            i === 0 ? ctx.moveTo(ix, iy) : ctx.lineTo(ix, iy);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }

    _drawRhombic(px, py, s, color) {
        const ctx = this.ctx;
        const r = 13 * s;
        const pts = [];
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
            pts.push({ x: px + Math.cos(angle) * r, y: py + Math.sin(angle) * r });
        }

        const g = ctx.createLinearGradient(px, py - r, px, py + r);
        g.addColorStop(0, color);
        g.addColorStop(1, this._rgba(color, 0.4));
        ctx.fillStyle = g;

        // Outer hexagon
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            i === 0 ? ctx.moveTo(pts[i].x, pts[i].y) : ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Inner rhombi edges
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(px, py); ctx.lineTo(pts[1].x, pts[1].y);
        ctx.moveTo(px, py); ctx.lineTo(pts[3].x, pts[3].y);
        ctx.moveTo(px, py); ctx.lineTo(pts[5].x, pts[5].y);
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    }

    _drawStar(px, py, r, points) {
        const ctx = this.ctx;
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
            const rad = i % 2 === 0 ? r : r * 0.45;
            const x = px + Math.cos(angle) * rad;
            const y = py + Math.sin(angle) * rad;
            i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    // ─── Helpers ────────────────────────────────────────────────────────
    _rgba(hex, alpha) {
        // Parse "#rrggbb" to rgba
        if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TDRenderer };
}
