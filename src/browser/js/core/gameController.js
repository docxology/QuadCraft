/**
 * Game Controller Module
 * Handles user input, game logic, and coordinates between different modules
 */

/**
 * Game Controller Class
 * Manages game input, logic, and state transitions
 */
class GameController {
    constructor() {
        this.isInitialized = false;
        this.keyHandlers = new Map();
        this.setupKeyHandlers();
    }

    /**
     * Initialize the game controller
     */
    initialize() {
        if (this.isInitialized) return;
        
        this.setupEventListeners();
        this.isInitialized = true;
        console.log('Game controller initialized');
    }

    /**
     * Setup key handlers for different game actions
     */
    setupKeyHandlers() {
        // Movement keys
        for (let key in Directions) {
            this.keyHandlers.set(key, () => {
                gameState.moveSelectedQuadray(Directions[key]);
            });
        }

        // Shape toggle keys
        this.keyHandlers.set('z', () => {
            gameState.toggleTetrahedronZAt(gameState.selq);
        });

        this.keyHandlers.set('x', () => {
            gameState.toggleOctahedronAt(gameState.selq);
        });

        this.keyHandlers.set('c', () => {
            gameState.toggleTetrahedronCAt(gameState.selq);
        });

        this.keyHandlers.set(' ', () => {
            // Toggle all three shapes
            gameState.toggleTetrahedronZAt(gameState.selq);
            gameState.toggleOctahedronAt(gameState.selq);
            gameState.toggleTetrahedronCAt(gameState.selq);
        });

        this.keyHandlers.set('Shift', () => {
            const current = gameState.getDisplaySettings();
            gameState.updateDisplaySettings({
                QGridDots: !current.QGridDots
            });
        });
    }

    /**
     * Setup event listeners for keyboard and UI
     */
    setupEventListeners() {
        // Keyboard event listener
        document.addEventListener('keydown', (e) => {
            this.handleKeyPress(e);
        });

        // Camera control event listeners
        this.setupCameraControls();
    }

