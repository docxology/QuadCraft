#!/usr/bin/env python3
"""
games.src.board.migrate — Migrate game boards to extend BaseBoard.

Conservative migration that ONLY adds:
  1. require('./base_board.js')  → HTML <script> tag
  2. extends BaseBoard           → class declaration
  3. super(size)                 → constructor call

Usage:
  python3 -m games.src.board.migrate           # Dry-run
  python3 -m games.src.board.migrate --apply   # Apply
"""
import re
import sys
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger(__name__)

GAMES_DIR = Path(__file__).parent.parent

# Games to skip (not grid-based boards or ES module architecture)
SKIP_BOARDS = {"MahjongBoard"}

# Per-class super() argument overrides
SUPER_CALL_OVERRIDES = {
    "CatanBoard": "6, { name: 'CatanBoard', verify: false }",
}


def add_baseboard_script(html_path: Path, dry_run: bool) -> bool:
    """Add base_board.js script tag to index.html."""
    content = html_path.read_text()
    tag = '<script src="../4d_generic/base_board.js"></script>'
    if "base_board.js" in content:
        return False
    for anchor in ["grid_utils.js", "synergetics.js", "quadray.js"]:
        pattern = f'<script src="../4d_generic/{anchor}"></script>'
        if pattern in content:
            new_content = content.replace(pattern, f'{pattern}\n    {tag}')
            if not dry_run:
                html_path.write_text(new_content)
            logger.info(f"  ✅ {html_path.name}: added base_board.js import")
            return True
    return False


def add_baseboard_require(content: str) -> str:
    """Add BaseBoard require block if missing."""
    if "base_board.js" in content:
        return content

    # Insert before GridUtils require block (or before class)
    require_block = (
        "if (typeof BaseBoard === 'undefined' && typeof require !== 'undefined') {\n"
        "    const _bb = require('../../4d_generic/base_board.js');\n"
        "    globalThis.BaseBoard = _bb.BaseBoard;\n"
        "}\n"
    )

    # Find best insertion point: before GridUtils require
    gu_match = re.search(r"if \(typeof GridUtils === 'undefined'", content)
    if gu_match:
        content = content[:gu_match.start()] + require_block + content[gu_match.start():]
        return content

    # Fallback: before class declaration
    class_match = re.search(r'\nclass \w+Board', content)
    if class_match:
        content = content[:class_match.start()] + '\n' + require_block + content[class_match.start():]
    return content


def add_extends(content: str, class_name: str) -> str:
    """Add 'extends BaseBoard' to class declaration."""
    if f"extends BaseBoard" in content:
        return content
    return content.replace(f"class {class_name} {{", f"class {class_name} extends BaseBoard {{")


def add_super_call(content: str, class_name: str) -> str:
    """Add super() call as first line of constructor."""
    if "super(" in content:
        return content

    if class_name in SUPER_CALL_OVERRIDES:
        super_args = SUPER_CALL_OVERRIDES[class_name]
    else:
        # Find the constructor and its first parameter
        ctor_match = re.search(r'constructor\(([^)]*)\)\s*\{', content)
        if not ctor_match:
            return content
        params = ctor_match.group(1)
        size_param = params.split(',')[0].split('=')[0].strip() if params else '6'
        super_args = f"{size_param}, {{ name: '{class_name}', verify: false }}"

    # Find constructor opening brace and insert super() after it
    ctor_match = re.search(r'(constructor\([^)]*\)\s*\{)', content)
    if ctor_match:
        insert_pos = ctor_match.end()
        # Check what's on the next line to match indentation
        super_call = f"\n        super({super_args});"
        content = content[:insert_pos] + super_call + content[insert_pos:]

    return content


def migrate_board(board_path: Path, dry_run: bool) -> dict:
    """Conservative migration: extends + require + super only."""
    content = board_path.read_text()
    original = content
    stats = {"extended": False, "require_added": False, "super_added": False}

    # Find board class
    class_match = re.search(r'class (\w+Board)\s*\{', content)
    if not class_match:
        logger.warning(f"  ⚠️  {board_path.name}: no Board class found")
        return stats

    class_name = class_match.group(1)

    if class_name in SKIP_BOARDS:
        logger.info(f"  ⏭️  {board_path.name}: {class_name} skipped (not grid-based)")
        return stats

    if f"extends BaseBoard" in content:
        logger.info(f"  ⏭️  {board_path.name}: already extends BaseBoard")
        return stats

    # 1. Add require
    new_content = add_baseboard_require(content)
    if new_content != content:
        stats["require_added"] = True
        content = new_content

    # 2. Add extends
    new_content = add_extends(content, class_name)
    if new_content != content:
        stats["extended"] = True
        content = new_content
        logger.info(f"  ✅ {board_path.name}: {class_name} extends BaseBoard")

    # 3. Add super() — we pass verify: false since existing boards call _verifyIntegrity themselves
    new_content = add_super_call(content, class_name)
    if new_content != content:
        stats["super_added"] = True
        content = new_content
        logger.info(f"  ✅ {board_path.name}: added super() call")

    if content != original and not dry_run:
        board_path.write_text(content)

    return stats


def main():
    dry_run = "--apply" not in sys.argv
    if dry_run:
        logger.info("🔍 DRY RUN — use --apply to write changes.\n")
    else:
        logger.info("🚀 APPLYING CHANGES\n")

    from ..core.registry import GAMES

    skip_games = {"doom"}
    totals = {"html": 0, "boards": 0}

    for key, meta in GAMES.items():
        if key in skip_games:
            logger.info(f"⏭️  Skipping {meta['name']} (ES module)")
            continue

        game_dir = GAMES_DIR / meta["dir"]
        logger.info(f"\n📦 {game_dir.name}")

        # Update HTML
        html = game_dir / "index.html"
        if html.exists():
            if add_baseboard_script(html, dry_run):
                totals["html"] += 1

        # Migrate board files
        js_dir = game_dir / "js"
        if js_dir.is_dir():
            for bf in list(js_dir.glob("*_board.js")) + list(js_dir.glob("board.js")):
                stats = migrate_board(bf, dry_run)
                if stats["extended"]:
                    totals["boards"] += 1

    logger.info(f"\n{'='*50}")
    logger.info(f"📊 Summary: {totals['html']} HTML, {totals['boards']} boards migrated")
    if dry_run:
        logger.info("  ℹ️  DRY RUN. Use --apply to write changes.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
