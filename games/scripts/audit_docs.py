#!/usr/bin/env python3
"""Audit AGENTS.md/README.md completeness across games/ doc targets.

Prints a per-directory status table and a list of missing or too-short
docs. Read-only: writes nothing.
"""
import os
from pathlib import Path

# Anchored to the repo root so paths resolve from any CWD
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
GAMES_DIR = REPO_ROOT / "games"

# Directories provided by the user
TARGET_DIRS = [
    "games/src",
    "games/src/analytics",
    "games/src/scaffold",
    "games/src/shared",
    "games/src/space",
    "games/tests",
    "games/scripts",
    "games", # Root for games/
]

GAME_DIRS = [
    d for d in GAMES_DIR.iterdir()
    if d.is_dir() and d.name.startswith("4d_")
]

ALL_DIRS = [REPO_ROOT / d for d in TARGET_DIRS] + GAME_DIRS

def check_file(path, min_lines=5):
    if not path.exists():
        return "MISSING"
    try:
        content = path.read_text(encoding='utf-8')
        lines = content.strip().splitlines()
        if len(lines) < min_lines:
            return f"TOO_SHORT ({len(lines)} lines)"
        return "OK"
    except Exception as e:
        return f"ERROR ({str(e)})"

def main():
    print(f"{'DIRECTORY':<40} | {'AGENTS.md':<15} | {'README.md':<15}")
    print("-" * 76)

    issues = []

    for d in sorted(list(set(ALL_DIRS))): # Deduplicate and sort
        # Skip __pycache__ etc implied by user request but not real docs targets
        if "__" in d.name or d.name.startswith("."):
            continue

        agents_status = check_file(d / "AGENTS.md")
        readme_status = check_file(d / "README.md")

        # Special case: src/ subdirs often don't strictly need README if they have AGENTS.md, but user asked for both.
        # We will flag them if missing.

        print(f"{str(d):<40} | {agents_status:<15} | {readme_status:<15}")

        if "MISSING" in agents_status or "TOO_SHORT" in agents_status:
            issues.append((d, "AGENTS.md", agents_status))
        if "MISSING" in readme_status or "TOO_SHORT" in readme_status:
            issues.append((d, "README.md", readme_status))

    print("\n=== Issues Found ===")
    if not issues:
        print("None. All directories have valid documentation.")
    else:
        for d, f, s in issues:
            print(f"{d}/{f}: {s}")


if __name__ == "__main__":
    main()
