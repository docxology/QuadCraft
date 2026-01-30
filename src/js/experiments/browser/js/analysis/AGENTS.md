# Analysis Modules - AI Agent Guidelines

## Purpose

These modules provide insights into gameplay without affecting core mechanics.

## Guidelines

### Adding New Analyses

1. Create new module or extend existing
2. Use gameState as data source
3. Avoid modifying game state
4. Consider performance impact

### Performance Considerations

Analysis runs alongside gameplay:

- Limit data collection rate
- Cap data storage size
- Use requestAnimationFrame for visuals
- Profile impact on frame rate

## Module-Specific Notes

### logger.js

- Limit log entries to prevent memory issues
- Clear old entries periodically
- Efficient storage format

### analyzer.js

- Compute-intensive; run in idle time
- Cache results when possible
- Handle large datasets gracefully

### visualizer.js

- Use separate canvas for visualization
- Don't block main render loop
- Clear canvas before redraw

### timeSeriesAnalyzer.js

- Configurable update interval
- Sliding window for memory efficiency
- Smooth chart updates

## Data Export

All modules support export:

- JSON for programmatic use
- CSV for spreadsheet analysis
- Consistent timestamp format
