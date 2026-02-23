#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# run.sh — QuadCraft Master Game Launcher
#
# Launches one, several, or all 30 4D games. All launching is delegated
# to the centralized run_games.py Python launcher.
#
# Usage:
#   ./run.sh                     # Launch all games via run_games.py
#   ./run.sh chess               # Launch just 4D Chess
#   ./run.sh chess doom life     # Launch specific games
#   ./run.sh --list              # List all available games
#   ./run.sh --test              # Run all unit tests
#   ./run.sh --validate          # Run structural validation
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
        sokoban)        echo "4d_sokoban" ;;
        2048)           echo "4d_2048" ;;
        rogue)          echo "4d_rogue" ;;
        go)             echo "4d_go" ;;
        hex)            echo "4d_hex" ;;
        memory)         echo "4d_memory" ;;
        sudoku)         echo "4d_sudoku" ;;
        lights_out)     echo "4d_lights_out" ;;
        *)              echo "" ;;
    esac
}

ALL_KEYS="chess checkers reversi life asteroids simant backgammon minecraft catan tower_defense doom mahjong tetris snake pong breakout pacman space_invaders frogger bomberman connect_four minesweeper sokoban 2048 rogue go hex memory sudoku lights_out"

# ── List mode ──
if [[ "$1" == "--list" || "$1" == "-l" ]]; then
    echo ""
    echo "🎮 QuadCraft Game Portfolio (30 games)"
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

# ── Launch specific games by key (delegate to run_games.py) ──
echo ""
echo "🎮 QuadCraft Launcher"
echo ""

# Validate all provided keys
VALID_KEYS=()
for key in "$@"; do
    dir=$(game_dir "$key")
    if [ -z "$dir" ]; then
        echo "  ❌ Unknown game: $key (use --list to see available games)"
    else
        VALID_KEYS+=("$key")
    fi
done

if [ ${#VALID_KEYS[@]} -eq 0 ]; then
    echo "❌ No valid games specified."
    exit 1
fi

# Delegate to the centralized Python launcher
python3 "$SCRIPT_DIR/run_games.py" --game "${VALID_KEYS[@]}"

