/**
 * Quadray Mathematics Module
 * Implements the 4D quadray coordinate system and related operations
 */

// Global deduplication maps
let dedupQuadraysMap = {};
let dedupTriMap = {};

/**
 * Quadray Class - 4D coordinate system for space
 * Represents points in 4D space that project to 3D with specific constraints
 */
class Quadray {
    constructor(a = 0, b = 0, c = 0, d = 0) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
        this.color = UTILS.randColor(); // For UI only, not part of quadray math
    }

    /**
     * Get the four components as an array
     */
    abcd() {
        return [this.a, this.b, this.c, this.d];
    }

    /**
     * Normalize the quadray by subtracting the minimum value from all components
     * This ensures at least one component is zero
     */
    normalized() {
        const minVal = Math.min(this.a, this.b, this.c, this.d);
        return new Quadray(
            this.a - minVal,
            this.b - minVal,
            this.c - minVal,
            this.d - minVal
        ).dedup();
    }

    /**
     * Convert quadray coordinates to Cartesian 3D coordinates
     * Uses the standard quadray-to-Cartesian transformation matrix
     */
    toCartesian() {
        const scale = 1 / ROOT2;
        const x = scale * (this.a - this.b - this.c + this.d);
        const y = scale * (this.a - this.b + this.c - this.d);
        const z = scale * (this.a + this.b - this.c - this.d);
        return [x, y, z];
    }

    /**
     * Create a quadray from Cartesian 3D coordinates
     * Static factory method
     */
    static fromCartesian([x, y, z]) {
        const scale = 1 / ROOT2;

        const a = scale * (Math.max(0, x) + Math.max(0, y) + Math.max(0, z));
        const b = scale * (Math.max(0, -x) + Math.max(0, -y) + Math.max(0, z));
        const c = scale * (Math.max(0, -x) + Math.max(0, y) + Math.max(0, -z));
        const d = scale * (Math.max(0, x) + Math.max(0, -y) + Math.max(0, -z));

        return new Quadray(a, b, c, d).normalized();
    }

    /**
     * Calculate the length/magnitude of the quadray
     */
    length() {
        const sumSq = this.a ** 2 + this.b ** 2 + this.c ** 2 + this.d ** 2;
        return Math.sqrt(sumSq / 2);
    }

    /**
     * Alias for length()
     */
    magnitude() {
        return this.length();
    }

    /**
     * Add another quadray (does not normalize)
     */
    Add(other) {
        return new Quadray(
            this.a + other.a,
            this.b + other.b,
            this.c + other.c,
            this.d + other.d
        ).dedup();
    }

    /**
     * Add another quadray and normalize the result
     */
    add(other) {
        return this.Add(other).normalized();
    }

    /**
     * Multiply by scalar (does not normalize)
     */
    Mul(scalar) {
        return new Quadray(
            this.a * scalar,
            this.b * scalar,
            this.c * scalar,
            this.d * scalar
        ).dedup();
    }

    /**
     * Multiply by scalar and normalize
     */
    mul(scalar) {
        return this.Mul(scalar).normalized();
    }

    /**
     * Negate the quadray (does not normalize)
     */
    Neg() {
        return this.Mul(-1);
    }

    /**
     * Negate and normalize
     */
    neg() {
        return this.Neg().normalized();
    }

    /**
     * Calculate 4D distance between two quadrays
     */
    static distance(q1, q2) {
        const diff = new Quadray(
            q1.a - q2.a,
            q1.b - q2.b,
            q1.c - q2.c,
            q1.d - q2.d
        );
        return diff.length();
    }

    /**
     * Calculate distance to another quadray
     */
    distance(other) {
        return Quadray.distance(this, other);
    }

    /**
     * Calculate 3D distance to another quadray
     */
    dist3d(other) {
        return UTILS.distance3D(this.toCartesian(), other.toCartesian());
    }

    /**
     * String representation
     */
    toString() {
        return `Q(${this.a},${this.b},${this.c},${this.d})`;
    }

    /**
     * Detailed string representation with Cartesian coordinates
     */
    toDetailString() {
        return `${this} (xyz ${JSON.stringify(this.toCartesian())})`;
    }

    /**
     * Deduplicate this quadray using the global map
     * Returns the first equal quadray found or creates this one
     */
    dedup() {
        let map = dedupQuadraysMap;
        map = map[this.a] || (map[this.a] = {});
        map = map[this.b] || (map[this.b] = {});
        map = map[this.c] || (map[this.c] = {});
        return map[this.d] || (map[this.d] = this);
    }

    /**
     * Check if this quadray equals another
     */
    equals(other) {
        return this.a === other.a && 
               this.b === other.b && 
               this.c === other.c && 
               this.d === other.d;
    }

    /**
     * Clone this quadray
     */
    clone() {
        return new Quadray(this.a, this.b, this.c, this.d);
    }
}

