#!/bin/bash
# run.sh — Launch 4D Doom in browser
# Usage: ./run.sh [port]
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${1:-8110}"

if ! command -v python3 &>/dev/null; then
    echo "❌ Python 3 not found. Please install python3."
    exit 1
fi

echo "======================================"
echo "      4 D   D O O M   E N G I N E     "
echo "======================================"
echo "🎮 Starting server on port $PORT..."
echo "   Dir: $SCRIPT_DIR"

cd "$SCRIPT_DIR"

python3 -m http.server "$PORT" --bind 127.0.0.1 &>/dev/null &
SERVER_PID=$!
echo "   Server PID: $SERVER_PID"
sleep 0.5

URL="http://127.0.0.1:$PORT/index.html"
if command -v open &>/dev/null; then open "$URL"
elif command -v xdg-open &>/dev/null; then xdg-open "$URL"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then start "$URL"
else echo "   Please open $URL in your browser"; fi

echo "   Press Ctrl+C to stop"

cleanup() {
    kill "$SERVER_PID" 2>/dev/null || true
    echo "   Server stopped."
}
trap cleanup EXIT INT TERM

wait "$SERVER_PID"
