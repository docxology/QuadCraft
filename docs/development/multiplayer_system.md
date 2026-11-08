# Historical JSP state synchronization, not production multiplayer

[Development index](README.md) · [Architecture](architecture.md) · [JavaScript experiment](javascript_implementation.md)

## Which client and server exist

[`src/browser/index.html`](../../src/browser/index.html) polls the relative `QuadCraftAjax.jsp` endpoint through `quadCraftAjax(json, callback)` and the `tomcatSparseSaveAndLoad*` functions. The server implementation is [`src/server/tomcat/webapps/QuadCraft/QuadCraftAjax.jsp`](../../src/server/tomcat/webapps/QuadCraft/QuadCraftAjax.jsp), using the adjacent Java JsonDS classes.

This is an experimental Var-tree synchronization path. The portfolio launcher under `games/src/server/` serves static files and does not run this JSP or synchronize game rules. The native C++ executable has no network transport. There is no implemented packet-oriented `NetworkManager`, authoritative match server, lobby, prediction/reconciliation framework, matchmaking or peer-to-peer mode.

## Actual request actions

The JSP reads the request body as JSON and dispatches by `action`:

| Action | Behavior |
|---|---|
| `readAll` / `writeAll` | Earlier separate `wholeState` string experiment; not the same storage as the Var tree |
| `writeSparse` | Merges incoming `root` into the shared tree |
| `readSparse` | Selects a `game`/`room` subtree by inclusive `peer.main.tNetFrom` |
| `readWriteSparse` | Performs the write path then the sparse read path |
| `sparseVSync` | Returns an unfinished placeholder response; not the working sparse protocol |
| `help` / `ok` | Informational/acknowledgment responses |

The `help` text still mentions the older `sparseVSync` name; the implemented action branches, not that text, define current behavior.

## Two different clocks

Every Var node carries a client-side value timestamp `.t`. Merge chooses an incoming node's local fields only when its allowed `.t` is **strictly greater**; equal timestamps keep the server value. Descendant `pu` maps merge recursively. Future client timestamps beyond the configured allowance are rejected.

The server separately stamps accepted changes with server-only `.tNet`. Sparse selection uses `.tNet`, not just the client's `.t`, and does not refresh it for rejected/older/equal writes. A response echoes `peer.main.tNetFrom` and supplies `peer.main.tNetTo`; the browser advances the next lower bound with `nextUpPositiveDouble(tNetTo)`. Per-Var `tNet` is omitted from ordinary downloads. No per-browser identity/cursor is stored by the server.

The browser starts with a read before uploading local boot state, then merges received state and tracks its outgoing write window. This is last-newer-timestamp state merging, not authenticated ownership, conflict-free gameplay transactions or deterministic lockstep.

## Deployment boundary and persistence

The client fetches a **relative** JSP URL. A local experiment needs a JSP-capable Tomcat installation with the selected page/dependencies and compiled JsonDS classes under the corresponding web application; Python static HTTP alone cannot execute it. The repository does not contain a complete supported Tomcat bootstrap/deployment command, and this guide does not invent one. Historical setup notes under [`src/server/`](../../src/server/) are experiment context, not a production operations runbook.

The state tree and earlier whole-state value are static process memory. No durable world database, replicated store or restart recovery is provided by this endpoint.

## Security and reliability limits

The endpoint does not implement authenticated players, room authorization or authoritative validation of game actions. `game`/`room` choose paths, not access permissions. Timestamp checks do not prevent cheating or malicious state replacement. The request body is collected before parsing; there is no application-level rate/size policy in this code. Do not expose it as a public multiplayer service or treat sample administrative commands from older designs as real tools.

Native chunks, raw portfolio boards and Var-tree objects also have different identity/serialization contracts. A future multiplayer design must define authority, identity, validation, durability and bounded transport explicitly before advertising reliable sessions, rollback, mod networking or cross-runtime world synchronization.
