/** Synchronous conservative transport on an undirected, uniform-site graph.
 * alpha is a dimensionless mixing fraction; edge coefficient = alpha/maxDegree.
 * Masks disable incident edges, not stored values. No sources, sinks or decay.
 * Ordinary fields use edge fluxes; overflow/underflow-risk fields accumulate
 * exact binary-rational fluxes and round each final convex value once.
 */
class ConservativeGraphField {
    constructor(size, edges) {
        if (!Number.isInteger(size) || size < 0) throw new RangeError('Invalid graph size');
        this.size = size;
        const unique = new Set();
        const pairs = [];
        const degree = new Uint32Array(size);
        for (const [u, v] of edges) {
            if (!Number.isInteger(u) || !Number.isInteger(v) || u < 0 || v < 0 || u >= size || v >= size) {
                throw new RangeError('Edge endpoint outside graph');
            }
            if (u === v) continue;
            const a = Math.min(u, v), b = Math.max(u, v);
            const key = `${a},${b}`;
            if (unique.has(key)) continue;
            unique.add(key);
            pairs.push(a, b);
            degree[a]++; degree[b]++;
        }
        this.edges = new Uint32Array(pairs);
        this.maxDegree = degree.reduce((max, d) => Math.max(max, d), 0);
        this._workspace = new Float64Array(size);
    }

    step(values, alpha, out = null, active = null) {
        if (!Number.isFinite(alpha) || alpha < 0 || alpha > 1) throw new RangeError('alpha must be in [0,1]');
        if (values.length !== this.size || (out && out.length !== this.size) || (active && active.length !== this.size)) {
            throw new RangeError('Field or mask length differs from graph size');
        }
        if (out === values || (out && ArrayBuffer.isView(values) && ArrayBuffer.isView(out) &&
            out.buffer === values.buffer && out.byteOffset < values.byteOffset + values.byteLength &&
            values.byteOffset < out.byteOffset + out.byteLength)) {
            throw new TypeError('Output must not alias input');
        }
        const coefficient = this.maxDegree ? alpha / this.maxDegree : 0;
        const minimumNormal = 2 ** -1022;
        let exact = coefficient < minimumNormal;
        for (let i = 0; i < this.size; i++) {
            const value = values[i];
            if (!Number.isFinite(value)) throw new RangeError('Field values must be finite');
            const magnitude = Math.abs(value);
            // For |values| <= M, absolute incident flux sums are <= 2*M:
            // degree * (alpha/maxDegree) <= 1, even with masked edges.
            // Adding the old state is bounded by 3*M before cancellation;
            // reserve rounding headroom, not merely a safe edge difference.
            if (magnitude > Number.MAX_VALUE / 4 ||
                (magnitude !== 0 && magnitude < minimumNormal / coefficient)) exact = true;
        }
        const result = out || new Float64Array(this.size);
        if (alpha === 0 || this.maxDegree === 0) {
            for (let i = 0; i < this.size; i++) result[i] = values[i];
            return result;
        }
        if (exact) return this._exactStep(values, alpha, result, active);
        const work = this._workspace;
        work.fill(0);
        for (let k = 0; k < this.edges.length; k += 2) {
            const a = this.edges[k], b = this.edges[k + 1];
            if (active && (!active[a] || !active[b])) continue;
            const flux = coefficient * (values[b] - values[a]);
            work[a] += flux;
            work[b] -= flux;
        }
        for (let i = 0; i < this.size; i++) result[i] = values[i] + work[i];
        return result;
    }

    _exactStep(values, alpha, result, active) {
        // Every finite binary64 is an integer multiple of 2^-1074. Keep
        // alpha/maxDegree rational as well: dividing alpha first can erase it.
        const view = new DataView(new ArrayBuffer(8));
        const scale = 1n << 1074n;
        const denominator = BigInt(this.maxDegree) * scale;
        const coupling = ConservativeGraphField._binaryUnits(alpha, view);
        const native = Array.from(values, value => ConservativeGraphField._binaryUnits(value, view));
        const numerators = native.map(value => value * denominator);
        for (let k = 0; k < this.edges.length; k += 2) {
            const a = this.edges[k], b = this.edges[k + 1];
            if (active && (!active[a] || !active[b])) continue;
            const flux = coupling * (native[b] - native[a]);
            numerators[a] += flux;
            numerators[b] -= flux;
        }
        const denominatorBits = denominator.toString(2).length;
        for (let i = 0; i < this.size; i++) {
            result[i] = ConservativeGraphField._roundUnits(numerators[i], denominator, denominatorBits);
        }
        return result;
    }

    static _binaryUnits(value, view) {
        view.setFloat64(0, value);
        const bits = view.getBigUint64(0);
        const exponent = Number((bits >> 52n) & 2047n);
        let units = bits & ((1n << 52n) - 1n);
        if (exponent !== 0) units = (units | (1n << 52n)) << BigInt(exponent - 1);
        return bits >> 63n ? -units : units;
    }

    static _roundUnits(numerator, denominator, denominatorBits) {
        if (numerator === 0n) return 0;
        const negative = numerator < 0n;
        const magnitude = negative ? -numerator : numerator;
        let exponent = magnitude.toString(2).length - denominatorBits;
        if (exponent >= 0 && magnitude < (denominator << BigInt(exponent))) exponent--;
        // Normal results retain 53 significant bits; subnormals use the
        // fixed 2^-1074 spacing. Round the exact quotient, never a float proxy.
        const shift = Math.max(0, exponent - 52);
        const divisor = denominator << BigInt(shift);
        let rounded = magnitude / divisor;
        const twiceRemainder = 2n * (magnitude % divisor);
        if (twiceRemainder > divisor || (twiceRemainder === divisor && (rounded & 1n))) rounded++;
        const value = Number(rounded) * (2 ** (shift - 1074));
        return negative ? -value : value;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConservativeGraphField };
}
