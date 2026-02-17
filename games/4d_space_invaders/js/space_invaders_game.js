/**
 * space_invaders_game.js — 4D Space Invaders Game Controller
 *
 * Extends BaseGame for lifecycle, camera sync, input, and HUD management.
 * Integrates HUD, ScoreManager, and continuous ship movement with Quadray-native evaluation.
 *
 * Uses:
 *   - BaseGame: init, togglePause, reset, _syncCamera, _updateHUD, _setupBaseInput
 *   - HUD: set, gameOver, paused, playing, warning, livesString
 *   - ScoreManager: addScore, loseLife, reset, toJSON
 *   - verifyGeometricIdentities: startup integrity check
 *   - GridUtils: manhattan, euclidean, key, parseKey
 *   - Quadray: distance, distanceTo, toKey, normalized, clone
 *
 * Controls:
 *   <-/-> or A/D  : Move ship on B axis
 *   Up/Dn or W/S  : Move ship on C axis
 *   Q/E           : Move ship on D axis
 *   Space         : Shoot
 *   N             : New game
 *   P             : Pause
 *   R             : Reset
 *
 * @module SpaceInvadersGame
 */

class SpaceInvadersGame extends BaseGame {
    constructor(canvas, hudElement) {
        const board = new SpaceInvadersBoard();
        const renderer = new SpaceInvadersRenderer(canvas, board);
        super(canvas, hudElement, board, renderer, {
            name: 'SpaceInvadersGame',
            tickRate: 100,
            zoomOpts: { min: 15, max: 80 },
            cameraMode: 'shift-drag',
        });

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            lives: 3,
            levelThreshold: 500,
            storageKey: 'spaceInvaders4D_highScore',
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
            console.log(`[SpaceInvadersGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
        } else {
            console.warn(`[SpaceInvadersGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
            results.checks.filter(c => !c.passed).forEach(c =>
                console.warn(`  FAIL ${c.name}: expected ${c.expected}, got ${JSON.stringify(c.actual)}`)
            );
        }
    }

    /**
     * Override BaseGame._setupGameInput() — bind game-specific keys.
     */
    _setupGameInput() {
        this.input.bind([' '], () => {
            if (!this.board.gameOver) this.board.shoot();
        });
        this.input.bind(['n'], () => this.newGame());
    }

    /**
     * Override BaseGame.update() — poll continuous ship movement and step board.
     */
    update() {
        if (this.board.gameOver) return;

        // Poll continuous ship movement
        if (this.input.isDown('ArrowLeft') || this.input.isDown('a')) this.board.moveShip(-1, 0, 0);
        if (this.input.isDown('ArrowRight') || this.input.isDown('d')) this.board.moveShip(1, 0, 0);
        if (this.input.isDown('ArrowUp') || this.input.isDown('w')) this.board.moveShip(0, 1, 0);
        if (this.input.isDown('ArrowDown') || this.input.isDown('s')) this.board.moveShip(0, -1, 0);
        if (this.input.isDown('q')) this.board.moveShip(0, 0, -1);
        if (this.input.isDown('e')) this.board.moveShip(0, 0, 1);

        const result = this.board.step();

        // Sync ScoreManager with board state
        if (result === 'hit') {
            this.scoring.loseLife();
        } else if (result === 'dead') {
            this.scoring.lives = 0;
        } else if (result === 'wave_clear') {
            // Award bonus points for wave clear and sync level
            this.scoring.addScore(this.board.level * 50);
            this.scoring.level = this.board.level;
        }

        // Keep ScoreManager score synced with board score
        this.scoring.score = this.board.score;
        this.scoring._saveHighScore();
    }

    /** Start a new game, preserving high score. */
    newGame() {
        this.board.reset();
        this.scoring.score = 0;
        this.scoring.level = 1;
        this.scoring.lives = this.scoring.initialLives;
        console.log('[SpaceInvadersGame] New game started');
    }

    /** Override BaseGame.reset() — also reset scoring. */
    reset() {
        this.scoring.reset();
        super.reset();
    }

    /**
     * Override BaseGame._getHUDState() — rich status with quadray info.
     * @returns {{ text: string, color: string }}
     */
    _getHUDState() {
        const b = this.board;
        const meta = b.getMetadata();
        const highScoreLabel = this.scoring.highScore > 0 ? ` | Hi: ${this.scoring.highScore}` : '';

        if (b.gameOver) {
            return {
                text: `GAME OVER | Score: ${meta.score} | Wave: ${meta.level}${highScoreLabel} | Press N`,
                color: '#f87171',
            };
        }

        const livesStr = HUD.livesString(meta.lives, '>>>');
        return {
            text: `${livesStr} | Score: ${meta.score} | Wave: ${meta.level} | Aliens: ${meta.liveAliens}${highScoreLabel}`,
            color: '#94a3b8',
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SpaceInvadersGame };
}
