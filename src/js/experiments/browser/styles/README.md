# Prototype panel layout and Canvas styling

[main.css](main.css) styles `#app`, `.panel`, `#game-panel`, `#analysis-panel`, `.game-canvas`, control sections and related inputs/buttons. The current file uses literal dark colors and flex sizing, not the fictional `--bg-primary/--accent-color` variable API previously shown here.

A host document can link `styles/main.css`, but that does not supply missing split-script DOM/startup wiring. This stylesheet is separate from styles embedded in the standalone HTML and current monolithic browser page. Contrast, mobile support and responsive usability require visual review; no accessibility compliance is asserted.
