# Save Files - AI Agent Guidelines

## Purpose

This directory stores game state snapshots for testing, debugging, and user saves.

## Guidelines

### Do NOT

- Commit large save files to git
- Modify saves directly (use application)
- Delete saves without understanding purpose

### Do

- Use descriptive names for test saves
- Clean up obsolete debug saves
- Maintain format compatibility

## Format Changes

If changing save format:

1. Increment version number
2. Provide migration for old saves
3. Test loading old saves
4. Document changes
