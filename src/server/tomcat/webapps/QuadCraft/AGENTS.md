# QuadCraft Webapp - AI Agent Guidelines

## Overview

The deployed web application for server-based persistence.

## Key Files

### QuadCraftAjax.jsp

- Main AJAX endpoint
- Handles save/load operations
- Returns JSON responses

### Guidelines

- Validate all input
- Handle errors gracefully
- Return proper HTTP status codes
- Log important operations

## Adding Features

1. Edit QuadCraftAjax.jsp for new endpoints
2. Add Java classes in WEB-INF/classes if needed
3. Update browser client to use new features
4. Test round-trip operations

## Security

- Sanitize input data
- Validate JSON structure
- Consider authentication
- Log suspicious activity

## Testing

1. Test save operation
2. Test load operation
3. Test error conditions
4. Test with multiple clients
