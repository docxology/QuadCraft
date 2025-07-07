/**
 * Geometry Module
 * Contains shape generation functions and geometric operations for octahedrons and tetrahedrons
 */

// Core directions for navigation (will be initialized after quadray module loads)
let CoreDirections = [];
let Directions = {};

/**
 * Initialize the core directions and keyboard mappings
 * Must be called after the quadray module is loaded
 */
function initializeDirections() {
    // Create core directions from the data
    CoreDirections = CORE_DIRECTIONS_DATA.map(data => 
        Q(data.a, data.b, data.c, data.d)
    );

    // Create the full direction mapping
    Directions = {
        // Forward directions (asdfgh)
        a: CoreDirections[0],
        s: CoreDirections[1],
        d: CoreDirections[2],
        f: CoreDirections[3],
        g: CoreDirections[4],
        h: CoreDirections[5],
        
        // Backward directions (qwerty)
        q: CoreDirections[0].mul(-1),
        w: CoreDirections[1].mul(-1),
        e: CoreDirections[2].mul(-1),
        r: CoreDirections[3].mul(-1),
        t: CoreDirections[4].mul(-1),
        y: CoreDirections[5].mul(-1)
    };

    console.log('Directions initialized:', Object.keys(Directions));
}

/**
 * Get the 6 corners of an octahedron at a given quadray position
 */
function getOctahedronCorners(quadray) {
    let A = CoreDirections[0].Neg();
    let B = CoreDirections[4].Neg();
    
    return [
        quadray, // Base corner
        quadray.add(A).add(B), // Opposite corner
        quadray.add(CoreDirections[1]), // Corner 1
        quadray.add(CoreDirections[5]), // Corner 2
        quadray.add(CoreDirections[5]).add(CoreDirections[3]), // Corner 3
        quadray.add(CoreDirections[3].Neg()).add(CoreDirections[1]) // Corner 4
    ];
}

/**
 * Get the 4 corners of tetrahedron Z at a given quadray position
 */
function getTetrahedronZCorners(quadray) {
    return [
        quadray, // Main corner shared between octahedron and tetrahedrons
        quadray.add(Directions.e),
        quadray.add(Directions.q), // Secondary corner shared between octahedron and tetrahedrons
        quadray.add(Directions.q).add(Directions.f)
    ];
}

/**
 * Get the 4 corners of tetrahedron X at a given quadray position
 */
function getTetrahedronXCorners(quadray) {
    return [
        quadray, // Main corner shared between octahedron and tetrahedrons
        quadray.add(Directions.r),
        quadray.add(Directions.q), // Secondary corner shared between octahedron and tetrahedrons
        quadray.add(Directions.q).add(Directions.d)
    ];
}

/**
 * Generate triangles for a tetrahedron from its 4 corners
 */
function generateTetrahedronTriangles(corners) {
    return [
        T(corners[1], corners[2], corners[3]),
        T(corners[0], corners[2], corners[3]),
        T(corners[0], corners[1], corners[3]),
        T(corners[0], corners[1], corners[2])
    ];
}

/**
 * Generate triangles for an octahedron from its 6 corners
 */
function generateOctahedronTriangles(corners) {
    return OCTAHEDRON_FACES.map(faceIndices => 
        T(corners[faceIndices[0]], corners[faceIndices[1]], corners[faceIndices[2]])
    );
}

/**
 * Get all triangles for an octahedron at a given quadray position
 */
function getOctahedronTriangles(quadray) {
    const corners = getOctahedronCorners(quadray);
    return generateOctahedronTriangles(corners);
}

/**
 * Get all triangles for tetrahedron Z at a given quadray position
 */
function getTetrahedronZTriangles(quadray) {
    const corners = getTetrahedronZCorners(quadray);
    return generateTetrahedronTriangles(corners);
}

/**
 * Get all triangles for tetrahedron X at a given quadray position
 */
function getTetrahedronXTriangles(quadray) {
    const corners = getTetrahedronXCorners(quadray);
    return generateTetrahedronTriangles(corners);
}

