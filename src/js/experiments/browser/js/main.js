/**
 * Main Application Entry Point
 * Initializes all modules and starts the game loop
 */

// Global variables for compatibility with existing code
let viewChanged = false;
let gridChanged = false;

/**
 * Main application class
 */
class QuadCraftApp {
    constructor() {
        this.isRunning = false;
        this.lastFrameTime = 0;
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        console.log('Initializing QuadCraft...');
        
        try {
            // Initialize all modules
            this.initializeModules();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize game state
            this.initializeGameState();
            
            // Start the game loop
            this.start();
            
            console.log('QuadCraft initialized successfully');
        } catch (error) {
            console.error('Failed to initialize QuadCraft:', error);
        }
    }

    /**
     * Initialize all modules
     */
    initializeModules() {
        // Initialize renderer
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            throw new Error('Game canvas not found');
        }
        initializeRenderer(canvas);
        
        // Initialize camera
        initializeCamera(canvas);
        
        // Initialize geometry directions
        initializeDirections();
        
        // Initialize visualizer
        const vizInitialized = visualizer.init();
        if (!vizInitialized) {
            console.warn('Visualizer failed to initialize - canvas may be missing');
        }
        
        // Initialize logger
        logger.init();
        
        console.log('All modules initialized');
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            // Don't handle keys when typing in textarea
            if (e.target.id === 'textBoxToEval') {
                return;
            }
            gameController.handleKeyPress(e.key);
        });

        // Window resize
        window.addEventListener('resize', () => {
            renderer.resizeCanvas();
            camera.resizeCanvas();
        });

        // Camera input events
        const canvas = renderer.canvas;
        if (canvas) {
            canvas.addEventListener('mousedown', (e) => camera.handleMouseDown(e));
            canvas.addEventListener('mouseup', (e) => camera.handleMouseUp(e));
            canvas.addEventListener('mousemove', (e) => camera.handleMouseMove(e));
            canvas.addEventListener('wheel', (e) => camera.handleWheel(e));
            canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        }

        console.log('Event listeners set up');
    }

    /**
     * Initialize game state
     */
    initializeGameState() {
        // Set initial selected quadray
        gameState.selq = new Quadray(0, 0, 0, 0).dedup();
        
        // Add initial grid dot
        gameState.addQGridDot(gameState.selq);
        
        // Expand grid dots
        for (let depth = 1; depth <= constants.GAME_CONFIG.QGRID_BOOT_DEPTH; depth++) {
            gameState.expandGridDots();
        }
        
        // Set initial camera position
        gameState.camera = {
            offsetX: 731,
            offsetY: 141,
            zoom: 0.38742048900000015,
            angleX: 0.10999999999999997,
            angleY: 1.0100000000038
        };
        
        // Update camera with initial state
        camera.setCameraState(gameState.camera);
        
        // Update UI controls
        this.updateUIControls();
        
        console.log('Game state initialized');
    }

    /**
     * Start the game loop
     */
    start() {
        this.isRunning = true;
        this.gameLoop();
        console.log('Game loop started');
    }

    /**
     * Stop the game loop
     */
    stop() {
        this.isRunning = false;
        console.log('Game loop stopped');
    }

    /**
     * Main game loop
     */
    gameLoop(currentTime = 0) {
        if (!this.isRunning) return;

        // Calculate delta time
        const deltaTime = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;

        try {
            // Update game state
            this.update(deltaTime);
            
            // Render frame
            this.render();
            
            // Update visualizations
            visualizer.update();
            
            // Continue loop
            requestAnimationFrame((time) => this.gameLoop(time));
        } catch (error) {
            console.error('Error in game loop:', error);
            // Continue loop even if there's an error
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }

    /**
     * Update game state
     */
    update(deltaTime) {
        // Update camera
        camera.update(deltaTime);
        
        // Update game state if needed
        if (gridChanged || viewChanged) {
            // Sort triangles by depth for proper rendering
            const triangles = Object.values(gameState.gameTris);
            const sortedTriangles = renderer.sortTrianglesByDepth(triangles);
            
            // Rebuild gameTris object with sorted order
            gameState.gameTris = {};
            for (const tri of sortedTriangles) {
                gameState.gameTris[tri.primaryKey()] = tri;
            }
            
            this.updateUIControls();
            gridChanged = false;
            viewChanged = false;
        }
        
        // Update logger
        logger.update();
    }

    /**
     * Render the current frame
     */
    render() {
        // Use the renderer's main render method
        renderer.render();
    }

    /**
     * Update UI controls with current state
     */
    updateUIControls() {
        const cameraState = gameState.camera;
        
        // Update camera inputs
        const offsetXInput = document.getElementById('numOffsetX');
        const offsetYInput = document.getElementById('numOffsetY');
        const zoomInput = document.getElementById('numZoom');
        const angleXInput = document.getElementById('numAngleX');
        const angleYInput = document.getElementById('numAngleY');
        
        if (offsetXInput) offsetXInput.value = cameraState.offsetX;
        if (offsetYInput) offsetYInput.value = cameraState.offsetY;
        if (zoomInput) zoomInput.value = cameraState.zoom;
        if (angleXInput) angleXInput.value = cameraState.angleX;
        if (angleYInput) angleYInput.value = cameraState.angleY;
        
        // Update selected quadray display
        const selqDisplay = document.getElementById('selq-display');
        if (selqDisplay) {
            selqDisplay.textContent = 'selq: ' + gameState.selq.toString();
        }
    }
}

// Global functions for compatibility with existing code
function SimKeyPress(key) {
    gameController.simKeyPress(key);
}

function SimKeyPresses(str) {
    console.log('SimKeyPresses str=' + str);
    for (let ch of str) {
        gameController.simKeyPress(ch);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting QuadCraft...');
    
    // Create global app instance
    window.quadCraftApp = new QuadCraftApp();
    
    // Make app available globally
    window.app = window.quadCraftApp;
});

// Fallback initialization for immediate execution
if (document.readyState === 'loading') {
    // DOM is still loading
} else {
    // DOM is already loaded
    console.log('DOM already loaded, starting QuadCraft...');
    window.quadCraftApp = new QuadCraftApp();
    window.app = window.quadCraftApp;
} 