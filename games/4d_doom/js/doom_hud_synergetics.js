/**
 * doom_hud_synergetics.js — Synergetics HUD Overlay
 *
 * Renders real-time Synergetics analysis data:
 *   - Tetravolumes (Fuller's volume unit)
 *   - IVM fill ratio
 *   - Polyhedra counts (T:O:C = 1:4:20)
 *   - Coordination numbers
 *   - Quadray position (a,b,c,d) with color-coded axes
 *   - Geometric identity verification badge
 *   - IVM grid lines on floor
 */
import { COLORS, IVM, RENDER } from './doom_config.js';
import { getAnalysis, verifyGeometricIdentities } from './doom_synergetics.js';

// Cache verification (expensive, run once)
let _verifyCache = null;

export class SynergeticsHUD {
    constructor() {
        this._verifyResult = null;
        this._lastAnalysis = null;
        this._analysisAge = 0;
    }

    /**
     * Run geometric verification (once on startup).
     */
    verify() {
        if (!_verifyCache) {
            _verifyCache = verifyGeometricIdentities();
            console.log(`[Synergetics] Geometric verification: ${_verifyCache.allPassed ? 'ALL PASSED' : 'FAILURES'}`);
            for (const c of _verifyCache.checks) {
                console.log(`  ${c.passed ? '✓' : '✗'} ${c.name}: ${c.value}`);
            }
        }
        this._verifyResult = _verifyCache;
    }

    /**
     * Update analysis (throttled to avoid per-frame expense).
     */
    update(map, frameCount) {
        if (frameCount % 60 === 0 || !this._lastAnalysis) {
            this._lastAnalysis = getAnalysis(map);
            this._analysisAge = 0;
        }
        this._analysisAge++;
    }

    /**
     * Render the Synergetics HUD panel.
     */
    renderPanel(ctx, W, H) {
        const analysis = this._lastAnalysis;
        if (!analysis) return;

        // Panel position and size
        const px = 10, py = H - 180;
        const pw = 210, ph = 170;

        // Semi-transparent panel background
        ctx.fillStyle = 'rgba(0, 10, 20, 0.75)';
        ctx.beginPath();
        if (ctx.roundRect) {
            ctx.roundRect(px, py, pw, ph, 6);
        } else {
            ctx.rect(px, py, pw, ph);
        }
        ctx.fill();

        // Panel border (gold)
        ctx.strokeStyle = COLORS.synergetics;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Title
        ctx.font = 'bold 11px monospace';
        ctx.fillStyle = COLORS.synergetics;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText('◆ SYNERGETICS', px + 8, py + 6);

        // Verification badge
        if (this._verifyResult) {
            const badge = this._verifyResult.allPassed ? '✓ 8/8' : '✗ FAIL';
            ctx.fillStyle = this._verifyResult.allPassed ? '#44ff88' : '#ff4444';
            ctx.textAlign = 'right';
            ctx.fillText(badge, px + pw - 8, py + 6);
            ctx.textAlign = 'left';
        }

        // Data lines
        ctx.font = '10px monospace';
        const lh = 14;
        let y = py + 24;

        // Tetravolumes
        ctx.fillStyle = '#d0d8ff';
        ctx.fillText(`Tetravolumes: ${analysis.tetravolume.totalTetravolumes.toFixed(1)}`, px + 8, y);
        y += lh;

        // IVM Fill
        ctx.fillText(`IVM Fill: ${(analysis.ivmGrid.fillRatio * 100).toFixed(2)}%`, px + 8, y);
        y += lh;

        // Cell count
        ctx.fillText(`IVM Cells: ${analysis.cellCount}`, px + 8, y);
        y += lh;

        // Coordination
        ctx.fillText(`Avg Coord #: ${analysis.coordination.average.toFixed(1)} (max ${analysis.coordination.max})`, px + 8, y);
        y += lh;

        // Polyhedra (gold highlight)
        const p = analysis.polyhedra;
        ctx.fillStyle = COLORS.synergetics;
        ctx.fillText(`T:${p.tetrahedra} O:${p.octahedra} C:${p.cuboctahedra}`, px + 8, y);
        ctx.fillStyle = '#999';
        ctx.fillText(`(${p.totalPolyVolume.toFixed(0)} TV)`, px + 140, y);
        y += lh;

        // Center of mass
        if (analysis.centerOfMass) {
            const q = analysis.centerOfMass.quadray;
            ctx.fillStyle = '#d0d8ff';
            ctx.fillText(`CoM: (${q.a.toFixed(1)},${q.b.toFixed(1)},${q.c.toFixed(1)},${q.d.toFixed(1)})`, px + 8, y);
        }
        y += lh;

        // Volume ratios key
        ctx.fillStyle = '#777';
        ctx.font = '9px monospace';
        ctx.fillText('T=1 O=4 C=20 tetravolumes', px + 8, y);
        y += lh;

        // IVM cell tetravolume
        ctx.fillText(`Cell TV: ${IVM.CELL_TETRAVOLUME.toFixed(3)}  S3: ${IVM.S3.toFixed(4)}`, px + 8, y);
    }