/**
 * Get the center offset for an octahedron
 */
function getOctahedronCenterOffset() {
    const corners = getOctahedronCorners(Q(0, 0, 0, 0));
    return quadrayAverage(corners);
}

/**
 * Get the center offset for tetrahedron Z
 */
function getTetrahedronZCenterOffset() {
    const corners = getTetrahedronZCorners(Q(0, 0, 0, 0));
    return quadrayAverage(corners);
}

/**
 * Get the center offset for tetrahedron X
 */
function getTetrahedronXCenterOffset() {
    const corners = getTetrahedronXCorners(Q(0, 0, 0, 0));
    return quadrayAverage(corners);
}

/**
 * Generate a grid of quadrays around a center point
 * @param {Quadray} center - The center quadray
 * @param {number} hops - Number of hops outward from center
 * @returns {Quadray[]} Array of quadrays in the grid
 */
function generateGridAround(center, hops) {
    const set = new Set();
    set.add(center);
    
    for (let h = 1; h <= hops; h++) {
        const currentSet = [...set];
        for (let q of currentSet) {
            for (let direction of CoreDirections) {
                const newQuadray = q.add(direction);
                set.add(newQuadray);
                
                if (set.size > GAME_CONFIG.MAX_GRID_SIZE) {
                    UTILS.Err(ERROR_MESSAGES.GRID_TOO_LARGE);
                }
            }
        }
    }
    
    return [...set];
}

/**
 * Expand the existing grid dots by one level
 * @param {Object} gridDots - Current grid dots object
 */
function expandGridDots(gridDots) {
    const directions = Object.values(Directions);
    const currentDots = Object.values(gridDots);
    
    for (let q of currentDots) {
        for (let direction of directions) {
            const newQuadray = q.add(direction);
            gridDots[newQuadray.toString()] = newQuadray;
        }
    }
}

/**
 * Calculate the volume of a tetrahedron
 * @param {Quadray[]} corners - The 4 corners of the tetrahedron
 * @returns {number} Volume
 */
function calculateTetrahedronVolume(corners) {
    const [a, b, c, d] = corners.map(q => q.toCartesian());
    
    // Calculate volume using determinant
    const matrix = [
        [a[0], a[1], a[2], 1],
        [b[0], b[1], b[2], 1],
        [c[0], c[1], c[2], 1],
        [d[0], d[1], d[2], 1]
    ];
    
    // Calculate 4x4 determinant
    const det = calculateDeterminant4x4(matrix);
    return Math.abs(det) / 6;
}

/**
 * Calculate the volume of an octahedron
 * @param {Quadray[]} corners - The 6 corners of the octahedron
 * @returns {number} Volume
 */
function calculateOctahedronVolume(corners) {
    // Split octahedron into 8 tetrahedrons
    const center = quadrayAverage(corners);
    let totalVolume = 0;
    
    for (let face of OCTAHEDRON_FACES) {
        const tetrahedronCorners = [
            center,
            corners[face[0]],
            corners[face[1]],
            corners[face[2]]
        ];
        totalVolume += calculateTetrahedronVolume(tetrahedronCorners);
    }
    
    return totalVolume;
}

/**
 * Calculate determinant of a 4x4 matrix
 * @param {number[][]} matrix - 4x4 matrix
 * @returns {number} Determinant
 */
function calculateDeterminant4x4(matrix) {
    // Laplace expansion
    let det = 0;
    for (let i = 0; i < 4; i++) {
        const minor = [];
        for (let j = 1; j < 4; j++) {
            const row = [];
            for (let k = 0; k < 4; k++) {
                if (k !== i) row.push(matrix[j][k]);
            }
            minor.push(row);
        }
        det += matrix[0][i] * Math.pow(-1, i) * calculateDeterminant3x3(minor);
    }
    return det;
}

/**
 * Calculate determinant of a 3x3 matrix
 * @param {number[][]} matrix - 3x3 matrix
 * @returns {number} Determinant
 */
