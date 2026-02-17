/**
 * doom_fx.js — Visual Effects Engine for Synergetics Doom
 * 
 * Renders advanced visual effects on top of the base FPS view:
 *   - Animated IVM floor grid with energy pulse waves
 *   - 4D hyperplane cross-section glow
 *   - Concentric Hierarchy ring visualization
 *   - Jitterbug phase animation
 *   - IVM starfield ceiling with nebula clouds and constellations
 *   - Cell parity corner markers
 *   - Screen shake on damage
 *   - Kill streak border pulse
 */

import { COLORS, IVM, CELL } from './doom_config.js';
import { CONCENTRIC_HIERARCHY, HIERARCHY_ORDER, jitterbugTransform, analyzeFrequency, localFrequency } from './doom_geometry.js';
import { Quadray } from './quadray.js';

export class SynergeticsFX {
    constructor() {
        this.time = 0;
        this.jitterbugPhase = 0;
        this.jitterbugSpeed = 0.005;
        this.jitterbugDirection = 1;
        this.starfield = this._generateStarfield(250);
        this.nebulaClouds = this._generateNebulae(12);
        this.frequencyData = null;
        this.screenShake = { x: 0, y: 0, intensity: 0 };
    }

    /** Update animation state each frame */
    update(dt, player, map) {
        this.time += dt || 16;

        // Jitterbug oscillation (bounces VE ↔ Octa)
        this.jitterbugPhase += this.jitterbugSpeed * this.jitterbugDirection;
        if (this.jitterbugPhase >= 1) { this.jitterbugPhase = 1; this.jitterbugDirection = -1; }
        if (this.jitterbugPhase <= 0) { this.jitterbugPhase = 0; this.jitterbugDirection = 1; }

        // Update frequency data every ~30 frames
        if (player && map && Math.floor(this.time / 500) !== Math.floor((this.time - 16) / 500)) {
            this.frequencyData = localFrequency(map, player.a, player.b, player.c, player.d);
        }

        // Decay screen shake
        if (this.screenShake.intensity > 0) {
            this.screenShake.intensity *= 0.85;
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity * 8;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity * 8;
            if (this.screenShake.intensity < 0.01) {
                this.screenShake.intensity = 0;
                this.screenShake.x = 0;
                this.screenShake.y = 0;
            }
        }
    }

    /** Trigger screen shake (called on damage) */
    triggerShake(intensity = 1.0) {
        this.screenShake.intensity = Math.min(1, this.screenShake.intensity + intensity);
    }

