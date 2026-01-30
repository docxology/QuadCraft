# Server Infrastructure

This directory contains server-side components for QuadCraft multiplayer and persistence.

## Directory Structure

```text
server/
└── tomcat/
    └── webapps/
        └── QuadCraft/       # QuadCraft webapp
            ├── QuadCraftAjax.jsp
            └── WEB-INF/
                └── classes/  # Java classes
```

## Overview

The server enables:

- Save/load synchronization between browser clients
- Shared game state for multiplayer
- Persistent storage for game worlds

## Technology Stack

- **Apache Tomcat** - Java servlet container
- **JSP** - Java Server Pages for AJAX endpoints
- **Java** - Backend logic and data handling

## Deployment

1. Install Apache Tomcat
2. Copy `webapps/QuadCraft` to Tomcat's webapps directory
3. Start Tomcat server
4. Access at `http://localhost:8080/QuadCraft/`

## Features

### AJAX Endpoints

`QuadCraftAjax.jsp` provides:

- Save game state
- Load game state
- List available saves

### Cross-Browser Sync

Multiple browser instances can:

- Save to shared server storage
- Load saves from other clients
- Enable basic multiplayer
