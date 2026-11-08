# External Tomcat deployment and JSP runtime boundary

This tree contains `webapps/QuadCraft/`, not a Tomcat distribution, server.xml or launcher scripts. Install/manage Tomcat externally; copying the webapp under its webapps directory exposes the context `/QuadCraft` according to the container configuration.

The operational endpoint is `QuadCraft/QuadCraftAjax.jsp`; its request body is JSON and its action switch, not HTTP method or query parameter alone, selects behavior. Read [the full protocol](../README.md) before writing clients. A static Python HTTP server cannot execute JSP.

`WEB-INF/classes/immutable/occamsjsonds/` includes Java sources and checked-in bytecode. Recompilation/classloader reload must be handled if sources change; source/bytecode parity and Java/Tomcat version compatibility were not exercised in this audit. There is no root Java file matching the old wildcard compilation recipe. The placeholder index note does not deploy the current browser's external Var.js automatically.