    // ─── IVM Starfield Ceiling ──────────────────────────────────────
    _generateStarfield(count) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random(),
                y: Math.random(),
                size: 0.3 + Math.random() * 2.2,
                brightness: 0.2 + Math.random() * 0.8,
                twinklePhase: Math.random() * Math.PI * 2,
                twinkleSpeed: 0.3 + Math.random() * 2.5,
                constellation: Math.random() < 0.12,
                color: Math.random() < 0.3 ? 'cyan' : Math.random() < 0.5 ? 'warm' : 'white'
            });
        }
        return stars;
    }

    _generateNebulae(count) {
        const nebulae = [];
        for (let i = 0; i < count; i++) {
            nebulae.push({
                x: Math.random(),
                y: Math.random() * 0.7,
                r: 30 + Math.random() * 80,
                hue: Math.random() < 0.5 ? 'purple' : 'cyan',
                alpha: 0.01 + Math.random() * 0.025,
                driftSpeed: 0.001 + Math.random() * 0.003
            });
        }
        return nebulae;
    }

    renderStarfield(ctx, player, W, H) {
        const halfH = H / 2;
        const t = this.time / 1000;

        ctx.save();

        // Nebula clouds (very subtle colorful haze)
        for (const nb of this.nebulaClouds) {
            const nx = ((nb.x * W + player.angle * 20 + t * nb.driftSpeed * 100) % W + W) % W;
            const ny = nb.y * halfH;
            const grad = ctx.createRadialGradient(nx, ny, 0, nx, ny, nb.r);
            const baseColor = nb.hue === 'purple' ? '120, 40, 180' : '40, 160, 200';
            grad.addColorStop(0, `rgba(${baseColor}, ${nb.alpha * 1.5})`);
            grad.addColorStop(0.5, `rgba(${baseColor}, ${nb.alpha * 0.5})`);
            grad.addColorStop(1, `rgba(${baseColor}, 0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(nx - nb.r, ny - nb.r, nb.r * 2, nb.r * 2);
        }

        // Stars
        for (const star of this.starfield) {
            const sx = ((star.x * W + player.angle * 50 * star.brightness) % W + W) % W;
            const sy = star.y * halfH * 0.85;

            const twinkle = 0.5 + 0.5 * Math.sin(t * star.twinkleSpeed + star.twinklePhase);
            const alpha = star.brightness * twinkle * 0.8;

            if (star.constellation) {
                // IVM constellation stars — small tetrahedra with glow
                const ts = star.size * 1.8;
                ctx.fillStyle = `rgba(100, 255, 255, ${alpha})`;
                ctx.shadowColor = 'rgba(100, 255, 255, 0.5)';
                ctx.shadowBlur = 4;
                ctx.beginPath();
                ctx.moveTo(sx, sy - ts);
                ctx.lineTo(sx + ts, sy + ts);
                ctx.lineTo(sx - ts, sy + ts);
                ctx.closePath();
                ctx.fill();
                ctx.shadowBlur = 0;
            } else {
                const starColor = star.color === 'cyan' ? `rgba(150, 220, 255, ${alpha})` :
                    star.color === 'warm' ? `rgba(255, 220, 180, ${alpha})` :
                        `rgba(255, 255, 255, ${alpha})`;
                ctx.fillStyle = starColor;
                ctx.beginPath();
                ctx.arc(sx, sy, star.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    // ─── Concentric Hierarchy Rings ─────────────────────────────────
    renderConcentricHierarchy(ctx, x, y, radius) {
        ctx.save();
        const maxVol = CONCENTRIC_HIERARCHY.CUBOCTAHEDRON;
        const t = this.time / 1000;

        // Background circle
        ctx.fillStyle = 'rgba(2, 4, 12, 0.7)';
        ctx.beginPath();
        ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw each polyhedron as a ring
        for (let i = 0; i < HIERARCHY_ORDER.length; i++) {
            const poly = HIERARCHY_ORDER[i];
            const r = (poly.volume / maxVol) * radius;
            const pulse = 1 + 0.03 * Math.sin(t * 2 + i * 0.5);

            ctx.strokeStyle = poly.color;
            ctx.lineWidth = i === 0 ? 0.5 : 1;
            ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t + i);
            ctx.beginPath();
            ctx.arc(x, y, r * pulse, 0, Math.PI * 2);
            ctx.stroke();

            // Label the main ones
            if (poly.volume >= 1) {
                ctx.fillStyle = poly.color;
                ctx.globalAlpha = 0.8;
                ctx.font = '8px monospace';
                ctx.textAlign = 'left';
                const labelAngle = -Math.PI / 2 + i * 0.4;
                const lx = x + Math.cos(labelAngle) * (r * pulse + 3);
                const ly = y + Math.sin(labelAngle) * (r * pulse + 3);
                ctx.fillText(`${poly.symbol}=${poly.volume}`, lx, ly);
            }
        }

        // Center dot
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();

        // Title
        ctx.font = '9px monospace';
        ctx.fillStyle = COLORS.synergetics;
        ctx.textAlign = 'center';
        ctx.fillText('CONCENTRIC HIERARCHY', x, y + radius + 14);

        ctx.restore();
    }

    // ─── Jitterbug Visualization ────────────────────────────────────
    renderJitterbug(ctx, x, y, radius) {
        const jb = jitterbugTransform(this.jitterbugPhase);
        ctx.save();

        // Background
        ctx.fillStyle = 'rgba(2, 4, 12, 0.6)';
        ctx.beginPath();
        ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw projected vertices
        const scale = radius * 0.4;
        ctx.strokeStyle = COLORS.neonCyan;
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.7;

        const projected = jb.vertices.map(v => ({
            px: x + v.x * scale,
            py: y + v.y * scale
        }));

        // Draw edges
        for (let i = 0; i < projected.length; i++) {
            for (let j = i + 1; j < projected.length; j++) {
                const dx = projected[i].px - projected[j].px;
                const dy = projected[i].py - projected[j].py;
                if (Math.sqrt(dx * dx + dy * dy) < radius * 0.8) {
                    ctx.beginPath();
                    ctx.moveTo(projected[i].px, projected[i].py);
                    ctx.lineTo(projected[j].px, projected[j].py);
                    ctx.stroke();
                }
            }
        }

        // Draw vertices with glow
        ctx.globalAlpha = 1;
        for (const p of projected) {
            ctx.fillStyle = COLORS.neonCyan;
            ctx.shadowColor = COLORS.neonCyan;
            ctx.shadowBlur = 4;
            ctx.beginPath();
            ctx.arc(p.px, p.py, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.shadowBlur = 0;

        // Phase label
        ctx.font = '9px monospace';
        ctx.fillStyle = COLORS.neonCyan;
        ctx.textAlign = 'center';
        ctx.fillText(jb.name, x, y + radius + 10);
        ctx.fillStyle = COLORS.synergetics;
        ctx.fillText(`${jb.volume.toFixed(1)} TV`, x, y + radius + 20);

        ctx.restore();
    }

    // ─── Animated Floor Grid (Energy Pulse) ──────────────────────────
    renderAnimatedFloorGrid(ctx, player, W, H) {
        const halfH = H / 2;
        const t = this.time / 1000;
        const gridSpacing = 80;
        const depth = 12;

        ctx.save();

        for (let row = 0; row < depth; row++) {
            const screenY = halfH + (row + 1) * (halfH / depth);
            const rowAlpha = Math.max(0.02, 0.25 - row * 0.02);
            const rowScale = (row + 1) / depth;

            // Energy pulse wave (radiates outward from player)
            const pulseWave = Math.sin(t * 3 - row * 0.4) * 0.5 + 0.5;
            const pulse = 1 + 0.06 * pulseWave;

            // Horizontal lines
            ctx.strokeStyle = COLORS.ivm;
            ctx.globalAlpha = rowAlpha * pulse;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(0, screenY);
            ctx.lineTo(W, screenY);
            ctx.stroke();

            // Perspective-scaled vertical + diagonal lines (IVM pattern)
            const spacing = gridSpacing * rowScale;
            const offset = (player.a * spacing * 0.3) % spacing;

            for (let x = -spacing; x < W + spacing; x += spacing) {
                const sx = x - offset;

                // Vertical grid
                ctx.globalAlpha = rowAlpha * 0.5 * pulse;
                ctx.beginPath();
                ctx.moveTo(sx, screenY);
                ctx.lineTo(sx, screenY + halfH / depth);
                ctx.stroke();

                // Diagonal lines (IVM tessellation)
                ctx.globalAlpha = rowAlpha * 0.3;
                ctx.strokeStyle = COLORS.synergetics;
                ctx.beginPath();
                ctx.moveTo(sx, screenY);
                ctx.lineTo(sx + spacing / 2, screenY + halfH / depth);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(sx, screenY);
                ctx.lineTo(sx - spacing / 2, screenY + halfH / depth);
                ctx.stroke();
                ctx.strokeStyle = COLORS.ivm;
            }

            // Energy pulse highlight (bright line that sweeps)
            if (pulseWave > 0.7) {
                ctx.strokeStyle = COLORS.synergetics;
                ctx.globalAlpha = (pulseWave - 0.7) * 0.5;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, screenY);
                ctx.lineTo(W, screenY);
                ctx.stroke();
            }
        }

        ctx.restore();
    }

    // ─── Hyperplane Cross-Section Glow ──────────────────────────────
    renderHyperplaneGlow(ctx, player, W, H) {
        const t = this.time / 1000;
        const halfH = H / 2;

        const cFrac = player.c - Math.floor(player.c);
        const dFrac = player.d - Math.floor(player.d);
        const nearBoundary = Math.min(cFrac, 1 - cFrac, dFrac, 1 - dFrac);

        if (nearBoundary < 0.3) {
            const intensity = (0.3 - nearBoundary) / 0.3;
            const pulse = 0.5 + 0.5 * Math.sin(t * 4);

            const grad = ctx.createLinearGradient(0, halfH - 30, 0, halfH + 30);
            grad.addColorStop(0, `rgba(80, 180, 255, 0)`);
            grad.addColorStop(0.5, `rgba(80, 180, 255, ${intensity * pulse * 0.12})`);
            grad.addColorStop(1, `rgba(80, 180, 255, 0)`);

            ctx.fillStyle = grad;
            ctx.fillRect(0, halfH - 30, W, 60);
        }
    }

    // ─── Frequency Display ──────────────────────────────────────────
    renderFrequencyInfo(ctx, x, y) {
        if (!this.frequencyData) return;

        ctx.save();
        const fd = this.frequencyData;
        const fa = analyzeFrequency(fd.localFreq);

        ctx.font = '9px monospace';
        ctx.fillStyle = COLORS.synergetics;
        ctx.textAlign = 'left';
        ctx.fillText(`Freq-${fa.frequency}:`, x, y);
        ctx.fillStyle = '#aaa';
        ctx.fillText(`Shell: ${fa.shellVertices}V`, x, y + 11);
        ctx.fillText(`${fa.ratio}`, x, y + 22);
        ctx.fillText(`Node: ${fd.distToNode.toFixed(2)}`, x, y + 33);

        ctx.restore();
    }

    // ─── Cell Parity Edge Highlighting — Corner Marks ────────────────
    renderParityIndicator(ctx, player, W, H) {
        const parity = (Math.round(player.a) + Math.round(player.b) +
            Math.round(player.c) + Math.round(player.d)) % 2;

        const color = parity === 0 ? COLORS.glowTetra : COLORS.glowOcta;
        const ts = 35;
        const t = this.time / 1000;
        const pulse = 0.12 + 0.06 * Math.sin(t * 2);

        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.fillStyle = color;

        // Top-left corner triangle (A-axis)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(ts, 0);
        ctx.lineTo(0, ts);
        ctx.closePath();
        ctx.fill();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(W, 0);
        ctx.lineTo(W - ts, 0);
        ctx.lineTo(W, ts);
        ctx.closePath();
        ctx.fill();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(0, H);
        ctx.lineTo(ts, H);
        ctx.lineTo(0, H - ts);
        ctx.closePath();
        ctx.fill();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(W, H);
        ctx.lineTo(W - ts, H);
        ctx.lineTo(W, H - ts);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
    }

    // ─── Death Screen Stats ─────────────────────────────────────────
    renderDeathStats(ctx, game, W, H) {
        if (game.player.alive) return;

        ctx.save();
        ctx.fillStyle = 'rgba(2, 4, 12, 0.5)';
        ctx.fillRect(W / 2 - 160, H / 2 + 50, 320, 160);
        ctx.strokeStyle = COLORS.hudBorder;
        ctx.lineWidth = 1;
        ctx.strokeRect(W / 2 - 160, H / 2 + 50, 320, 160);

        ctx.font = '12px monospace';
        ctx.fillStyle = COLORS.synergetics;
        ctx.textAlign = 'center';
        ctx.fillText('◆ SYNERGETICS POST-MORTEM ◆', W / 2, H / 2 + 70);

        ctx.textAlign = 'left';
        ctx.font = '10px monospace';
        ctx.fillStyle = '#ccc';
        const x = W / 2 - 140;
        let y = H / 2 + 90;

        const q = game.player.quadray;
        ctx.fillText(`Final Position: (${q.a.toFixed(1)}, ${q.b.toFixed(1)}, ${q.c.toFixed(1)}, ${q.d.toFixed(1)})`, x, y); y += 14;
        ctx.fillText(`Cell Parity: ${game.player.cellParity.toUpperCase()}`, x, y); y += 14;
        ctx.fillText(`Score: ${game.player.score}`, x, y); y += 14;
        ctx.fillText(`IVM Cells Explored: ${game.map.cells.size}`, x, y); y += 14;

        const jb = jitterbugTransform(this.jitterbugPhase);
        ctx.fillText(`Jitterbug Phase: ${jb.name} (${jb.volume.toFixed(1)} TV)`, x, y); y += 14;

        ctx.fillStyle = COLORS.synergetics;
        ctx.fillText(`T:O:C = 1:4:20 tetravolumes`, x, y);

        ctx.restore();
    }

    // ─── Master Render (call from game loop) ────────────────────────
    renderAll(ctx, game, W, H) {
        const player = game.player;

        // Apply screen shake transform
        if (this.screenShake.intensity > 0) {
            ctx.save();
            ctx.translate(this.screenShake.x, this.screenShake.y);
        }

        // Background effects
        this.renderStarfield(ctx, player, W, H);
        this.renderAnimatedFloorGrid(ctx, player, W, H);
        this.renderHyperplaneGlow(ctx, player, W, H);
        this.renderParityIndicator(ctx, player, W, H);

        // Concentric Hierarchy visualization
        this.renderConcentricHierarchy(ctx, 75, H - 290, 45);

        // Jitterbug animation
        this.renderJitterbug(ctx, 75, H - 410, 40);

        // Frequency info
        this.renderFrequencyInfo(ctx, 15, H - 360);

        // Death screen overlay
        this.renderDeathStats(ctx, game, W, H);

        // Restore shake transform
        if (this.screenShake.intensity > 0) {
            ctx.restore();
        }
    }
}
