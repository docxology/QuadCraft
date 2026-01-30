# Tomcat Server - AI Agent Guidelines

## Overview

Tomcat deployment directory for QuadCraft backend services.

## Guidelines

### Modifying Webapp

1. Edit files in `webapps/QuadCraft/`
2. Redeploy or auto-reload in development
3. Test with browser client

### Adding New Endpoints

1. Create JSP or servlet
2. Add to WEB-INF/web.xml if needed
3. Update browser client code
4. Document API

## Common Tasks

### Recompiling Java

```bash
cd webapps/QuadCraft/WEB-INF/classes
javac -cp .:$CATALINA_HOME/lib/* *.java
```

### Checking Logs

```bash
tail -f $CATALINA_HOME/logs/catalina.out
```

### Restarting

```bash
$CATALINA_HOME/bin/shutdown.sh
$CATALINA_HOME/bin/startup.sh
```

## Troubleshooting

- 404: Check context path and file locations
- 500: Check JSP syntax and Java compilation
- CORS: Configure in web.xml or JSP headers
