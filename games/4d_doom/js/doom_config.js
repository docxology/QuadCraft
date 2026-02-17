/**
 * doom_config.js — Constants and Configuration for 4D Doom
 * All tunable parameters in one place.
 * Synergetics-native: IVM grid, tetravolumes, tetrahedral geometry.
 */

// Cell types for the IVM voxel grid
export const CELL = {
    VOID: 0,       // Empty / unexplored
    FLOOR: 1,      // Walkable floor
    WALL: 2,       // Standard wall
    WALL2: 3,      // Alternate wall texture (octa pattern)
    WALL3: 4,      // Third wall type (cubo pattern)
    DOOR: 5,       // Door
    EXIT: 6,       // Level exit
    IVM_NODE: 7,   // IVM grid junction (decorative)
    TETRA_WALL: 8, // Tetrahedral geometry wall
    OCTA_WALL: 9,  // Octahedral geometry wall
};

// IVM (Isotropic Vector Matrix) constants — Fuller's Synergetics
export const IVM = {
    // 8 neighbor directions in 4D Quadray space (±1 on each axis)
    DIRECTIONS: [
        [1, 0, 0, 0], [-1, 0, 0, 0],
        [0, 1, 0, 0], [0, -1, 0, 0],
        [0, 0, 1, 0], [0, 0, -1, 0],
        [0, 0, 0, 1], [0, 0, 0, -1],
    ],
    // Per-cell volume in tetravolumes: (1/√2)^3 × S3 ≈ 0.375
    CELL_TETRAVOLUME: Math.pow(1 / Math.sqrt(2), 3) * Math.sqrt(9 / 8),
    // Tetrahedral angle between basis vectors
    TETRAHEDRAL_ANGLE: 109.4712, // degrees
    // Synergetics volume ratios (tetra = 1)
    VOLUME_TETRA: 1,
    VOLUME_OCTA: 4,
    VOLUME_CUBO: 20,
    // Volume ratios grouped for convenience
    VOLUME_RATIOS: Object.freeze({ T: 1, O: 4, C: 20 }),
    // S3 constant: XYZ→IVM volume conversion = √(9/8)
    S3: Math.sqrt(9 / 8),
    // Basis vector length in Cartesian
    BASIS_LENGTH: 1 / Math.sqrt(2), // ~0.7071
    // Tetra edge offsets for polyhedra detection
    TETRA_OFFSETS: [[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]],
    // Octa vertex offsets
    OCTA_OFFSETS: [[1, 1, 0, 0], [1, 0, 1, 0], [1, 0, 0, 1], [0, 1, 1, 0], [0, 1, 0, 1], [0, 0, 1, 1]],
};

// Weapon definitions
export const WEAPONS = [
    { name: 'Pistol', damage: 15, cooldown: 12, spread: 0, pellets: 1, ammoKey: 'bullets', auto: false },
    { name: 'Shotgun', damage: 10, cooldown: 30, spread: 0.08, pellets: 7, ammoKey: 'shells', auto: false },
    { name: 'Plasma', damage: 25, cooldown: 5, spread: 0.02, pellets: 1, ammoKey: 'cells', auto: true },
];

// Enemy stat tables
export const ENEMY_STATS = {
    imp: { hp: 60, speed: 0.025, damage: 8, attackRange: 8, color: '#e83a30', name: 'Imp' },
    demon: { hp: 150, speed: 0.045, damage: 15, attackRange: 1.5, color: '#ff2266', name: 'Pinky' },
    baron: { hp: 500, speed: 0.02, damage: 20, attackRange: 10, color: '#00ff88', name: 'Baron' },
};

// Rendering config
export const RENDER = {
    FOV: Math.PI / 3,        // 60° field of view
    WALL_HEIGHT: 1.0,
    DRAW_DISTANCE: 20,
    MINIMAP_SCALE: 6,        // Pixels per cell on minimap
    MINIMAP_RADIUS: 60,
    IVM_GRID_ALPHA: 0.3,     // Floor grid line alpha
    IVM_GRID_COLOR: '#44ff88',// Grid line color (green for Synergetics)
    IVM_GRID_MODE: 1,        // 0=Off, 1=Grid, 2=Grid+Wireframe
    SHOW_COORDINATES: true,  // Show distinct A,B,C,D bars
    GRID_RADIUS: 12,         // How many grid lines to draw
    TEXTURE_SIZE: 128,       // Wall texture resolution (px)
    GLOW_INTENSITY: 0.6,     // Neon edge glow strength
    BLOOM_RADIUS: 8,         // Bloom halo size
};

// Map generation config
export const MAP = {
    SIZE: 24,                // IVM grid size per dimension (24^4)
    NUM_ROOMS: 15,
    MIN_ROOM: 3,
    MAX_ROOM: 7,
    ENEMIES_PER_ROOM: 2,
};

// Futuristic cyber-neon palette
export const COLORS = {
    sky: '#0a0618',
    floor: '#1a0f08',
    ceiling: '#060410',
    hud: '#1a1a2e',
    health: '#ff2244',
    ammo: '#ffcc00',
    blood: '#cc0000',
    // Quadray axes — vibrant neon
    quadrayA: '#ff3355',  // A-axis (Neon Red-Pink)
    quadrayB: '#00ff66',  // B-axis (Neon Green)
    quadrayC: '#3388ff',  // C-axis (Neon Blue)
    quadrayD: '#ffee00',  // D-axis (Neon Yellow)
    // Environment
    ivm: '#ffffff',       // IVM grid color (White for contrast)
    synergetics: '#00ffcc',// Cyan-mint for data
    // Glow / neon accents
    glowTetra: '#aa44ff',  // Tetra cell glow (purple)
    glowOcta: '#00ffaa',   // Octa cell glow (cyan)
    glowWarm: '#ff8844',   // Warm glow for generic edges
    neonPink: '#ff44aa',
    neonBlue: '#4488ff',
    neonCyan: '#44ffff',
    neonPurple: '#aa66ff',
    // HUD accent
    hudGlass: 'rgba(10, 15, 30, 0.75)',
    hudBorder: 'rgba(0, 255, 204, 0.4)',
    hudHighlight: '#00ffcc',
};
