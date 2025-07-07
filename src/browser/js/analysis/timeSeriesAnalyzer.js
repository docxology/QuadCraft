/**
 * Time Series Analyzer Module
 * Provides real-time coordinate tracking and line chart visualization
 */

/**
 * Time Series Analyzer Class
 * Manages coordinate tracking over time with line chart visualization
 */
class TimeSeriesAnalyzer {
    constructor() {
        this.quadrayTracking = false;
        this.xyzTracking = false;
        this.movementTracking = false;
        
        this.quadrayData = [];
        this.xyzData = [];
        this.movementData = [];
        
        this.quadrayInterval = null;
        this.xyzInterval = null;
        this.movementInterval = null;
        
        this.timeWindow = 60; // seconds
        this.updateInterval = 100; // milliseconds
        
        this.lastPosition = null;
        
        this.canvases = {
            quadray: null,
            xyz: null,
            movement: null
        };
    }

    /**
     * Initialize the time series analyzer
     */
    init() {
        this.initCanvases();
        this.setupEventListeners();
        console.log('Time Series Analyzer initialized');
    }

    /**
     * Initialize canvas elements
     */
    initCanvases() {
        this.canvases.quadray = document.getElementById('quadrayChart');
        this.canvases.xyz = document.getElementById('xyzChart');
        this.canvases.movement = document.getElementById('movementChart');
        
        // Set canvas dimensions
        Object.values(this.canvases).forEach(canvas => {
            if (canvas) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.resizeCanvases();
        });
    }

    /**
     * Setup event listeners for controls
     */
    setupEventListeners() {
        // Time settings change handlers
        const timeWindowInput = document.getElementById('timeWindowInput');
        const intervalInput = document.getElementById('intervalInput');
        
        if (timeWindowInput) {
            timeWindowInput.addEventListener('change', () => {
                this.updateTimeSettings();
            });
        }
        
        if (intervalInput) {
            intervalInput.addEventListener('change', () => {
                this.updateTimeSettings();
            });
        }
    }

    /**
     * Resize canvas elements
     */
    resizeCanvases() {
        Object.values(this.canvases).forEach(canvas => {
            if (canvas) {
                const container = canvas.parentElement;
                if (container) {
                    canvas.width = container.clientWidth;
                    canvas.height = container.clientHeight;
                }
            }
        });
        
        // Redraw charts
        this.redrawAllCharts();
    }

    /**
     * Update time settings from UI inputs
     */
    updateTimeSettings() {
        const timeWindowInput = document.getElementById('timeWindowInput');
        const intervalInput = document.getElementById('intervalInput');
        
        if (timeWindowInput) {
            this.timeWindow = parseInt(timeWindowInput.value) || 60;
        }
        if (intervalInput) {
            this.updateInterval = parseInt(intervalInput.value) || 100;
        }
        
        console.log(`Time settings updated: window=${this.timeWindow}s, interval=${this.updateInterval}ms`);
    }

    /**
     * Toggle quadray coordinate tracking
     */
    toggleQuadrayTracking() {
        this.quadrayTracking = !this.quadrayTracking;
        const btn = document.getElementById('toggleQuadrayBtn');
        
        if (this.quadrayTracking) {
            if (btn) {
                btn.textContent = 'Stop Quadray Tracking';
                btn.classList.add('status-active');
            }
            this.updateTimeSettings();
            this.quadrayInterval = setInterval(() => {
                this.recordQuadrayData();
            }, this.updateInterval);
            console.log('Started quadray tracking');
        } else {
            if (btn) {
                btn.textContent = 'Start Quadray Tracking';
                btn.classList.remove('status-active');
            }
            if (this.quadrayInterval) {
                clearInterval(this.quadrayInterval);
                this.quadrayInterval = null;
            }
            console.log('Stopped quadray tracking');
        }
    }

