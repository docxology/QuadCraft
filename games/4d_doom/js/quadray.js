/**
 * Quadray.js — ESM Bridge to shared 4d_generic/quadray.js
 *
 * Browser: Globals are loaded via <script src="../4d_generic/quadray.js"> in index.html.
 * Node.js: Falls back to dynamic import of the shared module.
 *
 * Single source of truth: ../4d_generic/quadray.js
 */

let _Quadray, _ROOT2, _S3;

if (typeof globalThis.Quadray !== 'undefined') {
    // Browser path — globals already loaded via <script> tags
    _Quadray = globalThis.Quadray;
    _ROOT2 = globalThis.ROOT2;
    _S3 = globalThis.S3;
} else {
    // Node.js path — require the shared canonical module
    const { createRequire } = await import('node:module');
    const require = createRequire(import.meta.url);
    const _q = require('../../4d_generic/quadray.js');
    _Quadray = _q.Quadray;
    _ROOT2 = _q.ROOT2;
    _S3 = _q.S3;
}

export { _Quadray as Quadray, _ROOT2 as ROOT2, _S3 as S3 };
