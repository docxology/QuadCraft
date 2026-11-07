/**
 * Quadray.js — ESM Bridge to shared 4d_generic/quadray.js
 *
 * Browser: Shared classic-script lexical globals must be loaded before this module.
 * Node.js: Loads the same canonical CommonJS implementation with createRequire.
 *
 * Single source of truth: ../4d_generic/quadray.js
 */

let _Quadray, _ROOT2, _S3;

if (typeof Quadray !== 'undefined' && typeof ROOT2 !== 'undefined' && typeof S3 !== 'undefined') {
    // Classic-script class/const bindings are identifiers, not window properties.
    _Quadray = Quadray;
    _ROOT2 = ROOT2;
    _S3 = S3;
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