function calculateDeterminant3x3(matrix) {
    return matrix[0][0] * (matrix[1][1] * matrix[2][2] - matrix[1][2] * matrix[2][1]) -
           matrix[0][1] * (matrix[1][0] * matrix[2][2] - matrix[1][2] * matrix[2][0]) +
           matrix[0][2] * (matrix[1][0] * matrix[2][1] - matrix[1][1] * matrix[2][0]);
}

/**
 * Check if a point is inside a tetrahedron
 * @param {Quadray} point - Point to test
 * @param {Quadray[]} corners - Tetrahedron corners
 * @returns {boolean} True if point is inside
 */
function isPointInTetrahedron(point, corners) {
    const volumes = [];
    const pointCoords = point.toCartesian();
    
    // Calculate volumes of 4 tetrahedrons formed by the point and each face
    for (let i = 0; i < 4; i++) {
        const faceCorners = corners.filter((_, j) => j !== i);
        const tetrahedronCorners = [point, ...faceCorners];
        volumes.push(calculateTetrahedronVolume(tetrahedronCorners));
    }
    
    // Calculate volume of original tetrahedron
    const originalVolume = calculateTetrahedronVolume(corners);
    
    // Sum of sub-volumes should equal original volume if point is inside
    const sumVolumes = volumes.reduce((sum, vol) => sum + vol, 0);
    return Math.abs(sumVolumes - originalVolume) < 1e-10;
}

/**
 * Get the bounding box of a set of quadrays
 * @param {Quadray[]} quadrays - Array of quadrays
 * @returns {Object} Bounding box with min/max coordinates
 */
function getBoundingBox(quadrays) {
    if (quadrays.length === 0) {
        return { min: [0, 0, 0], max: [0, 0, 0] };
    }
    
    const cartesians = quadrays.map(q => q.toCartesian());
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    
    for (let coords of cartesians) {
        for (let i = 0; i < 3; i++) {
            min[i] = Math.min(min[i], coords[i]);
            max[i] = Math.max(max[i], coords[i]);
        }
    }
    
    return { min, max };
}

/**
 * Calculate the surface area of a set of triangles
 * @param {Tri[]} triangles - Array of triangles
 * @returns {number} Total surface area
 */
function calculateSurfaceArea(triangles) {
    return triangles.reduce((total, tri) => total + tri.getArea(), 0);
}

/**
 * Get geometric statistics for the current game state
 * @param {Object} gameState - Current game state
 * @returns {Object} Statistics object
 */
function getGeometricStats(gameState) {
    const stats = {
        octahedrons: 0,
        tetrahedronsZ: 0,
        tetrahedronsX: 0,
        totalTriangles: 0,
        totalVolume: 0,
        totalSurfaceArea: 0,
        boundingBox: null
    };
    
    // Count shapes
    stats.octahedrons = gameState.grid.oct.size;
    stats.tetrahedronsZ = gameState.grid.tetZ.size;
    stats.tetrahedronsX = gameState.grid.tetC.size;
    
    // Calculate triangles and areas
    const allTriangles = Object.values(gameState.gameTris);
    stats.totalTriangles = allTriangles.length;
    stats.totalSurfaceArea = calculateSurfaceArea(allTriangles);
    
    // Calculate bounding box
    const allQuadrays = [
        ...gameState.grid.oct,
        ...gameState.grid.tetZ,
        ...gameState.grid.tetC
    ];
    stats.boundingBox = getBoundingBox(allQuadrays);
    
    return stats;
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        initializeDirections,
        getOctahedronCorners,
        getTetrahedronZCorners,
        getTetrahedronXCorners,
        generateTetrahedronTriangles,
        generateOctahedronTriangles,
        getOctahedronTriangles,
        getTetrahedronZTriangles,
        getTetrahedronXTriangles,
        getOctahedronCenterOffset,
        getTetrahedronZCenterOffset,
        getTetrahedronXCenterOffset,
        generateGridAround,
        expandGridDots,
        calculateTetrahedronVolume,
        calculateOctahedronVolume,
        isPointInTetrahedron,
        getBoundingBox,
        calculateSurfaceArea,
        getGeometricStats
    };
} 