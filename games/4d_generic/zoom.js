/**
 * zoom.js - Shared mouse-wheel zoom for QuadCraft games
 *
 * Attaches a wheel event listener that scales a renderer's `scale` property
 * with configurable min/max bounds.
 *
 * Usage:
 *   setupZoom(canvas, renderer, { min: 15, max: 100 });
 *
 * @param {HTMLCanvasElement} canvas
 * @param {Object} renderer - Any object with a `.scale` property
 * @param {Object} opts
 * @param {number} [opts.min=10]   - Minimum scale value
 * @param {number} [opts.max=120] - Maximum scale value
 * @param {number} [opts.zoomIn=1.08] - Multiplier for zoom-in
 * @param {number} [opts.zoomOut=0.92] - Multiplier for zoom-out
 */
function setupZoom(canvas, renderer, { min = 10, max = 120, zoomIn = 1.08, zoomOut = 0.92 } = {}) {
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        renderer.scale *= (e.deltaY > 0 ? zoomOut : zoomIn);
        renderer.scale = Math.max(min, Math.min(max, renderer.scale));
    }, { passive: false });
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { setupZoom };
}
