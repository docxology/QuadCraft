# Asteroids CSS maintenance — live markup and shared cascade

Read the [style guide](README.md), [game instructions](../AGENTS.md) and actual [HTML page](../index.html). Preserve the shared-HUD-before-local-styles cascade, wrapping sidebar layout, readable control/HUD contrast and canvas sizing. Do not move gameplay logic or projection assumptions into CSS.

Presentation changes require inspection of the actual served page, not a claim that Node board tests cover layout. Retain font fallbacks and check controls/readouts against real markup; do not copy a stylesheet API from another game.
