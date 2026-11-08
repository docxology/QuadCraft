# Maintaining static HTTP server lifecycle

Read [launch operations](../../doc/launch_operations.md) and inspect `launcher.py`. Preserve explicit per-handler document roots and loopback binding; never chdir to serve a game or block serving/shutdown on one incomplete client. Shared imports require the parent games root.

`GameServer.start()` is idempotent when already started and returns failure for missing content/occupied ports. Publish the actual OS port if computed port is zero. `stop()` must shut down, close and join serving state. Browser opening is best-effort, not evidence of a successful rendered game. This module does not implement authentication, synchronized multiplayer or application state.
