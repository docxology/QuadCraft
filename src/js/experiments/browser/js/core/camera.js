/**
 * Camera Module
 * Handles 3D camera transformations, mouse controls, and projection
 */

/**
 * Camera Class
 * Manages 3D camera position, orientation, and projection
 */
class Camera {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // Camera state
        this.offsetX = constants.GAME_CONFIG.DEFAULT_CAMERA.offsetX;
        this.offsetY = constants.GAME_CONFIG.DEFAULT_CAMERA.offsetY;
        this.zoom = constants.GAME_CONFIG.DEFAULT_CAMERA.zoom;
        this.angleX = constants.GAME_CONFIG.DEFAULT_CAMERA.angleX;
        this.angleY = constants.GAME_CONFIG.DEFAULT_CAMERA.angleY;
        this.cubeSize = constants.GAME_CONFIG.CUBE_SIZE;
        
        // Mouse state
        this.drag = false;
        this.rotateDrag = false;
        this.lastX = 0;
        this.lastY = 0;
        
        // Camera position cache
        this.lastCameraPosition = [0, 0, 0];
        
        this.setupEventListeners();
    }

    /**
     * Setup mouse and touch event listeners
     */
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
    }

    /**
     * Handle mouse down events
     */
    handleMouseDown(e) {
        if (e.button === 2) {
            this.drag = true;
        } else if (e.button === 0) {
            this.rotateDrag = true;
        }
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        this.canvas.style.cursor = 'grabbing';
    }

    /**
     * Handle mouse up events
     */
    handleMouseUp(e) {
        this.drag = false;
        this.rotateDrag = false;
        this.canvas.style.cursor = 'grab';
    }

    /**
     * Handle mouse move events
     */
    handleMouseMove(e) {
        if (this.drag) {
            this.offsetX += e.clientX - this.lastX;
            this.offsetY += e.clientY - this.lastY;
            this.notifyViewChanged();
        } else if (this.rotateDrag) {
            this.angleY += (e.clientX - this.lastX) * 0.01;
            this.angleX += (e.clientY - this.lastY) * 0.01;
            this.notifyViewChanged();
        }
        this.lastX = e.clientX;
        this.lastY = e.clientY;
    }

    /**
     * Handle mouse wheel events
     */
    handleWheel(e) {
        e.preventDefault();
        this.zoom *= e.deltaY < 0 ? 1.1 : 0.9;
        this.notifyViewChanged();
    }

    /**
     * Handle touch start events
     */
    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            this.rotateDrag = true;
            this.lastX = e.touches[0].clientX;
            this.lastY = e.touches[0].clientY;
        }
    }

    /**
     * Handle touch end events
     */
    handleTouchEnd(e) {
        e.preventDefault();
        this.drag = false;
        this.rotateDrag = false;
    }

    /**
     * Handle touch move events
     */
    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1 && this.rotateDrag) {
            this.angleY += (e.touches[0].clientX - this.lastX) * 0.01;
            this.angleX += (e.touches[0].clientY - this.lastY) * 0.01;
            this.lastX = e.touches[0].clientX;
            this.lastY = e.touches[0].clientY;
            this.notifyViewChanged();
        }
    }

    /**
     * Notify that the view has changed
     */
    notifyViewChanged() {
        if (typeof gameState !== 'undefined') {
            gameState.viewChanged = true;
        }
    }

    /**
     * Update camera state from external source
     */
    updateCamera(cameraData) {
        Object.assign(this, cameraData);
        this.updateCameraPosition();
    }

    /**
     * Get current camera state
     */
    getCameraState() {
        return {
            offsetX: this.offsetX,
            offsetY: this.offsetY,
            zoom: this.zoom,
            angleX: this.angleX,
            angleY: this.angleY
        };
    }

    /**
     * Update the cached camera position
     */
    updateCameraPosition() {
        this.lastCameraPosition = this.getCameraXYZ();
    }

    /**
     * Get the camera position in 3D space
     */
    getCameraXYZ() {
        const side = GAME_CONFIG.SIDE;
        const rotated = this.inverseRotate([side / 2, side / 2, side / 2 - this.cubeSize / this.zoom]);
        this.lastCameraPosition = rotated;
        return rotated;
    }

    /**
     * Rotate a 3D point around the camera angles
     */
    rotate([x, y, z]) {
        const side = constants.GAME_CONFIG.SIDE;
        
        // Move to origin
        let dx = x - side / 2;
        let dz = z - side / 2;
        
        // Rotate around Y axis
        let tx = dx * Math.cos(this.angleY) - dz * Math.sin(this.angleY);
        let tz = dx * Math.sin(this.angleY) + dz * Math.cos(this.angleY);
        dx = tx;
        dz = tz;
        
        // Rotate around X axis
        let dy = y - side / 2;
        tx = dy * Math.cos(this.angleX) - tz * Math.sin(this.angleX);
        tz = dy * Math.sin(this.angleX) + tz * Math.cos(this.angleX);
        dy = tx;
        
        // Move back from origin
        return [dx + side / 2, dy + side / 2, tz + side / 2];
    }

    /**
     * Inverse rotate a 3D point
     */
    inverseRotate([x, y, z]) {
        const side = constants.GAME_CONFIG.SIDE;
        
        // Move to origin
        let dx = x - side / 2;
        let dy = y - side / 2;
        let dz = z - side / 2;

        // Inverse X rotation
        let ty = dy * Math.cos(-this.angleX) - dz * Math.sin(-this.angleX);
        let tz = dy * Math.sin(-this.angleX) + dz * Math.cos(-this.angleX);
        dy = ty;
        dz = tz;

        // Inverse Y rotation
        let tx = dx * Math.cos(-this.angleY) - dz * Math.sin(-this.angleY);
        tz = dx * Math.sin(-this.angleY) + dz * Math.cos(-this.angleY);
        dx = tx;

        // Translate back from origin
        return [dx + side / 2, dy + side / 2, tz + side / 2];
    }

    /**
     * Project a 3D point to 2D screen coordinates
     */
    project([x, y, z]) {
        const side = constants.GAME_CONFIG.SIDE;
        const scale = this.cubeSize / (z + side);
        return [
            this.offsetX + (x - side / 2) * scale * this.zoom,
            this.offsetY - (y - side / 2) * scale * this.zoom
        ];
    }

    /**
     * Scale grid coordinates for display
     */
    scaleGrid(v) {
        const side = constants.GAME_CONFIG.SIDE;
        return [
            side / 2 + (v[0] - side / 2) * ROOT2,
            side / 2 + (v[1] - side / 2) * ROOT2,
            side / 2 + (v[2] - side / 2) * ROOT2
        ];
    }

    /**
     * Unscale grid coordinates
     */
    unscaleGrid([x, y, z]) {
        const side = constants.GAME_CONFIG.SIDE;
        return [
            (x - side / 2) / ROOT2 + side / 2,
            (y - side / 2) / ROOT2 + side / 2,
            (z - side / 2) / ROOT2 + side / 2
        ];
    }

    /**
     * Get the distance from camera to a 3D point
     */
    getDistanceToPoint(point3D) {
        return constants.UTILS.distance3D(this.lastCameraPosition, point3D);
    }

    /**
     * Calculate point size based on distance to camera
     */
    getPointSize(distance, baseSize = 2, maxSize = 8) {
        if (!constants.GAME_CONFIG.VARY_POINT_SIZE_BY_DISTANCE) {
            return baseSize;
        }
        
        const size = baseSize + (maxSize - baseSize) * (0.5 + 0.5 * Math.sin(distance * 20));
        return Math.max(1, Math.min(maxSize, size));
    }

    /**
     * Test the rotation functions for accuracy
     */
    testRotationFunctions() {
        console.log('Testing rotation functions...');
        
        for (let x = -10; x < 10; x++) {
            for (let y = -10; y < 10; y++) {
                for (let z = -10; z < 10; z++) {
                    const orig = [x, y, z];
                    const rotated = this.rotate(orig);
                    const rebuiltOrig = this.inverseRotate(rotated);
                    const dist = constants.UTILS.distance3D(orig, rebuiltOrig);
                    
                    if (dist > 0.001) {
                        console.error('Rotation test failed:', {
                            original: orig,
                            rotated: rotated,
                            rebuilt: rebuiltOrig,
                            distance: dist
                        });
                        return false;
                    }
                }
            }
        }
        
        console.log('Rotation functions test passed');
        return true;
    }

    /**
     * Reset camera to default position
     */
    resetToDefault() {
        this.offsetX = constants.GAME_CONFIG.DEFAULT_CAMERA.offsetX;
        this.offsetY = constants.GAME_CONFIG.DEFAULT_CAMERA.offsetY;
        this.zoom = constants.GAME_CONFIG.DEFAULT_CAMERA.zoom;
        this.angleX = constants.GAME_CONFIG.DEFAULT_CAMERA.angleX;
        this.angleY = constants.GAME_CONFIG.DEFAULT_CAMERA.angleY;
        this.notifyViewChanged();
    }

    /**
     * Set camera state from external source
     */
    setCameraState(cameraState) {
        this.offsetX = cameraState.offsetX;
        this.offsetY = cameraState.offsetY;
        this.zoom = cameraState.zoom;
        this.angleX = cameraState.angleX;
        this.angleY = cameraState.angleY;
        this.notifyViewChanged();
    }

    /**
     * Get camera statistics
     */
    getCameraStats() {
        return {
            position: this.lastCameraPosition,
            angles: { x: this.angleX, y: this.angleY },
            zoom: this.zoom,
            offset: { x: this.offsetX, y: this.offsetY },
            cubeSize: this.cubeSize
        };
    }

    /**
     * Set canvas size
     */
    setCanvasSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    }

    /**
     * Get canvas dimensions
     */
    getCanvasDimensions() {
        return {
            width: this.canvas.width,
            height: this.canvas.height
        };
    }

    /**
     * Resize canvas
     */
    resizeCanvas() {
        this.setCanvasSize(window.innerWidth, window.innerHeight);
    }
}

// Create global camera instance (will be initialized after canvas is available)
let camera = null;

/**
 * Initialize the camera with a canvas
 */
function initializeCamera(canvas) {
    if (camera) {
        console.warn('Camera already initialized');
        return camera;
    }
    
    camera = new Camera(canvas);
    
    // Run rotation tests
    camera.testRotationFunctions();
    
    console.log('Camera initialized');
    return camera;
}

/**
 * Get the camera instance
 */
function getCamera() {
    if (!camera) {
        throw new Error('Camera not initialized. Call initializeCamera() first.');
    }
    return camera;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Camera,
        initializeCamera,
        getCamera
    };
} 