"""
games.src.scaffold — Game scaffolding and project generation.

Provides tools to create new game directories with the correct
folder structure, boilerplate HTML, JS modules, and AGENTS.md
documentation following the QuadCraft template.

Usage:
    from games.src.scaffold import GameScaffold
    scaffold = GameScaffold('chess', '4D Chess')
    scaffold.create()
"""

import logging
import os
import json
from pathlib import Path

from ..config import GAMES_DIR, GENERIC_DIR, SHARED_MODULES, REQUIRED_FILES

logger = logging.getLogger(__name__)

# ─── Script tag template ────────────────────────────────────────────────────
_SCRIPT_TAG = '    <script src="../4d_generic/{module}"></script>'


class GameScaffold:
    """Generates a new game directory from the QuadCraft template."""

    def __init__(self, game_key: str, display_name: str, *,
                 grid_size: int = 8, tick_rate: int = 16):
        self.game_key = game_key
        self.display_name = display_name
        self.grid_size = grid_size
        self.tick_rate = tick_rate
        self.dir_name = f"4d_{game_key}"
        self.game_dir = Path(GAMES_DIR) / self.dir_name
        logger.info("[Scaffold] Initialized for %s → %s", game_key, self.game_dir)

    # ── Public API ───────────────────────────────────────────────────────────

    def create(self, *, overwrite: bool = False) -> Path:
        """Create the full game directory structure. Returns the path."""
        if self.game_dir.exists() and not overwrite:
            raise FileExistsError(f"Directory already exists: {self.game_dir}")

        self.game_dir.mkdir(parents=True, exist_ok=True)
        js_dir = self.game_dir / "js"
        js_dir.mkdir(exist_ok=True)

        self._write_board(js_dir)
        self._write_renderer(js_dir)
        self._write_game(js_dir)
        self._write_html()
        self._write_run_sh()
        self._write_agents_md()
        self._write_manifest()

        logger.info("[Scaffold] Created game: %s at %s", self.display_name, self.game_dir)
        return self.game_dir

    def validate(self) -> list:
        """Check that all required files exist. Returns list of issues."""
        issues = []
        for f in REQUIRED_FILES:
            if not (self.game_dir / f).exists():
                issues.append(f"Missing required file: {f}")
        for pattern_key, pattern in [("board", f"{self.game_key}_board.js"),
                                      ("renderer", f"{self.game_key}_renderer.js"),
                                      ("game", f"{self.game_key}_game.js")]:
            if not (self.game_dir / "js" / pattern).exists():
                issues.append(f"Missing JS module: js/{pattern}")
        if issues:
            logger.warning("[Scaffold] Validation issues: %s", issues)
        return issues

    # ── Private generators ───────────────────────────────────────────────────

    def _class_name(self, suffix: str) -> str:
        parts = self.game_key.split('_')
        return ''.join(p.capitalize() for p in parts) + suffix

    def _write_board(self, js_dir: Path):
        cls = self._class_name('Board')
        content = f"""/**
 * {self.game_key}_board.js — {self.display_name} Board Logic
 * @module {cls}
 */
class {cls} {{
    constructor(size = {self.grid_size}) {{
        this.size = size;
        this.gameOver = false;
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.grid = this._createGrid(size);
        console.log('[{cls}] Created {self.grid_size}⁴ grid');
    }}

    _createGrid(size) {{
        const grid = [];
        for (let a = 0; a < size; a++)
            for (let b = 0; b < size; b++)
                for (let c = 0; c < size; c++)
                    for (let d = 0; d < size; d++)
                        grid.push({{ a, b, c, d, value: 0 }});
        return grid;
    }}

    step() {{
        // Override in subclass
    }}

    reset() {{
        this.gameOver = false;
        this.score = 0;
        this.level = 1;
        this.lives = 3;
        this.grid = this._createGrid(this.size);
    }}
}}

if (typeof module !== 'undefined' && module.exports) {{
    module.exports = {{ {cls} }};
}}
"""
        (js_dir / f"{self.game_key}_board.js").write_text(content)
        logger.debug("[Scaffold] Wrote board: %s", f"{self.game_key}_board.js")

    def _write_renderer(self, js_dir: Path):
        cls = self._class_name('Renderer')
        board_cls = self._class_name('Board')
        content = f"""/**
 * {self.game_key}_renderer.js — {self.display_name} Renderer
 * @module {cls}
 */
class {cls} {{
    constructor(canvas, board) {{
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.board = board;
        this.scale = 35;
        this.rotX = 0;
        this.rotY = 0;
    }}

    render() {{
        const {{ ctx, canvas }} = this;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw grid cells
        for (const cell of this.board.grid) {{
            const p = this._project(cell.a, cell.b, cell.c, cell.d);
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3 * p.scale, 0, Math.PI * 2);
            ctx.fillStyle = cell.value ? '#60a5fa' : 'rgba(100,116,139,0.3)';
            ctx.fill();
        }}
    }}

    _project(a, b, c, d) {{
        if (typeof projectQuadray !== 'undefined') {{
            return projectQuadray(a, b, c, d, this);
        }}
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        return {{
            x: cx + (a - b) * this.scale,
            y: cy + (c - d) * this.scale,
            scale: 1
        }};
    }}
}}

if (typeof module !== 'undefined' && module.exports) {{
    module.exports = {{ {cls} }};
}}
"""
        (js_dir / f"{self.game_key}_renderer.js").write_text(content)
        logger.debug("[Scaffold] Wrote renderer: %s", f"{self.game_key}_renderer.js")

    def _write_game(self, js_dir: Path):
        cls = self._class_name('Game')
        board_cls = self._class_name('Board')
        renderer_cls = self._class_name('Renderer')
        content = f"""/**
 * {self.game_key}_game.js — {self.display_name} Game Controller
 *
 * Uses GameLoop for update/render cycle and InputController for input.
 *
 * Controls:
 *   P : Pause/Resume
 *   R : Reset
 *
 * @module {cls}
 */
class {cls} {{
    constructor(canvas, hudElement) {{
        this.canvas = canvas;
        this.hudElement = hudElement;
        this.board = new {board_cls}();
        this.renderer = new {renderer_cls}(canvas, this.board);

        this.input = new InputController();
        this._setupInput();

        this.loop = new GameLoop({{
            update: () => this.update(),
            render: () => {{
                this.renderer.render();
                this._updateHUD();
            }},
            tickRate: {self.tick_rate}
        }});

        if (typeof CameraController !== 'undefined') {{
            this.camera = new CameraController(canvas, {{ mode: 'shift-drag' }});
        }}
        if (typeof setupZoom !== 'undefined') {{
            setupZoom(canvas, this.renderer, {{ min: 20, max: 100 }});
        }}
    }}

    init() {{
        this.input.attach();
        this.loop.start();
        console.log('[{cls}] Initialized');
    }}

    update() {{
        if (this.board.gameOver) return;
        this.board.step();
    }}

    reset() {{
        this.loop.stop();
        this.board.reset();
        this.loop.start();
    }}

    _setupInput() {{
        this.input.bind(['p'], () => this.loop.togglePause());
        this.input.bind(['r'], () => this.reset());
    }}

    _updateHUD() {{
        if (!this.hudElement) return;
        const b = this.board;
        if (b.gameOver) {{
            this.hudElement.textContent = '💀 GAME OVER | Press R to restart';
            this.hudElement.style.color = '#f87171';
        }} else if (this.loop.paused) {{
            this.hudElement.textContent = '⏸ PAUSED — Press P to continue';
            this.hudElement.style.color = '#fbbf24';
        }} else {{
            this.hudElement.textContent = `Score: ${{b.score}} | Level: ${{b.level}} | Lives: ${{b.lives}}`;
            this.hudElement.style.color = '#94a3b8';
        }}
    }}
}}

if (typeof module !== 'undefined' && module.exports) {{
    module.exports = {{ {cls} }};
}}
"""
        (js_dir / f"{self.game_key}_game.js").write_text(content)
        logger.debug("[Scaffold] Wrote game controller: %s", f"{self.game_key}_game.js")

    def _write_html(self):
        script_tags = '\n'.join(_SCRIPT_TAG.format(module=m) for m in SHARED_MODULES)
        content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{self.display_name} — QuadCraft</title>
    <style>
        body {{ margin: 0; background: #0f172a; color: #e2e8f0; font-family: 'Inter', sans-serif; display: flex; flex-direction: column; align-items: center; }}
        h1 {{ margin: 1rem 0 0.5rem; font-size: 1.6rem; }}
        canvas {{ border: 1px solid #334155; border-radius: 8px; }}
        #hud {{ margin-top: 0.5rem; font-family: monospace; font-size: 0.95rem; color: #94a3b8; text-align: center; }}
    </style>
</head>
<body>
    <h1>🎮 {self.display_name}</h1>
    <canvas id="gameCanvas" width="600" height="600"></canvas>
    <div id="hud">Loading…</div>

    <!-- Shared modules -->
{script_tags}

    <!-- Game-specific modules -->
    <script src="js/{self.game_key}_board.js"></script>
    <script src="js/{self.game_key}_renderer.js"></script>
    <script src="js/{self.game_key}_game.js"></script>

    <script>
        const canvas = document.getElementById('gameCanvas');
        const hud = document.getElementById('hud');
        const game = new {self._class_name('Game')}(canvas, hud);
        game.init();
    </script>
</body>
</html>
"""
        (self.game_dir / "index.html").write_text(content)
        logger.debug("[Scaffold] Wrote index.html")

    def _write_run_sh(self):
        content = f"""#!/usr/bin/env bash
# Run {self.display_name} locally
cd "$(dirname "$0")"
python3 -m http.server 8080 &
open http://localhost:8080/index.html
"""
        run_sh = self.game_dir / "run.sh"
        run_sh.write_text(content)
        run_sh.chmod(0o755)
        logger.debug("[Scaffold] Wrote run.sh")

    def _write_agents_md(self):
        cls = self._class_name('')
        content = f"""# {self.display_name} — AGENTS.md

## Architecture
- **Board** (`js/{self.game_key}_board.js`): Game state, grid, logic, step.
- **Renderer** (`js/{self.game_key}_renderer.js`): Canvas 2D rendering with Quadray projection.
- **Game Controller** (`js/{self.game_key}_game.js`): GameLoop, InputController, HUD, camera integration.

## Shared Modules
Depends on: {', '.join('`' + m + '`' for m in SHARED_MODULES)}

## Controls
| Key | Action |
|-----|--------|
| P   | Pause/Resume |
| R   | Reset |
"""
        (self.game_dir / "AGENTS.md").write_text(content)
        logger.debug("[Scaffold] Wrote AGENTS.md")

    def _write_manifest(self):
        manifest = {
            "key": self.game_key,
            "name": self.display_name,
            "dir": self.dir_name,
            "grid_size": self.grid_size,
            "tick_rate": self.tick_rate,
            "shared_modules": SHARED_MODULES,
        }
        (self.game_dir / "manifest.json").write_text(
            json.dumps(manifest, indent=2) + '\n'
        )
        logger.debug("[Scaffold] Wrote manifest.json")
