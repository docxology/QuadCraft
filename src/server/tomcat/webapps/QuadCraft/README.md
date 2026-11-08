# QuadCraft JSP endpoint and deployment contents

[QuadCraftAjax.jsp](QuadCraftAjax.jsp) reads the request body and emits JSON. Implemented sparse action names are `writeSparse`, `readSparse` and `readWriteSparse`; `readAll/writeAll` address separate legacy memory state. GET `?action=load&name=...` and POST `{action:"save",name,data}` recipes are not implemented.

For exact fields, timestamp merge/cursor semantics and security constraints see [the server protocol](../../../README.md). `index.html_goesHere.txt` is only a placement note. Serving a browser client also requires its actual script dependencies and correct endpoint/origin wiring; this webapp is not a packaged complete browser distribution.

[WEB-INF](WEB-INF/README.md) holds Java dependency sources/bytecode. State is static JVM memory, not files or a catalog of named saves. Native/portfolio clients are not integrated here.
