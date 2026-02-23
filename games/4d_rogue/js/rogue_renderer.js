/**
 * rogue_renderer.js — 4D Rogue Canvas Renderer
 *
 * Renders the IVM dungeon with fog-of-war, parity-based cell shapes,
 * enemy health bars, item glows, and depth-based alpha.
 *
 * Uses: BaseRenderer, GridUtils.depthSort, Quadray.cellType, projectQuadray
 *
 * @module RogueRenderer
 */

if (typeof BaseRenderer === 'undefined' && typeof require !== 'undefined') {
    const _br = require('../../4d_generic/base_renderer.js');
    globalThis.BaseRenderer = _br.BaseRenderer;
}

class RogueRenderer extends BaseRenderer {
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 35,
            cameraDist: 600,
            rotX: 0.4,
            rotY: 0.6,
            bgColor: '#0a0a0a',
        });

        this.tileColors = {
            0: 'rgba(45, 45, 45, 0.6)',    // Floor
            1: '#3d3d3d',                    // Wall
            2: '#48bb78',                    // Player
            3: '#e74c3c',                    // Enemy
            4: '#f1c40f',                    // Stairs
            5: '#e91e63',                    // Potion
            6: '#ffd700',                    // Gold
            7: '#ff6b6b',                    // Weapon
            8: '#4ecdc4',                    // Armor
        };

        this.animTime = 0;
        console.log('[RogueRenderer] Initialized with FOV, parity shapes, enemy HP bars');
    }

    /** Main render loop. */
    render() {
        this._clearCanvas();
        this._drawAxes();
        this.animTime += 0.03;

        const cells = GridUtils.generateGrid(this.board.size);
        const projected = this._projectCells(cells);

        // Sort by depth (back-to-front)
        projected.sort((a, b) => a.pScale - b.pScale);

        // Draw all cells
        for (const p of projected) {
            this._drawCell(p);
        }

        // Draw enemies (on top)
        for (const enemy of this.board.enemies) {
            if (this.board.isVisible(enemy.pos)) {
                this._drawEnemy(enemy);
            }
        }

        // Draw player (always on top)
        if (this.board.player) {
            this._drawPlayer();
        }

        // Draw HUD
        this._drawDungeonHUD();
    }

    /** Project all cells to screen coordinates. */
    _projectCells(cells) {
        if (typeof projectQuadray !== 'function') return [];
        const W = this.canvas.width, H = this.canvas.height;
        return cells.map(c => {
            const p = projectQuadray(c.a, c.b, c.c, c.d, W, H, this.camera);
            return { ...c, px: p.x, py: p.y, pScale: p.scale };
        });
    }

    /** Draw a single cell with FOV-aware rendering. */
    _drawCell(p) {
        const { ctx } = this;
        const tile = this.board.getCell(p);
        const isVisible = this.board.isVisible(p);
        const isExplored = this.board.isExplored(p);

        if (!isExplored) return; // Never seen — don't render

        const r = Math.max(2, 8 * p.pScale);
        const parity = Quadray.cellType(p.a, p.b, p.c, p.d);
        const alpha = isVisible ? 1.0 : 0.25; // Dim explored-but-not-visible

        ctx.save();
        ctx.globalAlpha = alpha * Math.max(0.3, p.pScale);

        if (tile === 1) {
            // Wall — filled square
            ctx.fillStyle = this.tileColors[1];
            ctx.fillRect(p.px - r * 0.6, p.py - r * 0.6, r * 1.2, r * 1.2);
        } else if (tile === 4) {
            // Stairs — yellow triangle, pulsing
            const pulse = 0.8 + Math.sin(this.animTime * 3) * 0.2;
            ctx.fillStyle = this.tileColors[4];
            ctx.globalAlpha *= pulse;
            ctx.beginPath();
            ctx.moveTo(p.px, p.py - r * 1.3);
            ctx.lineTo(p.px + r, p.py + r);
            ctx.lineTo(p.px - r, p.py + r);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#f39c12';
            ctx.lineWidth = 1;
            ctx.stroke();
        } else if (tile === 5 || tile === 6 || tile === 7 || tile === 8) {
            // Items — glowing circles/diamonds
            const itemColor = this.tileColors[tile];
            const glowPhase = (Math.sin(this.animTime * 2 + p.a + p.b) + 1) / 2;
            ctx.shadowColor = itemColor;
            ctx.shadowBlur = 5 + glowPhase * 8;
            ctx.fillStyle = itemColor;

            if (parity === 'tetra') {
                this._drawDiamond(p.px, p.py, r * 0.7, itemColor);
            } else {
                ctx.beginPath();
                ctx.arc(p.px, p.py, r * 0.6, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.shadowBlur = 0;
        } else if (tile === 0) {
            // Floor — subtle dot based on parity
            ctx.fillStyle = isVisible ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)';
            if (parity === 'tetra') {
                this._drawDiamond(p.px, p.py, r * 0.2, ctx.fillStyle);
            } else {
                ctx.beginPath();
                ctx.arc(p.px, p.py, r * 0.15, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        // Player/Enemy tiles rendered separately

        ctx.restore();
    }

    /** Draw the player character. */
    _drawPlayer() {
        if (!this.board.player) return;
        const { ctx } = this;
        const p = this._projectOne(this.board.player);
        if (!p) return;
        const r = Math.max(4, 10 * p.pScale);

        // Player glow
        const pulse = 0.8 + Math.sin(this.animTime * 2) * 0.2;
        ctx.save();
        ctx.shadowColor = '#48bb78';
        ctx.shadowBlur = 8 + pulse * 6;
        ctx.fillStyle = '#48bb78';
        ctx.beginPath();
        ctx.arc(p.px, p.py, r * 1.1, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright
        ctx.fillStyle = '#68d391';
        ctx.beginPath();
        ctx.arc(p.px, p.py, r * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // @ symbol
        ctx.fillStyle = '#0a0a0a';
        ctx.font = `bold ${Math.max(8, r)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('@', p.px, p.py);
        ctx.restore();

        // HP bar above player
        this._drawHPBar(p.px, p.py - r * 1.8, r * 2, this.board.hp, this.board.maxHp, '#48bb78');
    }

    /** Draw an enemy with type-specific rendering and HP bar. */
    _drawEnemy(enemy) {
        const { ctx } = this;
        const p = this._projectOne(enemy.pos);
        if (!p) return;
        const r = Math.max(4, 9 * p.pScale);

        ctx.save();
        ctx.fillStyle = enemy.color;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = 4;

        // Different shapes for different enemy types
        if (enemy.type === 'goblin') {
            // Small circle
            ctx.beginPath();
            ctx.arc(p.px, p.py, r * 0.8, 0, Math.PI * 2);
            ctx.fill();
        } else if (enemy.type === 'ogre') {
            // Large square
            ctx.fillRect(p.px - r, p.py - r, r * 2, r * 2);
        } else if (enemy.type === 'wraith') {
            // Diamond (phasing entity)
            this._drawDiamond(p.px, p.py, r * 1.1, enemy.color);
            ctx.globalAlpha = 0.5 + Math.sin(this.animTime * 4) * 0.3;
        } else {
            // Skeleton — default square
            ctx.fillRect(p.px - r * 0.7, p.py - r * 0.7, r * 1.4, r * 1.4);
        }

        // Enemy symbol
        ctx.fillStyle = '#0a0a0a';
        ctx.font = `bold ${Math.max(7, r * 0.8)}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(enemy.symbol, p.px, p.py);
        ctx.restore();

        // HP bar
        this._drawHPBar(p.px, p.py - r * 1.5, r * 1.6, enemy.hp, enemy.maxHp, enemy.color);
    }

    /** Draw a small HP bar. */
    _drawHPBar(x, y, width, hp, maxHp, color) {
        const { ctx } = this;
        const h = 3;
        const ratio = hp / maxHp;

        ctx.save();
        // Background
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(x - width / 2, y, width, h);
        // HP fill
        ctx.fillStyle = ratio > 0.5 ? color : (ratio > 0.25 ? '#f39c12' : '#e74c3c');
        ctx.fillRect(x - width / 2, y, width * ratio, h);
        // Border
        ctx.strokeStyle = 'rgba(255,255,255,0.2)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x - width / 2, y, width, h);
        ctx.restore();
    }

    /** Project a single cell to screen coords. */
    _projectOne(pos) {
        if (typeof projectQuadray !== 'function') return null;
        const W = this.canvas.width, H = this.canvas.height;
        const p = projectQuadray(pos.a, pos.b, pos.c, pos.d, W, H, this.camera);
        return { px: p.x, py: p.y, pScale: p.scale };
    }

    /** Draw the IVM dungeon HUD overlay. */
    _drawDungeonHUD() {
        const meta = this.board.getMetadata();
        const status = meta.gameOver
            ? `☠️ Dead! Depth: ${meta.depth} | Gold: ${meta.gold}`
            : `Depth ${meta.depth} | Move ${meta.moveCount}`;
        const lines = [
            status,
            `HP: ${meta.hp}/${meta.maxHp} | Lv${meta.level} (${meta.xp}/${meta.xpToLevel})`,
            `ATK: ${meta.attack} | DEF: ${meta.defense} | 🧪${meta.potions}`,
        ];
        this._drawHUD(lines, { color: 'rgba(148, 163, 184, 0.7)', fontSize: 11 });
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RogueRenderer };
}