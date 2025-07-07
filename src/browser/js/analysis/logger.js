/**
 * Logger Module
 * Handles real-time coordinate logging and data collection
 */

/**
 * Logger Class
 * Manages coordinate logging, data collection, and export functionality
 */
class Logger {
    constructor() {
        this.isLogging = false;
        this.logEntries = [];
        this.logInterval = null;
        this.maxEntries = constants.LOGGING_CONFIG.MAX_LOG_ENTRIES;
        this.logIntervalMs = constants.LOGGING_CONFIG.LOG_INTERVAL_MS;
        this.autoExportInterval = null;
    }

    /**
     * Initialize the logger
     */
    init() {
        this.initializeUI();
    }

    /**
     * Initialize the logger UI elements
     */
    initializeUI() {
        this.logDisplay = document.getElementById('logDisplay');
        this.toggleButton = document.getElementById('toggleLoggingBtn');
        
        if (this.toggleButton) {
            this.updateToggleButton();
        }
    }

    /**
     * Toggle logging on/off
     */
    toggleLogging() {
        if (this.isLogging) {
            this.stopLogging();
        } else {
            this.startLogging();
        }
    }

    /**
     * Start logging coordinates
     */
    startLogging() {
        if (this.isLogging) return;
        
        this.isLogging = true;
        this.updateToggleButton();
        
        // Start logging interval
        this.logInterval = setInterval(() => {
            this.logCurrentState();
        }, this.logIntervalMs);
        
        // Start auto-export interval
        this.autoExportInterval = setInterval(() => {
            this.autoExport();
        }, constants.LOGGING_CONFIG.AUTO_EXPORT_INTERVAL);
        
        console.log('Coordinate logging started');
    }

    /**
     * Stop logging coordinates
     */
    stopLogging() {
        if (!this.isLogging) return;
        
        this.isLogging = false;
        this.updateToggleButton();
        
        // Clear intervals
        if (this.logInterval) {
            clearInterval(this.logInterval);
            this.logInterval = null;
        }
        
        if (this.autoExportInterval) {
            clearInterval(this.autoExportInterval);
            this.autoExportInterval = null;
        }
        
        console.log('Coordinate logging stopped');
    }

    /**
     * Log the current game state
     */
    logCurrentState() {
        if (!gameState || !gameState.selq) return;
        
        const timestamp = constants.UTILS.getTimestamp();
        const quadray = gameState.selq;
        const cartesian = quadray.toCartesian();
        const cameraState = camera ? camera.getCameraState() : null;
        
        const entry = {
            timestamp,
            timeFormatted: constants.UTILS.formatTimestamp(timestamp),
            quadray: {
                a: quadray.a,
                b: quadray.b,
                c: quadray.c,
                d: quadray.d,
                string: quadray.toString()
            },
            cartesian: {
                x: parseFloat(cartesian[0].toFixed(constants.LOGGING_CONFIG.COORDINATE_PRECISION)),
                y: parseFloat(cartesian[1].toFixed(constants.LOGGING_CONFIG.COORDINATE_PRECISION)),
                z: parseFloat(cartesian[2].toFixed(constants.LOGGING_CONFIG.COORDINATE_PRECISION))
            },
            camera: cameraState,
            gameStats: gameState.getStats ? gameState.getStats() : {
                gridDots: Object.keys(gameState.QGridDots || {}).length,
                pathDots: Object.keys(gameState.QDots || {}).length,
                triangles: Object.keys(gameState.gameTris || {}).length,
                octahedrons: gameState.grid.oct.size,
                tetrahedronsZ: gameState.grid.tetZ.size,
                tetrahedronsC: gameState.grid.tetC.size
            }
        };
        
        this.addLogEntry(entry);
    }

    /**
     * Add a log entry
     */
    addLogEntry(entry) {
        this.logEntries.push(entry);
        
        // Limit the number of entries
        if (this.logEntries.length > this.maxEntries) {
            this.logEntries.shift();
        }
        
        this.updateLogDisplay();
    }

    /**
     * Update the log display
     */
    updateLogDisplay() {
        if (!this.logDisplay) return;
        
        // Show only the last 50 entries for performance
        const recentEntries = this.logEntries.slice(-50);
        
        this.logDisplay.innerHTML = recentEntries.map(entry => {
            const time = entry.timeFormatted;
            const quadray = entry.quadray.string;
            const xyz = `[${entry.cartesian.x}, ${entry.cartesian.y}, ${entry.cartesian.z}]`;
            
            return `<div class="log-entry">[${time}] ${quadray} → ${xyz}</div>`;
        }).join('');
        
        // Auto-scroll to bottom
        this.logDisplay.scrollTop = this.logDisplay.scrollHeight;
    }

    /**
     * Update the toggle button appearance
     */
    updateToggleButton() {
        if (!this.toggleButton) return;
        
        if (this.isLogging) {
            this.toggleButton.textContent = 'Stop Logging';
            this.toggleButton.classList.add('status-active');
            this.toggleButton.classList.remove('status-inactive');
        } else {
            this.toggleButton.textContent = 'Start Logging';
            this.toggleButton.classList.add('status-inactive');
            this.toggleButton.classList.remove('status-active');
        }
    }

    /**
     * Clear all log entries
     */
    clearLog() {
        this.logEntries = [];
        this.updateLogDisplay();
        console.log('Log cleared');
    }

