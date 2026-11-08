# OccamsJSONDS provenance and JSP integration

`JsonDS.java` is Ben F Rayfield's bundled JSON datastore/helper source; its header records MIT and additional Apache2 attribution/history. Preserve those upstream notices and source commentary. `TestJsonDS.java` is its bundled demonstration/self-test; checked-in `.class` artifacts also exist.

The QuadCraft JSP uses `JsonDS.jsonParse`, `jsonString`, `map`, `jsonGet` and `jsonSet`. Numbers are represented as doubles; sorted NavigableMaps and immutable-style updates are library conventions, not a database persistence layer or a guarantee for every possible JSON value. Read the source's documented subset/caveats rather than assuming a generic standards-compliant serializer.

[Parent classpath guide](../../README.md) documents source/bytecode lifecycle; [application guide](../../../../README.md) owns server protocol/security. This audit preserved third-party Java documentation and did not run its self-test or establish bytecode freshness.