    /**
     * Setup camera control event listeners
     */
    setupCameraControls() {
        const cameraInputs = ['numOffsetX', 'numOffsetY', 'numZoom', 'numAngleX', 'numAngleY'];
        
        cameraInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('input', () => {
                    this.updateCameraFromUI();
                });
            }
        });
    }

    /**
     * Handle key press events
     */
    handleKeyPress(event) {
        // Ignore input when focused on text areas
        if (event.target.tagName === 'TEXTAREA' || event.target.tagName === 'INPUT') {
            return;
        }

        const key = event.key;
        const handler = this.keyHandlers.get(key);
        
        if (handler) {
            handler();
            this.updateUI();
        } else {
            console.log(`No handler for key: ${key}`);
        }
    }

    /**
     * Simulate a key press (for UI buttons)
     */
    simKeyPress(key) {
        const handler = this.keyHandlers.get(key);
        if (handler) {
            handler();
            this.updateUI();
        } else {
            console.log(`No handler for key: ${key}`);
        }
    }

    /**
     * Simulate multiple key presses
     */
    simKeyPresses(keysString) {
        console.log('SimKeyPresses str=' + keysString);
        const keys = keysString.split(' ').filter(k => k.length > 0);
        
        for (let key of keys) {
            this.simKeyPress(key);
        }
    }

    /**
     * Toggle a game triangle
     */
    toggleGameTri(tri) {
        gameState.toggleGameTri(tri);
    }

    /**
     * Add colored dots to the player path
     */
    addColoredDots(quadrays, color) {
        for (let q of quadrays) {
            q.color = color;
            gameState.removeDot(q); // In case it had a different color
            gameState.addDot(q);
        }
    }

    /**
     * Update camera from UI controls
     */
    updateCameraFromUI() {
        const camera = {
            offsetX: parseFloat(document.getElementById('numOffsetX').value) || 0,
            offsetY: parseFloat(document.getElementById('numOffsetY').value) || 0,
            zoom: parseFloat(document.getElementById('numZoom').value) || 1,
            angleX: parseFloat(document.getElementById('numAngleX').value) || 0,
            angleY: parseFloat(document.getElementById('numAngleY').value) || 0
        };

        gameState.updateCamera(camera);
    }

    /**
     * Update UI from game state
     */
    updateUI() {
        // Update camera controls
        const camera = gameState.getCamera();
        document.getElementById('numOffsetX').value = camera.offsetX;
        document.getElementById('numOffsetY').value = camera.offsetY;
        document.getElementById('numZoom').value = camera.zoom;
        document.getElementById('numAngleX').value = camera.angleX;
        document.getElementById('numAngleY').value = camera.angleY;

        // Update selected quadray display
        const selqDisplay = document.getElementById('selq-display');
        if (selqDisplay) {
            selqDisplay.textContent = `selq: ${gameState.selq}`;
        }

        // Update code execution text
        const textBox = document.getElementById('textBoxToEval');
        if (textBox) {
            gameState.codeExecutionText = textBox.value;
        }
    }

    /**
     * Get grid dots near a center point
     */
    getGridDotsNear(center, hops) {
        return generateGridAround(center, hops);
    }

    /**
     * Fill grid by function
     */
    fillGridByFunc(centerQ, hops, func) {
        return gameState.fillGridByFunc(centerQ, hops, func);
    }

    /**
     * Get current game statistics
     */
    getGameStats() {
        return gameState.getStats();
    }

    /**
     * Check if game has pending changes
     */
    hasChanges() {
        return gameState.hasChanges();
    }

    /**
     * Mark changes as processed
     */
    markChangesProcessed() {
        gameState.markChangesProcessed();
    }

    /**
     * Get the current game state
     */
    getGameState() {
        return gameState;
    }

    /**
     * Reset the game
     */
    resetGame() {
        gameState.reset();
        this.updateUI();
    }

    /**
     * Get the current selected quadray
     */
    getSelectedQuadray() {
        return gameState.selq;
    }

    /**
     * Set the selected quadray
     */
    setSelectedQuadray(quadray) {
        gameState.selq = quadray;
        gameState.addDot(quadray);
        gameState.gridChanged = true;
        this.updateUI();
    }

    /**
     * Get all game triangles
     */
    getGameTriangles() {
        return Object.values(gameState.gameTris);
    }

    /**
     * Get all grid dots
     */
    getGridDots() {
        return Object.values(gameState.QGridDots);
    }

    /**
     * Get all player path dots
     */
    getPlayerPathDots() {
        return Object.values(gameState.QDots);
    }

    /**
     * Get the grid state
     */
    getGridState() {
        return gameState.grid;
    }

    /**
     * Get camera state
     */
    getCameraState() {
        return gameState.getCamera();
    }

    /**
     * Get display settings
     */
    getDisplaySettings() {
        return gameState.getDisplaySettings();
    }

    /**
     * Execute a sequence of moves
     */
    executeMoveSequence(moves) {
        for (let move of moves) {
            if (typeof move === 'string') {
                this.simKeyPress(move);
            } else if (typeof move === 'object' && move.direction) {
                gameState.moveSelectedQuadray(move.direction);
            }
        }
        this.updateUI();
    }

    /**
     * Create a path between two quadrays
     */
    createPath(fromQuadray, toQuadray, maxSteps = 100) {
        const path = [fromQuadray];
        let current = fromQuadray;
        let steps = 0;

        while (!current.equals(toQuadray) && steps < maxSteps) {
            // Find the best direction to move towards the target
            let bestDirection = null;
            let bestDistance = Infinity;

            for (let direction of Object.values(Directions)) {
                const next = current.add(direction);
                const distance = next.dist3d(toQuadray);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestDirection = direction;
                }
            }

            if (bestDirection) {
                current = current.add(bestDirection);
                path.push(current);
            } else {
                break;
            }

            steps++;
        }

        return path;
    }

    /**
     * Animate movement along a path
     */
    async animatePath(path, delayMs = 100) {
        for (let quadray of path) {
            this.setSelectedQuadray(quadray);
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }
    }
}

// Create global game controller instance
const gameController = new GameController();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GameController,
        gameController
    };
} 