    /**
     * Export log data to JSON file
     */
    exportLog() {
        if (this.logEntries.length === 0) {
            alert('No log data to export');
            return;
        }
        
        const exportData = {
            metadata: {
                exportTime: new Date().toISOString(),
                totalEntries: this.logEntries.length,
                timeRange: {
                    start: this.logEntries[0].timeFormatted,
                    end: this.logEntries[this.logEntries.length - 1].timeFormatted
                },
                configuration: {
                    logIntervalMs: this.logIntervalMs,
                    maxEntries: this.maxEntries,
                    coordinatePrecision: constants.LOGGING_CONFIG.COORDINATE_PRECISION
                }
            },
            entries: this.logEntries
        };
        
        const filename = `quadcraft_coordinate_log_${UTILS.getTimestamp().toFixed(0)}.json`;
        this.downloadJSON(exportData, filename);
        
        console.log(`Log exported with ${this.logEntries.length} entries`);
    }

    /**
     * Auto-export log data
     */
    autoExport() {
        if (this.logEntries.length > 0) {
            console.log('Auto-exporting log data...');
            this.exportLog();
        }
    }

    /**
     * Download JSON data as a file
     */
    downloadJSON(data, filename) {
        const jsonString = JSON.stringify(data, null, constants.EXPORT_CONFIG.JSON_INDENT);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Get log statistics
     */
    getLogStats() {
        if (this.logEntries.length === 0) {
            return {
                totalEntries: 0,
                timeRange: null,
                averageInterval: 0,
                uniqueQuadrays: 0
            };
        }
        
        const uniqueQuadrays = new Set();
        let totalTime = 0;
        
        for (let i = 1; i < this.logEntries.length; i++) {
            const interval = this.logEntries[i].timestamp - this.logEntries[i - 1].timestamp;
            totalTime += interval;
            
            const quadray = this.logEntries[i].quadray.string;
            uniqueQuadrays.add(quadray);
        }
        
        const averageInterval = totalTime / (this.logEntries.length - 1);
        const timeRange = {
            start: this.logEntries[0].timestamp,
            end: this.logEntries[this.logEntries.length - 1].timestamp,
            duration: this.logEntries[this.logEntries.length - 1].timestamp - this.logEntries[0].timestamp
        };
        
        return {
            totalEntries: this.logEntries.length,
            timeRange,
            averageInterval,
            uniqueQuadrays: uniqueQuadrays.size
        };
    }

    /**
     * Get trajectory data for analysis
     */
    getTrajectoryData() {
        return this.logEntries.map(entry => ({
            timestamp: entry.timestamp,
            quadray: entry.quadray,
            cartesian: entry.cartesian
        }));
    }

    /**
     * Get coordinate statistics
     */
    getCoordinateStats() {
        if (this.logEntries.length === 0) return null;
        
        const cartesians = this.logEntries.map(entry => entry.cartesian);
        
        // Calculate min/max for each coordinate
        const min = { x: Infinity, y: Infinity, z: Infinity };
        const max = { x: -Infinity, y: -Infinity, z: -Infinity };
        const sum = { x: 0, y: 0, z: 0 };
        
        for (const coord of cartesians) {
            min.x = Math.min(min.x, coord.x);
            min.y = Math.min(min.y, coord.y);
            min.z = Math.min(min.z, coord.z);
            
            max.x = Math.max(max.x, coord.x);
            max.y = Math.max(max.y, coord.y);
            max.z = Math.max(max.z, coord.z);
            
            sum.x += coord.x;
            sum.y += coord.y;
            sum.z += coord.z;
        }
        
        const count = cartesians.length;
        const average = {
            x: sum.x / count,
            y: sum.y / count,
            z: sum.z / count
        };
        
        // Calculate standard deviation
        let sumSq = { x: 0, y: 0, z: 0 };
        for (const coord of cartesians) {
            sumSq.x += Math.pow(coord.x - average.x, 2);
            sumSq.y += Math.pow(coord.y - average.y, 2);
            sumSq.z += Math.pow(coord.z - average.z, 2);
        }
        
        const stdDev = {
            x: Math.sqrt(sumSq.x / count),
            y: Math.sqrt(sumSq.y / count),
            z: Math.sqrt(sumSq.z / count)
        };
        
        return {
            count,
            min,
            max,
            average,
            stdDev,
            range: {
                x: max.x - min.x,
                y: max.y - min.y,
                z: max.z - min.z
            }
        };
    }

    /**
     * Filter log entries by time range
     */
    filterByTimeRange(startTime, endTime) {
        return this.logEntries.filter(entry => 
            entry.timestamp >= startTime && entry.timestamp <= endTime
        );
    }

    /**
     * Filter log entries by quadray coordinates
     */
    filterByQuadray(quadrayFilter) {
        return this.logEntries.filter(entry => {
            const q = entry.quadray;
            return quadrayFilter(q.a, q.b, q.c, q.d);
        });
    }

    /**
     * Get the current logging status
     */
    getStatus() {
        return {
            isLogging: this.isLogging,
            totalEntries: this.logEntries.length,
            maxEntries: this.maxEntries,
            logIntervalMs: this.logIntervalMs
        };
    }

    /**
     * Set logging configuration
     */
    setConfig(config) {
        if (config.maxEntries !== undefined) {
            this.maxEntries = config.maxEntries;
        }
        if (config.logIntervalMs !== undefined) {
            this.logIntervalMs = config.logIntervalMs;
            // Restart logging if currently active
            if (this.isLogging) {
                this.stopLogging();
                this.startLogging();
            }
        }
    }
}

// Create global logger instance
const logger = new Logger();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Logger,
        logger
    };
} 