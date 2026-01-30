# Tomcat Server

Apache Tomcat deployment for QuadCraft backend.

## Directory Structure

```text
tomcat/
└── webapps/
    └── QuadCraft/           # Deployed web application
        ├── QuadCraftAjax.jsp
        ├── index.html_goesHere.txt
        └── WEB-INF/
            └── classes/     # Compiled Java classes
```

## Deployment

### Prerequisites

- Apache Tomcat 8+ installed
- Java 8+ runtime

### Installation

1. Copy `webapps/QuadCraft` to `$CATALINA_HOME/webapps/`
2. Start Tomcat: `./startup.sh`
3. Access: `http://localhost:8080/QuadCraft/`

### Configuration

- Port: Default 8080 (configure in `server.xml`)
- Context path: `/QuadCraft`

## Webapp Contents

### QuadCraftAjax.jsp

AJAX endpoint for game operations:

- POST: Save game state
- GET: Load game state

### WEB-INF/classes

Compiled Java classes:

- `JsonDS.java` - JSON data structure handling
- `TestJsonDS.java` - Test code

## Integration

Browser clients connect via:

```javascript
fetch('http://localhost:8080/QuadCraft/QuadCraftAjax.jsp', {
  method: 'POST',
  body: JSON.stringify(gameState)
});
```
