# Servlet-private Java dependency layout

`classes/` is the servlet-private classpath root. Its `immutable/occamsjsonds` package supplies JSON parsing, map construction and persistent-style update helpers imported by the JSP. WEB-INF content is not normally served directly by the servlet container.

See [classpath contents](classes/README.md) and [application integration](../README.md). This directory contains no checked-in web.xml authentication or persistence configuration; its presence does not establish such services.
