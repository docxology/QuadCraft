/**
 * InputController.js - Unified Input Handling
 * Maps keys to actions and handles events.
 */
class InputController {
    constructor() {
        this.actions = new Map(); // key -> callback
        this.bindings = new Map(); // actionName -> [keys]
        this.activeKeys = new Set();

        this._handleDown = this._handleDown.bind(this);
        this._handleUp = this._handleUp.bind(this);
    }

    /**
     * Bind a key or keys to an action callback
     * @param {string|string[]} keys - Key(s) to bind (e.g. 'ArrowUp', ['w', 'W'])
     * @param {Function} callback - Function to call on press
     * @param {string} actionName - Optional name for re-binding
     */
    bind(keys, callback, actionName = null) {
        const keyList = Array.isArray(keys) ? keys : [keys];

        keyList.forEach(key => {
            this.actions.set(key, callback);
        });

        if (actionName) {
            this.bindings.set(actionName, keyList);
        }
    }

    /**
     * Start listening for input
     */
    attach(target = document) {
        document.addEventListener('keydown', this._handleDown);
        document.addEventListener('keyup', this._handleUp);
    }

    detach() {
        document.removeEventListener('keydown', this._handleDown);
        document.removeEventListener('keyup', this._handleUp);
    }

    _handleDown(e) {
        if (this.actions.has(e.key)) {
            // Prevent default for game keys (arrows, space)
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', ' '].includes(e.key)) {
                e.preventDefault();
            }
            const callback = this.actions.get(e.key);
            if (callback) callback(e);
        }
        this.activeKeys.add(e.key);
    }

    _handleUp(e) {
        this.activeKeys.delete(e.key);
    }

    isDown(key) {
        return this.activeKeys.has(key);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InputController };
}
