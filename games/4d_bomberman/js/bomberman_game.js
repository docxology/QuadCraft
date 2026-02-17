/**
 * bomberman_game.js — 4D Bomberman Game Controller
 *
 * Extends BaseGame for lifecycle, camera sync, input, and HUD management.
 * Integrates HUD, ScoreManager, and Quadray-native board evaluation.
 *
 * Uses:
 *   - BaseGame: init, togglePause, reset, _syncCamera, _updateHUD, _setupBaseInput
 *   - HUD: set, gameOver, paused, playing, warning, livesString
 *   - ScoreManager: addScore, loseLife, reset, toJSON
 *   - verifyGeometricIdentities: startup integrity check
 *   - GridUtils: manhattan, euclidean, shuffle, randomCoord
 *   - Quadray: distance, distanceTo, toKey, normalized, clone
 *
 * Controls:
 *   W/S or Up/Down  : Move along A axis
 *   A/D or Left/Right: Move along B axis
 *   Q/E             : Move along C axis
 *   Z/X             : Move along D axis
 *   Space           : Place bomb
 *   N               : New game
 *   P               : Pause
 *   R               : Reset
 *
 * @module BombermanGame
 */

class BombermanGame extends BaseGame {
    constructor(canvas, hudElement) {
        const board = new BombermanBoard();
        const renderer = new BombermanRenderer(canvas, board);
        super(canvas, hudElement, board, renderer, {
            name: 'BombermanGame',
            tickRate: 200,
            zoomOpts: { min: 15, max: 80 },
            cameraMode: 'shift-drag',
        });

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            lives: 3,
            levelThreshold: 500,
            storageKey: 'bomberman4D_highScore',
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
            console.log(`[BombermanGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
        } else {
            console.warn(`[BombermanGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
            results.checks.filter(c => !c.passed).forEach(c =>
                console.warn(`  ${c.name}: expected ${c.expected}, got ${JSON.stringify(c.actual)}`)
            );
        }
    }

    /**
     * Override BaseGame._setupGameInput() — bind game-specific keys.
     */
    _setupGameInput() {
        const DIRS = BombermanBoard.DIRECTIONS;
        // Movement along 4 axes (8 directions)
        this.input.bind(['ArrowUp', 'w'], () => { if (!this.board.gameOver) this.board.movePlayer(DIRS[0]); });
        this.input.bind(['ArrowDown', 's'], () => { if (!this.board.gameOver) this.board.movePlayer(DIRS[1]); });
        this.input.bind(['ArrowRight', 'd'], () => { if (!this.board.gameOver) this.board.movePlayer(DIRS[2]); });
        this.input.bind(['ArrowLeft', 'a'], () => { if (!this.board.gameOver) this.board.movePlayer(DIRS[3]); });
        this.input.bind(['e'], () => { if (!this.board.gameOver) this.board.movePlayer(DIRS[4]); });
        this.input.bind(['q'], () => { if (!this.board.gameOver) this.board.movePlayer(DIRS[5]); });
        this.input.bind(['x'], () => { if (!this.board.gameOver) this.board.movePlayer(DIRS[6]); });
        this.input.bind(['z'], () => { if (!this.board.gameOver) this.board.movePlayer(DIRS[7]); });
        // Bomb placement
        this.input.bind([' '], () => { if (!this.board.gameOver) this.board.placeBomb(); });
        // New game
        this.input.bind(['n'], () => this.newGame());
    }

    /**
     * Override BaseGame.update() — run board step each tick.
     */
    update() {
        if (this.board.gameOver) return;
        const result = this.board.step();

        // Sync scoring with board state
        if (result === 'dead') {
            this.scoring.loseLife();
        } else if (result === 'level_clear') {
            this.scoring.addScore(200);
            this.scoring.nextLevel();
        }

        // Keep score manager in sync
        this.scoring.score = this.board.score;
    }

    /** Start a new game, preserving high scores. */
    newGame() {
        this.board.reset();
        this.scoring.reset();
        this.scoring.lives = this.board.lives;
        console.log('[BombermanGame] New game started');
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
        const lives = HUD.livesString(meta.lives, '|');
        const enemies = meta.aliveEnemies;
        const scoreLabel = `Score: ${meta.score}`;
        const highLabel = this.scoring.highScore > 0 ? ` | Hi: ${this.scoring.highScore}` : '';

        if (b.gameOver) {
            return {
                text: `GAME OVER | ${scoreLabel} | Level: ${meta.level}${highLabel} | Press N`,
                color: '#f87171',
            };
        }

        return {
            text: `${lives} | ${scoreLabel} | Level: ${meta.level} | Enemies: ${enemies} | Range: ${meta.bombRange}${highLabel}`,
            color: '#94a3b8',
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BombermanGame };
}
