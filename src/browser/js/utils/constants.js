/**
 * Constants and Configuration for QuadCraft Browser
 * Centralized configuration for mathematical constants and game settings
 */

// Mathematical Constants
const ROOT2 = Math.SQRT2;
const S3 = Math.sqrt(9 / 8);

// Game Configuration
const GAME_CONFIG = {
    // Grid and World Settings
    SIDE: 10,
    CUBE_SIZE: 700,
    QGRID_BOOT_DEPTH: 3,
    
    // Display Settings
    DISPLAY_CAMERA_CENTER_AS_DOT: false,
    VARY_POINT_SIZE_BY_DISTANCE: false,
    DISPLAY_QGRID_DOTS: true,
    
    // Camera Movement
    CAMERA_PAN_SPEED: 20,
    
    // Random Generation
    NUM_RANDOM_OCTAHEDRONS: 99,
    
    // Performance
    MAX_GRID_SIZE: 1000000,
    
    // Default Camera Position (arbitrary view that looks good at Q(0,0,0,0))
    DEFAULT_CAMERA: {
        offsetX: 731,
        offsetY: 141,
        zoom: 0.38742048900000015,
        angleX: 0.10999999999999997,
        angleY: 1.0100000000000038
    }
};

// Octahedron Geometry
const OCT_CORNERS = [
    [0, 0, 0], [0, 0, 2], [0, -1, 1], 
    [0, 1, 1], [-1, 0, 1], [1, 0, 1]
];

const OCTAHEDRON_FACES = [
    [0, 2, 4], [0, 4, 3], [0, 3, 5], [0, 5, 2],
    [1, 2, 5], [1, 5, 3], [1, 3, 4], [1, 4, 2]
];

// Core Directions for Quadray Navigation
const CORE_DIRECTIONS_DATA = [
    { a: 0, b: 1, c: -1, d: 0, desc: "from [0, -1, 1]" },
    { a: 1, b: 0, c: 0, d: -1, desc: "from [0, 1, 1]" },
    { a: 0, b: 1, c: 0, d: -1, desc: "from [-1, 0, 1]" },
    { a: 1, b: 0, c: -1, d: 0, desc: "from [1, 0, 1]" },
    { a: -1, b: 0, c: 0, d: 1, desc: "from [0, -1, -1]" },
    { a: 0, b: -1, c: 1, d: 0, desc: "from [0, 1, -1]" }
];

// Keyboard Mapping
const KEYBOARD_MAPPING = {
    // Forward directions (asdfgh)
    'a': 0, 's': 1, 'd': 2, 'f': 3, 'g': 4, 'h': 5,
    // Backward directions (qwerty)
    'q': 0, 'w': 1, 'e': 2, 'r': 3, 't': 4, 'y': 5
};

// Shape Types
const SHAPE_TYPES = {
    OCTAHEDRON: 'oct',
    TETRAHEDRON_Z: 'tetZ',
    TETRAHEDRON_C: 'tetC'
};

// Logging Configuration
const LOGGING_CONFIG = {
    MAX_LOG_ENTRIES: 1000,
    LOG_INTERVAL_MS: 100, // How often to log coordinates
    AUTO_EXPORT_INTERVAL: 30000, // Auto-export every 30 seconds
    COORDINATE_PRECISION: 6
};

// Analysis Configuration
const ANALYSIS_CONFIG = {
    TRAJECTORY_SMOOTHING: 0.1,
    HEATMAP_RESOLUTION: 50,
    STATISTICS_UPDATE_INTERVAL: 1000
};

// File Export Configuration
const EXPORT_CONFIG = {
    DEFAULT_FILENAME_PREFIX: 'quadcraft_quadgrid_',
    TIMESTAMP_FORMAT: 'YYYY-MM-DD_HH-mm-ss',
    JSON_INDENT: 2
};

// Error Messages
const ERROR_MESSAGES = {
    GRID_TOO_LARGE: 'Grid size exceeded maximum limit',
    INVALID_QUADRAY: 'Invalid quadray coordinates',
    FILE_LOAD_ERROR: 'Error loading file',
    SAVE_ERROR: 'Error saving data',
    INVALID_STATE: 'Invalid game state format'
};

// Utility Functions
const UTILS = {
    /**
     * Generate a random color in hex format
     */
    randColor: () => {
        const s = (Math.random() * (2 ** 24) | 0).toString(16);
        return '#' + s.padStart(6, '0');
    },

    /**
     * Get current timestamp in seconds with high precision
     */
    getTimestamp: () => {
        return (performance.timing.navigationStart + performance.now()) * 0.001;
    },

    /**
     * Format timestamp for display
     */
    formatTimestamp: (timestamp) => {
        return new Date(timestamp * 1000).toISOString().slice(11, -1);
    },

    /**
     * Calculate distance between two 3D points
     */
    distance3D: (xyz1, xyz2) => {
        return Math.hypot(xyz1[0] - xyz2[0], xyz1[1] - xyz2[1], xyz1[2] - xyz2[2]);
    },

    /**
     * Calculate average of three 3D points
     */
    average3D: (vecA, vecB, vecC) => {
        return [
            (vecA[0] + vecB[0] + vecC[0]) / 3,
            (vecA[1] + vecB[1] + vecC[1]) / 3,
            (vecA[2] + vecB[2] + vecC[2]) / 3
        ];
    },

    /**
     * Multiply vector by scalar
     */
    vecMulScalar: (vec, scalar) => {
        return [vec[0] * scalar, vec[1] * scalar, vec[2] * scalar];
    },

    /**
     * Generate random integer
     */
    randInt: (max) => Math.floor(Math.random() * max),

    /**
     * Generate random float
     */
    randFloat: (max) => Math.random() * max,

    /**
     * Error handler
     */
    Err: (str) => {
        throw new Error(str);
    }
};

// Create global constants object for browser use
const constants = {
    ROOT2,
    S3,
    GAME_CONFIG,
    OCT_CORNERS,
    OCTAHEDRON_FACES,
    CORE_DIRECTIONS_DATA,
    KEYBOARD_MAPPING,
    SHAPE_TYPES,
    LOGGING_CONFIG,
    ANALYSIS_CONFIG,
    EXPORT_CONFIG,
    ERROR_MESSAGES,
    UTILS
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = constants;
} 