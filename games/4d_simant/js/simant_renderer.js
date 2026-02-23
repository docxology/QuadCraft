/**
 * simant_renderer.js — 4D SimAnt Canvas Renderer — Enhanced
 *
 * Extends BaseRenderer to project Quadray positions to 2D with
 * rich Quadray geometry visualization:
 *   - IVM tetrahedral wireframe showing close-packed sphere topology
 *   - Tunnel corridor rendering between EMPTY cells
 *   - Ant sprites with caste-specific visuals (queen crowns, scout antennae)
 *   - Pheromone trail overlays with gradient colors
 *   - Particle effects, minimap, health bars, and hover tooltips
 *   - Carrying indicators and coordinate labels (toggleable)
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
            bgColor: '#060503',
        });

        // Mouse hover position
        this.mouseX = 0;
        this.mouseY = 0;

        // Pheromone visualizer
        this.pheromoneViz = (typeof PheromoneVisualizer !== 'undefined') ? new PheromoneVisualizer() : null;

        // Particle system
        this.particles = [];
        this.maxParticles = 100;

        // Display toggles
        this.showMinimap = true;
        this.showLabels = false; // Coordinate labels off by default (less clutter)
        this.showTunnels = true;
        this.showIVMGrid = true;

        // Minimap
        this.minimapSize = 130;

        // Cached tunnel edges for rendering
        this._tunnelEdgeCache = [];
        this._tunnelCacheTick = -1;

        // Sprites (Procedural)
        this.sprites = {};
        this.initSprites();

        console.log('[SimAntRenderer] Initialized with IVM grid visualization');
    }

    /**
     * Helper: project a Quadray coordinate using BaseRenderer._project().
     */
    _projectQ(a, b, c, d) {
        const p = this._project(a, b, c, d);
        const q = new Quadray(a, b, c, d);
        const cart = q.toCartesian();
        const cy = Math.cos(this.rotY), sy = Math.sin(this.rotY);
        const cx = Math.cos(this.rotX), sx = Math.sin(this.rotX);
        let pz = cart.x * sy + cart.z * cy;
        pz = cart.y * sx + pz * cx;
        return { x: p.x, y: p.y, scale: p.scale, z: pz };
    }

    initSprites() {
        this.sprites['yellow_worker'] = this.drawAntSprite('#ffaa00', '#cc8800');
        this.sprites['yellow_soldier'] = this.drawAntSprite('#ffaa00', '#aa0000', true);
        this.sprites['yellow_scout'] = this.drawAntSprite('#ffcc44', '#ccaa00', false, true);
        this.sprites['red_worker'] = this.drawAntSprite('#ff4444', '#aa0000');
        this.sprites['red_soldier'] = this.drawAntSprite('#ff4444', '#660000', true);
        this.sprites['red_scout'] = this.drawAntSprite('#ff6666', '#cc2222', false, true);
        this.sprites['food'] = this.drawFoodSprite();
        this.sprites['queen_yellow'] = this.drawQueenSprite('#ffaa00');
        this.sprites['queen_red'] = this.drawQueenSprite('#ff4444');
    }

    drawAntSprite(color, legsColor, huge = false, scout = false) {
        const size = 32;
        const cvs = document.createElement('canvas');
        cvs.width = size; cvs.height = size;
        const ctx = cvs.getContext('2d');
        const cx = size / 2, cy = size / 2;

        // Legs
        ctx.strokeStyle = legsColor;
        ctx.lineWidth = scout ? 1.5 : 2;
        ctx.beginPath();
        ctx.moveTo(cx - 8, cy - 5); ctx.lineTo(cx + 8, cy - 5);
        ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 8, cy);
        ctx.moveTo(cx - 8, cy + 5); ctx.lineTo(cx + 8, cy + 5);
        ctx.stroke();

        // Body (3 segments)
        ctx.fillStyle = color;
        const bs = scout ? 0.8 : 1.0;
        ctx.beginPath(); ctx.ellipse(cx, cy + 6, 5 * bs, 7 * bs, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx, cy, 4 * bs, 4 * bs, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx, cy - 6, 4 * bs, 4 * bs, 0, 0, Math.PI * 2); ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(cx - 2, cy - 8, 1.5, 1.5);
        ctx.fillRect(cx + 0.5, cy - 8, 1.5, 1.5);

        if (scout) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(cx - 2, cy - 9); ctx.lineTo(cx - 5, cy - 14); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + 2, cy - 9); ctx.lineTo(cx + 5, cy - 14); ctx.stroke();
            // Small dot at antennae tips
            ctx.fillStyle = '#fff';
            ctx.beginPath(); ctx.arc(cx - 5, cy - 14, 1, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(cx + 5, cy - 14, 1, 0, Math.PI * 2); ctx.fill();
        }

        if (huge) {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(cx - 2, cy - 9); ctx.lineTo(cx - 5, cy - 13); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(cx + 2, cy - 9); ctx.lineTo(cx + 5, cy - 13); ctx.stroke();
        }

        return cvs;
    }

    drawQueenSprite(color) {
        const size = 40;
        const cvs = document.createElement('canvas');
        cvs.width = size; cvs.height = size;
        const ctx = cvs.getContext('2d');
        const cx = size / 2, cy = size / 2 + 2;

        // Glow
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 18);
        grad.addColorStop(0, color + '44');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, size, size);

        // Body
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.ellipse(cx, cy + 6, 7, 10, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx, cy - 2, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(cx, cy - 8, 5, 5, 0, 0, Math.PI * 2); ctx.fill();

        // Crown
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.moveTo(cx - 6, cy - 14);
        ctx.lineTo(cx - 4, cy - 19);
        ctx.lineTo(cx - 1, cy - 15);
        ctx.lineTo(cx + 1, cy - 15);
        ctx.lineTo(cx + 4, cy - 19);
        ctx.lineTo(cx + 6, cy - 14);
        ctx.closePath();
        ctx.fill();
        // Crown jewels
        ctx.fillStyle = '#ff4444';
        ctx.beginPath(); ctx.arc(cx - 4, cy - 18, 1, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#44aaff';
        ctx.beginPath(); ctx.arc(cx + 4, cy - 18, 1, 0, Math.PI * 2); ctx.fill();

        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(cx - 3, cy - 10, 2, 2);
        ctx.fillRect(cx + 1, cy - 10, 2, 2);

        // Legs
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy - 4); ctx.lineTo(cx + 10, cy - 4);
        ctx.moveTo(cx - 10, cy + 1); ctx.lineTo(cx + 10, cy + 1);
        ctx.moveTo(cx - 9, cy + 6); ctx.lineTo(cx + 9, cy + 6);
        ctx.stroke();

        return cvs;
    }

    drawFoodSprite() {
        const s = 16;
        const cvs = document.createElement('canvas');
        cvs.width = s; cvs.height = s;
        const ctx = cvs.getContext('2d');
        // Glow
        const grad = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, 7);
        grad.addColorStop(0, '#88ff8844');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, s, s);
        // Core
        ctx.fillStyle = '#44ff44';
        ctx.beginPath(); ctx.arc(s / 2, s / 2, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#aaffaa';
        ctx.beginPath(); ctx.arc(s / 2 - 1.5, s / 2 - 1.5, 1.5, 0, Math.PI * 2); ctx.fill();
        return cvs;
    }

    /** Spawn a particle effect */
    addParticle(x, y, color, type = 'burst') {
        if (this.particles.length >= this.maxParticles) return;
        this.particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3 - 1,
            life: 1.0,
            decay: 0.02 + Math.random() * 0.03,
            color,
            size: 2 + Math.random() * 3,
            type,
        });
    }

    /** Update and render particles */
    _renderParticles() {
        const ctx = this.ctx;
        this.particles = this.particles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            if (p.life <= 0) return false;

            ctx.globalAlpha = p.life * 0.8;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            return true;
        });
        ctx.globalAlpha = 1.0;
    }

    /**
     * Render IVM tetrahedral wireframe — shows the close-packed sphere geometry.
     * Draws edges between adjacent cells that are both EMPTY (tunnels),
     * revealing the tetrahedral lattice structure.
     */
    _drawIVMGrid() {
        if (!this.showIVMGrid) return;
        const ctx = this.ctx;
        const board = this.board;

        // Draw the 4 Quadray basis vectors as thick labeled arrows
        const center = this._projectQ(
            board.size / 2, board.size / 2, board.size / 2, board.size / 2
        );

        const basisLabels = ['a', 'b', 'c', 'd'];
        const basisColors = ['#ff8844', '#44aaff', '#44ff88', '#ff44aa'];
        const basisDirs = [
            [3, 0, 0, 0],
            [0, 3, 0, 0],
            [0, 0, 3, 0],
            [0, 0, 0, 3],
        ];

        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const ep = this._projectQ(
                board.size / 2 + basisDirs[i][0],
                board.size / 2 + basisDirs[i][1],
                board.size / 2 + basisDirs[i][2],
                board.size / 2 + basisDirs[i][3]
            );

            ctx.strokeStyle = basisColors[i];
            ctx.beginPath();
            ctx.moveTo(center.x, center.y);
            ctx.lineTo(ep.x, ep.y);
            ctx.stroke();

            // Arrow head
            const dx = ep.x - center.x;
            const dy = ep.y - center.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 10) {
                const nx = dx / len, ny = dy / len;
                ctx.fillStyle = basisColors[i];
                ctx.beginPath();
                ctx.moveTo(ep.x, ep.y);
                ctx.lineTo(ep.x - nx * 8 + ny * 4, ep.y - ny * 8 - nx * 4);
                ctx.lineTo(ep.x - nx * 8 - ny * 4, ep.y - ny * 8 + nx * 4);
                ctx.closePath();
                ctx.fill();
            }

            // Label
            ctx.font = 'bold 14px Outfit';
            ctx.fillStyle = basisColors[i];
            ctx.textAlign = 'center';
            ctx.fillText(basisLabels[i], ep.x + (dx / len) * 15, ep.y + (dy / len) * 15);
        }
        ctx.globalAlpha = 1.0;
    }

    /**
     * Render tunnel corridors as connecting lines between EMPTY cells,
     * showing the IVM lattice structure of the dug network.
     */
    _drawTunnelNetwork() {
        if (!this.showTunnels) return;
        const ctx = this.ctx;
        const board = this.board;

        // Rebuild cache every 20 ticks for performance
        if (this._tunnelCacheTick !== Math.floor(board.tick / 20)) {
            this._tunnelCacheTick = Math.floor(board.tick / 20);
            this._tunnelEdgeCache = [];

            // Sample tunnel cells and find connected pairs
            const maxEdges = 800;
            let edgeCount = 0;
            const visited = new Set();

            for (let i = 0; i < board.volume && edgeCount < maxEdges; i++) {
                if (board.grid[i] !== TYPE_EMPTY) continue;
                const c = board.coords(i);
                const key = `${c.a},${c.b},${c.c},${c.d}`;
                if (visited.has(key)) continue;
                visited.add(key);

                // Check IVM neighbors
                const neighbors = board.getNeighborCoords(c.a, c.b, c.c, c.d);
                for (const n of neighbors) {
                    const ni = board.idx(n.a, n.b, n.c, n.d);
                    if (ni === -1 || board.grid[ni] !== TYPE_EMPTY) continue;
                    const nKey = `${n.a},${n.b},${n.c},${n.d}`;
                    const edgeKey = key < nKey ? `${key}|${nKey}` : `${nKey}|${key}`;
                    if (!visited.has(edgeKey)) {
                        visited.add(edgeKey);
                        this._tunnelEdgeCache.push({ from: c, to: n });
                        edgeCount++;
                    }
                }
            }
        }

        // Draw tunnel edges
        ctx.globalAlpha = 0.12;
        ctx.strokeStyle = '#665533';
        ctx.lineWidth = 1;

        for (const edge of this._tunnelEdgeCache) {
            const p1 = this._projectQ(edge.from.a, edge.from.b, edge.from.c, edge.from.d);
            const p2 = this._projectQ(edge.to.a, edge.to.b, edge.to.c, edge.to.d);
            if (p1.scale < 0 || p2.scale < 0) continue;

            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }

        // Draw tunnel nodes as faint dots
        ctx.fillStyle = '#443322';
        ctx.globalAlpha = 0.08;
        const visited2 = new Set();
        for (const edge of this._tunnelEdgeCache) {
            const k1 = `${edge.from.a},${edge.from.b}`;
            if (!visited2.has(k1)) {
                visited2.add(k1);
                const p = this._projectQ(edge.from.a, edge.from.b, edge.from.c, edge.from.d);
                if (p.scale > 0) {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 2 * p.scale, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        ctx.globalAlpha = 1.0;
    }

    /**
     * Main render loop — uses BaseRenderer infrastructure.
     */
    render() {
        this._clearCanvas();

        // Draw IVM basis vectors — tetrahedral geometry reference
        this._drawIVMGrid();

        // Draw tunnel network — IVM lattice connectivity
        this._drawTunnelNetwork();

        // Draw standard axes
        this._drawAxes();

        const board = this.board;
        const list = [];

        // Ants
        for (const ant of board.ants) {
            if (!ant.alive) continue;
            const p = this._projectQ(ant.a, ant.b, ant.c, ant.d);
            let sprite;
            if (ant.caste === CASTE_QUEEN) {
                sprite = ant.faction === 0 ? 'queen_yellow' : 'queen_red';
            } else if (ant.faction === 1) {
                sprite = ant.caste === CASTE_SOLDIER ? 'red_soldier'
                    : ant.caste === CASTE_SCOUT ? 'red_scout'
                        : 'red_worker';
            } else {
                sprite = ant.caste === CASTE_SOLDIER ? 'yellow_soldier'
                    : ant.caste === CASTE_SCOUT ? 'yellow_scout'
                        : 'yellow_worker';
            }
            list.push({ type: 'ant', p, ant, sprite });
        }

        // Food cells
        for (let i = 0; i < board.grid.length; i++) {
            if (board.grid[i] === 3) {
                const c = board.coords(i);
                const p = this._projectQ(c.a, c.b, c.c, c.d);
                list.push({ type: 'food', p, coords: c });
            }
        }

        // Sort by Z (painters algo)
        list.sort((a, b) => b.p.z - a.p.z);

        // Pheromone visualization layer
        if (this.pheromoneViz) {
            this.pheromoneViz.render(this.ctx, board, (a, b, c, d) => this._projectQ(a, b, c, d));
        }

        // Draw nest markers (behind ants)
        this._drawNests();

        // Draw entities
        let hoveredItem = null;
        let hoverDist = 30;

        for (const item of list) {
            if (item.p.scale < 0) continue;
            const x = item.p.x;
            const y = item.p.y;

            if (item.type === 'food') {
                const img = this.sprites['food'];
                const dim = 16 * item.p.scale;
                this.ctx.drawImage(img, x - dim / 2, y - dim / 2, dim, dim);
            }
            else if (item.type === 'ant') {
                this._drawAntEntity(item);
            }

            // Track closest item to mouse for hover tooltip
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
            this._drawTooltip(hoveredItem);
        }

        // Particles
        this._renderParticles();

        // Minimap
        if (this.showMinimap) {
            this._drawMinimap();
        }

        // On-canvas HUD
        this._drawBoardHUD();
    }

    /** Draw individual ant entity with indicators */
    _drawAntEntity(item) {
        const ctx = this.ctx;
        const x = item.p.x;
        const y = item.p.y;
        const ant = item.ant;
        const isQueen = ant.caste === CASTE_QUEEN;
        const img = this.sprites[item.sprite];
        const dim = (isQueen ? 40 : 32) * item.p.scale;

        ctx.globalAlpha = 1.0;
        ctx.drawImage(img, x - dim / 2, y - dim / 2, dim, dim);

        // Carrying indicator — green leaf icon
        if (ant.carrying > 0) {
            ctx.fillStyle = '#44ff44';
            ctx.globalAlpha = 0.9;
            ctx.font = `${Math.max(8, 10 * item.p.scale)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('🍃', x + dim * 0.35, y - dim * 0.25);
            ctx.globalAlpha = 1.0;
        }

        // HP Bar (only if damaged)
        const hpPct = ant.hp / ant.maxHp;
        if (hpPct < 1) {
            const barW = 20 * item.p.scale;
            const barH = 2.5 * item.p.scale;
            const barX = x - barW / 2;
            const barY = y - dim / 2 - 4 * item.p.scale;
            ctx.fillStyle = '#222';
            ctx.fillRect(barX, barY, barW, barH);
            ctx.fillStyle = hpPct > 0.5 ? '#4ade80' : hpPct > 0.25 ? '#fbbf24' : '#ef4444';
            ctx.fillRect(barX, barY, barW * hpPct, barH);
        }

        // State icon for scouts
        if (ant.caste === CASTE_SCOUT) {
            ctx.globalAlpha = 0.5;
            ctx.font = `${Math.max(7, 8 * item.p.scale)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('🔍', x, y - dim / 2 - 6 * item.p.scale);
            ctx.globalAlpha = 1.0;
        }

        // Attacking state indicator
        if (ant.state === 'attacking') {
            ctx.globalAlpha = 0.5;
            ctx.font = `${Math.max(7, 8 * item.p.scale)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillText('⚔', x, y - dim / 2 - 6 * item.p.scale);
            ctx.globalAlpha = 1.0;
        }

        // Coordinate label (only when toggled on or hovered)
        if (this.showLabels) {
            ctx.globalAlpha = 0.6;
            ctx.font = '8px monospace';
            ctx.fillStyle = ant.faction === 0 ? '#ffaa44' : '#ff4444';
            ctx.textAlign = 'center';
            ctx.fillText(`(${ant.a},${ant.b},${ant.c},${ant.d})`, x, y + dim / 2 + 8);
            ctx.globalAlpha = 1.0;
        }
    }

    /** Draw nest markers with territory glow */
    _drawNests() {
        const ctx = this.ctx;
        const board = this.board;

        for (let f = 0; f < 2; f++) {
            const nest = board.nests[f];
            if (!nest) continue;
            const np = this._projectQ(nest.a, nest.b, nest.c, nest.d);
            if (np.scale < 0) continue;

            const color = f === 0 ? '#ffaa44' : '#ff4444';

            // Territory glow — pulsing
            const pulse = 0.7 + 0.3 * Math.sin(Date.now() / 800 + f * Math.PI);
            ctx.globalAlpha = 0.08 * pulse;
            const grad = ctx.createRadialGradient(np.x, np.y, 0, np.x, np.y, 50 * np.scale);
            grad.addColorStop(0, color);
            grad.addColorStop(1, 'transparent');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(np.x, np.y, 50 * np.scale, 0, Math.PI * 2);
            ctx.fill();

            // Nest diamond marker
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = color;
            const ds = 8 * np.scale;
            ctx.beginPath();
            ctx.moveTo(np.x, np.y - ds);
            ctx.lineTo(np.x + ds * 0.7, np.y);
            ctx.lineTo(np.x, np.y + ds);
            ctx.lineTo(np.x - ds * 0.7, np.y);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.4;
            ctx.stroke();

            // Label
            ctx.globalAlpha = 0.9;
            ctx.font = 'bold 11px Outfit';
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            const icon = f === 0 ? '🏠' : '🔴';
            ctx.fillText(`${icon} NEST`, np.x, np.y - 18 * np.scale);

            // Quadray coordinates below
            ctx.globalAlpha = 0.5;
            ctx.font = '9px monospace';
            ctx.fillText(`(${nest.a},${nest.b},${nest.c},${nest.d})`, np.x, np.y + 18 * np.scale);

            ctx.globalAlpha = 1.0;
        }
    }

    _drawTooltip(hoveredItem) {
        const ctx = this.ctx;
        const hx = hoveredItem.p.x;
        const hy = hoveredItem.p.y;
        let lines = [];

        if (hoveredItem.type === 'ant') {
            const a = hoveredItem.ant;
            const fName = a.faction === 0 ? 'Yellow' : 'Red';
            const cName = a.caste === CASTE_QUEEN ? 'Queen'
                : a.caste === CASTE_SOLDIER ? 'Soldier'
                    : a.caste === CASTE_SCOUT ? 'Scout'
                        : 'Worker';
            lines.push(`${fName} ${cName}`);
            lines.push(`HP: ${Math.floor(a.hp)}/${a.maxHp}  Energy: ${Math.floor(a.energy)}`);
            lines.push(`Pos: (${a.a}, ${a.b}, ${a.c}, ${a.d})`);
            if (a.carrying > 0) lines.push(`Carrying: ${a.carrying} food`);
            if (a.kills > 0) lines.push(`Kills: ${a.kills}`);
            lines.push(`State: ${a.state}`);
        } else if (hoveredItem.type === 'food') {
            const c = hoveredItem.coords;
            lines.push('Food Source');
            lines.push(`Pos: (${c.a}, ${c.b}, ${c.c}, ${c.d})`);
        }

        if (lines.length === 0) return;

        ctx.font = '11px Outfit';
        const maxW = Math.max(...lines.map(l => ctx.measureText(l).width));
        const tw = maxW + 20;
        const th = lines.length * 16 + 12;
        const tx = Math.min(hx - tw / 2, this.canvas.width - tw - 10);
        const ty = hy - th - 15;

        // Background
        ctx.globalAlpha = 0.92;
        ctx.fillStyle = '#0a0800';
        ctx.beginPath();
        // Rounded rectangle
        const r = 6;
        ctx.moveTo(tx + r, ty);
        ctx.lineTo(tx + tw - r, ty);
        ctx.quadraticCurveTo(tx + tw, ty, tx + tw, ty + r);
        ctx.lineTo(tx + tw, ty + th - r);
        ctx.quadraticCurveTo(tx + tw, ty + th, tx + tw - r, ty + th);
        ctx.lineTo(tx + r, ty + th);
        ctx.quadraticCurveTo(tx, ty + th, tx, ty + th - r);
        ctx.lineTo(tx, ty + r);
        ctx.quadraticCurveTo(tx, ty, tx + r, ty);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#ffaa4466';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Text
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = '#ffe0a0';
        ctx.textAlign = 'left';
        for (let i = 0; i < lines.length; i++) {
            ctx.fillStyle = i === 0 ? '#ffcc88' : '#bb9966';
            ctx.font = i === 0 ? 'bold 11px Outfit' : '10px Outfit';
            ctx.fillText(lines[i], tx + 10, ty + 16 + i * 16);
        }
        ctx.globalAlpha = 1.0;
    }

    /** Draw enhanced minimap with IVM-projected overview */
    _drawMinimap() {
        const ctx = this.ctx;
        const sz = this.minimapSize;
        const mx = 12;
        const my = this.canvas.height - sz - 50;
        const board = this.board;
        const cellSize = sz / board.size;

        // Background
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = '#0a0800';
        ctx.beginPath();
        const r = 8;
        ctx.moveTo(mx + r, my);
        ctx.lineTo(mx + sz - r, my);
        ctx.quadraticCurveTo(mx + sz, my, mx + sz, my + r);
        ctx.lineTo(mx + sz, my + sz - r);
        ctx.quadraticCurveTo(mx + sz, my + sz, mx + sz - r, my + sz);
        ctx.lineTo(mx + r, my + sz);
        ctx.quadraticCurveTo(mx, my + sz, mx, my + sz - r);
        ctx.lineTo(mx, my + r);
        ctx.quadraticCurveTo(mx, my, mx + r, my);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,170,68,0.25)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Label
        ctx.globalAlpha = 0.4;
        ctx.font = '9px Outfit';
        ctx.fillStyle = '#886';
        ctx.textAlign = 'left';
        ctx.fillText('IVM OVERVIEW', mx + 5, my - 4);

        // Draw terrain heatmap (project a,b axes, summing over c,d)
        const terrainMap = new Uint8Array(board.size * board.size); // 0=dirt, 1=tunnel, 2=food
        for (let a = 0; a < board.size; a++) {
            for (let b = 0; b < board.size; b++) {
                let hasEmpty = false, hasFood = false;
                // Sample a few c,d values
                for (let c = 0; c < board.size; c += Math.max(1, Math.floor(board.size / 4))) {
                    for (let d = 0; d < board.size; d += Math.max(1, Math.floor(board.size / 4))) {
                        const idx = board.idx(a, b, c, d);
                        if (idx !== -1) {
                            if (board.grid[idx] === TYPE_EMPTY) hasEmpty = true;
                            if (board.grid[idx] === TYPE_FOOD) hasFood = true;
                        }
                    }
                }
                if (hasFood) terrainMap[a * board.size + b] = 2;
                else if (hasEmpty) terrainMap[a * board.size + b] = 1;
            }
        }

        // Draw terrain
        ctx.globalAlpha = 0.35;
        for (let a = 0; a < board.size; a++) {
            for (let b = 0; b < board.size; b++) {
                const val = terrainMap[a * board.size + b];
                if (val === 0) continue;
                const px = mx + a * cellSize;
                const py = my + b * cellSize;
                ctx.fillStyle = val === 2 ? '#44ff44' : '#332211';
                ctx.fillRect(px, py, cellSize, cellSize);
            }
        }

        // Draw ants
        ctx.globalAlpha = 0.9;
        for (const ant of board.ants) {
            if (!ant.alive) continue;
            const px = mx + ant.a * cellSize + cellSize / 2;
            const py = my + ant.b * cellSize + cellSize / 2;
            ctx.fillStyle = ant.faction === 0 ? '#ffaa44' : '#ff4444';
            const dotSize = ant.caste === CASTE_QUEEN ? 3 : (ant.caste === CASTE_SOLDIER ? 2 : 1.2);
            ctx.beginPath();
            ctx.arc(px, py, dotSize, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw nests with diamond marker
        for (let f = 0; f < 2; f++) {
            const nest = board.nests[f];
            if (!nest) continue;
            const nx = mx + nest.a * cellSize + cellSize / 2;
            const ny = my + nest.b * cellSize + cellSize / 2;
            ctx.strokeStyle = f === 0 ? '#ffaa44' : '#ff4444';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(nx, ny - 4); ctx.lineTo(nx + 3, ny);
            ctx.lineTo(nx, ny + 4); ctx.lineTo(nx - 3, ny);
            ctx.closePath();
            ctx.stroke();
        }

        ctx.globalAlpha = 1.0;
    }

    /**
     * Draw HUD overlay on the canvas.
     */
    _drawBoardHUD() {
        const meta = this.board.getMetadata();
        const lines = [
            `Tick: ${meta.tick} | Y:${meta.yellowAnts} R:${meta.redAnts} ants`,
            `Tunnels: ${meta.tunnelPercent}% | Food: ${meta.foodCells} cells`,
            `World TV: ${meta.worldTetravolume} | S3: ${this.board.s3Constant.toFixed(4)}`,
        ];
        this._drawHUD(lines, { color: 'rgba(148, 163, 184, 0.6)', fontSize: 11 });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SimAntRenderer };
}
