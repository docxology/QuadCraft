# WEB-INF

Java web application configuration and classes.

## Structure

```
WEB-INF/
└── classes/
    └── immutable/
        └── occamsjsonds/
            ├── JsonDS.java        # JSON data structure
            ├── JsonDS.class       # Compiled class
            ├── JsonDS$1.class     # Inner class
            ├── TestJsonDS.java    # Test code
            └── TestJsonDS.class   # Compiled test
```

## Classes

### JsonDS

Immutable JSON data structure handling:

- Parse JSON input
- Generate JSON output
- Immutable operations for safety

### TestJsonDS

Unit tests for JsonDS functionality.

## Deployment Notes

- Classes are auto-loaded by Tomcat
- Recompile after Java changes
- Restart Tomcat for class changes to take effect

## Configuration

Standard J2EE webapp structure:

- No web.xml currently (uses defaults)
- Add web.xml for servlet mappings if needed
