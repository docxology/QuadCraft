/**
 * doom_render_fps.js — Futuristic Column Raycaster for 4D Doom
 * 
 * Uses DDA (Digital Differential Analyzer) to cast rays in the (A,B) plane,
 * sliced at the player's current (C,D) position in the 4D IVM hypercube.
 * 
 * Features:
 *   - Per-column wall rendering with atmospheric fog
 *   - 128px procedural wall textures with animated energy lines
 *   - Neon glow edge highlighting at cell-type boundaries
 *   - Ambient sky gradient with subtle nebula tones
 *   - Z-buffer for proper sprite occlusion
 *   - Billboard sprite rendering for enemies/pickups/particles
 *   - Circular minimap with glow effects and IVM grid overlay
 *   - Crystalline energy weapon with animated pulse
 *   - Glassmorphism HUD with gradient bars
 *   - Animated tetrahedral crosshair
 *   - Scanline + vignette post-processing
 */
import { CELL, RENDER, COLORS } from './doom_config.js';
import { Quadray } from './quadray.js';

export class DoomRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.zBuffer = new Float64Array(canvas.width);
        this.time = 0;

        // Pre-generate textures (Synergetics patterns)
        this.wallTextures = {};
        this.generateTextures();
    }

    resize(w, h) {
        this.canvas.width = w;
        this.canvas.height = h;
        this.zBuffer = new Float64Array(w);
    }

    // ─── Procedural Wall Textures (Tetrahedral Synergetics) ─────────────
    generateTextures() {
        const S = RENDER.TEXTURE_SIZE;
        this.wallTextures[CELL.WALL] = this.makeWallTexture('#120408', '#ff2244', '#ff4466', 'tetra', S);
        this.wallTextures[CELL.WALL2] = this.makeWallTexture('#041208', '#00ff55', '#44ff88', 'tetra', S);
        this.wallTextures[CELL.WALL3] = this.makeWallTexture('#040812', '#2266ff', '#44aaff', 'tetra', S);
        this.wallTextures[CELL.TETRA_WALL] = this.makeWallTexture('#0c0318', '#aa44ff', '#cc66ff', 'tetra', S);
        this.wallTextures[CELL.OCTA_WALL] = this.makeWallTexture('#031812', '#00ffaa', '#44ffcc', 'octa', S);
    }

    makeWallTexture(bgColor, lineColor, accentColor, pattern, size = 128) {
        const s = size;
        const c = document.createElement('canvas');
        c.width = s; c.height = s;
        const x = c.getContext('2d');

        // Base fill with gradient
        const bg = x.createLinearGradient(0, 0, 0, s);
        bg.addColorStop(0, bgColor);
        bg.addColorStop(0.5, lighten(bgColor, 1.3));
        bg.addColorStop(1, bgColor);
        x.fillStyle = bg;
        x.fillRect(0, 0, s, s);

        x.strokeStyle = lineColor;
        x.fillStyle = lineColor;

        if (pattern === 'tetra') {
            // Tetrahedral: interlocking upward/downward triangles with energy lines
            const h = s / 4;
            x.lineWidth = 1.5;
            for (let row = 0; row < 4; row++) {
                const y0 = row * h;
                for (let col = 0; col < 4; col++) {
                    const x0 = col * (s / 4);
                    // Upward triangle
                    x.beginPath();
                    x.moveTo(x0, y0 + h);
                    x.lineTo(x0 + h / 2, y0);
                    x.lineTo(x0 + h, y0 + h);
                    x.closePath();
                    x.stroke();
                    // Downward triangle (inverted, offset)
                    x.beginPath();
                    x.moveTo(x0 + h / 2, y0);
                    x.lineTo(x0 + h, y0 + h);
                    x.lineTo(x0 + h * 1.5, y0);
                    x.closePath();
                    x.stroke();
                }
            }
            // Energy flow lines (horizontal, thin, with accent)
            x.strokeStyle = accentColor;
            x.lineWidth = 0.5;
            x.globalAlpha = 0.3;
            for (let ey = 0; ey < s; ey += 8) {
                x.beginPath();
                x.moveTo(0, ey);
                for (let ex = 0; ex < s; ex += 4) {
                    x.lineTo(ex, ey + Math.sin(ex * 0.3 + ey * 0.1) * 1.5);
                }
                x.stroke();
            }
            x.globalAlpha = 1.0;
            // Vertex dots with glow
            x.fillStyle = accentColor;
            for (let row = 0; row <= 4; row++) {
                for (let col = 0; col <= 4; col++) {
                    x.globalAlpha = 0.6;
                    x.beginPath();
                    x.arc(col * (s / 4), row * (s / 4), 2.5, 0, Math.PI * 2);
                    x.fill();
                    // Glow halo
                    x.globalAlpha = 0.15;
                    x.beginPath();
                    x.arc(col * (s / 4), row * (s / 4), 5, 0, Math.PI * 2);
                    x.fill();
                    // Mid-points
                    if (row < 4) {
                        x.globalAlpha = 0.4;
                        x.beginPath();
                        x.arc(col * (s / 4) + s / 8, row * (s / 4), 1.5, 0, Math.PI * 2);
                        x.fill();
                    }
                }
            }
            x.globalAlpha = 1.0;
        } else if (pattern === 'octa') {
            // Octahedral: diamond lattice with internal cross and glow
            x.lineWidth = 1.5;
            const cs = s / 4;
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 4; col++) {
                    const cx = col * cs + cs / 2;
                    const cy = row * cs + cs / 2;
                    const half = cs / 2;
                    // Diamond
                    x.beginPath();
                    x.moveTo(cx, cy - half);
                    x.lineTo(cx + half, cy);
                    x.lineTo(cx, cy + half);
                    x.lineTo(cx - half, cy);
                    x.closePath();
                    x.stroke();
                    // Internal cross
                    x.beginPath();
                    x.moveTo(cx - half / 2, cy - half / 2);
                    x.lineTo(cx + half / 2, cy + half / 2);
                    x.moveTo(cx + half / 2, cy - half / 2);
                    x.lineTo(cx - half / 2, cy + half / 2);
                    x.stroke();
                }
            }
            // Accent energy lines
            x.strokeStyle = accentColor;
            x.lineWidth = 0.5;
            x.globalAlpha = 0.25;
            for (let ey = 0; ey < s; ey += 6) {
                x.beginPath();
                x.moveTo(0, ey);
                x.lineTo(s, ey + Math.sin(ey * 0.2) * 3);
                x.stroke();
            }
            x.globalAlpha = 1.0;
            // Vertex dots
            x.fillStyle = accentColor;
            for (let row = 0; row <= 4; row++) {
                for (let col = 0; col <= 4; col++) {
                    x.globalAlpha = 0.6;
                    x.beginPath();
                    x.arc(col * cs, row * cs, 2, 0, Math.PI * 2);
                    x.fill();
                    x.globalAlpha = 0.12;
                    x.beginPath();
                    x.arc(col * cs, row * cs, 4, 0, Math.PI * 2);
                    x.fill();
                }
            }
            x.globalAlpha = 1.0;
        }

        // Subtle noise for organic variation
        const id = x.getImageData(0, 0, s, s);
        for (let i = 0; i < id.data.length; i += 4) {
            const n = (Math.random() - 0.5) * 12;
            id.data[i] = Math.max(0, Math.min(255, id.data[i] + n));
            id.data[i + 1] = Math.max(0, Math.min(255, id.data[i + 1] + n));
            id.data[i + 2] = Math.max(0, Math.min(255, id.data[i + 2] + n));
        }
        x.putImageData(id, 0, 0);
        return c;
    }

    // ─── Main Render ──────────────────────────────────────────────────
    render(game) {
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;
        const player = game.player;
        this.time = performance.now();

        const slice = game.map.getSlice(player.c, player.d);
        const mapSize = game.map.size;

        // ── 1. Sky gradient (deep space) ──
        const skyGrad = ctx.createLinearGradient(0, 0, 0, H / 2);
        skyGrad.addColorStop(0, '#020008');
        skyGrad.addColorStop(0.3, '#060218');
        skyGrad.addColorStop(0.6, '#0c0428');
        skyGrad.addColorStop(1, '#180a30');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, H / 2);

        // ── 2. Floor gradient (warm depth) ──
        const floorGrad = ctx.createLinearGradient(0, H / 2, 0, H);
        floorGrad.addColorStop(0, '#140a04');
        floorGrad.addColorStop(0.4, '#201008');
        floorGrad.addColorStop(0.8, '#2a1810');
        floorGrad.addColorStop(1, '#342018');
        ctx.fillStyle = floorGrad;
        ctx.fillRect(0, H / 2, W, H / 2);

        // ── 3. Raycasting (DDA) ──
        const fov = RENDER.FOV;
        const halfFov = fov / 2;
        const numRays = W;
        const texSize = RENDER.TEXTURE_SIZE;

        let prevCellType = -1;
        const edgeColumns = []; // Track edges for glow pass

        for (let col = 0; col < numRays; col++) {
            const cameraX = 2 * col / numRays - 1;
            const rayAngle = player.angle + cameraX * halfFov;
            const rayDirA = Math.cos(rayAngle);
            const rayDirB = Math.sin(rayAngle);

            let mapA = Math.floor(player.a);
            let mapB = Math.floor(player.b);

            const deltaDistA = Math.abs(1 / rayDirA);
            const deltaDistB = Math.abs(1 / rayDirB);

            let stepA, stepB, sideDistA, sideDistB;

            if (rayDirA < 0) {
                stepA = -1;
                sideDistA = (player.a - mapA) * deltaDistA;
            } else {
                stepA = 1;
                sideDistA = (mapA + 1 - player.a) * deltaDistA;
            }
            if (rayDirB < 0) {
                stepB = -1;
                sideDistB = (player.b - mapB) * deltaDistB;
            } else {
                stepB = 1;
                sideDistB = (mapB + 1 - player.b) * deltaDistB;
            }

            let hit = false;
            let side = 0;
            let cellType = CELL.WALL;
            let steps = 0;
            const maxSteps = Math.floor(RENDER.DRAW_DISTANCE);

            while (!hit && steps < maxSteps) {
                if (sideDistA < sideDistB) {
                    sideDistA += deltaDistA;
                    mapA += stepA;
                    side = 0;
                } else {
                    sideDistB += deltaDistB;
                    mapB += stepB;
                    side = 1;
                }

                if (mapA < 0 || mapA >= mapSize || mapB < 0 || mapB >= mapSize) {
                    hit = true;
                    cellType = CELL.WALL;
                } else {
                    const cell = slice[mapA][mapB];
                    if (cell !== CELL.FLOOR && cell !== CELL.VOID) {
                        hit = true;
                        cellType = cell;
                    }
                }
                steps++;
            }

            let perpDist;
            if (side === 0) {
                perpDist = (mapA - player.a + (1 - stepA) / 2) / rayDirA;
            } else {
                perpDist = (mapB - player.b + (1 - stepB) / 2) / rayDirB;
            }

            perpDist = Math.max(perpDist, 0.01);
            this.zBuffer[col] = perpDist;

            // ── Draw wall column ──
            const lineHeight = Math.floor(H / perpDist);
            const drawStart = Math.max(0, Math.floor(H / 2 - lineHeight / 2 + player.bobAmount));
            const drawEnd = Math.min(H, Math.floor(H / 2 + lineHeight / 2 + player.bobAmount));

            // Atmospheric fog (non-linear for depth feel)
            const fogRaw = perpDist / RENDER.DRAW_DISTANCE;
            const fog = Math.max(0, 1 - fogRaw * fogRaw);
            const sideMul = side === 1 ? 0.65 : 1.0;
            const brightness = fog * sideMul;

            let wallHitPos;
            if (side === 0) {
                wallHitPos = player.b + perpDist * rayDirB;
            } else {
                wallHitPos = player.a + perpDist * rayDirA;
            }
            wallHitPos -= Math.floor(wallHitPos);

            const tex = this.wallTextures[cellType] || this.wallTextures[CELL.WALL];
            const texX = Math.floor(wallHitPos * texSize);

            if (tex && lineHeight > 0) {
                ctx.drawImage(tex, texX, 0, 1, texSize, col, drawStart, 1, drawEnd - drawStart);

                // Axis Tinting
                const axisColor = side === 0 ? COLORS.quadrayA : COLORS.quadrayB;
                ctx.fillStyle = axisColor;
                ctx.globalAlpha = 0.12;
                ctx.fillRect(col, drawStart, 1, drawEnd - drawStart);
                ctx.globalAlpha = 1.0;

                // Atmospheric distance shading (dark blue tint instead of pure black)
                const fogAmount = 1 - brightness;
                ctx.fillStyle = `rgba(4, 2, 16, ${fogAmount})`;
                ctx.fillRect(col, drawStart, 1, drawEnd - drawStart);
            }

            // Track cell-type edges for glow pass
            if (cellType !== prevCellType && prevCellType >= 0 && col > 0) {
                edgeColumns.push({ col, drawStart, drawEnd, cellType });
            }

            // Wireframe Mode (IVM_GRID_MODE === 2)
            if (RENDER.IVM_GRID_MODE === 2) {
                ctx.strokeStyle = COLORS.ivm;
                ctx.lineWidth = 1;

                // Top and Bottom edges
                ctx.fillStyle = COLORS.ivm;
                ctx.fillRect(col, drawStart, 1, 1);
                ctx.fillRect(col, drawEnd - 1, 1, 1);

                // Vertical edges at cell boundaries
                if (texX === 0 || texX === texSize - 1) {
                    ctx.globalAlpha = 0.5;
                    ctx.fillRect(col, drawStart, 1, drawEnd - drawStart);
                    ctx.globalAlpha = 1.0;
                }

                // Diagonal tetrahedral edge
                const wallH = drawEnd - drawStart;
                if (wallH > 4 && texX >= 0 && texX <= texSize - 1) {
                    const diagFrac = texX / (texSize - 1);
                    const diagY = drawStart + diagFrac * wallH;
                    ctx.globalAlpha = 0.25;
                    ctx.fillRect(col, Math.floor(diagY), 1, 1);
                    ctx.globalAlpha = 1.0;
                }
            }
            prevCellType = cellType;
        }

        // ── Neon glow pass on edges ──
        for (const edge of edgeColumns) {
            const edgeColor = edge.cellType === CELL.TETRA_WALL ? COLORS.glowTetra :
                edge.cellType === CELL.OCTA_WALL ? COLORS.glowOcta :
                    COLORS.glowWarm;
            const h = edge.drawEnd - edge.drawStart;
            // Bright core
            ctx.fillStyle = edgeColor;
            ctx.globalAlpha = RENDER.GLOW_INTENSITY * 0.8;
            ctx.fillRect(edge.col - 1, edge.drawStart, 2, h);
            // Wider soft glow
            ctx.globalAlpha = RENDER.GLOW_INTENSITY * 0.2;
            ctx.fillRect(edge.col - 3, edge.drawStart, 6, h);
            // Widest bloom
            ctx.globalAlpha = RENDER.GLOW_INTENSITY * 0.06;
            ctx.fillRect(edge.col - RENDER.BLOOM_RADIUS, edge.drawStart, RENDER.BLOOM_RADIUS * 2, h);
            ctx.globalAlpha = 1.0;
        }

        // ── 4. Sprites ──
        this.renderSprites(ctx, game, W, H);

        // ── 5. Weapon ──
        this.renderWeapon(ctx, game.player, W, H);

        // ── 6. HUD ──
        this.renderHUD(ctx, game, W, H);

        // ── 7. Minimap ──
        this.renderMinimap(ctx, game, slice, W, H);

        // ── 8. Vignette ──
        const vigGrad = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85);
        vigGrad.addColorStop(0, 'rgba(0,0,0,0)');
        vigGrad.addColorStop(1, 'rgba(0,0,0,0.35)');
        ctx.fillStyle = vigGrad;
        ctx.fillRect(0, 0, W, H);

        // ── 9. Scanlines ──
        ctx.fillStyle = 'rgba(0,0,0,0.04)';
        for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

        // ── 10. Damage flash (red + screen shift) ──
        if (game.damageFlash > 0) {
            ctx.fillStyle = `rgba(255,20,40,${game.damageFlash * 0.25})`;
            ctx.fillRect(0, 0, W, H);
        }
    }

    // ─── Sprite Rendering ─────────────────────────────────────────────
    renderSprites(ctx, game, W, H) {
        const player = game.player;
        const spritesToRender = [];

        for (const e of game.enemies) {
            if (!e.alive) continue;
            if (Math.abs(e.c - player.c) > 1.5 || Math.abs(e.d - player.d) > 1.5) continue;
            const info = this.projectSprite(e, player, W, H);
            if (info) spritesToRender.push({ ...info, entity: e, kind: 'enemy' });
        }

        for (const p of game.particles) {
            const info = this.projectSprite(p, player, W, H);
            if (info) spritesToRender.push({ ...info, entity: p, kind: 'particle' });
        }

        spritesToRender.sort((a, b) => b.dist - a.dist);

        for (const sp of spritesToRender) {
            if (sp.kind === 'enemy') this.drawEnemySprite(ctx, sp, W, H);
            else if (sp.kind === 'particle') this.drawParticleSprite(ctx, sp, W, H);
        }
    }

    projectSprite(ent, player, W, H) {
        const da = ent.a - player.a;
        const db = ent.b - player.b;
        const cos = Math.cos(-player.angle);
        const sin = Math.sin(-player.angle);
        const tx = da * cos - db * sin;
        const ty = da * sin + db * cos;
        if (ty <= 0.2) return null;
        return {
            x: W / 2 + (tx / ty) * (W / 2),
            y: H / 2 - (H / ty) / 2 + player.bobAmount,
            size: H / ty,
            dist: ty
        };
    }

    drawEnemySprite(ctx, sp, W, H) {
        const e = sp.entity;
        const size = sp.size * 0.8;
        const x = sp.x - size / 2;
        const y = sp.y + sp.size * 0.1;

        const centerCol = Math.floor(sp.x);
        if (centerCol >= 0 && centerCol < W && sp.dist > this.zBuffer[centerCol]) return;

        const fog = Math.max(0.1, 1 - sp.dist / RENDER.DRAW_DISTANCE);
        const t = this.time / 1000;

        ctx.save();
        ctx.globalAlpha = fog;

        const color = e.color;
        const cx = sp.x;
        const armWave = Math.sin(t * 5 + e.angle) * 0.08;
        const corePulse = 0.5 + 0.5 * Math.sin(t * 4 + e.angle * 2);

        // ── Energy aura (glow behind enemy) ──
        ctx.globalAlpha = fog * 0.15;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(cx, y + size * 0.4, size * 0.35, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = fog;

        // ── Tetrahedral Enemy Body ──
        // Upper tetrahedron (head)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx, y);
        ctx.lineTo(cx - size * 0.2, y + size * 0.35);
        ctx.lineTo(cx + size * 0.2, y + size * 0.35);
        ctx.closePath();
        ctx.fill();

        // Core tetrahedron (torso — downward, interlocking)
        ctx.fillStyle = darken(color, 0.65);
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.25, y + size * 0.3);
        ctx.lineTo(cx + size * 0.25, y + size * 0.3);
        ctx.lineTo(cx, y + size * 0.7);
        ctx.closePath();
        ctx.fill();

        // Energy core (pulsing center)
        ctx.fillStyle = `rgba(255, 255, 255, ${corePulse * 0.4})`;
        ctx.beginPath();
        ctx.arc(cx, y + size * 0.42, size * 0.06, 0, Math.PI * 2);
        ctx.fill();

        // Arms
        ctx.fillStyle = darken(color, 0.75);
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.25, y + size * (0.35 + armWave));
        ctx.lineTo(cx - size * 0.4, y + size * (0.5 + armWave));
        ctx.lineTo(cx - size * 0.2, y + size * (0.55 + armWave));
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + size * 0.25, y + size * (0.35 - armWave));
        ctx.lineTo(cx + size * 0.4, y + size * (0.5 - armWave));
        ctx.lineTo(cx + size * 0.2, y + size * (0.55 - armWave));
        ctx.closePath();
        ctx.fill();

        // Legs
        ctx.fillStyle = darken(color, 0.45);
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.12, y + size * 0.65);
        ctx.lineTo(cx - size * 0.05, y + size * 0.95);
        ctx.lineTo(cx + size * 0.02, y + size * 0.65);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.02, y + size * 0.65);
        ctx.lineTo(cx + size * 0.05, y + size * 0.95);
        ctx.lineTo(cx + size * 0.12, y + size * 0.65);
        ctx.closePath();
        ctx.fill();

        // Eyes — glowing triangles
        const eyeColor = e.state === 'pain' ? '#ffffff' :
            e.state === 'attack' ? '#ff4444' : '#ffee00';
        ctx.fillStyle = eyeColor;
        ctx.shadowColor = eyeColor;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(cx - size * 0.1, y + size * 0.15);
        ctx.lineTo(cx - size * 0.06, y + size * 0.22);
        ctx.lineTo(cx - size * 0.02, y + size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + size * 0.02, y + size * 0.15);
        ctx.lineTo(cx + size * 0.06, y + size * 0.22);
        ctx.lineTo(cx + size * 0.1, y + size * 0.15);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // HP bar — gradient
        if (e.hp < e.maxHp) {
            const barW = size * 0.5;
            const hpFrac = e.hp / e.maxHp;
            ctx.fillStyle = '#220000';
            ctx.fillRect(cx - barW / 2, y - 6, barW, 4);
            const hpGrad = ctx.createLinearGradient(cx - barW / 2, 0, cx - barW / 2 + barW * hpFrac, 0);
            hpGrad.addColorStop(0, '#ff2244');
            hpGrad.addColorStop(1, '#ff6622');
            ctx.fillStyle = hpGrad;
            ctx.fillRect(cx - barW / 2, y - 6, barW * hpFrac, 4);
            // Border
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(cx - barW / 2, y - 6, barW, 4);
        }

        ctx.restore();
    }

    drawParticleSprite(ctx, sp, W, H) {
        const p = sp.entity;
        const alpha = (p.life / p.maxLife) * Math.max(0.1, 1 - sp.dist / RENDER.DRAW_DISTANCE);
        const size = sp.size * 0.05 * (p.life / p.maxLife);

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        const ps = Math.max(1, size);
        const py = sp.y + sp.size / 2;
        ctx.beginPath();
        ctx.moveTo(sp.x, py - ps);
        ctx.lineTo(sp.x + ps, py + ps * 0.5);
        ctx.lineTo(sp.x - ps, py + ps * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.restore();
    }

    // ─── Weapon Rendering ─────────────────────────────────────────────
    renderWeapon(ctx, player, W, H) {
        const bob = player.bobAmount;
        const cx = W / 2;
        const baseY = H - 180;
        const t = this.time / 1000;

        // Muzzle flash (enhanced)
        if (player.muzzleFlash > 0) {
            const flashR = 50 + player.muzzleFlash * 15;
            const grad = ctx.createRadialGradient(cx, baseY - 20 + bob, 0, cx, baseY - 20 + bob, flashR);
            grad.addColorStop(0, 'rgba(255,255,220,0.95)');
            grad.addColorStop(0.2, 'rgba(255,200,80,0.7)');
            grad.addColorStop(0.5, 'rgba(255,120,40,0.3)');
            grad.addColorStop(1, 'rgba(255,60,20,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(cx - flashR, baseY - 20 + bob - flashR, flashR * 2, flashR * 2);
        }

        // Weapon — Crystalline energy blade
        // Outer glow frame
        ctx.shadowColor = COLORS.neonCyan;
        ctx.shadowBlur = 12;

        // Main shaft
        const shaftGrad = ctx.createLinearGradient(cx, baseY - 40 + bob, cx, baseY + 180 + bob);
        shaftGrad.addColorStop(0, '#aaddff');
        shaftGrad.addColorStop(0.3, '#556688');
        shaftGrad.addColorStop(0.7, '#445566');
        shaftGrad.addColorStop(1, '#334455');
        ctx.fillStyle = shaftGrad;
        ctx.beginPath();
        ctx.moveTo(cx, baseY - 40 + bob);
        ctx.lineTo(cx - 14, baseY + 180 + bob);
        ctx.lineTo(cx + 14, baseY + 180 + bob);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Inner energy core (pulsing)
        const corePulse = 0.5 + 0.5 * Math.sin(t * 6);
        const coreGrad = ctx.createLinearGradient(cx, baseY - 30 + bob, cx, baseY + 30 + bob);
        coreGrad.addColorStop(0, `rgba(68, 255, 255, ${0.4 + corePulse * 0.3})`);
        coreGrad.addColorStop(0.5, `rgba(100, 200, 255, ${0.2 + corePulse * 0.2})`);
        coreGrad.addColorStop(1, `rgba(68, 255, 255, 0)`);
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.moveTo(cx, baseY - 30 + bob);
        ctx.lineTo(cx - 6, baseY + 25 + bob);
        ctx.lineTo(cx + 6, baseY + 25 + bob);
        ctx.closePath();
        ctx.fill();

        // Edge highlights
        ctx.strokeStyle = `rgba(180, 220, 255, ${0.3 + corePulse * 0.2})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx, baseY - 40 + bob);
        ctx.lineTo(cx - 14, baseY + 180 + bob);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, baseY - 40 + bob);
        ctx.lineTo(cx + 14, baseY + 180 + bob);
        ctx.stroke();

        // Grip
        const gripGrad = ctx.createLinearGradient(cx, baseY + 80 + bob, cx, baseY + 140 + bob);
        gripGrad.addColorStop(0, '#554422');
        gripGrad.addColorStop(1, '#332211');
        ctx.fillStyle = gripGrad;
        ctx.beginPath();
        ctx.moveTo(cx - 12, baseY + 80 + bob);
        ctx.lineTo(cx + 12, baseY + 80 + bob);
        ctx.lineTo(cx, baseY + 140 + bob);
        ctx.closePath();
        ctx.fill();

        // Crosshair — Animated rotating tetrahedron
        const rotAngle = t * 1.5; // Slow rotation
        const chSize = 12;
        const chPulse = 0.8 + 0.2 * Math.sin(t * 3);

        ctx.save();
        ctx.translate(cx, H / 2);
        ctx.rotate(rotAngle);
        ctx.strokeStyle = COLORS.synergetics;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = COLORS.synergetics;
        ctx.shadowBlur = 6;
        ctx.globalAlpha = chPulse;

        // Outer triangle
        ctx.beginPath();
        ctx.moveTo(0, -chSize);
        ctx.lineTo(chSize * 0.866, chSize * 0.5);
        ctx.lineTo(-chSize * 0.866, chSize * 0.5);
        ctx.closePath();
        ctx.stroke();

        // Inner inverted triangle
        const inner = chSize * 0.45;
        ctx.beginPath();
        ctx.moveTo(0, inner);
        ctx.lineTo(inner * 0.866, -inner * 0.5);
        ctx.lineTo(-inner * 0.866, -inner * 0.5);
        ctx.closePath();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1.0;
        ctx.restore();

        // Center dot
        ctx.fillStyle = COLORS.synergetics;
        ctx.globalAlpha = chPulse;
        ctx.beginPath();
        ctx.arc(cx, H / 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }

    // ─── HUD ──────────────────────────────────────────────────────────
    renderHUD(ctx, game, W, H) {
        const p = game.player;
        const t = this.time / 1000;

        // ── Glassmorphism status bar ──
        const barH = 56;
        // Background
        ctx.fillStyle = COLORS.hudGlass;
        ctx.beginPath();
        ctx.moveTo(0, H - barH);
        ctx.lineTo(W / 2, H - barH - 8); // Center peak (chevron)
        ctx.lineTo(W, H - barH);
        ctx.lineTo(W, H);
        ctx.lineTo(0, H);
        ctx.closePath();
        ctx.fill();

        // Top border accent
        ctx.strokeStyle = COLORS.hudBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, H - barH);
        ctx.lineTo(W / 2, H - barH - 8);
        ctx.lineTo(W, H - barH);
        ctx.stroke();

        // Subtle inner glow line
        ctx.strokeStyle = `rgba(0, 255, 204, ${0.1 + 0.05 * Math.sin(t * 2)})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(20, H - barH + 4);
        ctx.lineTo(W - 20, H - barH + 4);
        ctx.stroke();

        // ── Health ──
        const healthColor = p.hp > 30 ? COLORS.health :
            (Math.sin(t * 8) > 0 ? '#ffee00' : '#ff2244');
        ctx.font = 'bold 28px Impact, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = healthColor;
        ctx.shadowColor = healthColor;
        ctx.shadowBlur = 8;
        ctx.fillText(`${Math.ceil(p.hp)}%`, 20, H - 14);
        ctx.shadowBlur = 0;
        ctx.font = '10px monospace';
        ctx.fillStyle = '#556';
        ctx.fillText('HEALTH', 20, H - 42);

        // Health bar
        const hBarW = 80, hBarH = 3;
        const hBarX = 20, hBarY = H - 8;
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(hBarX, hBarY, hBarW, hBarH);
        const hpFrac = Math.max(0, p.hp / p.maxHp);
        const hGrad = ctx.createLinearGradient(hBarX, 0, hBarX + hBarW * hpFrac, 0);
        hGrad.addColorStop(0, COLORS.health);
        hGrad.addColorStop(1, '#ff8844');
        ctx.fillStyle = hGrad;
        ctx.fillRect(hBarX, hBarY, hBarW * hpFrac, hBarH);

        // ── Ammo ──
        ctx.textAlign = 'right';
        ctx.font = 'bold 28px Impact, sans-serif';
        ctx.fillStyle = COLORS.ammo;
        ctx.shadowColor = COLORS.ammo;
        ctx.shadowBlur = 8;
        ctx.fillText(`${p.ammo[p.weapon.ammoKey] || 0}`, W - 20, H - 14);
        ctx.shadowBlur = 0;
        ctx.font = '10px monospace';
        ctx.fillStyle = '#556';
        ctx.fillText(p.weapon.name.toUpperCase(), W - 20, H - 42);

        // Ammo bar
        const aBarX = W - 20 - hBarW;
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(aBarX, hBarY, hBarW, hBarH);
        const ammoMax = p.weapon.ammoKey === 'bullets' ? 50 : p.weapon.ammoKey === 'shells' ? 24 : 100;
        const ammoFrac = Math.min(1, (p.ammo[p.weapon.ammoKey] || 0) / ammoMax);
        const aGrad = ctx.createLinearGradient(aBarX, 0, aBarX + hBarW * ammoFrac, 0);
        aGrad.addColorStop(0, '#ff8800');
        aGrad.addColorStop(1, COLORS.ammo);
        ctx.fillStyle = aGrad;
        ctx.fillRect(aBarX, hBarY, hBarW * ammoFrac, hBarH);

        // ── Score & cell parity ──
        ctx.textAlign = 'center';
        ctx.font = '14px monospace';
        ctx.fillStyle = '#ddd';
        ctx.fillText(`SCORE: ${p.score}`, W / 2, H - 20);

        ctx.font = '10px monospace';
        const parityColor = p.cellParity === 'tetra' ? COLORS.glowTetra : COLORS.glowOcta;
        ctx.fillStyle = parityColor;
        ctx.shadowColor = parityColor;
        ctx.shadowBlur = 4;
        ctx.fillText(`◆ ${p.cellParity.toUpperCase()} CELL ◆`, W / 2, H - 38);
        ctx.shadowBlur = 0;

        // ── Game over ──
        if (!p.alive) {
            ctx.fillStyle = 'rgba(60,0,0,0.55)';
            ctx.fillRect(0, 0, W, H);
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff2244';
            ctx.font = 'bold 72px Impact';
            ctx.shadowColor = '#ff0000';
            ctx.shadowBlur = 30;
            ctx.fillText('YOU DIED', W / 2, H / 2 - 20);
            ctx.font = '20px monospace';
            ctx.fillStyle = '#aaa';
            ctx.shadowBlur = 0;
            ctx.fillText('Press R to respawn', W / 2, H / 2 + 30);
        }
    }

    // ─── Minimap ──────────────────────────────────────────────────────
    renderMinimap(ctx, game, slice, W, H) {
        const r = RENDER.MINIMAP_RADIUS;
        const scale = RENDER.MINIMAP_SCALE;
        const cx = W - r - 15;
        const cy = r + 15;
        const player = game.player;

        ctx.save();

        // Circular clip
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.clip();

        // Background
        ctx.fillStyle = 'rgba(2, 4, 12, 0.85)';
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);

        const mapSize = game.map.size;
        const pa = Math.floor(player.a);
        const pb = Math.floor(player.b);
        const viewR = Math.ceil(r / scale) + 1;

        // IVM grid on minimap
        ctx.strokeStyle = COLORS.ivm;
        ctx.globalAlpha = 0.08;
        ctx.lineWidth = 0.5;
        for (let da = -viewR; da <= viewR; da++) {
            const sx = cx + (da - (player.a % 1)) * scale;
            ctx.beginPath(); ctx.moveTo(sx, cy - r); ctx.lineTo(sx, cy + r); ctx.stroke();
        }
        for (let db = -viewR; db <= viewR; db++) {
            const sy = cy + (db - (player.b % 1)) * scale;
            ctx.beginPath(); ctx.moveTo(cx - r, sy); ctx.lineTo(cx + r, sy); ctx.stroke();
        }
        // Diagonal IVM lines
        for (let d = -viewR * 2; d <= viewR * 2; d++) {
            const x0 = cx + d * scale * 0.5;
            ctx.beginPath(); ctx.moveTo(x0 - r, cy - r); ctx.lineTo(x0 + r, cy + r); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x0 + r, cy - r); ctx.lineTo(x0 - r, cy + r); ctx.stroke();
        }
        ctx.globalAlpha = 1;

        // Solid cells — triangular parity rendering
        for (let da = -viewR; da <= viewR; da++) {
            for (let db = -viewR; db <= viewR; db++) {
                const ma = pa + da;
                const mb = pb + db;
                if (ma < 0 || ma >= mapSize || mb < 0 || mb >= mapSize) continue;
                const cell = slice[ma][mb];
                if (cell === CELL.FLOOR || cell === CELL.VOID) continue;

                const sx = cx + (ma - player.a) * scale;
                const sy = cy + (mb - player.b) * scale;

                if (cell === CELL.TETRA_WALL) ctx.fillStyle = '#6030a0';
                else if (cell === CELL.OCTA_WALL) ctx.fillStyle = '#208060';
                else if (cell === CELL.WALL2) ctx.fillStyle = '#254030';
                else if (cell === CELL.WALL3) ctx.fillStyle = '#253050';
                else ctx.fillStyle = '#504020';

                // Triangle based on cell parity
                const parity = (ma + mb) % 2;
                ctx.beginPath();
                if (parity === 0) {
                    ctx.moveTo(sx + scale / 2, sy);
                    ctx.lineTo(sx + scale, sy + scale);
                    ctx.lineTo(sx, sy + scale);
                } else {
                    ctx.moveTo(sx, sy);
                    ctx.lineTo(sx + scale, sy);
                    ctx.lineTo(sx + scale / 2, sy + scale);
                }
                ctx.closePath();
                ctx.fill();
            }
        }

        // Enemies
        for (const e of game.enemies) {
            if (!e.alive) continue;
            if (Math.abs(e.c - player.c) > 1.5 || Math.abs(e.d - player.d) > 1.5) continue;
            const sx = cx + (e.a - player.a) * scale;
            const sy = cy + (e.b - player.b) * scale;
            ctx.fillStyle = e.color;
            ctx.shadowColor = e.color;
            ctx.shadowBlur = 3;
            ctx.fillRect(sx - 2, sy - 2, 4, 4);
            ctx.shadowBlur = 0;
        }

        // Player — glowing tetrahedron marker
        ctx.fillStyle = COLORS.synergetics;
        ctx.shadowColor = COLORS.synergetics;
        ctx.shadowBlur = 8;
        const ps = 5;
        ctx.beginPath();
        ctx.moveTo(cx, cy - ps);
        ctx.lineTo(cx + ps, cy + ps);
        ctx.lineTo(cx - ps, cy + ps);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        // Direction line
        ctx.strokeStyle = COLORS.synergetics;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(player.angle) * 14, cy + Math.sin(player.angle) * 14);
        ctx.stroke();

        ctx.restore();

        // Border with glow
        ctx.strokeStyle = COLORS.hudBorder;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = COLORS.synergetics;
        ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
        ctx.shadowBlur = 0;

        // Label
        ctx.font = '9px monospace';
        ctx.fillStyle = COLORS.synergetics;
        ctx.textAlign = 'center';
        ctx.fillText('IVM MAP', cx, cy + r + 12);
    }
}

// ─── Utilities ────────────────────────────────────────────────────
function darken(hex, factor) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r * factor)},${Math.floor(g * factor)},${Math.floor(b * factor)})`;
}

function lighten(hex, factor) {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) * factor);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) * factor);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) * factor);
    return `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`;
}
