# QuadCraft Games Suite Unification Plan

## Context

The QuadCraft repository contains **22 playable games** and a **shared module library** (`4d_generic/`) providing Quadray 4D coordinate math, rendering, game loop, input, scoring, and HUD infrastructure. A Python backend (`src/`) provides validation, testing, and mathematical verification.

**The problem:** Only **1 game** (connect_four) fully uses the shared infrastructure. The other 21 games have varying levels of integration — most import basic modules (Quadray, Camera, Projection) but don't extend `BaseGame`/`BaseRenderer`, don't use `GridUtils`, `ScoreManager`, or `HUD`, and have light Quadray usage (local key/direction implementations instead of shared utilities).

**The goal:** Bring all 22 games to the connect_four "gold standard" — fully integrated with shared modules, deep Quadray coordinate usage, Synergetics metadata display, and a classic-yet-clearly-4D feel.

## Integration Gap Summary

| Category | Games | Count | Missing |
|----------|-------|-------|---------|
| **A: Model** | connect_four | 1 | Nothing — gold standard |
| **B: ES6** | doom | 1 | N/A (exempt, self-contained ES6) |
| **C: Standard** | snake, tetris, pong, breakout, pacman, frogger, space_invaders, asteroids, bomberman, life, minesweeper, tower_defense, backgammon | 13 | BaseGame, BaseRenderer, GridUtils, ScoreManager, HUD, hud-style.css |
| **D: Minimal** | checkers, reversi, catan, mahjong, simant | 5 | All of Category C + GameLoop, InputController |
| **E: Specific** | chess (missing synergetics), minecraft (missing game_loop, input_controller) | 2 | Specific imports only |

## Implementation Strategy: 5 Waves

### Wave 0: Fix Specific Import Gaps (2 games, trivial)

**chess** — Add `<script src="../4d_generic/synergetics.js"></script>` to `index.html`
- File: `4d_chess/index.html`

**minecraft** — Add missing imports to `index.html`:
- `synergetics.js`, `game_loop.js`, `input_controller.js`
- File: `4d_minecraft/index.html`

### Wave 1: Arcade Games (7 games, parallel agents)

**Games:** snake, tetris, pong, breakout, pacman, frogger, space_invaders

These already have GameLoop + InputController. Need: BaseGame, BaseRenderer, GridUtils, ScoreManager, HUD.

### Wave 2: Strategy/Simulation Games (6 games, parallel agents)

**Games:** asteroids, bomberman, life, minesweeper, tower_defense, backgammon

Same migration pattern as Wave 1. Some are render-only/click-driven (minesweeper, backgammon) — use `tickRate: 1000/30` with no-op `update()`.

### Wave 3: Minimal Control Games (5 games, parallel agents)

**Games:** checkers, reversi, catan, mahjong, simant

Need GameLoop + InputController imports in ADDITION to all Wave 1/2 changes. These have manual `requestAnimationFrame` loops that get replaced by BaseGame's GameLoop.

### Wave 4: Doom (1 game, special case)

Doom stays ES6 module architecture. Only change: add cross-validation test verifying local Quadray matches shared API.

---

## Per-Game Migration Pattern (4 Steps)

Each game gets the same 4-step treatment, following the **connect_four gold standard**:

### Step 1: Update `index.html`

Add missing shared module imports (in this order, before game-specific scripts):
```html
<link rel="stylesheet" href="../4d_generic/hud-style.css">
<script src="../4d_generic/quadray.js"></script>
<script src="../4d_generic/camera.js"></script>
<script src="../4d_generic/projection.js"></script>
<script src="../4d_generic/zoom.js"></script>
<script src="../4d_generic/synergetics.js"></script>
<script src="../4d_generic/game_loop.js"></script>
<script src="../4d_generic/input_controller.js"></script>
<script src="../4d_generic/grid_utils.js"></script>
<script src="../4d_generic/base_renderer.js"></script>
<script src="../4d_generic/base_game.js"></script>
<script src="../4d_generic/hud.js"></script>
<script src="../4d_generic/score_manager.js"></script>
```

Add HUD element: `<div class="hud" id="hud">...</div>`

Update initialization to: `new XxxGame(canvas, hudEl); game.init();`

### Step 2: Migrate `*_board.js`

