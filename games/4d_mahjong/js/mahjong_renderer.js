/**
 * mahjong_renderer.js — 4D Mahjong Canvas Renderer
 *
 * Extends BaseRenderer to project Quadray tile positions to 2D,
 * draw stacked tile layers with suit coloring, hover tooltips,
 * hint highlighting, and selection glow.
 *
 * Uses all BaseRenderer methods:
 *   _project(), _drawAxes(), _clearCanvas(), _drawHUD(),
 *   _drawCircle(), _drawDiamond()
 * Plus: Quadray.cellType(), Quadray.distance(), Quadray.toKey()
 *
 * @module MahjongRenderer
 */

class MahjongRenderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 40,
            cameraDist: 600,
            rotX: 0.5,
            rotY: 0.6,
            bgColor: '#0a0a14',
        });
        this.mouseX = 0;
        this.mouseY = 0;
        this.isDragging = false;

        // Store reference for hit-testing from game
        this.hintTiles = [];
        this.hintExpiry = 0;

        console.log('[MahjongRenderer] Initialized with BaseRenderer + full quadray methods');
    }

    /**
     * Project a Quadray to 2D screen space — convenience helper.
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

        this._drawTiles();
        this._drawHoverTooltip();
        this._drawBoardHUD();
    }

    /**
     * Draw all visible tiles with layer depth sorting.
     * Preserves all original visual effects: shadow, face, selection, hint.
     */
    _drawTiles() {
        const ctx = this.ctx;
        const board = this.board;

        // Sort by layer (back to front)
        const visible = board.tiles.filter(t => !t.matched).sort((a, b) => a.layer - b.layer);
        for (const tile of visible) {
            const p = this._projectQ(tile.toQuadray());
            const tw = 14 * p.scale, th = 18 * p.scale;
            const exposed = board.isExposed(tile);

            // Shadow
            ctx.fillStyle = 'rgba(0,0,0,0.3)';
            ctx.fillRect(p.x - tw + 2, p.y - th + 2, tw * 2, th * 2);

            // Tile face
            ctx.fillStyle = exposed ? '#f5f0e8' : '#c0b8a8';
            ctx.fillRect(p.x - tw, p.y - th, tw * 2, th * 2);

            // Hint glow
            const isHint = this.hintTiles && performance.now() < this.hintExpiry && this.hintTiles.includes(tile);

            // Selection / hint border
            ctx.strokeStyle = board.selected === tile ? '#ffff00' : isHint ? '#00ff88' : '#999';
            ctx.lineWidth = (board.selected === tile || isHint) ? 2 : 0.5;
            ctx.strokeRect(p.x - tw, p.y - th, tw * 2, th * 2);

            if (isHint) {
                ctx.fillStyle = 'rgba(0,255,136,0.15)';
                ctx.fillRect(p.x - tw, p.y - th, tw * 2, th * 2);
            }

            // Suit color pip
            ctx.fillStyle = TILE_COLORS[tile.suit] || '#888';
            ctx.font = `bold ${10 * p.scale}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${tile.suit[0].toUpperCase()}${tile.value}`, p.x, p.y);
        }
    }

    /**
     * Draw hover tooltip near cursor.
     */
    _drawHoverTooltip() {
        const ctx = this.ctx;
        const board = this.board;
        const visible = board.tiles.filter(t => !t.matched);

        let closestDist = 20, hoveredTile = null;
        for (const tile of visible) {
            const p = this._projectQ(tile.toQuadray());
            const dx = this.mouseX - p.x, dy = this.mouseY - p.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < closestDist) { closestDist = dist; hoveredTile = { tile, p }; }
        }
        if (hoveredTile && !this.isDragging) {
            const ht = hoveredTile, tp = ht.tile.pos;
            const label = `${ht.tile.suit} ${ht.tile.value} L${ht.tile.layer} Q(${tp.a},${tp.b},${tp.c},${tp.d})`;
            ctx.font = '12px monospace'; ctx.textAlign = 'left'; ctx.textBaseline = 'bottom';
            const tw = ctx.measureText(label).width;
            const tx = this.mouseX + 14, ty = this.mouseY - 10;
            ctx.fillStyle = 'rgba(0,0,0,0.8)';
            ctx.beginPath(); ctx.roundRect(tx - 4, ty - 16, tw + 8, 20, 4); ctx.fill();
            ctx.fillStyle = '#d4c088'; ctx.fillText(label, tx, ty);
        }
    }

    /**
     * Draw HUD overlay on the canvas using BaseRenderer._drawHUD().
     */
    _drawBoardHUD() {
        const meta = this.board.getMetadata();

        const status = meta.isComplete ? 'YOU WIN!'
            : meta.isStuck ? 'No moves — press R to shuffle'
            : `Tiles: ${meta.remainingTiles} | Score: ${meta.score} | Moves: ${meta.moves}`;

        const lines = [
            status,
            `Tetra: ${meta.tetraCount} | Octa: ${meta.octaCount}`,
            `Vol T:O:C=${meta.volumeRatios.tetra}:${meta.volumeRatios.octa}:${meta.volumeRatios.cubo}`,
        ];
        this._drawHUD(lines, { color: 'rgba(148, 163, 184, 0.7)', fontSize: 11 });

        // Win overlay
        const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
        if (meta.isComplete) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, h / 2 - 30, w, 60);
            ctx.fillStyle = '#ffcc00';
            ctx.font = 'bold 24px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('YOU WIN!', w / 2, h / 2);
        } else if (meta.isStuck) {
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(0, h / 2 - 20, w, 40);
            ctx.fillStyle = '#ff6644';
            ctx.font = '16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('No moves available — press R to shuffle', w / 2, h / 2);
        }
    }

    /**
     * Hit-test a screen coordinate against visible tiles.
     * Tests front-to-back (highest layer first) for correct occlusion.
     * @param {number} mx - Screen X
     * @param {number} my - Screen Y
     * @returns {MahjongTile|null}
     */
    hitTest(mx, my) {
        const tiles = this.board.tiles.filter(t => !t.matched).sort((a, b) => b.layer - a.layer);
        for (const t of tiles) {
            const p = this._projectQ(t.toQuadray());
            if (Math.abs(p.x - mx) < 14 * p.scale && Math.abs(p.y - my) < 18 * p.scale) {
                return t;
            }
        }
        return null;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MahjongRenderer };
}
