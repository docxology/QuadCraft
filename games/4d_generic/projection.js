/**
 * projection.js - Shared 3D projection for QuadCraft games
 *
 * Projects a Quadray position to 2D screen coordinates using
 * rotation angles and perspective.
 *
 * In browser: load quadray.js before this file via script tags.
 * In Node.js: Quadray is loaded automatically via require.
 */

// Node.js compatibility
// NOTE: Do NOT use `var` — it conflicts with `class Quadray` from quadray.js
// when loaded via <script> tags in browsers.
if (typeof Quadray === 'undefined' && typeof require !== 'undefined') {
    const _q = require('./quadray.js');
    globalThis.Quadray = _q.Quadray;
}

/**
 * Project a Quadray to 2D screen coordinates.
 * @param {Quadray} q - The Quadray position
 * @param {Object} opts
 * @param {number} opts.rotX - X rotation angle
 * @param {number} opts.rotY - Y rotation angle
 * @param {number} opts.scale - Rendering scale factor
 * @param {number} opts.cameraDist - Camera distance for perspective
 * @param {number} opts.centerX - Screen center X
 * @param {number} opts.centerY - Screen center Y
 * @returns {{ x: number, y: number, scale: number }}
 */
function projectQuadray(q, { rotX, rotY, scale, cameraDist, centerX, centerY }) {
    const cart = q.toCartesian();

    const cosY = Math.cos(rotY);
    const sinY = Math.sin(rotY);
    const cosX = Math.cos(rotX);
    const sinX = Math.sin(rotX);

    let x = cart.x * cosY - cart.z * sinY;
    let z = cart.x * sinY + cart.z * cosY;
    let y = cart.y;

    let y2 = y * cosX - z * sinX;
    let z2 = y * sinX + z * cosX;

    const perspective = cameraDist / (cameraDist + z2);

    return {
        x: centerX + x * scale * perspective,
        y: centerY - y2 * scale * perspective,
        scale: perspective
    };
}

/**
 * Draw Quadray basis axes on a 2D canvas.
 * Renders four labeled arrows from the origin along the A, B, C, D basis directions.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {Object} opts - Same projection options as projectQuadray
 * @param {number} [axisLen=2] - Length of each axis arrow in Quadray units
 */
function drawQuadrayAxes(ctx, opts, axisLen = 2) {
    const origin = projectQuadray(new Quadray(0, 0, 0, 0), opts);
    const basisVecs = [
        { q: new Quadray(axisLen, 0, 0, 0), color: '#ff4444', label: 'A' },
        { q: new Quadray(0, axisLen, 0, 0), color: '#44ff44', label: 'B' },
        { q: new Quadray(0, 0, axisLen, 0), color: '#4444ff', label: 'C' },
        { q: new Quadray(0, 0, 0, axisLen), color: '#ffaa00', label: 'D' }
    ];

    ctx.lineWidth = 2;
    for (const { q, color, label } of basisVecs) {
        const p = projectQuadray(q, opts);
        ctx.beginPath();
        ctx.moveTo(origin.x, origin.y);
        ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = color;
        ctx.stroke();

        // Arrowhead
        const dx = p.x - origin.x, dy = p.y - origin.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 5) {
            const ux = dx / len, uy = dy / len;
            const aSize = 6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p.x - aSize * ux + aSize * 0.4 * uy, p.y - aSize * uy - aSize * 0.4 * ux);
            ctx.lineTo(p.x - aSize * ux - aSize * 0.4 * uy, p.y - aSize * uy + aSize * 0.4 * ux);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
        }

        // Label
        ctx.font = 'bold 12px monospace';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, p.x + (p.x - origin.x) * 0.15, p.y + (p.y - origin.y) * 0.15);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { projectQuadray, drawQuadrayAxes };
}
