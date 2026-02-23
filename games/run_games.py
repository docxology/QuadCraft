#!/usr/bin/env python3
"""
run_games.py — Configurable QuadCraft Game Launcher

Launch one, several, or all 4D games in separate browser windows,
each served on its own local HTTP port.

Usage:
    python3 run_games.py --list                    # List all available games
    python3 run_games.py --game chess               # Launch just 4D Chess
    python3 run_games.py --game chess checkers       # Launch Chess + Checkers
    python3 run_games.py --all                      # Launch all games
    python3 run_games.py --all --base-port 9000     # All games starting at port 9000
    python3 run_games.py --config games_config.json        # Launch from a config file
    python3 run_games.py --test                     # Run all unit tests

Config file format (games_config.json):
    {
        "games": ["chess", "reversi", "doom"],
        "base_port": 8100,
        "open_browser": true
    }
"""

import argparse
import json
import signal
import sys
import time
from pathlib import Path

# Import from our new src package
from src.core.registry import GAMES, load_config
from src.server.launcher import GameServer
from src.qa.testing import run_tests
from src.qa.validation import audit_all

def main():
    parser = argparse.ArgumentParser(
        description="QuadCraft Game Launcher — Launch 4D games in your browser",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3 run_games.py --list                    List all games
  python3 run_games.py --game chess              Launch 4D Chess
  python3 run_games.py --game chess doom life    Launch three games
  python3 run_games.py --all                     Launch all 30 games
  python3 run_games.py --all --no-browser        Serve all, don't open browser
  python3 run_games.py --all --base-port 9000    Custom port range
  python3 run_games.py --config games_config.json       Launch from config file
  python3 run_games.py --test                    Run all unit tests
  python3 run_games.py --test --game doom        Run tests for one game
        """
    )
    parser.add_argument("--game", "-g", nargs="+", metavar="NAME",
                        help="Game(s) to launch (use --list to see names)")
    parser.add_argument("--all", "-a", action="store_true",
                        help="Launch all games")
    parser.add_argument("--list", "-l", action="store_true",
                        help="List available games")
    parser.add_argument("--test", "-t", action="store_true",
                        help="Run unit tests instead of launching")
    parser.add_argument("--validate", "-v", action="store_true",
                        help="Run structural validation on all game directories")
    parser.add_argument("--base-port", "-p", type=int, default=8100,
                        help="Base port number (default: 8100)")
    parser.add_argument("--no-browser", action="store_true",
                        help="Start servers but don't open browser windows")
    parser.add_argument("--config", "-c", metavar="FILE",
                        help="Load game selection from a JSON config file")

    args = parser.parse_args()
    games_dir = Path(__file__).parent.resolve()

    # ── Validate mode ──
    if args.validate:
        success = audit_all(games_dir)
        sys.exit(0 if success else 1)

    # ── List mode ──
    if args.list:
        print("\n🎮 QuadCraft Game Portfolio\n")
        print(f"  {'Key':18s} {'Name':22s} {'Port':6s} Directory")
        print(f"  {'─'*18} {'─'*22} {'─'*6} {'─'*20}")
        for key, meta in GAMES.items():
            port = args.base_port + meta["port_offset"]
            print(f"  {key:18s} {meta['name']:22s} {port:<6d} {meta['dir']}")
        print(f"\n  Total: {len(GAMES)} games ({sum(1 for m in GAMES.values() if m['port_offset'] < 12)} Wave 1 + {sum(1 for m in GAMES.values() if m['port_offset'] >= 12)} Wave 2)")
        return

    # ── Config file mode ──
    game_keys = None
    open_browser = not args.no_browser

    if args.config:
        try:
            config = load_config(args.config)
            game_keys = config.get("games", list(GAMES.keys()))
            args.base_port = config.get("base_port", args.base_port)
            if "open_browser" in config:
                open_browser = config["open_browser"] # Allow config to override CLI default logic
        except Exception as e:
            print(f"❌ Error loading config: {e}")
            sys.exit(1)

    elif args.all:
        game_keys = list(GAMES.keys())
    elif args.game:
        game_keys = args.game

    if not game_keys and not args.test:
        parser.print_help()
        return

    # ── Validate game keys ──
    if game_keys:
        invalid = [k for k in game_keys if k not in GAMES]
        if invalid:
            print(f"❌ Unknown game(s): {', '.join(invalid)}")
            print(f"   Valid names: {', '.join(GAMES.keys())}")
            sys.exit(1)

    # ── Test mode ──
    if args.test:
        print("\n🧪 Running QuadCraft Unit Tests\n")
        success = run_tests(games_dir, game_keys)
        sys.exit(0 if success else 1)

    # ── Launch mode ──
    print(f"\n🎮 QuadCraft Launcher — Starting {len(game_keys)} game(s)\n")

    servers = []
    
    for key in game_keys:
        server = GameServer(key, args.base_port, games_dir, open_browser)
        if server.start():
            servers.append(server)
        time.sleep(0.2)  # Stagger browser opens slightly

    if not servers:
        print("\n❌ No games could be started")
        sys.exit(1)

    print(f"\n  🟢 {len(servers)} game(s) running. Press Ctrl+C to stop all.\n")

    # ── Wait for Ctrl+C ──
    def shutdown(sig, frame):
        print(f"\n\n  🛑 Shutting down {len(servers)} server(s)...")
        for s in servers:
            s.stop()
        print("  All servers stopped.\n")
        sys.exit(0)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    # Keep main thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown(None, None)


if __name__ == "__main__":
    main()