- Add Node.js compatibility preamble (for tests) following connect_four pattern
- Replace local `key(a,b,c,d)` with `GridUtils.key(a,b,c,d)`
- Replace local `parseKey(k)` with `GridUtils.parseKey(k)`
- Replace local `DIRECTIONS` with references to `GridUtils.DIRECTIONS_8`
- Add Synergetics metadata: `this.volumeRatios`, `this.cellVolumeUnit`, `this.s3Constant`
- Add `_verifyIntegrity()` call using `verifyRoundTrip()` in constructor
- Add `getMetadata()` method returning Synergetics stats
- Ensure `getCell(q)` / `setCell(q, v)` exist (validation requirement)
- Keep all existing game logic intact

### Step 3: Migrate `*_renderer.js`

- Change to `extends BaseRenderer`
- Replace manual canvas/ctx/scale setup with `super(canvas, board, opts)`
- Replace local `_project(quadrayObj)` calls with `this._project(q.a, q.b, q.c, q.d)` or add wrapper `_projectQ(q) { return this._project(q.a, q.b, q.c, q.d); }`
- Replace manual axis drawing with `this._drawAxes()`
- Replace manual canvas clearing with `this._clearCanvas()`
- Use `GridUtils.depthSort()` for depth sorting where applicable
- Keep all game-specific visual effects (particles, glows, animations)

### Step 4: Migrate `*_game.js`

- Change to `extends BaseGame`
- Constructor: `super(canvas, hudElement, board, renderer, { name, tickRate, zoomOpts, cameraMode })`
- Add `this.scoring = new ScoreManager({...})` for score tracking
- Move input bindings to `_setupGameInput()` override
- Remove manual GameLoop/CameraController/setupZoom creation (provided by BaseGame)
- Override `_getHUDState()` returning `{ text, color }` for game status
- Add `_runGeometricVerification()` in constructor
- Keep all game-specific logic (AI, physics, turn management)

---

## Critical Reference Files

| File | Role |
|------|------|
| `4d_connect_four/js/connect_four_board.js` | Board gold standard — Quadray storage, GridUtils delegation, Synergetics metadata, verifyRoundTrip |
| `4d_connect_four/js/connect_four_renderer.js` | Renderer gold standard — extends BaseRenderer, _project, _drawAxes, depth sorting |
| `4d_connect_four/js/connect_four_game.js` | Game gold standard — extends BaseGame, ScoreManager, _getHUDState, _setupGameInput, mouse bindings |
| `4d_connect_four/index.html` | HTML gold standard — all 12 shared imports, HUD element, sidebar panels, initialization |
| `4d_generic/base_game.js` | BaseGame API: init(), togglePause(), reset(), _setupGameInput(), _getHUDState() |
| `4d_generic/base_renderer.js` | BaseRenderer API: _project(a,b,c,d), _drawAxes(), _clearCanvas(), _drawHUD(), _drawCircle(), _drawDiamond() |
| `4d_generic/grid_utils.js` | GridUtils API: key(), parseKey(), DIRECTIONS_8, neighbors(), boundedNeighbors(), depthSort(), manhattan(), euclidean() |

## Key Design Decisions

1. **Turn-based games** (checkers, reversi, etc.): Use `tickRate: 1000/30` (render-only). `update()` is a no-op. All game logic stays in click handlers.

2. **`_project()` signature**: BaseRenderer takes `(a, b, c, d)` not a Quadray object. Each renderer migration adds `_projectQ(q)` wrapper or updates call sites.

3. **Doom**: Stays ES6 module architecture. Validation already exempts it. Only add cross-validation test.

4. **Backward compatibility**: Keep old `board.key()` / `board.parseKey()` as thin wrappers delegating to `GridUtils` during migration. Existing tests continue to pass.

5. **Renderer naming**: Games with generic `Renderer` class names (like checkers) get renamed to `CheckersRenderer` to avoid conflicts.

## Parallel Agent Strategy

- **Wave 1**: 7 agents, one per arcade game
- **Wave 2**: 6 agents, one per strategy game
- **Wave 3**: 5 agents, one per minimal-control game
- Each agent is self-contained — only modifies files within its game directory
- Each agent receives: the 4-step migration pattern + connect_four reference files + game-specific metadata (tickRate, score type, special mechanics)

## Verification

After each wave:
1. Run existing tests per game: `node tests/test_*.js`
2. Run Python validation: `python -c "from src.validation import audit_all; audit_all('.')"`
3. Open each `index.html` in browser — verify: loads without errors, axes visible, gameplay works, camera rotates, HUD updates, P/R keys work
4. Verify all 707+ existing tests still pass

## Total Scope

- **~100 files modified** (21 games x ~4-5 files each)
- **0 shared module files changed** (4d_generic/ stays untouched)
- **0 Python files changed** (src/ stays untouched)
- **connect_four unchanged** (already the model)
