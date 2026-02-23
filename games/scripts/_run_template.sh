#!/bin/bash
# run_GAMENAME.sh — Launch DISPLAYNAME via centralized Python launcher
# Usage: ./run_GAMENAME.sh [port]
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${1:-DEFAULTPORT}"

# Check for Python 3
if ! command -v python3 &>/dev/null; then
    echo "❌ Python 3 not found. Please install python3."
    exit 1
fi

echo "🎮 Launching DISPLAYNAME on port $PORT..."

# Delegate to the centralized launcher (serves games/ root correctly)
exec python3 "$SCRIPT_DIR/run_games.py" --game GAMENAME --base-port "$PORT"
