# JSP classpath sources and checked-in bytecode

`immutable/occamsjsonds/` contains `JsonDS.java`, `TestJsonDS.java`, their `.class` files and `JsonDS$1.class`. The JSP imports that package for `jsonParse`, `jsonString`, `map`, `jsonGet` and `jsonSet` operations.

Source files beside bytecode do not make Tomcat automatically compile those Java classes. Source/bytecode synchronization and target-JVM compatibility must be addressed when code changes. [Library provenance and limits](immutable/occamsjsonds/README.md) are separate from application concurrency/security: the JSP supplies its own lock/merge logic; immutable-style maps do not make the full service automatically safe.
