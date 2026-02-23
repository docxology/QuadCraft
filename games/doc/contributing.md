# Contributing a New Game

> **Note on 4D Geometry & Nomenclature**: Throughout QuadCraft, whenever we refer to **"4D"**, we strictly mean **Synergetics** geometry. This entails **Quadray 4D tetrahedral coordinates** deployed on an **Isotropic Vector Matrix (IVM)** of close-packed spheres, where the Quadray coordinates of the 12 neighboring balls are strictly defined by all permutations of `(0, 1, 1, 2)`.

> End-to-end guide for adding a new 4D game to the QuadCraft portfolio.

---

## Prerequisites

- Node.js (for running tests)
- Python 3.10+ (for infrastructure tooling)
- Basic understanding of Quadray coordinates — see [space_math_reference.md](space_math_reference.md)

---

## Step-by-Step Checklist

### 1. Scaffold the Game

```python
from games.src.scaffold import GameScaffold

scaffold = GameScaffold(
    "my_game",           # Registry key (snake_case)
    "4D My Game",        # Display name
    grid_size=8,         # Grid dimension (adjust for your game)
    tick_rate=16,         # Updates per second
)
path = scaffold.create()
print(f"✅ Created: {path}")
```

This generates the complete directory structure:

```text
games/4d_my_game/
├── index.html
├── AGENTS.md
├── manifest.json
├── js/
│   ├── my_game_board.js
│   ├── my_game_renderer.js
│   └── my_game_game.js
└── tests/
    └── test_my_game.js
```

> See [scaffold_guide.md](scaffold_guide.md) for full scaffold options.

---

### 2. Register in the Game Registry

Add an entry to `src/registry.py`:

```python
GAMES = {
    # ... existing games ...
    "my_game": {"dir": "4d_my_game", "name": "4D My Game", "port_offset": 22},
}
```

**Rules:**

- `port_offset` must be unique (next available = current max + 1)
- `dir` must match the directory name
- Key must be the snake_case game identifier

---

### 3. Implement Game Logic

Edit the three core JS files:

| File | What to Implement |
|------|-------------------|
| `js/my_game_board.js` | Game state: grid, pieces, rules, win condition |
| `js/my_game_renderer.js` | Canvas rendering: draw board, pieces, effects |
| `js/my_game_game.js` | Controller: input bindings, update loop, UI |

#### Board (`my_game_board.js`)

```javascript
class MyGameBoard {
    constructor(size) {
        this.size = size;
        this.grid = {};  // Quadray key → cell state
        this.reset();
    }

    reset() { /* Initialize grid */ }
    getCell(a, b, c, d) { return this.grid[`${a},${b},${c},${d}`]; }
    setCell(a, b, c, d, val) { this.grid[`${a},${b},${c},${d}`] = val; }
}
```

#### Renderer (`my_game_renderer.js`)

```javascript
class MyGameRenderer extends BaseRenderer {
    drawBoard(board, camera, zoom) {
        this.clear();
        this.drawAxes(camera, zoom);
        // Draw game-specific elements using projectQuadray()
    }
}
```

#### Game Controller (`my_game_game.js`)

```javascript
class MyGameGame extends BaseGame {
    init() {
        this.board = new MyGameBoard(this.options.gridSize || 8);
        this.renderer = new MyGameRenderer(this.canvas);
        this.input.bind('Space', () => this.doAction());
    }

    update(dt) { /* Game logic per tick */ }
    render() { this.renderer.drawBoard(this.board, this.camera, this.zoom); }
}
```

> See [game_template.md](game_template.md) for file structure details and [shared_modules_reference.md](shared_modules_reference.md) for the shared API.

---

### 4. Write Tests

Edit `tests/test_my_game.js`:

```javascript
const path = require('path');
let passed = 0, failed = 0;

function assert(cond, msg) {
    if (cond) { console.log(`  ✅ ${msg}`); passed++; }
    else { console.log(`  ❌ ${msg}`); failed++; }
}

console.log('\n🧪 My Game Tests\n');

// Test board initialization
// Test game rules
// Test win/loss conditions
// Test edge cases

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);
```

> See [testing_guide.md](testing_guide.md) for the standardized output format.

---

### 5. Validate Structure

```bash
python3 run_games.py --validate
```

All checks must pass:

- ✅ Directory exists
- ✅ `index.html` present with shared imports
- ✅ `AGENTS.md` present
- ✅ Board file is not a scaffold stub
- ✅ No local `quadray.js` copy

---

### 7. Run Tests

```bash
# Game-specific tests
python3 run_games.py --test --game my_game

# Full suite (verify nothing broke)
python3 run_games.py --test
```

---

### 8. Test in Browser

```bash
python3 run_games.py --game my_game
# Opens http://127.0.0.1:8122/4d_my_game/index.html
```

Verify:

- [ ] No console errors
- [ ] Canvas renders with Quadray axes
- [ ] Keyboard/mouse interaction works
- [ ] HUD displays correctly

---

### 9. Update Portfolio Index

Add a row to `GAMES_INDEX.md`:

```markdown
| 23 | 🎮 **4D My Game** | [`4d_my_game/`](4d_my_game/) | ✅ Complete | N | Key mechanic description |
```

Also update the game count in:

- `GAMES_INDEX.md` total line
- `README.md` total line

---

### 10. Update Config

Add to `games_config.json`:

```json
{
    "games": [
        "chess", "checkers", ..., "my_game"
    ]
}
```

---

## Summary Checklist

```text
[ ] 1. Scaffold game           — GameScaffold("my_game", "4D My Game").create()
[ ] 2. Register in registry    — Add to GAMES dict in src/registry.py
[ ] 3. Implement game logic    — js/my_game_{board,renderer,game}.js
[ ] 4. Write tests             — tests/test_my_game.js
[ ] 5. Validate structure      — python3 run_games.py --validate
[ ] 6. Run tests               — python3 run_games.py --test --game my_game
[ ] 7. Test in browser         — python3 run_games.py --game my_game
[ ] 8. Update GAMES_INDEX.md   — Add portfolio row
[ ] 9. Update config           — Add to games_config.json
```

---

## Documentation Cross-References

| Topic | Document |
|-------|----------|
| System architecture | [architecture.md](architecture.md) |
| Shared JS modules API | [shared_modules_reference.md](shared_modules_reference.md) |
| Python infrastructure | [python_infrastructure.md](python_infrastructure.md) |
| Scaffold details | [scaffold_guide.md](scaffold_guide.md) |
| Analytics & health | [analytics_reporting.md](analytics_reporting.md) |
| Quadray math | [space_math_reference.md](space_math_reference.md) |
| File structure | [game_template.md](game_template.md) |
| Testing | [testing_guide.md](testing_guide.md) |
| Scripts | [scripts_reference.md](scripts_reference.md) |
| Configuration | [configuration.md](configuration.md) |
| Launch & operations | [launch_operations.md](launch_operations.md) |

---

*Part of the [QuadCraft](../../) project — Exploring 4D tetrahedral geometry through interactive applications.*
