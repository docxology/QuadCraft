/**
 * Game State Module
 * Manages the current state of the game including grid, shapes, and UI state
 */

/**
 * Game State Class
 * Centralized state management for the QuadCraft game
 */
class GameState {
    constructor() {
        this.reset();
    }

    /**
     * Reset the game state to initial values
     */
    reset() {
        // Selected quadray (player position)
        this.selq = Q(0, 0, 0, 0);
        
        // Grid dots for navigation
        this.QGridDots = {};
        
        // Player path dots
        this.QDots = {};
        
        // Game triangles (faces of shapes)
        this.gameTris = {};
        
        // Grid state - contains all placed shapes
        this.grid = {
            oct: new Set(),    // Octahedrons
            tetZ: new Set(),   // Tetrahedrons Z
            tetC: new Set()    // Tetrahedrons C
        };
        
        // Camera state
        this.camera = {
            offsetX: constants.GAME_CONFIG.DEFAULT_CAMERA.offsetX,
            offsetY: constants.GAME_CONFIG.DEFAULT_CAMERA.offsetY,
            zoom: constants.GAME_CONFIG.DEFAULT_CAMERA.zoom,
            angleX: constants.GAME_CONFIG.DEFAULT_CAMERA.angleX,
            angleY: constants.GAME_CONFIG.DEFAULT_CAMERA.angleY
        };
        
        // Display settings
        this.displaySettings = {
            QGridDots: constants.GAME_CONFIG.DISPLAY_QGRID_DOTS,
            varyPointSizeByDistance: constants.GAME_CONFIG.VARY_POINT_SIZE_BY_DISTANCE
        };
        
        // Change flags
        this.gridChanged = false;
        this.viewChanged = false;
        
        // Code execution text
        this.codeExecutionText = '';
        
        // Initialize grid
        this.initializeGrid();
    }

    /**
     * Initialize the grid with the starting quadray
     */
    initializeGrid() {
        this.addQGridDot(this.selq);
        
        // Expand grid to boot depth
        for (let depth = 1; depth <= constants.GAME_CONFIG.QGRID_BOOT_DEPTH; depth++) {
            this.expandQGridDotsOneDeeper();
        }
    }

    /**
     * Add a quadray to the grid dots
     */
    addQGridDot(quadray) {
        quadray = quadray.dedup();
        this.QGridDots[quadray.toString()] = quadray;
    }

    /**
     * Expand grid dots by one level
     */
    expandQGridDotsOneDeeper() {
        const directions = Object.values(Directions);
        const currentDots = Object.values(this.QGridDots);
        
        for (let q of currentDots) {
            for (let direction of directions) {
                const newQuadray = q.add(direction);
                this.addQGridDot(newQuadray);
            }
        }
    }

    /**
     * Add a dot to the player path
     */
    addDot(quadray) {
        this.QDots[quadray.toString()] = quadray;
    }

    /**
     * Remove a dot from the player path
     */
    removeDot(quadray) {
        delete this.QDots[quadray.toString()];
    }

    /**
     * Check if a dot exists in the player path
     */
    hasDot(quadray) {
        return !!this.QDots[quadray.toString()];
    }

    /**
     * Toggle a dot in the player path
     */
    toggleDot(quadray) {
        if (this.hasDot(quadray)) {
            this.removeDot(quadray);
        } else {
            this.addDot(quadray);
        }
    }

    /**
     * Add a game triangle
     */
    addGameTri(tri) {
        this.gameTris[tri.primaryKey()] = tri;
    }

    /**
     * Remove a game triangle
     */
    removeGameTri(tri) {
        delete this.gameTris[tri.primaryKey()];
    }

    /**
     * Check if a game triangle exists
     */
    hasGameTri(tri) {
        return !!this.gameTris[tri.primaryKey()];
    }

    /**
     * Toggle a game triangle
     */
    toggleGameTri(tri) {
        if (this.hasGameTri(tri)) {
            this.removeGameTri(tri);
        } else {
            this.addGameTri(tri);
        }
        this.gridChanged = true;
    }

    /**
     * Toggle an octahedron at a quadray position
     */
    toggleOctahedronAt(quadray) {
        console.log('toggleOctahedronAt q=' + quadray);
        
        // Toggle corners
        const corners = getOctahedronCorners(quadray);
        for (let corner of corners) {
            this.toggleDot(corner);
        }
        
        // Toggle triangles
        const triangles = getOctahedronTriangles(quadray);
        for (let tri of triangles) {
            this.toggleGameTri(tri);
        }
        
        // Toggle in grid
        this.toggleQuadrayInSet(this.grid.oct, quadray);
        this.gridChanged = true;
    }

    /**
     * Toggle tetrahedron Z at a quadray position
     */
    toggleTetrahedronZAt(quadray) {
        console.log('toggleTetrahedronZAt q=' + quadray);
        
        // Toggle corners
        const corners = getTetrahedronZCorners(quadray);
        for (let corner of corners) {
            this.toggleDot(corner);
        }
        
        // Toggle triangles
        const triangles = getTetrahedronZTriangles(quadray);
        for (let tri of triangles) {
            this.toggleGameTri(tri);
        }
        
        // Toggle in grid
        this.toggleQuadrayInSet(this.grid.tetZ, quadray);
        this.gridChanged = true;
    }

    /**
     * Toggle tetrahedron C at a quadray position
     */
    toggleTetrahedronCAt(quadray) {
        console.log('toggleTetrahedronCAt q=' + quadray);
        
        // Toggle corners
        const corners = getTetrahedronXCorners(quadray);
        for (let corner of corners) {
            this.toggleDot(corner);
        }
        
        // Toggle triangles
        const triangles = getTetrahedronXTriangles(quadray);
        for (let tri of triangles) {
            this.toggleGameTri(tri);
        }
        
        // Toggle in grid
        this.toggleQuadrayInSet(this.grid.tetC, quadray);
        this.gridChanged = true;
    }

