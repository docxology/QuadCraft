# Split classic-script browser prototype and standalone snapshot

[QuadCraft_Complete_Standalone.html](QuadCraft_Complete_Standalone.html) embeds a browser experiment. The `js/` directory separately contains classes/singletons plus `styles/main.css`; it is not an ES-module package. These files use shared globals and have no import/export wiring. There is no modular `index.html` in this directory.

`js/main.js` declares `QuadCraftApp`, looks for `gameCanvas`, initializes renderer/camera/directions/analysis and installs DOM listeners. A host page must supply the expected controls, scripts in dependency order and initialization. Missing host wiring and mismatched calls mean the split files are not a turnkey runnable application; do not substitute a fabricated module-import recipe. The standalone page is an independent snapshot, not an automatically generated bundle.

See [script responsibilities](js/README.md), [state and persistence](js/core/README.md), [math units](js/math/README.md), [analysis](js/analysis/README.md) and [styles](styles/README.md). Canvas depth sorting is an approximate painter renderer, not exact hidden-surface removal. JavaScript code execution uses page privileges and is not sandboxed.

From the repository root, `python3.13 -m http.server 8080` can serve the standalone path `/src/js/experiments/browser/QuadCraft_Complete_Standalone.html`. This documentation audit did not exercise that page, its controls or browser compatibility.
