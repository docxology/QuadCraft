# QuadCraft Web Application

The deployed QuadCraft web application for Tomcat.

## Files

| File | Purpose |
|------|---------|
| `QuadCraftAjax.jsp` | AJAX endpoint for save/load |
| `index.html_goesHere.txt` | Instructions for index file |
| `WEB-INF/` | Java classes and configuration |

## QuadCraftAjax.jsp

Server-side endpoint handling:

### Save Operation (POST)

```javascript
// Client request
fetch('/QuadCraft/QuadCraftAjax.jsp', {
  method: 'POST',
  body: JSON.stringify({
    action: 'save',
    name: 'savename',
    data: gameState
  })
});

// Server response
{ success: true }
```

### Load Operation (GET)

```javascript
// Client request
fetch('/QuadCraft/QuadCraftAjax.jsp?action=load&name=savename');

// Server response
{ data: {...gameState...} }
```

## WEB-INF Structure

```
WEB-INF/
└── classes/
    └── immutable/
        └── occamsjsonds/
            ├── JsonDS.java     # JSON handling
            ├── JsonDS.class
            ├── TestJsonDS.java # Tests
            └── TestJsonDS.class
```

## Setup

1. Copy index.html from browser version
2. Update AJAX URLs to point to this server
3. Deploy to Tomcat
