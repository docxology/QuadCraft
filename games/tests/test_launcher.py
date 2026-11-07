import os
import socket
import tempfile
import threading
import unittest
import urllib.request
from pathlib import Path

from src.server.launcher import GameServer


class TestGameServerLifecycle(unittest.TestCase):
    def make_root(self, directory, marker):
        root = Path(directory)
        (root / "4d_chess").mkdir()
        (root / "4d_chess" / "index.html").write_text(marker)
        (root / "4d_generic").mkdir()
        (root / "4d_generic" / "shared.js").write_text(marker + " shared")
        return root

    def read(self, game, path):
        with urllib.request.urlopen(
            f"http://127.0.0.1:{game.port}/{path}", timeout=2
        ) as response:
            return response.read().decode()

    def test_servers_own_their_roots_without_changing_cwd(self):
        original_cwd = Path.cwd()
        with tempfile.TemporaryDirectory() as first, tempfile.TemporaryDirectory() as second:
            first_root = self.make_root(first, "first")
            second_root = self.make_root(second, "second")
            # Relative input must be resolved before request handling starts.
            first_game = GameServer(
                "chess", 0, Path(os.path.relpath(first_root)), open_browser=False
            )
            second_game = GameServer("chess", 0, second_root, open_browser=False)
            try:
                self.assertTrue(first_game.start())
                self.assertEqual(Path.cwd(), original_cwd)
                self.assertTrue(second_game.start())
                self.assertEqual(Path.cwd(), original_cwd)
                self.assertNotEqual(first_game.port, second_game.port)
                self.assertEqual(self.read(first_game, "4d_chess/index.html"), "first")
                self.assertEqual(self.read(second_game, "4d_chess/index.html"), "second")
                self.assertEqual(self.read(first_game, "4d_generic/shared.js"), "first shared")
                self.assertEqual(self.read(second_game, "4d_generic/shared.js"), "second shared")
            finally:
                first_game.stop()
                second_game.stop()
            self.assertEqual(Path.cwd(), original_cwd)

    def test_incomplete_request_does_not_block_serving_or_shutdown(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = self.make_root(temporary, "parallel")
            game = GameServer("chess", 0, root, open_browser=False)
            self.assertTrue(game.start())
            listener_thread = game.thread
            idle = socket.create_connection(("127.0.0.1", game.port), timeout=2)
            stopper = None
            try:
                idle.sendall(b"GET /4d_chess/index.html")
                self.assertEqual(self.read(game, "4d_chess/index.html"), "parallel")
                stopper = threading.Thread(target=game.stop, daemon=True)
                stopper.start()
                stopper.join(timeout=2)
                self.assertFalse(stopper.is_alive(), "shutdown waited for an incomplete request")
                self.assertFalse(listener_thread.is_alive())
            finally:
                # Complete and drain the accepted request even after listener shutdown.
                # This also releases a regressed single-threaded server on failure.
                try:
                    idle.sendall(b" HTTP/1.0\r\n\r\n")
                    while idle.recv(4096):
                        pass
                finally:
                    idle.close()
                    if stopper is not None:
                        stopper.join(timeout=2)
                    game.stop()

    def test_stop_is_idempotent_and_port_can_be_reused(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = self.make_root(temporary, "restart")
            game = GameServer("chess", 0, root, open_browser=False)
            game.stop()
            self.assertTrue(game.start())
            port = game.port
            try:
                self.assertEqual(self.read(game, "4d_chess/index.html"), "restart")
            finally:
                game.stop()
            game.stop()
            try:
                self.assertTrue(game.start())
                self.assertEqual(game.port, port)
                self.assertEqual(self.read(game, "4d_chess/index.html"), "restart")
            finally:
                game.stop()


if __name__ == "__main__":
    unittest.main()