    /**
     * Render the enhanced Quadray position display.
     * Shows current (a,b,c,d) with color-coded axes.
     */
    renderQuadrayPosition(ctx, player, W, H) {
        if (!RENDER.SHOW_COORDINATES) return;

        const coords = [
            { l: 'A', v: player.a, c: COLORS.quadrayA },
            { l: 'B', v: player.b, c: COLORS.quadrayB },
            { l: 'C', v: player.c, c: COLORS.quadrayC },
            { l: 'D', v: player.d, c: COLORS.quadrayD }
        ];

        const cx = W / 2;
        const bottomY = H - 35;
        const width = 60;
        const gap = 10;
        const totalW = 4 * width + 3 * gap;
        let x = cx - totalW / 2;

        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';

        for (const p of coords) {
            // Label
            ctx.fillStyle = p.c;
            ctx.fillText(`${p.l}: ${p.v.toFixed(1)}`, x, bottomY);

            // Bar
            const barH = 4;
            const val = p.v % 10; // Wrap for visualization
            const fillW = (Math.abs(val) / 10) * width;

            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(x, bottomY + 4, width, barH);

            ctx.fillStyle = p.c;
            ctx.fillRect(x, bottomY + 4, fillW, barH);

            x += width + gap;
        }

        // Mode indicator
        ctx.fillStyle = '#666';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        const modeName = ['OFF', 'GRID', 'WIREFRAME'][RENDER.IVM_GRID_MODE];
        ctx.fillText(`[G] GEO MODE: ${modeName}`, cx, H - 10);
    }

    /**
     * Render enhanced Quadray compass with all 4 tetrahedral axes.
     * Shows the 3D projection of all 4 Quadray basis vectors.
     */
    renderCompass(ctx, player, W, H) {
        const cx = 55, cy = 55, r = 40;

        // Background circle
        ctx.fillStyle = 'rgba(0, 10, 20, 0.7)';
        ctx.beginPath();
        ctx.arc(cx, cy, r + 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.synergetics;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Project 4 basis vectors into 2D based on player angle
        const cos = Math.cos(player.angle);
        const sin = Math.sin(player.angle);

        // Quadray basis directions in Cartesian (from Quadray.BASIS)
        const basisDirs = [
            { dx: 1, dy: 1, label: 'A', color: COLORS.quadrayA }, // (1,0,0,0) → roughly (+x,+y)
            { dx: -1, dy: 1, label: 'B', color: COLORS.quadrayB }, // (0,1,0,0) → roughly (-x,+y)
            { dx: -1, dy: -1, label: 'C', color: COLORS.quadrayC }, // (0,0,1,0) → roughly (-x,-y)
            { dx: 1, dy: -1, label: 'D', color: COLORS.quadrayD }, // (0,0,0,1) → roughly (+x,-y)
        ];

        for (const b of basisDirs) {
            // Rotate by player angle
            const rx = b.dx * cos - b.dy * sin;
            const ry = b.dx * sin + b.dy * cos;

            // Scale and draw
            const nx = rx / Math.sqrt(2);
            const ny = ry / Math.sqrt(2);
            const ex = cx + nx * r * 0.8;
            const ey = cy - ny * r * 0.8;

            ctx.strokeStyle = b.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(ex, ey);
            ctx.stroke();

            // Label
            const lx = cx + nx * r;
            const ly = cy - ny * r;
            ctx.font = 'bold 10px monospace';
            ctx.fillStyle = b.color;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(b.label, lx, ly);
        }

        // Center dot
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cx, cy, 2, 0, Math.PI * 2);
        ctx.fill();

        // Label
        ctx.font = '9px monospace';
        ctx.fillStyle = COLORS.synergetics;
        ctx.textAlign = 'center';
        ctx.fillText('QUADRAY', cx, cy + r + 12);
    }

