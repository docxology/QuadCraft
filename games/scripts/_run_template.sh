#!/bin/bash
# run_GAMENAME.sh — Launch DISPLAYNAME in browser
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
GAME_DIR="$SCRIPT_DIR/GAMEDIR"
PORT="${1:-DEFAULTPORT}"

# Check for Python 3
if ! command -v python3 &>/dev/null; then
    echo "❌ Python 3 not found. Please install python3."
    exit 1
fi

echo "🎮 Starting DISPLAYNAME on port $PORT..."
echo "   Dir: $GAME_DIR"

if [ ! -d "$GAME_DIR" ]; then
    echo "❌ Game directory not found: $GAME_DIR"
    exit 1
fi

cd "$GAME_DIR"

# Start HTTP server
# We use a subshell to keep the PID tracking clean
python3 -m http.server "$PORT" --bind 127.0.0.1 &>/dev/null &
SERVER_PID=$!
echo "   Server PID: $SERVER_PID"
sleep 0.5

# Open Browser
URL="http://127.0.0.1:$PORT/index.html"
if command -v open &>/dev/null; then open "$URL"
elif command -v xdg-open &>/dev/null; then xdg-open "$URL"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then start "$URL"
else echo "   Please open $URL in your browser"; fi

echo "   Press Ctrl+C to stop"

# Trap exit to kill server
cleanup() {
    kill "$SERVER_PID" 2>/dev/null || true
    echo "   Server stopped."
}
trap cleanup EXIT INT TERM

wait "$SERVER_PID"
