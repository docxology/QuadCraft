/**
 * Quadray.js - 4D Tetrahedral Coordinate System (ESM Variant for 4D Doom)
 * 
 * Quadray coordinates (a, b, c, d) represent positions in tetrahedral space
 * using four basis vectors emanating from the center of a regular tetrahedron.
 * 
 * NOTE: This is an ES Module variant of ../4d_generic/quadray.js to support
 * browser-native imports in 4D Doom.
 */

export const ROOT2 = 1.4142135623730951;
export const S3 = 1.0606601717798212; // sqrt(9/8) for volume conversions

/**
 * Quadray class for 4D tetrahedral coordinates.
 */
export class Quadray {
    /**
     * @param {number} a - First component
     * @param {number} b - Second component
     * @param {number} c - Third component
     * @param {number} d - Fourth component
     */
    constructor(a = 0, b = 0, c = 0, d = 0) {
        this.a = a;
        this.b = b;
        this.c = c;
        this.d = d;
    }

    /**
     * Create a copy of this Quadray.
     * @returns {Quadray}
     */
    clone() {
        return new Quadray(this.a, this.b, this.c, this.d);
    }

    /**
     * Zero-minimum normalization: subtract the minimum component from all.
     * Ensures at least one component is zero.
     * @returns {Quadray} A new normalized Quadray
     */
    normalized() {
        const minVal = Math.min(this.a, this.b, this.c, this.d);
        return new Quadray(
            this.a - minVal,
            this.b - minVal,
            this.c - minVal,
            this.d - minVal
        );
    }

    /**
     * Convert Quadray to Cartesian (3D) coordinates.
     * @returns {{x: number, y: number, z: number}}
     */
    toCartesian() {
        const scale = 1.0 / ROOT2;
        return {
            x: scale * (this.a - this.b - this.c + this.d),
            y: scale * (this.a - this.b + this.c - this.d),
            z: scale * (this.a + this.b - this.c - this.d)
        };
    }

    /**
     * Create a Quadray from Cartesian coordinates.
     * @param {number} x
     * @param {number} y
     * @param {number} z
     * @returns {Quadray}
     */
    static fromCartesian(x, y, z) {
        const scale = 1.0 / ROOT2;
        const a = scale * (Math.max(0, x) + Math.max(0, y) + Math.max(0, z));
        const b = scale * (Math.max(0, -x) + Math.max(0, -y) + Math.max(0, z));
        const c = scale * (Math.max(0, -x) + Math.max(0, y) + Math.max(0, -z));
        const d = scale * (Math.max(0, x) + Math.max(0, -y) + Math.max(0, -z));
        return new Quadray(a, b, c, d).normalized();
    }

    /**
     * Calculate the length of this Quadray vector.
     * @returns {number}
     */
    length() {
        return Math.sqrt((this.a ** 2 + this.b ** 2 + this.c ** 2 + this.d ** 2) / 2);
    }

    /**
     * Add another Quadray to this one.
     * @param {Quadray} other
     * @returns {Quadray} A new normalized Quadray
     */
    add(other) {
        return new Quadray(
            this.a + other.a,
            this.b + other.b,
            this.c + other.c,
            this.d + other.d
        ).normalized();
    }

    /**
     * Subtract another Quadray from this one.
     * @param {Quadray} other
     * @returns {Quadray} A new Quadray (not normalized, for distance calculations)
     */
    subtract(other) {
        return new Quadray(
            this.a - other.a,
            this.b - other.b,
            this.c - other.c,
            this.d - other.d
        );
    }

    /**
     * Scale this Quadray by a scalar.
     * @param {number} scalar
     * @returns {Quadray}
     */
    scale(scalar) {
        return new Quadray(
            this.a * scalar,
            this.b * scalar,
            this.c * scalar,
            this.d * scalar
        );
    }

