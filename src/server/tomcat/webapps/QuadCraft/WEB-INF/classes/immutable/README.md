# Immutable Java package namespace for JSP JSON helpers

`occamsjsonds/` is the bundled dependency package; `immutable` is its Java namespace, not an application-wide immutability guarantee. See [library integration](occamsjsonds/README.md) and [classpath lifecycle](../README.md).

The JSP maintains mutable references to shared tree snapshots and coordinates writes separately. This package does not supply native saves, user identities or storage services.