/**
 * Triangle class representing a face made of three quadray points
 */
class Tri {
    constructor(e, f, g) {
        this.e = e;
        this.f = f;
        this.g = g;
        this.color = UTILS.randColor(); // For UI only
    }

    /**
     * Get the primary key for this triangle
     */
    primaryKey() {
        return `T(${this.e},${this.f},${this.g})`;
    }

    /**
     * String representation
     */
    toString() {
        return this.primaryKey();
    }

    /**
     * Toggle this triangle's display state
     */
    tog() {
        if (typeof gameController !== 'undefined') {
            gameController.toggleGameTri(this);
        }
    }

    /**
     * Deduplicate this triangle
     */
    dedup() {
        let primaryKey = this.primaryKey();
        return dedupTriMap[primaryKey] || (dedupTriMap[primaryKey] = this);
    }

    /**
     * Get the center point of this triangle
     */
    getCenter() {
        return this.e.add(this.f).add(this.g).mul(1/3);
    }

    /**
     * Get the area of this triangle
     */
    getArea() {
        const v1 = this.f.toCartesian();
        const v2 = this.g.toCartesian();
        const v3 = this.e.toCartesian();
        
        // Calculate area using cross product
        const cross = [
            (v2[1] - v1[1]) * (v3[2] - v1[2]) - (v2[2] - v1[2]) * (v3[1] - v1[1]),
            (v2[2] - v1[2]) * (v3[0] - v1[0]) - (v2[0] - v1[0]) * (v3[2] - v1[2]),
            (v2[0] - v1[0]) * (v3[1] - v1[1]) - (v2[1] - v1[1]) * (v3[0] - v1[0])
        ];
        
        return Math.sqrt(cross[0]**2 + cross[1]**2 + cross[2]**2) / 2;
    }
}

/**
 * Factory function for creating deduplicated quadrays
 */
function Q(a, b, c, d) {
    return new Quadray(a, b, c, d).dedup();
}

/**
 * Factory function for creating deduplicated triangles
 */
function T(e, f, g) {
    return new Tri(e, f, g).dedup();
}

/**
 * Calculate average of multiple quadrays
 */
function quadrayAverage(quadrays) {
    if (quadrays.length === 0) return Q(0, 0, 0, 0);
    
    let sum = Q(0, 0, 0, 0);
    for (let q of quadrays) {
        sum = sum.add(q);
    }
    return sum.mul(1 / quadrays.length);
}

/**
 * Clear all deduplication maps
 */
function clearDedupMaps() {
    dedupQuadraysMap = {};
    dedupTriMap = {};
}

/**
 * Get statistics about the deduplication maps
 */
function getDedupStats() {
    let quadrayCount = 0;
    let triCount = 0;
    
    // Count quadrays (nested object traversal)
    function countQuadrays(obj) {
        for (let key in obj) {
            if (typeof obj[key] === 'object' && obj[key] !== null) {
                if (obj[key].constructor === Quadray) {
                    quadrayCount++;
                } else {
                    countQuadrays(obj[key]);
                }
            }
        }
    }
    
    countQuadrays(dedupQuadraysMap);
    triCount = Object.keys(dedupTriMap).length;
    
    return {
        quadrayCount,
        triCount,
        quadrayMapSize: JSON.stringify(dedupQuadraysMap).length,
        triMapSize: JSON.stringify(dedupTriMap).length
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Quadray,
        Tri,
        Q,
        T,
        quadrayAverage,
        clearDedupMaps,
        getDedupStats
    };
} 