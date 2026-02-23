/**
 * rogue_game.js — 4D Rogue Game Controller
 *
 * Extends BaseGame for lifecycle, camera, input, and HUD management.
 * Integrates HUD, ScoreManager, and the enhanced RogueBoard.
 *
 * Controls:
 *   WASD/QE/ZX : Move in 8 IVM directions
 *   1-4        : Numpad move shortcuts
 *   H          : Use health potion
 *   N          : New game
 *   R          : Reset
 *   P          : Pause
 *
 * @module RogueGame
 */

if (typeof BaseGame === 'undefined' && typeof require !== 'undefined') {
    const _bg = require('../../4d_generic/base_game.js');
    globalThis.BaseGame = _bg.BaseGame;
}
if (typeof ScoreManager === 'undefined' && typeof require !== 'undefined') {
    const _sm = require('../../4d_generic/score_manager.js');
    globalThis.ScoreManager = _sm.ScoreManager;
}

class RogueGame extends BaseGame {

    constructor(canvas, hudElement) {
        const board = new RogueBoard(8);
        const renderer = new RogueRenderer(canvas, board);
        super(canvas, hudElement, board, renderer, {
            name: 'RogueGame',
            tickRate: 1000 / 20,
            zoomOpts: { min: 15, max: 80 },
            cameraMode: 'shift-drag',
        });

        this.scoring = new ScoreManager({
            lives: 0,
            storageKey: 'quadcraft_rogue_high',
        });

        // Direction mapping: key → IVM direction index (0-11)
        this.keyMap = {
            'w': 0, 'arrowup': 0,
            'e': 1,
            'd': 2, 'arrowright': 2,
            'x': 3, 'arrowdown': 3,
            's': 4,
            'a': 5, 'arrowleft': 5,
            'q': 6,
            'z': 7,
            '1': 8,
            '2': 9,
            '3': 10,
            '4': 11,
        };

        console.log('[RogueGame] Initialized with WASD/QE/ZX movement + inventory');
    }

    /** Override: bind game-specific keys. */
    _setupGameInput() {
        this.input.bind(['n'], () => this.newGame());
        this.input.bind(['h'], () => this._usePotion());
    }

    /** Override: hook for additional input. */
    init() {
        this._bindKeyboard();
        super.init();
    }

    /** Bind keyboard for movement (operates on keydown for responsiveness). */
    _bindKeyboard() {
        document.addEventListener('keydown', (e) => {
            if (this.board.gameOver && e.key.toLowerCase() === 'n') {
                this.newGame();
                return;
            }

            const key = e.key.toLowerCase();
            const dirIndex = this.keyMap[key];
            if (dirIndex !== undefined) {
                e.preventDefault();
                const result = this.board.move(dirIndex);
                if (result === 'dead') {
                    this.scoring.addScore(this.board.gold);
                    console.log(`[RogueGame] Final score: ${JSON.stringify(this.scoring.toJSON())}`);
                }
                this._updateCombatLog();
            }

            if (key === 'h') {
                this._usePotion();
            }
        });
    }

    /** Use a health potion. */
    _usePotion() {
        this.board.usePotion();
        this._updateCombatLog();
    }

    /** Update the combat log panel in the DOM. */
    _updateCombatLog() {
        const logEl = document.getElementById('combatLog');
        if (!logEl) return;
        const log = this.board.combatLog;
        logEl.innerHTML = log.map(msg => `<div>${msg}</div>`).join('');
        logEl.scrollTop = logEl.scrollHeight;
    }

    /** Start a new game, preserving high scores. */
    newGame() {
        this.board.reset();
        this._updateCombatLog();
        console.log('[RogueGame] New game started');
    }

    /** Override reset. */
    reset() {
        this.scoring.reset();
        super.reset();
    }

    /** Override: rich HUD state. */
    _getHUDState() {
        const m = this.board.getMetadata();

        if (m.gameOver) {
            return {
                text: `☠️ Dead! Depth: ${m.depth} | Gold: ${m.gold} | Lv${m.level} | Press N`,
                color: '#e74c3c',
            };
        }

        const wpn = m.weapon ? m.weapon.name : 'Fists';
        const arm = m.armor ? m.armor.name : 'None';
        return {
            text: `❤️ ${m.hp}/${m.maxHp} | ⚔️ ${m.attack} | 🛡️ ${m.defense} | Lv${m.level} | D${m.depth} | 💰${m.gold} | 🧪${m.potions}`,
            color: '#94a3b8',
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RogueGame };
}