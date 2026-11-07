/**
 * rogue_game.js — 4D Rogue Game Controller
 *
 * Extends BaseGame for lifecycle, camera, input, and HUD management.
 * Integrates HUD, ScoreManager, and the enhanced RogueBoard.
 *
 * Controls:
 *   WASD/QE/ZX : Move in the first 8 IVM directions
 *   1-4        : Move in the remaining 4 IVM directions
 *   H          : Use health potion
 *   T/F/M      : Use teleport/fireball/mapping scroll (either letter case)
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
            'w': 0, 'ArrowUp': 0,
            'e': 1,
            'd': 2, 'ArrowRight': 2,
            'x': 3, 'ArrowDown': 3,
            's': 4,
            'a': 5, 'ArrowLeft': 5,
            'q': 6,
            'z': 7,
            '1': 8,
            '2': 9,
            '3': 10,
            '4': 11,
        };

        console.log('[RogueGame] Initialized with WASD/QE/ZX movement + inventory');
    }

    /** Override: case-insensitive actions dispatched only by InputController. */
    _setupGameInput() {
        this.input.bind(['n', 'N'], () => this.newGame());
        this.input.bind(['h', 'H'], () => this._usePotion());
        this.input.bind(['t', 'T'], () => this._useScroll('teleport'));
        this.input.bind(['f', 'F'], () => this._useScroll('fireball'));
        this.input.bind(['m', 'M'], () => this._useScroll('mapping'));
    }

    /** Override: hook for additional input. */
    init() {
        this._bindKeyboard();
        super.init();
    }

    /** Bind keyboard for movement (operates on keydown for responsiveness). */
    _bindKeyboard() {
        const keys = Object.keys(this.keyMap).flatMap(key => key.length === 1 ? [key, key.toUpperCase()] : [key]);
        this.input.bind(keys, (e) => {
            if (this.loop.paused) return;
            e.preventDefault();
            const result = this.board.move(this.keyMap[e.key] ?? this.keyMap[e.key.toLowerCase()]);
            if (result === 'dead') this.scoring.addScore(this.board.gold);
            this._updateCombatLog();
        });
    }

    /** Use a health potion. */
    _usePotion() {
        this.board.usePotion();
        this._updateCombatLog();
    }

    /** Use a magic scroll. */
    _useScroll(type) {
        if (this.board.useScroll(type)) {
            this._updateCombatLog();
        }
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