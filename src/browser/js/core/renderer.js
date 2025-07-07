/**
 * Renderer Module
 * Handles drawing triangles, points, and other visual elements on the canvas
 */

/**
 * Renderer Class
 * Manages all rendering operations for the game
 */
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isInitialized = false;
    }

    /**
     * Initialize the renderer
     */
    initialize() {
        if (this.isInitialized) return;
        
        this.setCanvasSize();
        this.isInitialized = true;
        console.log('Renderer initialized');
    }

    /**
     * Set canvas size to match window size
     */
    setCanvasSize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    /**
     * Clear the canvas
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Draw a triangle in 3D space
     * @param {Array} p1 - First point [x, y, z]
     * @param {Array} p2 - Second point [x, y, z]
     * @param {Array} p3 - Third point [x, y, z]
     * @param {string} color - Fill color
     */
    drawTriangle(p1, p2, p3, color) {
        if (!camera) return;

        // Scale grid coordinates
        p1 = camera.scaleGrid(p1);
        p2 = camera.scaleGrid(p2);
        p3 = camera.scaleGrid(p3);

        // Project to 2D
        const a = camera.project(camera.rotate(p1));
        const b = camera.project(camera.rotate(p2));
        const c = camera.project(camera.rotate(p3));

        // Draw the triangle
        this.ctx.beginPath();
        this.ctx.moveTo(...a);
        this.ctx.lineTo(...b);
        this.ctx.lineTo(...c);
        this.ctx.closePath();
        
        this.ctx.fillStyle = color;
        this.ctx.fill();
        
        this.ctx.strokeStyle = '#000';
        this.ctx.stroke();
    }

    /**
     * Draw a point in 3D space
     * @param {Array} point3D - 3D point [x, y, z]
     * @param {string} color - Point color
     * @param {number} size - Point size (optional)
     */
    drawPoint(point3D, color, size = null) {
        if (!camera) return;

        const [px, py] = camera.project(camera.rotate(point3D));
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        
        let radius = 2;
        if (size !== null) {
            radius = size;
        } else if (constants.GAME_CONFIG.VARY_POINT_SIZE_BY_DISTANCE) {
            const distance = camera.getDistanceToPoint(point3D);
            radius = camera.getPointSize(distance);
        }
        
        this.ctx.arc(px, py, radius, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    /**
     * Draw a quadray point
     * @param {Quadray} quadray - Quadray to draw
     * @param {string} color - Point color
     */
    drawQuadrayPoint(quadray, color) {
        const cartesian = quadray.toCartesian();
        const unscaled = camera.unscaleGrid(cartesian);
        this.drawPoint(unscaled, color);
    }

    /**
     * Draw a triangle from quadray points
     * @param {Tri} triangle - Triangle to draw
     */
    drawQuadrayTriangle(triangle) {
        const p1 = camera.unscaleGrid(triangle.e.toCartesian());
        const p2 = camera.unscaleGrid(triangle.f.toCartesian());
        const p3 = camera.unscaleGrid(triangle.g.toCartesian());
        
        this.drawTriangle(p1, p2, p3, triangle.color);
    }

    /**
     * Sort triangles by distance from camera for proper depth ordering
     */
    sortTrianglesByDepth(triangles) {
        if (!camera) return triangles;

        const cameraPos = camera.getCameraXYZ();
        
        return triangles.sort((a, b) => {
            const centerA = constants.UTILS.average3D(
                camera.unscaleGrid(a.e.toCartesian()),
                camera.unscaleGrid(a.f.toCartesian()),
                camera.unscaleGrid(a.g.toCartesian())
            );
            
            const centerB = constants.UTILS.average3D(
                camera.unscaleGrid(b.e.toCartesian()),
                camera.unscaleGrid(b.f.toCartesian()),
                camera.unscaleGrid(b.g.toCartesian())
            );
            
            const distA = constants.UTILS.distance3D(cameraPos, centerA);
            const distB = constants.UTILS.distance3D(cameraPos, centerB);
            
            return distB - distA; // Draw farthest first
        });
    }

    /**
     * Render the current game state
     */
    render() {
        if (!this.isInitialized || !camera || !gameState) return;

        // Update camera position
        camera.updateCameraPosition();

        // Clear canvas
        this.clear();

        // Get game data
        const triangles = Object.values(gameState.gameTris);
        const gridDots = Object.values(gameState.QGridDots);
        const playerDots = Object.values(gameState.QDots);
        const displaySettings = gameState.getDisplaySettings();

        // Sort triangles by depth
        const sortedTriangles = this.sortTrianglesByDepth(triangles);

        // Draw triangles
        for (const tri of sortedTriangles) {
            this.drawQuadrayTriangle(tri);
        }

        // Draw grid dots if enabled
        if (displaySettings.QGridDots) {
            for (const q of gridDots) {
                this.drawQuadrayPoint(q, 'blue');
            }
        }

        // Draw player path dots
        for (const q of playerDots) {
            this.drawQuadrayPoint(q, q.color);
        }

        // Make selected quadray flash
        if (gameState.selq) {
            gameState.selq.color = constants.UTILS.randColor();
            this.drawQuadrayPoint(gameState.selq, gameState.selq.color);
        }
    }

    /**
     * Draw text on the canvas
     * @param {string} text - Text to draw
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {Object} options - Text options
     */
    drawText(text, x, y, options = {}) {
        const {
            color = '#ffffff',
            fontSize = '16px',
            fontFamily = 'Arial',
            textAlign = 'left',
            textBaseline = 'top'
        } = options;

        this.ctx.fillStyle = color;
        this.ctx.font = `${fontSize} ${fontFamily}`;
        this.ctx.textAlign = textAlign;
        this.ctx.textBaseline = textBaseline;
        this.ctx.fillText(text, x, y);
    }

    /**
     * Draw a rectangle
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @param {number} width - Width
     * @param {number} height - Height
     * @param {Object} options - Rectangle options
     */
    drawRect(x, y, width, height, options = {}) {
        const {
            fillColor = null,
            strokeColor = '#ffffff',
            lineWidth = 1
        } = options;

        this.ctx.lineWidth = lineWidth;

        if (fillColor) {
            this.ctx.fillStyle = fillColor;
            this.ctx.fillRect(x, y, width, height);
        }

        if (strokeColor) {
            this.ctx.strokeStyle = strokeColor;
            this.ctx.strokeRect(x, y, width, height);
        }
    }

    /**
     * Draw a line
     * @param {number} x1 - Start X coordinate
     * @param {number} y1 - Start Y coordinate
     * @param {number} x2 - End X coordinate
     * @param {number} y2 - End Y coordinate
     * @param {Object} options - Line options
     */
    drawLine(x1, y1, x2, y2, options = {}) {
        const {
            color = '#ffffff',
            lineWidth = 1
        } = options;

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = lineWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }

    /**
     * Draw a circle
     * @param {number} x - Center X coordinate
     * @param {number} y - Center Y coordinate
     * @param {number} radius - Circle radius
     * @param {Object} options - Circle options
     */
    drawCircle(x, y, radius, options = {}) {
        const {
            fillColor = null,
            strokeColor = '#ffffff',
            lineWidth = 1
        } = options;

        this.ctx.lineWidth = lineWidth;

        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, 2 * Math.PI);

        if (fillColor) {
            this.ctx.fillStyle = fillColor;
            this.ctx.fill();
        }

        if (strokeColor) {
            this.ctx.strokeStyle = strokeColor;
            this.ctx.stroke();
        }
    }

    /**
     * Draw debug information
     */
    drawDebugInfo() {
        if (!gameState) return;

        const stats = gameState.getStats();
        const cameraStats = camera ? camera.getCameraStats() : null;

        let y = 10;
        const lineHeight = 20;

        // Game statistics
        this.drawText('Game Stats:', 10, y, { color: '#ffff00' });
        y += lineHeight;
        
        this.drawText(`Selected: ${stats.selectedQuadray}`, 20, y);
        y += lineHeight;
        this.drawText(`Grid Dots: ${stats.gridDotsCount}`, 20, y);
        y += lineHeight;
        this.drawText(`Player Path: ${stats.playerPathCount}`, 20, y);
        y += lineHeight;
        this.drawText(`Triangles: ${stats.trianglesCount}`, 20, y);
        y += lineHeight;
        this.drawText(`Shapes: ${stats.totalShapesCount}`, 20, y);
        y += lineHeight * 2;

        // Camera statistics
        if (cameraStats) {
            this.drawText('Camera Stats:', 10, y, { color: '#00ffff' });
            y += lineHeight;
            this.drawText(`Zoom: ${cameraStats.zoom.toFixed(3)}`, 20, y);
            y += lineHeight;
            this.drawText(`Angle X: ${cameraStats.angles.x.toFixed(3)}`, 20, y);
            y += lineHeight;
            this.drawText(`Angle Y: ${cameraStats.angles.y.toFixed(3)}`, 20, y);
        }
    }

    /**
     * Draw coordinate axes for reference
     */
    drawCoordinateAxes() {
        if (!camera) return;

        const origin = [constants.GAME_CONFIG.SIDE / 2, constants.GAME_CONFIG.SIDE / 2, constants.GAME_CONFIG.SIDE / 2];
        const axisLength = 2;

        // X axis (red)
        const xEnd = [origin[0] + axisLength, origin[1], origin[2]];
        this.drawLine(...camera.project(camera.rotate(origin)), ...camera.project(camera.rotate(xEnd)), { color: '#ff0000', lineWidth: 2 });

        // Y axis (green)
        const yEnd = [origin[0], origin[1] + axisLength, origin[2]];
        this.drawLine(...camera.project(camera.rotate(origin)), ...camera.project(camera.rotate(yEnd)), { color: '#00ff00', lineWidth: 2 });

        // Z axis (blue)
        const zEnd = [origin[0], origin[1], origin[2] + axisLength];
        this.drawLine(...camera.project(camera.rotate(origin)), ...camera.project(camera.rotate(zEnd)), { color: '#0000ff', lineWidth: 2 });
    }

    /**
     * Draw a bounding box
     * @param {Object} boundingBox - Bounding box with min/max coordinates
     * @param {string} color - Box color
     */
    drawBoundingBox(boundingBox, color = '#ffff00') {
        if (!camera || !boundingBox) return;

        const { min, max } = boundingBox;
        
        // Convert to grid coordinates
        const corners = [
            [min[0], min[1], min[2]],
            [max[0], min[1], min[2]],
            [max[0], max[1], min[2]],
            [min[0], max[1], min[2]],
            [min[0], min[1], max[2]],
            [max[0], min[1], max[2]],
            [max[0], max[1], max[2]],
            [min[0], max[1], max[2]]
        ];

        // Project corners to 2D
        const projectedCorners = corners.map(corner => 
            camera.project(camera.rotate(camera.scaleGrid(corner)))
        );

        // Draw edges
        const edges = [
            [0, 1], [1, 2], [2, 3], [3, 0], // Bottom face
            [4, 5], [5, 6], [6, 7], [7, 4], // Top face
            [0, 4], [1, 5], [2, 6], [3, 7]  // Vertical edges
        ];

        for (const [i, j] of edges) {
            this.drawLine(
                projectedCorners[i][0], projectedCorners[i][1],
                projectedCorners[j][0], projectedCorners[j][1],
                { color, lineWidth: 1 }
            );
        }
    }

    /**
     * Get canvas context
     */
    getContext() {
        return this.ctx;
    }

    /**
     * Get canvas element
     */
    getCanvas() {
        return this.canvas;
    }

    /**
     * Check if renderer is initialized
     */
    isReady() {
        return this.isInitialized && camera !== null;
    }

    /**
     * Resize canvas
     */
    resizeCanvas() {
        this.setCanvasSize();
    }
}

// Create global renderer instance (will be initialized after canvas is available)
let renderer = null;

/**
 * Initialize the renderer with a canvas
 */
function initializeRenderer(canvas) {
    if (renderer) {
        console.warn('Renderer already initialized');
        return renderer;
    }
    
    renderer = new Renderer(canvas);
    renderer.initialize();
    
    console.log('Renderer initialized');
    return renderer;
}

/**
 * Get the renderer instance
 */
function getRenderer() {
    if (!renderer) {
        throw new Error('Renderer not initialized. Call initializeRenderer() first.');
    }
    return renderer;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Renderer,
        initializeRenderer,
        getRenderer
    };
} 