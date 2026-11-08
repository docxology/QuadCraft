# Game directory layout and composition contract

Use this as a layout guide, not a claim that every game has identical inheritance or storage. [Canonical portfolio contracts](../../docs/games.md) define physical versus raw coordinates and clocks; [shared APIs](shared_modules_reference.md) define actual signatures.

## Standard Layout

```text
4d_<key>/
  index.html
  AGENTS.md
  js/
    <key>_board.js
    <key>_renderer.js
    <key>_game.js
  tests/
    test_<key>.js
```

README, supplementary docs, manifest and additional rule/analysis modules may accompany this layout. A game directory still depends on sibling `4d_generic/`. Serve the full `games/` root. Doom uses an ES-module controller and its shared-Quadray bridge; inspect its actual entrypoint rather than forcing classic-script inheritance.

## State, rendering and controller responsibilities

- Board: actual rule state, transitions, terminal conditions and reset. Declare whether keys are raw slots or canonical physical points. `BaseBoard` uses a Map, while scaffold output uses an array; do not silently interchange them.
- Renderer: actual canvas drawing and hit-test coordinates. `BaseRenderer(canvas,board,opts)` offers `_project`, `_clearCanvas`, `_drawAxes` and `render`, not a `drawBoard` contract. Maintain intrinsic/CSS canvas dimensions and camera bounds.
- Controller: input, update cadence, lifecycle and HUD. `BaseGame(canvas,hudElement,board,renderer,opts)` receives already-created objects; custom hooks are `update(dtSeconds)`, `_setupGameInput()` and `_getHUDState()`. Call `init()` to attach/start. These APIs are optional composition choices, not mandatory superclass requirements.

Classic HTML loads shared dependencies before game classes, constructs the actual controller with its real constructor parameters, and invokes its actual initialization. Do not paste placeholders for class names or assume initialization happens in a constructor. Scaffold output and maintained game implementations differ; see [scaffold guide](scaffold_guide.md).

## Validation Rules and their limits

[`qa/validation.py`](../src/qa/validation.py) checks directory/index/js/tests/AGENTS presence, direct `test_*.js`, local `js/quadray.js` prohibition and required classic imports (Doom skips the latter two). It requires some `*_board.js` and flags boards below 200 bytes. It scans matching renderers/controllers for specific scaffold markers. It does **not** prove that all named trio files exist, that classes are exported or inherited, that a board is complete, or that a rendered game works.

`REQUIRED_JS_PATTERNS` records a convention, not stronger validation than this implementation performs. `run.sh` is not required by the structural validator. Keep substantive rule-transition checks and real browser scenarios; [testing guide](testing_guide.md) explains both.

[Contribution workflow](contributing.md) · [Scaffold generation](scaffold_guide.md) · [Inventory and ports](../GAMES_INDEX.md)
