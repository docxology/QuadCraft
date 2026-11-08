/** Synchronous conservative transport on an undirected, uniform-site graph.
 * alpha is a dimensionless mixing fraction; edge coefficient = alpha/maxDegree.
 * Masks disable incident edges, not stored values. No sources, sinks or decay.
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
        const result = out || new Float64Array(this.size);
        const work = this._workspace;
        work.fill(0);
        const coefficient = this.maxDegree ? alpha / this.maxDegree : 0;
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
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ConservativeGraphField };
}
