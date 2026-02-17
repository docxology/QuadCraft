/**
 * CameraController.js - Shared drag-to-rotate camera for QuadCraft games
 *
 * Modes:
 *   'left-drag'  - Left-click drag rotates (chess/checkers pattern)
 *   'shift-drag' - Shift+drag or right-click rotates (reversi/minecraft pattern)
 */
class CameraController {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {Object} opts
     * @param {string} opts.mode - 'left-drag' or 'shift-drag'
     * @param {number} [opts.sensitivity=0.005]
     * @param {number} [opts.clampX] - Optional max absolute rotX value
     */
    constructor(canvas, { mode = 'shift-drag', sensitivity = 0.005, clampX = null } = {}) {
        this.canvas = canvas;
        this.mode = mode;
        this.sensitivity = sensitivity;
        this.clampX = clampX;
        this.rotX = 0.5;
        this.rotY = 0.7;
        this.isDragging = false;
        this.lastMouse = { x: 0, y: 0 };
        this._setup(canvas);
    }

    _setup(canvas) {
        canvas.addEventListener('mousedown', (e) => {
            if (this.mode === 'left-drag') {
                if (e.button === 0) {
                    this.isDragging = true;
                    this.lastMouse = { x: e.clientX, y: e.clientY };
                }
            } else {
                if (e.button === 2 || e.shiftKey) {
                    this.isDragging = true;
                    this.lastMouse = { x: e.clientX, y: e.clientY };
                    e.preventDefault();
                }
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.clientX - this.lastMouse.x;
                const dy = e.clientY - this.lastMouse.y;
                this.rotY += dx * this.sensitivity;
                this.rotX += dy * this.sensitivity;
                if (this.clampX !== null) {
                    this.rotX = Math.max(-this.clampX, Math.min(this.clampX, this.rotX));
                }
                this.lastMouse = { x: e.clientX, y: e.clientY };
            }
        });

        canvas.addEventListener('mouseup', () => { this.isDragging = false; });
        canvas.addEventListener('mouseleave', () => { this.isDragging = false; });
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CameraController };
}
