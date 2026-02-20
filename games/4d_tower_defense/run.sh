#!/bin/bash
# run.sh — Launch 4D Tower Defense in browser
# Usage: ./run.sh [port]
#        ./run.sh --test       Run unit tests only
#        ./run.sh --test port  Run tests then launch
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${1:-8109}"

# ─── Test mode ───────────────────────────────────────────────────────
if [[ "$1" == "--test" || "$2" == "--test" ]]; then
    echo "🧪 Running 4D Tower Defense tests..."
    if command -v node &>/dev/null; then
        node "$SCRIPT_DIR/tests/test_td.js"
        TEST_EXIT=$?
        if [ $TEST_EXIT -ne 0 ]; then
            echo "❌ Tests failed. Aborting."
            exit $TEST_EXIT
        fi
        echo "✅ All tests passed."
    else
        echo "⚠️  Node.js not found, skipping tests."
    fi
    # If only --test was passed (no port), exit after tests
    if [[ "$1" == "--test" && -z "$2" ]]; then exit 0; fi
    PORT="${2:-8109}"
    if [[ "$2" == "--test" ]]; then PORT="${1:-8109}"; fi
fi

if ! command -v python3 &>/dev/null; then
    echo "❌ Python 3 not found. Please install python3."
    exit 1
fi

# ─── Kill stale server on same port ─────────────────────────────────
if lsof -i ":$PORT" -t &>/dev/null; then
    echo "⚠️  Killing stale process on port $PORT..."
    lsof -i ":$PORT" -t | xargs kill -9 2>/dev/null || true
    sleep 0.3
fi

echo "🎮 Starting 4D Tower Defense on port $PORT..."
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
