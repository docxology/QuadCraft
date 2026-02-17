/**
 * asteroids_game.js — 4D Asteroids Game Controller
 *
 * Extends BaseGame for lifecycle, camera sync, input, and HUD management.
 * Integrates HUD, ScoreManager, and continuous physics with Quadray-native entities.
 *
 * Uses:
 *   - BaseGame: init, togglePause, reset, _syncCamera, _updateHUD, _setupBaseInput
 *   - HUD: set, gameOver, paused, playing, warning
 *   - ScoreManager: addScore, loseLife, reset, toJSON
 *   - verifyGeometricIdentities: startup integrity check
 *   - angleBetweenQuadrays: direction calculations
 *   - GridUtils: manhattan, euclidean, key, parseKey
 *   - Quadray: distance, distanceTo, toKey, normalized, clone
 *
 * Controls:
 *   W/S   : Thrust +/-C axis
 *   A/D   : Thrust +/-A axis
 *   Q/E   : Thrust B/D axis
 *   Space : Shoot
 *   P     : Pause
 *   R     : Reset
 *
 * @module AsteroidsGame
 */

class AsteroidsGame extends BaseGame {
    constructor(canvas, hudElement) {
        const board = new AsteroidsBoard(8);
        const renderer = new AsteroidsRenderer(canvas, board);
        super(canvas, hudElement, board, renderer, {
            name: 'AsteroidsGame',
            tickRate: 16,
            zoomOpts: { min: 15, max: 100 },
            cameraMode: 'shift-drag',
        });

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            lives: 3,
            levelThreshold: 1000,
            storageKey: 'asteroids4D_highScore',
        });

        // Physics time tracking
        this.lastTime = performance.now();

        // Track score from board to detect changes
        this._lastBoardScore = 0;

        // Bind mouse for hover tooltips
        this._bindMouse();

        // Startup integrity check
        this._runGeometricVerification();
    }

    /** Run verifyGeometricIdentities() on startup and log results. */
    _runGeometricVerification() {
        if (typeof verifyGeometricIdentities !== 'function') return;
        const results = verifyGeometricIdentities();
        const passCount = results.checks.filter(c => c.passed).length;
        const totalCount = results.checks.length;
        if (results.allPassed) {
            console.log(`[AsteroidsGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
        } else {
            console.warn(`[AsteroidsGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
            results.checks.filter(c => !c.passed).forEach(c =>
                console.warn(`  FAIL ${c.name}: expected ${c.expected}, got ${JSON.stringify(c.actual)}`)
            );
        }
    }

    /**
     * Override BaseGame._setupGameInput() — bind game-specific keys.
     * Continuous thrust is polled in update(), only fire and reset
     * are event-driven bindings.
     */
    _setupGameInput() {
        this.input.bind([' '], () => {
            if (this.board.gameOver || !this.board.ship.alive) return;
            const v = this.board.ship.vel;
            const mag = Math.sqrt(v.a * v.a + v.b * v.b + v.c * v.c + v.d * v.d);
            const dir = mag > 0.1
                ? [v.a / mag, v.b / mag, v.c / mag, v.d / mag]
                : [1, 0, 0, 0];
            this.board.shoot(dir);
        });
    }

    /** Bind mouse move for hover tooltips on the renderer. */
    _bindMouse() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.renderer.mouseX = e.clientX - rect.left;
            this.renderer.mouseY = e.clientY - rect.top;
        });
    }

    /**
     * Override BaseGame.update() — poll continuous thrust keys and
     * step the physics simulation.
     */
    update() {
        const now = performance.now();
        const dt = Math.min((now - this.lastTime) / 1000, 0.05);
        this.lastTime = now;

        // Poll continuous thrust using InputController.isDown()
        if (this.input.isDown('w')) this.board.thrust([0, 0, 1, 0]);
        if (this.input.isDown('s')) this.board.thrust([0, 0, -1, 0]);
        if (this.input.isDown('a')) this.board.thrust([-1, 0, 0, 0]);
        if (this.input.isDown('d')) this.board.thrust([1, 0, 0, 0]);
        if (this.input.isDown('q')) this.board.thrust([0, 1, 0, 0]);
        if (this.input.isDown('e')) this.board.thrust([0, 0, 0, 1]);

        // Sync board score changes to ScoreManager
        const scoreDelta = this.board.score - this._lastBoardScore;
        if (scoreDelta > 0) {
            const result = this.scoring.addScore(scoreDelta);
            if (result.leveled) {
                console.log(`[AsteroidsGame] Level up! Now level ${this.scoring.level}`);
            }
        }
        this._lastBoardScore = this.board.score;

        // Sync lives: detect life loss from board
        if (this.board.lives < this.scoring.lives) {
            const died = this.scoring.loseLife();
            if (died) {
                console.log(`[AsteroidsGame] All lives lost! Score: ${JSON.stringify(this.scoring.toJSON())}`);
            }
        }

        this.board.update(dt);
    }

    /** Override BaseGame.reset() — also reset scoring. */
    reset() {
        this.scoring.reset();
        this._lastBoardScore = 0;
        this.lastTime = performance.now();
        super.reset();
    }

    /**
     * Override BaseGame._getHUDState() — rich status with quadray info.
     * @returns {{ text: string, color: string }}
     */
    _getHUDState() {
        const b = this.board;
        const meta = b.getMetadata();
        const scoreLabel = `Score: ${this.scoring.score}`;
        const livesLabel = `Lives: ${'♦'.repeat(this.scoring.lives)}`;
        const levelLabel = `Lv ${this.scoring.level}`;
        const hiLabel = this.scoring.highScore > 0 ? ` | Hi: ${this.scoring.highScore}` : '';

        if (b.gameOver) {
            return {
                text: `GAME OVER | ${scoreLabel} | ${levelLabel}${hiLabel} | Press R to restart`,
                color: '#f87171',
            };
        }

        if (!b.ship.alive) {
            return {
                text: `Ship destroyed! Respawning... | ${livesLabel} | ${scoreLabel}`,
                color: '#fb923c',
            };
        }

        const asteroidInfo = meta.asteroidCount > 0
            ? ` | Asteroids: ${meta.asteroidCount}`
            : ' | Field clear!';

        return {
            text: `${scoreLabel} | ${livesLabel} | ${levelLabel}${asteroidInfo}${hiLabel}`,
            color: '#94a3b8',
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AsteroidsGame };
}
