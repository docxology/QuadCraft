/**
 * GameLoop.js - Standardized Game Loop for 4D Games
 * Handles timing, pausing, and the update/render cycle.
 */
class GameLoop {
    /**
     * @param {Object} options
     * @param {Function} options.update - Logic update function (fixed timestep)
     * @param {Function} options.render - Rendering function (every frame)
     * @param {number} options.tickRate - Ms per update tick (default 1000/60)
     */
    constructor({ update, render, tickRate = 1000 / 60 }) {
        this.update = update;
        this.render = render;
        this.tickRate = tickRate;

        this.lastTime = 0;
        this.accumulator = 0;
        this.paused = false;
        this.animationId = null;

        this._loop = this._loop.bind(this);
    }

    start() {
        if (this.animationId) return;
        this.lastTime = performance.now();
        this.accumulator = 0;
        this.paused = false;
        this.animationId = requestAnimationFrame(this._loop);
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.paused = true;
    }

    togglePause() {
        if (this.paused) this.start();
        else this.stop();
        return this.paused;
    }

    _loop(timestamp) {
        if (this.paused) return;

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Cap deltaTime to prevent spiral of death if tab is backgrounded
        const safeDelta = Math.min(deltaTime, 250);

        this.accumulator += safeDelta;

        while (this.accumulator >= this.tickRate) {
            if (this.update) this.update();
            this.accumulator -= this.tickRate;
        }

        if (this.render) this.render(this.accumulator / this.tickRate);

        this.animationId = requestAnimationFrame(this._loop);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameLoop };
}