    /**
     * Toggle XYZ coordinate tracking
     */
    toggleXYZTracking() {
        this.xyzTracking = !this.xyzTracking;
        const btn = document.getElementById('toggleXYZBtn');
        
        if (this.xyzTracking) {
            if (btn) {
                btn.textContent = 'Stop XYZ Tracking';
                btn.classList.add('status-active');
            }
            this.updateTimeSettings();
            this.xyzInterval = setInterval(() => {
                this.recordXYZData();
            }, this.updateInterval);
            console.log('Started XYZ tracking');
        } else {
            if (btn) {
                btn.textContent = 'Start XYZ Tracking';
                btn.classList.remove('status-active');
            }
            if (this.xyzInterval) {
                clearInterval(this.xyzInterval);
                this.xyzInterval = null;
            }
            console.log('Stopped XYZ tracking');
        }
    }

    /**
     * Toggle movement analysis tracking
     */
    toggleMovementTracking() {
        this.movementTracking = !this.movementTracking;
        const btn = document.getElementById('toggleMovementBtn');
        
        if (this.movementTracking) {
            if (btn) {
                btn.textContent = 'Stop Movement Tracking';
                btn.classList.add('status-active');
            }
            this.updateTimeSettings();
            if (gameState && gameState.selq) {
                this.lastPosition = gameState.selq.toCartesian();
            }
            this.movementInterval = setInterval(() => {
                this.recordMovementData();
            }, this.updateInterval);
            console.log('Started movement tracking');
        } else {
            if (btn) {
                btn.textContent = 'Start Movement Tracking';
                btn.classList.remove('status-active');
            }
            if (this.movementInterval) {
                clearInterval(this.movementInterval);
                this.movementInterval = null;
            }
            console.log('Stopped movement tracking');
        }
    }

    /**
     * Record quadray coordinate data
     */
    recordQuadrayData() {
        if (!gameState || !gameState.selq) return;
        
        const timestamp = Date.now();
        const quadray = gameState.selq;
        
        this.quadrayData.push({
            time: timestamp,
            a: quadray.a,
            b: quadray.b,
            c: quadray.c,
            d: quadray.d
        });
        
        // Trim data to time window
        const cutoff = timestamp - (this.timeWindow * 1000);
        this.quadrayData = this.quadrayData.filter(d => d.time > cutoff);
        
        this.drawQuadrayChart();
    }

    /**
     * Record XYZ coordinate data
     */
    recordXYZData() {
        if (!gameState || !gameState.selq) return;
        
        const timestamp = Date.now();
        const cartesian = gameState.selq.toCartesian();
        
        this.xyzData.push({
            time: timestamp,
            x: cartesian[0],
            y: cartesian[1],
            z: cartesian[2]
        });
        
        // Trim data to time window
        const cutoff = timestamp - (this.timeWindow * 1000);
        this.xyzData = this.xyzData.filter(d => d.time > cutoff);
        
        this.drawXYZChart();
    }

    /**
     * Record movement analysis data
     */
    recordMovementData() {
        if (!gameState || !gameState.selq) return;
        
        const timestamp = Date.now();
        const currentPos = gameState.selq.toCartesian();
        
        // Calculate distance from origin
        const distanceFromOrigin = Math.sqrt(
            currentPos[0] * currentPos[0] + 
            currentPos[1] * currentPos[1] + 
            currentPos[2] * currentPos[2]
        );
        
        // Calculate speed (distance moved since last measurement)
        let speed = 0;
        if (this.lastPosition && this.movementData.length > 0) {
            const timeDiff = (timestamp - this.movementData[this.movementData.length - 1].time) / 1000;
            if (timeDiff > 0) {
                const distance = Math.sqrt(
                    Math.pow(currentPos[0] - this.lastPosition[0], 2) +
                    Math.pow(currentPos[1] - this.lastPosition[1], 2) +
                    Math.pow(currentPos[2] - this.lastPosition[2], 2)
                );
                speed = distance / timeDiff;
            }
        }
        
        this.movementData.push({
            time: timestamp,
            distance: distanceFromOrigin,
            speed: speed
        });
        
        this.lastPosition = [...currentPos];
        
        // Trim data to time window
        const cutoff = timestamp - (this.timeWindow * 1000);
        this.movementData = this.movementData.filter(d => d.time > cutoff);
        
        this.drawMovementChart();
    }