    /**
     * Render IVM grid lines on the floor to visualize tetrahedral structure.
     * Draws projected grid lines that show the IVM pattern.
     */
    /**
     * Render IVM grid lines on the floor to visualize the Quadray A/B lattice.
     * Projects actual integer coordinate lines (a=k, b=k) to the screen.
     */
    renderFloorGrid(ctx, player, W, H) {
        if (RENDER.IVM_GRID_MODE === 0) return;

        const maxDist = RENDER.DRAW_DISTANCE;
        const radius = RENDER.GRID_RADIUS;
        const alpha = RENDER.IVM_GRID_ALPHA;

        ctx.save();
        ctx.lineWidth = 1;

        const cos = Math.cos(player.angle);
        const sin = Math.sin(player.angle);
        const horizon = H / 2 + player.bobAmount;

        // Helper: Project a world point (a,b) to screen (x,y)
        // Returns null if behind player or too close
        const project = (a, b) => {
            const relA = a - player.a;
            const relB = b - player.b;

            // Rotate to camera space
            // x is right, z is forward
            const z = relA * cos + relB * sin;
            const x = relA * sin - relB * cos;

            if (z < 0.1) return null; // Behind player

            const screenX = W / 2 + (x / z) * (W / 2); // 90 deg FOV approx
            const screenY = H / 2 + (H / 2) / z + player.bobAmount; // Floor projection

            return { x: screenX, y: screenY, z: z };
        };

        // 1. Draw A-lines (constant A, varying B)
        const startA = Math.floor(player.a) - radius;
        const endA = Math.floor(player.a) + radius;

        for (let a = startA; a <= endA; a++) {
            // Draw segment from (a, player.b - radius) to (a, player.b + radius)
            // But we need to clip closely to the frustum to avoid artifacts
            // So we step along the line

            ctx.strokeStyle = (a === 0) ? '#ffffff' : (a % 5 === 0 ? COLORS.quadrayA : 'rgba(255, 68, 68, 0.3)');
            if (a % 1 !== 0) ctx.strokeStyle = 'rgba(255, 68, 68, 0.1)';
            if (a === Math.round(player.a)) ctx.globalAlpha = 0.8; else ctx.globalAlpha = alpha;

            ctx.beginPath();
            let first = true;
            for (let b = player.b - radius; b <= player.b + radius; b += 1) {
                const p = project(a, b);
                if (p && p.z < maxDist) {
                    if (first) { ctx.moveTo(p.x, p.y); first = false; }
                    else ctx.lineTo(p.x, p.y);
                } else {
                    first = true;
                }
            }
            ctx.stroke();
        }

        // 2. Draw B-lines (constant B, varying A)
        const startB = Math.floor(player.b) - radius;
        const endB = Math.floor(player.b) + radius;

        for (let b = startB; b <= endB; b++) {
            ctx.strokeStyle = (b === 0) ? '#ffffff' : (b % 5 === 0 ? COLORS.quadrayB : 'rgba(68, 255, 68, 0.3)');
            if (b === Math.round(player.b)) ctx.globalAlpha = 0.8; else ctx.globalAlpha = alpha;

            ctx.beginPath();
            let first = true;
            for (let a = player.a - radius; a <= player.a + radius; a += 1) {
                const p = project(a, b);
                if (p && p.z < maxDist) {
                    if (first) { ctx.moveTo(p.x, p.y); first = false; }
                    else ctx.lineTo(p.x, p.y);
                } else {
                    first = true;
                }
            }
            ctx.stroke();
        }

        // 3. Draw Diagonal lines (a+b = constant) — completes the IVM triangular tessellation
        // These form the third edge direction of the equilateral triangles
        const diagStart = Math.floor(player.a + player.b) - radius * 2;
        const diagEnd = Math.floor(player.a + player.b) + radius * 2;

        for (let k = diagStart; k <= diagEnd; k++) {
            ctx.strokeStyle = (k === 0) ? '#ffffff' : (k % 5 === 0 ? COLORS.quadrayD : 'rgba(255, 255, 68, 0.3)');
            ctx.globalAlpha = alpha * 0.8;

            ctx.beginPath();
            let first = true;
            // Walk along a+b=k, i.e., b = k - a
            for (let a = player.a - radius; a <= player.a + radius; a += 1) {
                const b = k - a;
                const p = project(a, b);
                if (p && p.z < maxDist) {
                    if (first) { ctx.moveTo(p.x, p.y); first = false; }
                    else ctx.lineTo(p.x, p.y);
                } else {
                    first = true;
                }
            }
            ctx.stroke();
        }

        ctx.restore();
    }
}
