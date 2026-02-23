/**
 * pong_game.js — 4D Pong Game Controller
 *
 * Extends BaseGame for lifecycle, camera sync, input, and HUD management.
 * Integrates HUD, ScoreManager, and AI opponent.
 *
 * Uses:
 *   - BaseGame: init, togglePause, reset, _syncCamera, _updateHUD, _setupBaseInput
 *   - HUD: set, gameOver, paused, playing, warning
 *   - ScoreManager: addScore, reset, toJSON
 *   - verifyGeometricIdentities: startup integrity check
 *   - GridUtils: manhattan, euclidean
 *   - Quadray: distance, distanceTo, toKey, clone
 *
 * Controls:
 *   ←/→ or A/D : Move paddle along B axis
 *   ↑/↓ or W/S : Move paddle along C axis
 *   Q/E        : Move paddle along D axis
 *   P          : Pause
 *   R          : Reset
 *   N          : New Game
 *
 * @module PongGame
 */

class PongGame extends BaseGame {
    constructor(canvas, hudElement) {
        const board = new PongBoard();
        const renderer = new PongRenderer(canvas, board);
        super(canvas, hudElement, board, renderer, {
            name: 'PongGame',
            tickRate: 16,   // ~60 fps physics
            zoomOpts: { min: 15, max: 120 },
            cameraMode: 'shift-drag',
        });

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            lives: 0,    // unlimited — arcade game
            levelThreshold: 3,  // level up every 3 wins
            storageKey: 'pong4D_highScore',
        });

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
            console.log(`[PongGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
        } else {
            console.warn(`[PongGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
            results.checks.filter(c => !c.passed).forEach(c =>
                console.warn(`  ${c.name}: expected ${c.expected}, got ${JSON.stringify(c.actual)}`)
            );
        }
    }

    /**
     * Override BaseGame._setupGameInput() — bind game-specific keys.
     * Continuous paddle movement is polled in update(), so only
     * event-driven keys (new game) are bound here.
     */
    _setupGameInput() {
        this.input.bind(['n'], () => this.newGame());
        this.input.bind(['f'], () => this.board.cycleDifficulty());
        this.input.bind(['t'], () => this.board.toggle2P());
    }

    /** Start a new game, preserving scores. */
    newGame() {
        this.board.reset();
        this.renderer.board = this.board;
        console.log('[PongGame] New game started');
    }

    /** Override BaseGame.reset() — also reset scoring. */
    reset() {
        this.scoring.reset();
        super.reset();
        this.renderer.board = this.board;
    }

    /**
     * Override BaseGame.update() — poll continuous paddle movement and step physics.
     * @param {number} dt Delta time
     */
    update(dt = 0.016) {
        const speed = 0.15;
        let db = 0, dc = 0, dd = 0;
        if (this.input.isDown('ArrowLeft') || this.input.isDown('a')) db = -speed;
        if (this.input.isDown('ArrowRight') || this.input.isDown('d')) db = speed;
        if (this.input.isDown('ArrowUp') || this.input.isDown('w')) dc = speed;
        if (this.input.isDown('ArrowDown') || this.input.isDown('s')) dc = -speed;
        if (this.input.isDown('q')) dd = -speed;
        if (this.input.isDown('e')) dd = speed;
        this.board.movePaddle(1, db, dc, dd);

        if (!this.board.gameOver) {
            if (this.board.twoPlayerMode) {
                // Player 2 controls: I/J/K/L/U/O
                let db2 = 0, dc2 = 0, dd2 = 0;
                if (this.input.isDown('j')) db2 = -speed;
                if (this.input.isDown('l')) db2 = speed;
                if (this.input.isDown('i')) dc2 = speed;
                if (this.input.isDown('k')) dc2 = -speed;
                if (this.input.isDown('u')) dd2 = -speed;
                if (this.input.isDown('o')) dd2 = speed;
                this.board.movePaddle(2, db2, dc2, dd2);
            }

            // AI opponent (only in 1P mode)
            this.board.aiMove();

            const result = this.board.step(dt);
            if (result === 'score1') {
                this.scoring.addScore(1);
                console.log(`[PongGame] Player 1 scores! ${JSON.stringify(this.scoring.toJSON())}`);
            } else if (result === 'gameover' && this.board.winner === 1) {
                this.scoring.addScore(5);
                console.log(`[PongGame] Player 1 wins the match! ${JSON.stringify(this.scoring.toJSON())}`);
            }
        }
    }

    /**
     * Override BaseGame._getHUDState() — rich status with score info.
     * @returns {{ text: string, color: string }}
     */
    _getHUDState() {
        const b = this.board;
        const meta = b.getMetadata();
        const diffNames = ['Easy', 'Med', 'Hard'];
        const mode = b.twoPlayerMode ? '2P' : `AI ${diffNames[b.aiDifficulty]}`;
        const scoreLabel = ` | Wins: ${this.scoring.score} | Hi: ${this.scoring.highScore}`;

        if (b.gameOver) {
            const winColor = b.winner === 1 ? '#60a5fa' : '#ef4444';
            return {
                text: `Player ${b.winner} Wins! | P1: ${b.score1} P2: ${b.score2}${scoreLabel} | Press N`,
                color: winColor,
            };
        }

        return {
            text: `P1: ${b.score1} | P2: ${b.score2} | Rally: ${b.rally} | ${mode}${scoreLabel} | F=Diff T=2P`,
            color: '#94a3b8',
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PongGame };
}
