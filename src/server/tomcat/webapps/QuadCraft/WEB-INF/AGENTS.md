# WEB-INF - AI Agent Guidelines

## Overview

Standard J2EE WEB-INF directory for server-side Java code.

## Java Classes

Located in `classes/immutable/occamsjsonds/`:

### JsonDS

- Immutable JSON handling
- Thread-safe by design
- Handles parsing and generation

### Guidelines for Modifying

1. Maintain immutability pattern
2. Run TestJsonDS after changes
3. Recompile: `javac *.java`
4. Restart Tomcat

## Adding New Classes

1. Create in appropriate package
2. Follow immutable patterns if applicable
3. Add tests
4. Document public API

## Configuration

### Adding web.xml

If needed for servlet configuration:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="http://xmlns.jcp.org/xml/ns/javaee"
         version="3.1">
  <!-- servlet mappings here -->
</web-app>
```

## Troubleshooting

- ClassNotFoundException: Check compilation
- NoClassDefFoundError: Check classpath
- Check Tomcat logs for stack traces
