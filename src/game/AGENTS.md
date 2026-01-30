# Game Logic - AI Agent Guidelines

## Overview

The game directory contains the main coordination logic. Changes here affect the overall game experience.

## Main Areas

### Game Loop (Game.cpp/h)

The central update cycle:

- Process input first
- Update world state
- Render frame
- Handle frame timing

When modifying:

- Maintain consistent update order
- Respect delta time for smooth movement
- Handle window events properly

### Input Handling (Input.h)

Input processing and key bindings:

- Key down/up events
- Mouse position and buttons
- State tracking (pressed, held)

When modifying:

- Consider both keyboard and mouse
- Add gamepad support via same interface
- Document new key bindings

## Modification Guidelines

### Adding New Controls

1. Define key constant in Input.h
2. Add event handling in processInput()
3. Implement action in appropriate system
4. Update documentation

### Changing Game States

1. Consider transitions between states
2. Handle cleanup when leaving state
3. Initialize properly when entering state

### Performance Considerations

- Input polling should be fast
- Decouple input from physics updates
- Use delta time for frame-independent logic

## Testing

- Test with different frame rates
- Verify all key bindings work
- Check mouse capture/release cycle
- Test window focus changes