    /**
     * Draw quadray coordinates chart
     */
    drawQuadrayChart() {
        const canvas = this.canvases.quadray;
        if (!canvas || this.quadrayData.length < 2) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44'];
        const properties = ['a', 'b', 'c', 'd'];
        
        this.drawLineChart(ctx, canvas, this.quadrayData, properties, colors);
    }

    /**
     * Draw XYZ coordinates chart
     */
    drawXYZChart() {
        const canvas = this.canvases.xyz;
        if (!canvas || this.xyzData.length < 2) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const colors = ['#ff6666', '#66ff66', '#6666ff'];
        const properties = ['x', 'y', 'z'];
        
        this.drawLineChart(ctx, canvas, this.xyzData, properties, colors);
    }

    /**
     * Draw movement analysis chart
     */
    drawMovementChart() {
        const canvas = this.canvases.movement;
        if (!canvas || this.movementData.length < 2) return;
        
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const colors = ['#ff8844', '#44ff88'];
        const properties = ['distance', 'speed'];
        
        this.drawLineChart(ctx, canvas, this.movementData, properties, colors);
    }

    /**
     * Generic line chart drawing function
     */
    drawLineChart(ctx, canvas, data, properties, colors) {
        if (data.length < 2) return;
        
        const width = canvas.width;
        const height = canvas.height;
        const padding = { top: 20, bottom: 30, left: 50, right: 20 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = height - padding.top - padding.bottom;
        
        // Calculate time and value ranges
        const times = data.map(d => d.time);
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        const timeRange = maxTime - minTime || 1;
        
        // Find global min/max for all properties
        let minValue = Infinity;
        let maxValue = -Infinity;
        
        for (const property of properties) {
            const values = data.map(d => d[property]).filter(v => v !== undefined);
            if (values.length > 0) {
                minValue = Math.min(minValue, ...values);
                maxValue = Math.max(maxValue, ...values);
            }
        }
        
        const valueRange = maxValue - minValue || 1;
        
        // Add some padding to the value range
        const valuePadding = valueRange * 0.1;
        minValue -= valuePadding;
        maxValue += valuePadding;
        const adjustedValueRange = maxValue - minValue;
        
        // Draw background
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, width, height);
        
        // Draw grid
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        
        // Vertical grid lines (time)
        for (let i = 0; i <= 5; i++) {
            const x = padding.left + (i / 5) * chartWidth;
            ctx.beginPath();
            ctx.moveTo(x, padding.top);
            ctx.lineTo(x, padding.top + chartHeight);
            ctx.stroke();
        }
        
        // Horizontal grid lines (values)
        for (let i = 0; i <= 5; i++) {
            const y = padding.top + (i / 5) * chartHeight;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(padding.left + chartWidth, y);
            ctx.stroke();
        }
        
        // Draw axes
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top);
        ctx.lineTo(padding.left, padding.top + chartHeight);
        ctx.lineTo(padding.left + chartWidth, padding.top + chartHeight);
        ctx.stroke();
        
