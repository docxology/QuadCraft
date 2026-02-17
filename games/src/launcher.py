import http.server
import os
import platform
import socketserver
import subprocess
import threading
import time
from pathlib import Path

from .registry import GAMES

# ─────────────────────────────────────────────────────────────────────────────
# Quiet HTTP handler (no per-request logging)
# ─────────────────────────────────────────────────────────────────────────────
class QuietHTTPHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP handler that suppresses per-request log output."""
    def log_message(self, format, *args):
        pass  # Suppress output

# ─────────────────────────────────────────────────────────────────────────────
# Game Server — serves one game on one port
# ─────────────────────────────────────────────────────────────────────────────
class GameServer:
    """Serves a single game directory over HTTP."""

    def __init__(self, game_key: str, base_port: int, games_dir: Path, open_browser: bool = True):
        meta = GAMES[game_key]
        self.key = game_key
        self.name = meta["name"]
        self.port = base_port + meta["port_offset"]
        self.game_dir = games_dir / meta["dir"]
        self.open_browser = open_browser
        self.server = None
        self.thread = None

    def start(self):
        """Start the HTTP server in a background thread."""
        if not self.game_dir.exists():
            print(f"  ⚠️  {self.name}: directory not found at {self.game_dir}")
            return False
            
        index_path = self.game_dir / "index.html"
        if not index_path.exists():
            print(f"  ⚠️  {self.name}: no index.html found")
            return False

        # SERVE FROM ROOT ("games/") so that "../4d_generic" imports work
        root_dir = self.game_dir.parent 
        
        current_dir = os.getcwd()
        try:
            os.chdir(root_dir)
            handler = lambda *args, **kwargs: QuietHTTPHandler(*args, directory=str(root_dir), **kwargs)

            # Allow address reuse to avoid "Address already in use" errors on quick restarts
            socketserver.TCPServer.allow_reuse_address = True
            try:
                self.server = socketserver.TCPServer(("127.0.0.1", self.port), handler)
            except OSError as e:
                print(f"  ⚠️  {self.name}: port {self.port} unavailable ({e})")
                return False

            self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
            self.thread.start()

            # URL includes the game directory name relative to games/ root
            rel_path = self.game_dir.name
            url = f"http://127.0.0.1:{self.port}/{rel_path}/index.html"
            print(f"  ✅ {self.name:20s} → {url}")

            if self.open_browser:
                open_url(url)
            return True
        finally:
            os.chdir(current_dir)

    def stop(self):
        """Shut down the server."""
        if self.server:
            self.server.shutdown()
            self.server.server_close()

def open_url(url: str):
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
