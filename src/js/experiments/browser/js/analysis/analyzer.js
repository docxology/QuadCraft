/**
 * Coordinate Analyzer
 * Provides analysis tools for quadray coordinates and game state
 */

const analyzer = {
    /**
     * Show coordinate statistics
     */
    showCoordinateStats: function() {
        const stats = this.calculateStats();
        this.displayAnalysis('Coordinate Statistics', stats);
    },

    /**
     * Plot trajectory of player movement
     */
    plotTrajectory: function() {
        const trajectory = this.calculateTrajectory();
        this.displayAnalysis('Player Trajectory', trajectory);
    },

    /**
     * Analyze shape distribution
     */
    analyzeShapeDistribution: function() {
        const distribution = this.calculateShapeDistribution();
        this.displayAnalysis('Shape Distribution', distribution);
    },

    /**
     * Calculate coordinate statistics
     * @returns {Object} Statistics object
     */
    calculateStats: function() {
        const pathDots = Object.values(gameState.QDots || {});
        const gridDots = Object.values(gameState.QGridDots || {});
        const triangles = Object.values(gameState.gameTris || {});

        const stats = {
            totalPathDots: pathDots.length,
            totalGridDots: gridDots.length,
            totalTriangles: triangles.length,
            octahedrons: gameState.grid.oct.size,
            tetrahedronsZ: gameState.grid.tetZ.size,
            tetrahedronsC: gameState.grid.tetC.size,
            selectedQuadray: gameState.selq.toString(),
            cameraPosition: gameState.camera || {}
        };

        // Calculate coordinate ranges
        if (pathDots.length > 0) {
            const coords = pathDots.map(q => q.toCartesian());
            stats.coordinateRanges = {
                x: { min: Math.min(...coords.map(c => c[0])), max: Math.max(...coords.map(c => c[0])) },
                y: { min: Math.min(...coords.map(c => c[1])), max: Math.max(...coords.map(c => c[1])) },
                z: { min: Math.min(...coords.map(c => c[2])), max: Math.max(...coords.map(c => c[2])) }
            };
        }

        return stats;
    },

    /**
     * Calculate player trajectory
     * @returns {Object} Trajectory data
     */
    calculateTrajectory: function() {
        const pathDots = Object.values(gameState.QDots || {});
        const trajectory = {
            totalPoints: pathDots.length,
            points: pathDots.map((q, index) => ({
                index: index,
                quadray: q.toString(),
                cartesian: q.toCartesian(),
                timestamp: Date.now() - (pathDots.length - index) * 100 // Simulated timestamps
            }))
        };

        // Calculate trajectory metrics
        if (pathDots.length > 1) {
            let totalDistance = 0;
            for (let i = 1; i < pathDots.length; i++) {
                totalDistance += pathDots[i].distance(pathDots[i - 1]);
            }
            trajectory.totalDistance = totalDistance;
            trajectory.averageStepSize = totalDistance / (pathDots.length - 1);
        }

        return trajectory;
    },

    /**
     * Calculate shape distribution
     * @returns {Object} Distribution data
     */
    calculateShapeDistribution: function() {
        const octahedrons = Array.from(gameState.grid.oct);
        const tetrahedronsZ = Array.from(gameState.grid.tetZ);
        const tetrahedronsC = Array.from(gameState.grid.tetC);

        const distribution = {
            octahedrons: {
                count: octahedrons.length,
                coordinates: octahedrons.map(q => ({
                    quadray: q.toString(),
                    cartesian: q.toCartesian()
                }))
            },
            tetrahedronsZ: {
                count: tetrahedronsZ.length,
                coordinates: tetrahedronsZ.map(q => ({
                    quadray: q.toString(),
                    cartesian: q.toCartesian()
                }))
            },
            tetrahedronsC: {
                count: tetrahedronsC.length,
                coordinates: tetrahedronsC.map(q => ({
                    quadray: q.toString(),
                    cartesian: q.toCartesian()
                }))
            },
            totalShapes: octahedrons.length + tetrahedronsZ.length + tetrahedronsC.length
        };

        // Calculate spatial distribution
        const allShapes = [...octahedrons, ...tetrahedronsZ, ...tetrahedronsC];
        if (allShapes.length > 0) {
            const coords = allShapes.map(q => q.toCartesian());
            distribution.spatialBounds = {
                x: { min: Math.min(...coords.map(c => c[0])), max: Math.max(...coords.map(c => c[0])) },
                y: { min: Math.min(...coords.map(c => c[1])), max: Math.max(...coords.map(c => c[1])) },
                z: { min: Math.min(...coords.map(c => c[2])), max: Math.max(...coords.map(c => c[2])) }
            };
        }

        return distribution;
    },

    /**
     * Display analysis results
     * @param {string} title - Analysis title
     * @param {Object} data - Analysis data
     */
    displayAnalysis: function(title, data) {
        const displayEl = document.getElementById('analysisDisplay');
        if (!displayEl) return;

        let html = `<h4>${title}</h4>`;
        html += '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
        
        displayEl.innerHTML = html;
        displayEl.style.display = 'block';
    },

    /**
     * Export analysis data
     * @param {string} analysisType - Type of analysis to export
     */
    exportAnalysis: function(analysisType) {
        let data;
        let filename;

        switch (analysisType) {
            case 'stats':
                data = this.calculateStats();
                filename = 'quadcraft_stats.json';
                break;
            case 'trajectory':
                data = this.calculateTrajectory();
                filename = 'quadcraft_trajectory.json';
                break;
            case 'distribution':
                data = this.calculateShapeDistribution();
                filename = 'quadcraft_distribution.json';
                break;
            default:
                console.error('Unknown analysis type:', analysisType);
                return;
        }

        const json = JSON.stringify(data, null, 2);
        saveLoadController.downloadFile(filename, 'application/json', json);
    },

    /**
     * Clear analysis display
     */
    clearAnalysis: function() {
        const displayEl = document.getElementById('analysisDisplay');
        if (displayEl) {
            displayEl.innerHTML = '';
            displayEl.style.display = 'none';
        }
    }
}; 