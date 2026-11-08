# Experimental JSP Var-tree synchronization protocol

[QuadCraftAjax.jsp](tomcat/webapps/QuadCraft/QuadCraftAjax.jsp) is a JSON-body endpoint for browser Var-tree experiments. It is not the portfolio HTTP launcher, a native server or a durable save database.

The implemented action switch handles `help`, `ok`, legacy `readAll/writeAll`, and `writeSparse/readSparse/readWriteSparse`. `sparseVSync` still returns a placeholder comment and is not the operational sparse protocol. There are no `action:save/name/data` or GET query-string load/list-save APIs.

Sparse writes pass `root`; reads require `game`, `room` and numeric `peer.main.tNetFrom`. `readWriteSparse` performs both. Responses use action `writeSparse`, the selected room under `root`, and peer cursor bounds. The server merges each Var by strictly newer `.t`, keeping existing values on ties, and stamps server-only `.tNet` for accepted changes. Reads use inclusive `.tNet` thresholds; the browser advances with the next representable value after `tNetTo`. This is not Var.js logical-j conflict resolution.

State lives in static process memory (`V` and a separate legacy `wholeState`), with no disk persistence, authentication, authorization or authoritative simulation. Restart/redeployment can lose it. Do not expose this experiment as a production service. Java/JSP dependencies are bundled under WEB-INF/classes; preserve their attribution. Deployment needs an external Java/Tomcat installation and compatible bytecode; no minimum-version compatibility was exercised here. The webapp's `index.html_goesHere.txt` is a placement note, not a shipped browser entry page.
