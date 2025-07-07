/**
 * Visualization Tools
 * Provides additional visualization capabilities for the game
 */

const visualizer = {
    vizCanvas: null,
    vizCtx: null,
    heatmapEnabled: false,
    gridEnabled: false,

    /**
     * Initialize visualization canvas
     */
    init: function() {
        this.vizCanvas = document.getElementById('vizCanvas');
        if (!this.vizCanvas) {
            console.error('Visualization canvas not found');
            return false;
        }

        this.vizCtx = this.vizCanvas.getContext('2d');
        this.resizeCanvas();
        
        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        console.log('Visualizer initialized successfully');
        return true;
    },

    /**
     * Resize visualization canvas
     */
    resizeCanvas: function() {
        if (!this.vizCanvas) return;
        
        const container = this.vizCanvas.parentElement;
        if (container) {
            this.vizCanvas.width = container.clientWidth;
            this.vizCanvas.height = container.clientHeight;
        }
    },

    /**
     * Toggle heatmap visualization
     */
    toggleHeatmap: function() {
        this.heatmapEnabled = !this.heatmapEnabled;
        if (this.heatmapEnabled) {
            this.drawHeatmap();
        } else {
            this.clearCanvas();
        }
    },

    /**
     * Show coordinate grid
     */
    showCoordinateGrid: function() {
        this.gridEnabled = !this.gridEnabled;
        if (this.gridEnabled) {
            this.drawCoordinateGrid();
        } else {
            this.clearCanvas();
        }
    },

    /**
     * Export visualization
     */
    exportVisualization: function() {
        if (!this.vizCanvas) return;
        
        const dataURL = this.vizCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'quadcraft_visualization.png';
        link.href = dataURL;
        link.click();
    },

    /**
     * Draw heatmap of shape density
     */
    drawHeatmap: function() {
        if (!this.vizCtx) return;
        
        this.clearCanvas();
        
        const octahedrons = Array.from(gameState.grid.oct);
        const tetrahedronsZ = Array.from(gameState.grid.tetZ);
        const tetrahedronsC = Array.from(gameState.grid.tetC);
        
        // Create density map
        const densityMap = new Map();
        
        // Count shapes at each coordinate
        const allShapes = [...octahedrons, ...tetrahedronsZ, ...tetrahedronsC];
        for (const quadray of allShapes) {
            const cartesian = quadray.toCartesian();
            const key = `${Math.round(cartesian[0])},${Math.round(cartesian[1])}`;
            densityMap.set(key, (densityMap.get(key) || 0) + 1);
        }
        
        // Find max density for normalization
        const maxDensity = Math.max(...densityMap.values());
        
        // Draw heatmap
        for (const [key, density] of densityMap) {
            const [x, y] = key.split(',').map(Number);
            const normalizedDensity = density / maxDensity;
            
            // Convert to screen coordinates
            const screenX = (x + 10) * 20; // Scale and offset
            const screenY = (y + 10) * 20;
            
            // Color based on density
            const intensity = Math.floor(normalizedDensity * 255);
            const color = `rgba(255, 0, 0, ${normalizedDensity * 0.7})`;
            
            this.vizCtx.fillStyle = color;
            this.vizCtx.fillRect(screenX - 10, screenY - 10, 20, 20);
        }
        
        // Add legend
        this.drawLegend('Shape Density Heatmap', maxDensity);
    },

    /**
     * Draw coordinate grid
     */
    drawCoordinateGrid: function() {
        if (!this.vizCtx) return;
        
        this.clearCanvas();
        
        const gridDots = Object.values(gameState.QGridDots || {});
        const pathDots = Object.values(gameState.QDots || {});
        
        // Draw grid dots
        this.vizCtx.fillStyle = '#0066cc';
        for (const quadray of gridDots) {
            const cartesian = quadray.toCartesian();
            const screenX = (cartesian[0] + 10) * 20;
            const screenY = (cartesian[1] + 10) * 20;
            
            this.vizCtx.beginPath();
            this.vizCtx.arc(screenX, screenY, 3, 0, 2 * Math.PI);
            this.vizCtx.fill();
        }
        
        // Draw path dots
        this.vizCtx.fillStyle = '#00cc66';
        for (const quadray of pathDots) {
            const cartesian = quadray.toCartesian();
            const screenX = (cartesian[0] + 10) * 20;
            const screenY = (cartesian[1] + 10) * 20;
            
            this.vizCtx.beginPath();
            this.vizCtx.arc(screenX, screenY, 5, 0, 2 * Math.PI);
            this.vizCtx.fill();
        }
        
        // Draw selected quadray
        const selectedCartesian = gameState.selq.toCartesian();
        const selectedScreenX = (selectedCartesian[0] + 10) * 20;
        const selectedScreenY = (selectedCartesian[1] + 10) * 20;
        
        this.vizCtx.fillStyle = '#ff6600';
        this.vizCtx.beginPath();
        this.vizCtx.arc(selectedScreenX, selectedScreenY, 8, 0, 2 * Math.PI);
        this.vizCtx.fill();
        
        // Add legend
        this.drawLegend('Coordinate Grid', null, {
            'Grid Dots': '#0066cc',
            'Path Dots': '#00cc66',
            'Selected': '#ff6600'
        });
    },

    /**
     * Draw legend
     * @param {string} title - Legend title
     * @param {number} maxValue - Maximum value for scale
     * @param {Object} colorMap - Color mapping for discrete values
     */
    drawLegend: function(title, maxValue, colorMap) {
        if (!this.vizCtx) return;
        
        const legendX = 10;
        const legendY = 10;
        const legendWidth = 200;
        const legendHeight = colorMap ? 100 : 80;
        
        // Background
        this.vizCtx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.vizCtx.fillRect(legendX, legendY, legendWidth, legendHeight);
        
        // Title
        this.vizCtx.fillStyle = 'white';
        this.vizCtx.font = '14px Arial';
        this.vizCtx.fillText(title, legendX + 10, legendY + 20);
        
        if (colorMap) {
            // Discrete color legend
            let yOffset = 35;
            for (const [label, color] of Object.entries(colorMap)) {
                this.vizCtx.fillStyle = color;
                this.vizCtx.fillRect(legendX + 10, legendY + yOffset, 15, 15);
                this.vizCtx.fillStyle = 'white';
                this.vizCtx.font = '12px Arial';
                this.vizCtx.fillText(label, legendX + 30, legendY + yOffset + 12);
                yOffset += 20;
            }
        } else if (maxValue) {
            // Continuous scale legend
            this.vizCtx.fillStyle = 'white';
            this.vizCtx.font = '12px Arial';
            this.vizCtx.fillText(`Max: ${maxValue}`, legendX + 10, legendY + 35);
            
            // Draw gradient
            const gradient = this.vizCtx.createLinearGradient(legendX + 10, legendY + 50, legendX + 150, legendY + 50);
            gradient.addColorStop(0, 'rgba(255, 0, 0, 0)');
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0.7)');
            
            this.vizCtx.fillStyle = gradient;
            this.vizCtx.fillRect(legendX + 10, legendY + 50, 140, 20);
        }
    },

    /**
     * Clear visualization canvas
     */
    clearCanvas: function() {
        if (!this.vizCtx || !this.vizCanvas) return;
        
        this.vizCtx.clearRect(0, 0, this.vizCanvas.width, this.vizCanvas.height);
    },

    /**
     * Update visualization (called from main loop)
     */
    update: function() {
        if (this.heatmapEnabled) {
            this.drawHeatmap();
        } else if (this.gridEnabled) {
            this.drawCoordinateGrid();
        }
    }
}; 