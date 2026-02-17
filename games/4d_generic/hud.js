/**
 * hud.js — Reusable HUD (Heads-Up Display) Manager
 *
 * Provides a clean API for updating game HUD elements with
 * consistent color-coded states: game-over, paused, playing.
 *
 * Usage:
 *   const hud = new HUD(document.getElementById('hud'));
 *   hud.playing('Score: 100 | Level: 2');
 *   hud.paused();
 *   hud.gameOver('Score: 100');
 *
 * @module HUD
 */

class HUD {
    /** Default color palette for HUD states. */
    static COLORS = {
        gameOver: '#f87171', // Red
        won: '#4ade80', // Green
        paused: '#fbbf24', // Yellow
        playing: '#94a3b8', // Slate/grey
        warning: '#fb923c', // Orange
    };

    /**
     * @param {HTMLElement} element — The DOM element for HUD text.
     */
    constructor(element) {
        this.element = element;
    }

    /**
     * Set arbitrary text and color.
     * @param {string} text
     * @param {string} [color='#94a3b8']
     */
    set(text, color = HUD.COLORS.playing) {
        if (!this.element) return;
        this.element.textContent = text;
        this.element.style.color = color;
    }

    /**
     * Show game-over state.
     * @param {string} text — e.g. 'Score: 100'
     * @param {boolean} [won=false] — Green if won, red if lost.
     */
    gameOver(text, won = false) {
        this.set(text, won ? HUD.COLORS.won : HUD.COLORS.gameOver);
    }

    /**
     * Show paused state.
     * @param {string} [text='⏸ PAUSED — Press P to continue']
     */
    paused(text = '⏸ PAUSED — Press P to continue') {
        this.set(text, HUD.COLORS.paused);
    }

    /**
     * Show normal playing state.
     * @param {string} text — Status line content.
     */
    playing(text) {
        this.set(text, HUD.COLORS.playing);
    }

    /**
     * Show warning state (e.g. low time).
     * @param {string} text
     */
    warning(text) {
        this.set(text, HUD.COLORS.warning);
    }

    /**
     * Generate a lives string from emoji.
     * @param {number} count
     * @param {string} [emoji='❤️']
     * @returns {string}
     */
    static livesString(count, emoji = '❤️') {
        let s = '';
        for (let i = 0; i < count; i++) s += emoji;
        return s;
    }
}

// Dual export for browser + Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HUD };
}