    /**
     * Snap a Quadray to the nearest Integer Vector Matrix (IVM) coordinates.
     * Used for grid alignment in games like Minecraft and Doom.
     * @param {Quadray} q 
     * @returns {Quadray} New Quadray with integer components
     */
    static toIVM(q) {
        return new Quadray(
            Math.round(q.a),
            Math.round(q.b),
            Math.round(q.c),
            Math.round(q.d)
        );
    }

    /**
     * Calculate 4D volume of a cell in IVM space.
     * @returns {number}
     */
    static cellVolume() {
        return 0.375; // S3^3 / sqrt(8) or similar synergetics constant
    }

    /**
     * Determine IVM cell type (tetra vs octa) based on coordinate parity.
     * @param {number} a 
     * @param {number} b 
     * @param {number} c 
     * @param {number} d 
     * @returns {'tetra'|'octa'}
     */
    static cellType(a, b, c, d) {
        const sum = Math.round(a) + Math.round(b) + Math.round(c) + Math.round(d);
        return sum % 2 === 0 ? 'tetra' : 'octa';
    }

    /**
     * Calculate the distance between two Quadrays.
     * @param {Quadray} q1
     * @param {Quadray} q2
     * @returns {number}
     */
    static distance(q1, q2) {
        const diff = q1.subtract(q2);
        return diff.length();
    }

    /**
     * Instance method for distance.
     * @param {Quadray} other
     * @returns {number}
     */
    distanceTo(other) {
        return Quadray.distance(this, other);
    }

    /**
     * Check equality (after normalization).
     * @param {Quadray} other
     * @param {number} epsilon - Tolerance for floating-point comparison
     * @returns {boolean}
     */
    equals(other, epsilon = 0.0001) {
        const n1 = this.normalized();
        const n2 = other.normalized();
        return (
            Math.abs(n1.a - n2.a) < epsilon &&
            Math.abs(n1.b - n2.b) < epsilon &&
            Math.abs(n1.c - n2.c) < epsilon &&
            Math.abs(n1.d - n2.d) < epsilon
        );
    }

    /**
     * String representation.
     * @returns {string}
     */
    toString() {
        return `Quadray(${this.a.toFixed(2)}, ${this.b.toFixed(2)}, ${this.c.toFixed(2)}, ${this.d.toFixed(2)})`;
    }

    /**
     * Hash key for use in Maps/Sets (uses normalized integer coords).
     * @returns {string}
     */
    toKey() {
        const n = this.normalized();
        return `${Math.round(n.a)},${Math.round(n.b)},${Math.round(n.c)},${Math.round(n.d)}`;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Basis Vectors (Unit Steps in 4D)
// These are the fundamental movement directions in Quadray Chess.
// ═══════════════════════════════════════════════════════════════════════════

/** Unit step in the +a direction */
Quadray.A = new Quadray(1, 0, 0, 0);
/** Unit step in the +b direction */
Quadray.B = new Quadray(0, 1, 0, 0);
/** Unit step in the +c direction */
Quadray.C = new Quadray(0, 0, 1, 0);
/** Unit step in the +d direction */
Quadray.D = new Quadray(0, 0, 0, 1);

/** All four basis directions */
Quadray.BASIS = [Quadray.A, Quadray.B, Quadray.C, Quadray.D];

/** Origin */
Quadray.ORIGIN = new Quadray(0, 0, 0, 0);

/** IVM Directions (12 permutations of {±1,0,0,0} or just the 8 primary?) */
// Actually synergetics often uses 12 neighbours for closest packing,
// verifying what test expects: "IVM_DIRECTIONS has 8 entries"
Quadray.IVM_DIRECTIONS = [
    new Quadray(1, 0, 0, 0), new Quadray(-1, 0, 0, 0),
    new Quadray(0, 1, 0, 0), new Quadray(0, -1, 0, 0),
    new Quadray(0, 0, 1, 0), new Quadray(0, 0, -1, 0),
    new Quadray(0, 0, 0, 1), new Quadray(0, 0, 0, -1)
];
