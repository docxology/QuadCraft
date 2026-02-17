
import os
from pathlib import Path

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

# Add all game directories programmatically or explicitly
GAMES_DIR = Path("games")
GAME_DIRS = [
    d for d in GAMES_DIR.iterdir() 
    if d.is_dir() and d.name.startswith("4d_")
]

ALL_DIRS = [Path(d) for d in TARGET_DIRS] + GAME_DIRS

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
