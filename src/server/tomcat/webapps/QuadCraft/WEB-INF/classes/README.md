# Java Classes

Compiled Java classes for the QuadCraft server.

## Structure

```text
classes/
└── immutable/
    └── occamsjsonds/
        ├── JsonDS.java        # JSON data structure source
        ├── JsonDS.class       # Compiled bytecode
        ├── JsonDS$1.class     # Anonymous inner class
        ├── TestJsonDS.java    # Test code source
        └── TestJsonDS.class   # Compiled test
```

## Package: immutable.occamsjsonds

An immutable JSON handling library used for save data.

### JsonDS

Immutable JSON data structure:

- Thread-safe by design
- Efficient for read operations
- Used for server-client communication
