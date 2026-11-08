"""
games.src.launcher — HTTP game server and browser launcher.

Serves individual game directories over HTTP with the games/ root as
the document root, so that '../4d_generic/' imports resolve correctly.
"""

import http.server
from functools import partial
import logging
import os
import platform
import subprocess
import socket
import threading
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

from ..core.registry import GAMES

# ─────────────────────────────────────────────────────────────────────────────
# Quiet HTTP handler (no per-request logging)
# ─────────────────────────────────────────────────────────────────────────────
class QuietHTTPHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler that suppresses per-request log output."""
    def log_message(self, format: str, *args: Any) -> None:
        pass  # Suppress output


class GameHTTPServer(http.server.ThreadingHTTPServer):
    """Serve concurrent script loads without blocking on incomplete requests."""

    allow_reuse_address = True
    daemon_threads = True
    request_queue_size = socket.SOMAXCONN


# ─────────────────────────────────────────────────────────────────────────────
# Game Server — serves one game on one port
# ─────────────────────────────────────────────────────────────────────────────
class GameServer:
    """Serves a single game directory over HTTP."""

    def __init__(self, game_key: str, base_port: int, games_dir: Path, open_browser: bool = True) -> None:
        meta = GAMES[game_key]
        self.key = game_key
        self.name = meta["name"]
        self.port = base_port + meta["port_offset"]
        self.game_dir = games_dir.resolve() / meta["dir"]
        self.open_browser = open_browser
        self.server = None
        self.thread = None

    def start(self) -> bool:
        """Start the HTTP server in a background thread."""
        if self.server is not None:
            return True
        if not self.game_dir.exists():
            logger.warning("[Launcher] %s: directory not found at %s", self.name, self.game_dir)
            print(f"  ⚠️  {self.name}: directory not found at {self.game_dir}")
            return False
            
        index_path = self.game_dir / "index.html"
        if not index_path.exists():
            print(f"  ⚠️  {self.name}: no index.html found")
            return False

        # Each handler owns its document root; process cwd is never changed.
        handler = partial(QuietHTTPHandler, directory=str(self.game_dir.parent))
        try:
            self.server = GameHTTPServer(("127.0.0.1", self.port), handler)
        except OSError as e:
            logger.error("[Launcher] %s: port %d unavailable: %s", self.name, self.port, e)
            print(f"  ⚠️  {self.name}: port {self.port} unavailable ({e})")
            return False

        # Port zero requests an ephemeral listener; publish its actual port.
        self.port = self.server.server_address[1]
        self.thread = threading.Thread(
            target=self.server.serve_forever,
            kwargs={"poll_interval": 0.1},
            daemon=True,
        )
        self.thread.start()
        logger.info("[Launcher] %s started on port %d", self.name, self.port)

        rel_path = self.game_dir.name
        url = f"http://127.0.0.1:{self.port}/{rel_path}/index.html"
        print(f"  ✅ {self.name:20s} → {url}")

        if self.open_browser:
            open_url(url)
        return True

    def stop(self) -> None:
        """Stop accepting requests without waiting for daemon request threads."""
        if self.server is not None:
            self.server.shutdown()
            self.server.server_close()
            if self.thread is not None:
                self.thread.join(timeout=1)
            self.server = None
            self.thread = None
            logger.info("[Launcher] %s stopped", self.name)

def open_url(url: str) -> None:
    """Open a URL in the default browser (platform-aware)."""
    system = platform.system()
    try:
        if system == "Darwin":
            subprocess.Popen(["open", url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        elif system == "Linux":
            subprocess.Popen(["xdg-open", url], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        elif system == "Windows":
            os.startfile(url)
    except Exception:
        pass  # Browser open is best-effort