    /**
     * Toggle a quadray in a Set
     */
    toggleQuadrayInSet(set, quadray) {
        if (set.has(quadray)) {
            set.delete(quadray);
        } else {
            set.add(quadray);
        }
    }

    /**
     * Move the selected quadray in a direction
     */
    moveSelectedQuadray(direction) {
        const nextSelq = this.selq.add(direction);
        console.log('selq=' + this.selq.toDetailString() + ' nextSelq=' + nextSelq.toDetailString());
        this.selq = nextSelq;
        this.addDot(this.selq);
        this.gridChanged = true;
    }

    /**
     * Update camera position
     */
    updateCamera(cameraData) {
        Object.assign(this.camera, cameraData);
        this.viewChanged = true;
    }

    /**
     * Get camera data
     */
    getCamera() {
        return { ...this.camera };
    }

    /**
     * Update display settings
     */
    updateDisplaySettings(settings) {
        Object.assign(this.displaySettings, settings);
        this.viewChanged = true;
    }

    /**
     * Get display settings
     */
    getDisplaySettings() {
        return { ...this.displaySettings };
    }

    /**
     * Clear all shapes
     */
    clearShapes() {
        this.gameTris = {};
        this.QDots = {};
        this.grid.oct.clear();
        this.grid.tetZ.clear();
        this.grid.tetC.clear();
        this.gridChanged = true;
    }

    /**
     * Fill grid by function
     * @param {Quadray} centerQ - Center quadray
     * @param {number} hops - Number of hops outward
     * @param {Function} func - Function that returns true/false for each position
     */
    fillGridByFunc(centerQ, hops, func) {
        const gridQuadrays = generateGridAround(centerQ, hops);
        let countOctYes = 0, countOctNo = 0;
        let countTetZYes = 0, countTetZNo = 0;
        let countTetCYes = 0, countTetCNo = 0;

        const toOctCenter = getOctahedronCenterOffset();
        const toTetZCenter = getTetrahedronZCenterOffset();
        const toTetCCenter = getTetrahedronXCenterOffset();

        for (let q of gridQuadrays) {
            if (func(q.add(toOctCenter))) {
                this.toggleOctahedronAt(q);
                countOctYes++;
            } else {
                countOctNo++;
            }
            
            if (func(q.add(toTetZCenter))) {
                this.toggleTetrahedronZAt(q);
                countTetZYes++;
            } else {
                countTetZNo++;
            }
            
            if (func(q.add(toTetCCenter))) {
                this.toggleTetrahedronCAt(q);
                countTetCYes++;
            } else {
                countTetCNo++;
            }
        }

        return `fillGridByFunc matched ${countOctYes}/${countTetZYes}/${countTetCYes} of ${countOctYes + countOctNo}/${countTetZYes + countTetZNo}/${countTetCYes + countTetCNo} octahedrons/tetrahedronZs/tetrahedronCs`;
    }

    /**
     * Convert grid to map for serialization
     */
    gridToMap() {
        const map = {};
        for (let key in this.grid) {
            map[key] = [];
            for (let q of this.grid[key]) {
                map[key].push(q.abcd());
            }
        }
        return map;
    }

    /**
     * Load grid from map
     */
    loadGridFromMap(map) {
        this.clearShapes();
        
        for (let abcd of map.oct || []) {
            const quadray = Q(...abcd);
            this.toggleOctahedronAt(quadray);
        }
        
        for (let abcd of map.tetZ || []) {
            const quadray = Q(...abcd);
            this.toggleTetrahedronZAt(quadray);
        }
        
        for (let abcd of map.tetC || []) {
            const quadray = Q(...abcd);
            this.toggleTetrahedronCAt(quadray);
        }
    }

    /**
     * Get state as JSON-serializable object
     */
    toJSON() {
        return {
            type: 'quadcraft_quadraygrid2_state',
            selq: this.selq.abcd(),
            camera: this.camera,
            displaySettings: this.displaySettings,
            codeExecutionText: this.codeExecutionText,
            grid: this.gridToMap()
        };
    }

    /**
     * Load state from JSON object
     */
    fromJSON(data) {
        if (data.type !== 'quadcraft_quadraygrid2_state') {
            throw new Error(constants.ERROR_MESSAGES.INVALID_STATE);
        }

        this.selq = Q(...data.selq);
        this.camera = { ...data.camera };
        this.displaySettings = { ...data.displaySettings };
        this.codeExecutionText = data.codeExecutionText || '';
        
        if (data.grid) {
            this.loadGridFromMap(data.grid);
        }

        this.gridChanged = true;
        this.viewChanged = true;
    }

    /**
     * Get statistics about the current state
     */
    getStats() {
        return {
            selectedQuadray: this.selq.toString(),
            gridDotsCount: Object.keys(this.QGridDots).length,
            playerPathCount: Object.keys(this.QDots).length,
            trianglesCount: Object.keys(this.gameTris).length,
            octahedronsCount: this.grid.oct.size,
            tetrahedronsZCount: this.grid.tetZ.size,
            tetrahedronsCCount: this.grid.tetC.size,
            totalShapesCount: this.grid.oct.size + this.grid.tetZ.size + this.grid.tetC.size
        };
    }

    /**
     * Check if there are any pending changes
     */
    hasChanges() {
        return this.gridChanged || this.viewChanged;
    }

    /**
     * Mark changes as processed
     */
    markChangesProcessed() {
        this.gridChanged = false;
        this.viewChanged = false;
    }
}

// Create global game state instance
const gameState = new GameState();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GameState,
        gameState
    };
} 