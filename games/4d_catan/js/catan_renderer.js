/**
 * CatanRenderer.js — 4D Catan Canvas Renderer
 *
 * Extends BaseRenderer to project Quadray positions to 2D,
 * draw tetrahedral hex tiles, settlements, roads, cities,
 * robber tokens, phase indicators, and hover tooltips.
 *
 * Uses all BaseRenderer methods:
 *   _project(), _drawAxes(), _clearCanvas(), _drawHUD(),
 *   _drawCircle(), _drawDiamond()
 * Plus: GridUtils.depthSort(), Quadray.cellType(), Quadray.toString()
 *
 * @module CatanRenderer
 */

class CatanRenderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 45,
            cameraDist: 600,
            rotX: 0.5,
            rotY: 0.6,
            bgColor: '#0a1520',
        });
        this.game = null;           // Set by CatanGame after construction
        this.mouseX = 0;
        this.mouseY = 0;
        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };

        console.log('[CatanRenderer] Initialized with BaseRenderer + full quadray methods');
    }

    /**
     * Project a Quadray object to 2D screen space.
     * Wraps BaseRenderer._project() for convenience with Quadray instances.
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
        this._clearCanvas();
        this._drawAxes();

        const board = this.board;

        // Draw tiles with depth sorting via GridUtils
        const tileData = board.tiles.map((tile, i) => ({
            tile, index: i,
            a: tile.pos.a, b: tile.pos.b, c: tile.pos.c || 0, d: tile.pos.d || 0,
        }));
        const sortedTiles = (typeof GridUtils !== 'undefined')
            ? GridUtils.depthSort(tileData, (a, b, c, d) => this._project(a, b, c, d))
            : tileData.map(t => {
                const p = this._project(t.a, t.b, t.c, t.d);
                return { ...t, px: p.x, py: p.y, pScale: p.scale };
            });

        for (const entry of sortedTiles) {
            const tile = entry.tile;
            const p = { x: entry.px, y: entry.py, scale: entry.pScale };
            const r = 16 * p.scale;

            // Tile fill — hexagon shape
            this.ctx.fillStyle = RESOURCE_COLORS[tile.resource] || '#888';
            this.ctx.beginPath();
            for (let j = 0; j < 6; j++) {
                const angle = j / 6 * Math.PI * 2 - Math.PI / 6;
                this.ctx.lineTo(p.x + Math.cos(angle) * r, p.y + Math.sin(angle) * r);
            }
            this.ctx.closePath();
            this.ctx.fill();

            // Highlight valid build spots during BUILD phase
            if (this.game && this.game.phase === TurnPhase.BUILD && this.game.buildMode === 'settlement' &&
                board.currentPlayer === 0) {
                if (board.isValidSettlementSpot(tile.pos) &&
                    canAfford(board.players[0], BUILD_COSTS.settlement)) {
                    this.ctx.strokeStyle = '#00ff88';
                    this.ctx.lineWidth = 2.5;
                    this.ctx.stroke();
                } else {
                    this.ctx.strokeStyle = '#000';
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            } else {
                this.ctx.strokeStyle = '#000';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }

            // Tile number
            if (tile.number) {
                const isHot = (tile.number === 6 || tile.number === 8);
                this.ctx.fillStyle = isHot ? '#ff3333' : '#fff';
                this.ctx.font = `bold ${12 * p.scale}px sans-serif`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(tile.number, p.x, p.y);
            }

            // Coordinate label below tile
            this.ctx.fillStyle = 'rgba(255,255,255,0.5)';
            this.ctx.font = `${7 * p.scale}px monospace`;
            this.ctx.textAlign = 'center'; this.ctx.textBaseline = 'top';
            const tp = tile.pos;
            this.ctx.fillText(`(${tp.a},${tp.b},${tp.c||0},${tp.d||0})`, p.x, p.y + r * 0.65);

            // Draw robber token (dark circle)
            if (tile === board.robber && tile.resource !== ResourceType.DESERT) {
                this.ctx.fillStyle = 'rgba(30, 0, 0, 0.7)';
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, r * 0.55, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#ff0000';
                this.ctx.font = `bold ${10 * p.scale}px sans-serif`;
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText('R', p.x, p.y);
            } else if (tile === board.robber) {
                // Robber on desert — subtle marker
                this.ctx.fillStyle = 'rgba(60, 30, 0, 0.5)';
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, r * 0.4, 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Highlight tiles for robber placement
            if (this.game && this.game.phase === TurnPhase.ROBBER) {
                if (tile !== board.robber) {
                    this.ctx.strokeStyle = '#ff4444';
                    this.ctx.lineWidth = 2;
                    this.ctx.setLineDash([4, 4]);
                    this.ctx.beginPath();
                    for (let j = 0; j < 6; j++) {
                        const angle = j / 6 * Math.PI * 2 - Math.PI / 6;
                        this.ctx.lineTo(p.x + Math.cos(angle) * r, p.y + Math.sin(angle) * r);
                    }
                    this.ctx.closePath();
                    this.ctx.stroke();
                    this.ctx.setLineDash([]);
                }
            }
        }

        // Draw roads
        for (const pl of board.players) {
            this.ctx.strokeStyle = pl.color;
            this.ctx.lineWidth = 3;
            for (const road of pl.roads) {
                const fp = this._project(road.from.a, road.from.b, road.from.c || 0, road.from.d || 0);
                const tp = this._project(road.to.a, road.to.b, road.to.c || 0, road.to.d || 0);
                this.ctx.beginPath();
                this.ctx.moveTo(fp.x, fp.y);
                this.ctx.lineTo(tp.x, tp.y);
                this.ctx.stroke();
            }
        }

        // Draw settlements and cities
        for (const pl of board.players) {
            for (const s of pl.settlements) {
                const p = this._project(s.a, s.b, s.c || 0, s.d || 0);
                if (s.isCity) {
                    // City: larger pentagon shape
                    this.ctx.fillStyle = pl.color;
                    this.ctx.beginPath();
                    for (let j = 0; j < 5; j++) {
                        const angle = j / 5 * Math.PI * 2 - Math.PI / 2;
                        this.ctx.lineTo(p.x + Math.cos(angle) * 9, p.y + Math.sin(angle) * 9);
                    }
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                    // City label
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = 'bold 8px sans-serif';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText('C', p.x, p.y);
                } else {
                    // Settlement: small square
                    this.ctx.fillStyle = pl.color;
                    this.ctx.fillRect(p.x - 5, p.y - 5, 10, 10);
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.lineWidth = 1;
                    this.ctx.strokeRect(p.x - 5, p.y - 5, 10, 10);
                }
            }
        }

        // Hover tooltip
        let closestDist = 25, hoveredTile = null;
        for (const tile of board.tiles) {
            const p = this._projectQ(tile.toQuadray());
            const dx = this.mouseX - p.x, dy = this.mouseY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDist) { closestDist = dist; hoveredTile = { tile, p }; }
        }
        if (hoveredTile && !this.isDragging) {
            const ht = hoveredTile, tp = ht.tile.pos;
            const label = `${ht.tile.resource} #${ht.tile.number || '-'} Q(${tp.a},${tp.b},${tp.c||0},${tp.d||0})`;
            this.ctx.font = '12px monospace'; this.ctx.textAlign = 'left'; this.ctx.textBaseline = 'bottom';
            const tw = this.ctx.measureText(label).width;
            const tx = this.mouseX + 14, ty = this.mouseY - 10;
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.beginPath(); this.ctx.roundRect(tx - 4, ty - 16, tw + 8, 20, 4); this.ctx.fill();
            this.ctx.fillStyle = '#FFD54F'; this.ctx.fillText(label, tx, ty);
        }

        // Canvas-based HUD overlay using BaseRenderer._drawHUD()
        this._drawBoardHUD();
    }

    /**
     * Draw HUD overlay on the canvas using BaseRenderer._drawHUD().
     */
    _drawBoardHUD() {
        const meta = this.board.getMetadata();
        const cp = this.board.players[this.board.currentPlayer];
        const phaseLabel = (this.game && this.game.phase) ? this.game.phase.toUpperCase() : 'SETUP';

        const lines = [
            `Turn: ${cp.name} | VP: ${cp.points} | Phase: ${phaseLabel}`,
            `W:${cp.resources.wood} B:${cp.resources.brick} Wh:${cp.resources.wheat} S:${cp.resources.sheep} O:${cp.resources.ore}`,
            `Dice: ${this.board.dice[0] || '?'}+${this.board.dice[1] || '?'} = ${(this.board.dice[0] && this.board.dice[1]) ? this.board.dice[0] + this.board.dice[1] : '?'}`,
            `Tetra: ${meta.tetraCount} | Octa: ${meta.octaCount} | T:O:C=${meta.volumeRatios.tetra}:${meta.volumeRatios.octa}:${meta.volumeRatios.cubo}`,
        ];

        if (this.game && this.game.buildMode) {
            lines.push(`Building: ${this.game.buildMode.toUpperCase()}`);
        }

        this._drawHUD(lines, { color: 'rgba(148, 163, 184, 0.7)', fontSize: 11 });

        // Controls hint (top-right)
        this.ctx.fillStyle = '#666';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'top';
        this.ctx.fillText('Shift+drag rotate | Scroll zoom', this.canvas.width - 12, 12);

        // Winner overlay
        const winner = this.board.winner();
        if (winner) {
            const w = this.canvas.width, h = this.canvas.height;
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(0, h / 2 - 40, w, 80);
            this.ctx.fillStyle = winner.color;
            this.ctx.font = 'bold 32px sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(`${winner.name} WINS! (${winner.points} VP)`, w / 2, h / 2);
        }

        // Robber placement mode
        if (this.game && this.game.phase === TurnPhase.ROBBER) {
            this.ctx.fillStyle = '#ff4444';
            this.ctx.font = 'bold 14px monospace';
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            this.ctx.fillText('CLICK TILE TO PLACE ROBBER', 12, this.canvas.height - 30);
        }
    }

    /**
     * Hit-test a screen coordinate against projected tile positions.
     * @param {number} sx - Screen X
     * @param {number} sy - Screen Y
     * @returns {{ tileIdx: number, tile: CatanTile }|null}
     */
    hitTest(sx, sy) {
        let closest = null;
        let minDist = Infinity;
        for (let i = 0; i < this.board.tiles.length; i++) {
            const tile = this.board.tiles[i];
            const p = this._projectQ(tile.toQuadray());
            const dx = p.x - sx, dy = p.y - sy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 18 && dist < minDist) {
                minDist = dist;
                closest = { tileIdx: i, tile };
            }
        }
        return closest;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CatanRenderer };
}
