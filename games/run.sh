#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# run.sh — QuadCraft Master Game Launcher
#
# Launches one, several, or all 22 4D games. Each game has its own run.sh
# inside its directory for standalone use.
#
# Usage:
#   ./run.sh                     # Launch all games via run_games.py
#   ./run.sh chess               # Launch just 4D Chess
#   ./run.sh chess doom life     # Launch specific games
#   ./run.sh --list              # List all available games
#   ./run.sh --test              # Run all unit tests
#   ./run.sh --validate          # Run structural validation
#
# Standalone per-game usage:
#   cd 4d_chess && ./run.sh [port]
# ─────────────────────────────────────────────────────────────────────────────
set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Resolve game key → directory ──
game_dir() {
    case "$1" in
        chess)          echo "4d_chess" ;;
        checkers)       echo "4d_checkers" ;;
        reversi)        echo "4d_reversi" ;;
        life)           echo "4d_life" ;;
        asteroids)      echo "4d_asteroids" ;;
        simant)         echo "4d_simant" ;;
        backgammon)     echo "4d_backgammon" ;;
        minecraft)      echo "4d_minecraft" ;;
        catan)          echo "4d_catan" ;;
        tower_defense)  echo "4d_tower_defense" ;;
        doom)           echo "4d_doom" ;;
        mahjong)        echo "4d_mahjong" ;;
        tetris)         echo "4d_tetris" ;;
        snake)          echo "4d_snake" ;;
        pong)           echo "4d_pong" ;;
        breakout)       echo "4d_breakout" ;;
        pacman)         echo "4d_pacman" ;;
        space_invaders) echo "4d_space_invaders" ;;
        frogger)        echo "4d_frogger" ;;
        bomberman)      echo "4d_bomberman" ;;
        connect_four)   echo "4d_connect_four" ;;
        minesweeper)    echo "4d_minesweeper" ;;
        *)              echo "" ;;
    esac
}

ALL_KEYS="chess checkers reversi life asteroids simant backgammon minecraft catan tower_defense doom mahjong tetris snake pong breakout pacman space_invaders frogger bomberman connect_four minesweeper"

# ── List mode ──
if [[ "$1" == "--list" || "$1" == "-l" ]]; then
    echo ""
    echo "🎮 QuadCraft Game Portfolio (22 games)"
    echo ""
    printf "  %-18s %s\n" "Key" "Directory"
    printf "  %-18s %s\n" "──────────────────" "──────────────────────"
    for key in $ALL_KEYS; do
        dir=$(game_dir "$key")
        printf "  %-18s %s\n" "$key" "$dir"
    done
    echo ""
    echo "  Usage: ./run.sh <key> [key2 ...]"
    echo ""
    exit 0
fi

# ── Delegate to Python launcher for --test, --validate, --all, --config ──
if [[ "$1" == "--test" || "$1" == "-t" || \
      "$1" == "--validate" || "$1" == "-v" || \
      "$1" == "--all" || "$1" == "-a" || \
      "$1" == "--config" || "$1" == "-c" || \
      "$#" -eq 0 ]]; then
    if [ -f "$SCRIPT_DIR/run_games.py" ]; then
        if [ "$#" -eq 0 ]; then
            echo "🚀 Launching all games via run_games.py..."
            python3 "$SCRIPT_DIR/run_games.py" --all
        else
            python3 "$SCRIPT_DIR/run_games.py" "$@"
        fi
    else
        echo "❌ run_games.py not found in $SCRIPT_DIR"
        exit 1
    fi
    exit $?
fi

# ── Launch specific games by key ──
PIDS=()
STARTED=0

cleanup() {
    echo ""
    echo "🛑 Shutting down $STARTED server(s)..."
    for pid in "${PIDS[@]}"; do
        kill "$pid" 2>/dev/null || true
    done
    echo "   All servers stopped."
    exit 0
}
trap cleanup EXIT INT TERM

echo ""
echo "🎮 QuadCraft Launcher"
echo ""

for key in "$@"; do
    dir=$(game_dir "$key")
    if [ -z "$dir" ]; then
        echo "  ❌ Unknown game: $key (use --list to see available games)"
        continue
    fi
    game_script="$SCRIPT_DIR/$dir/run.sh"
    if [ ! -f "$game_script" ]; then
        echo "  ❌ $key: run.sh not found at $game_script"
        continue
    fi
    bash "$game_script" &
    PIDS+=($!)
    STARTED=$((STARTED + 1))
    sleep 0.3
done

if [ $STARTED -eq 0 ]; then
    echo "❌ No games started."
    exit 1
fi

echo ""
echo "  🟢 $STARTED game(s) running. Press Ctrl+C to stop all."
echo ""

wait
