# Server Infrastructure - AI Agent Guidelines

## Overview

Server components for multiplayer and persistence. Less actively developed than browser version.

## Technology Context

- Apache Tomcat for servlet container
- JSP for server-side processing
- Java for backend logic

## Development Guidelines

### Modifying Server Code

1. Understand Tomcat deployment
2. Test with local Tomcat instance
3. Check browser integration
4. Document API changes

### Adding Endpoints

1. Add to QuadCraftAjax.jsp or new servlet
2. Follow existing request/response patterns
3. Update browser code to use endpoint
4. Test error handling

## Security Considerations

- Validate all input from clients
- Sanitize JSON data
- Consider authentication for production
- Protect against common web attacks

## Deployment Notes

- Requires Java runtime
- Tomcat configuration in WEB-INF
- Static files served by Tomcat
- CORS may need configuration

## Testing

- Test with multiple browser instances
- Verify save/load round-trip
- Check error handling
- Test concurrent access