        // Draw data lines
        for (let i = 0; i < properties.length; i++) {
            const property = properties[i];
            const color = colors[i] || '#ffffff';
            
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            let firstPoint = true;
            for (const point of data) {
                if (point[property] !== undefined) {
                    const x = padding.left + ((point.time - minTime) / timeRange) * chartWidth;
                    const y = padding.top + chartHeight - ((point[property] - minValue) / adjustedValueRange) * chartHeight;
                    
                    if (firstPoint) {
                        ctx.moveTo(x, y);
                        firstPoint = false;
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
            }
            ctx.stroke();
        }
        
        // Draw value labels
        ctx.fillStyle = '#aaa';
        ctx.font = '10px Arial';
        ctx.textAlign = 'right';
        
        for (let i = 0; i <= 5; i++) {
            const value = minValue + (i / 5) * adjustedValueRange;
            const y = padding.top + chartHeight - (i / 5) * chartHeight;
            ctx.fillText(value.toFixed(1), padding.left - 5, y + 3);
        }
        
        // Draw time labels
        ctx.textAlign = 'center';
        for (let i = 0; i <= 5; i++) {
            const timeAgo = (5 - i) * (this.timeWindow / 5);
            const x = padding.left + (i / 5) * chartWidth;
            ctx.fillText(`-${timeAgo.toFixed(0)}s`, x, height - 5);
        }
    }

    /**
     * Clear all data and redraw charts
     */
    clearAllData() {
        this.clearQuadrayData();
        this.clearXYZData();
        this.clearMovementData();
    }

    /**
     * Clear quadray data
     */
    clearQuadrayData() {
        this.quadrayData = [];
        this.drawQuadrayChart();
    }

    /**
     * Clear XYZ data
     */
    clearXYZData() {
        this.xyzData = [];
        this.drawXYZChart();
    }

    /**
     * Clear movement data
     */
    clearMovementData() {
        this.movementData = [];
        this.drawMovementChart();
    }

    /**
     * Redraw all charts
     */
    redrawAllCharts() {
        this.drawQuadrayChart();
        this.drawXYZChart();
        this.drawMovementChart();
    }

    /**
     * Reset time window and restart tracking
     */
    resetTimeWindow() {
        this.updateTimeSettings();
        
        // Restart active tracking with new settings
        if (this.quadrayTracking) {
            this.toggleQuadrayTracking();
            this.toggleQuadrayTracking();
        }
        if (this.xyzTracking) {
            this.toggleXYZTracking();
            this.toggleXYZTracking();
        }
        if (this.movementTracking) {
            this.toggleMovementTracking();
            this.toggleMovementTracking();
        }
    }

    /**
     * Export quadray data
     */
    exportQuadrayData() {
        if (this.quadrayData.length === 0) {
            console.warn('No quadray data to export');
            return;
        }
        
        const exportData = {
            type: 'quadray_time_series',
            timestamp: new Date().toISOString(),
            timeWindow: this.timeWindow,
            updateInterval: this.updateInterval,
            dataPoints: this.quadrayData.length,
            data: this.quadrayData
        };
        
        this.downloadJSON(exportData, `quadray_timeseries_${Date.now()}.json`);
    }

    /**
     * Export XYZ data
     */
    exportXYZData() {
        if (this.xyzData.length === 0) {
            console.warn('No XYZ data to export');
            return;
        }
        
        const exportData = {
            type: 'xyz_time_series',
            timestamp: new Date().toISOString(),
            timeWindow: this.timeWindow,
            updateInterval: this.updateInterval,
            dataPoints: this.xyzData.length,
            data: this.xyzData
        };
        
        this.downloadJSON(exportData, `xyz_timeseries_${Date.now()}.json`);
    }

    /**
     * Export movement data
     */
    exportMovementData() {
        if (this.movementData.length === 0) {
            console.warn('No movement data to export');
            return;
        }
        
        const exportData = {
            type: 'movement_time_series',
            timestamp: new Date().toISOString(),
            timeWindow: this.timeWindow,
            updateInterval: this.updateInterval,
            dataPoints: this.movementData.length,
            data: this.movementData
        };
        
        this.downloadJSON(exportData, `movement_timeseries_${Date.now()}.json`);
    }

    /**
     * Download JSON data as file
     */
    downloadJSON(data, filename) {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log(`Exported ${filename} with ${data.dataPoints} data points`);
    }

    /**
     * Get current tracking status
     */
    getStatus() {
        return {
            quadrayTracking: this.quadrayTracking,
            xyzTracking: this.xyzTracking,
            movementTracking: this.movementTracking,
            dataPoints: {
                quadray: this.quadrayData.length,
                xyz: this.xyzData.length,
                movement: this.movementData.length
            },
            settings: {
                timeWindow: this.timeWindow,
                updateInterval: this.updateInterval
            }
        };
    }

    /**
     * Stop all tracking
     */
    stopAllTracking() {
        if (this.quadrayTracking) this.toggleQuadrayTracking();
        if (this.xyzTracking) this.toggleXYZTracking();
        if (this.movementTracking) this.toggleMovementTracking();
    }
}

// Create global instance
const timeSeriesAnalyzer = new TimeSeriesAnalyzer();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        TimeSeriesAnalyzer,
        timeSeriesAnalyzer
    };
} 