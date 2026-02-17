/**
 * Pheromone Visualizer for 4D SimAnt
 * Renders food and home pheromone trails as translucent circles.
 * Food pheromones: green circles
 * Home pheromones: blue circles
 * Intensity maps to alpha: alpha = min(0.6, pheromone / maxPheromone)
 */

class PheromoneVisualizer {
    constructor() {
        this.enabled = false;
        this.minThreshold = 1.0; // Minimum pheromone to render
    }

    render(ctx, board, projectionFn) {
        if (!this.enabled) return;

        // Find max pheromone values for normalization
        let maxFood = 1;
        let maxHome = 1;
        for (let i = 0; i < board.volume; i++) {
            const foodVal = board.pheromones[i * 4 + 0] + board.pheromones[i * 4 + 2]; // Yellow + Red food
            const homeVal = board.pheromones[i * 4 + 1] + board.pheromones[i * 4 + 3]; // Yellow + Red home
            if (foodVal > maxFood) maxFood = foodVal;
            if (homeVal > maxHome) maxHome = homeVal;
        }

        // Collect pheromone cells to render
        const pheroList = [];
        for (let i = 0; i < board.volume; i++) {
            const foodVal = board.pheromones[i * 4 + 0] + board.pheromones[i * 4 + 2];
            const homeVal = board.pheromones[i * 4 + 1] + board.pheromones[i * 4 + 3];

            if (foodVal < this.minThreshold && homeVal < this.minThreshold) continue;
            if (board.grid[i] !== TYPE_EMPTY) continue; // Only render in tunnels

            const c = board.coords(i);
            const p = projectionFn(c.x, c.y, c.z, c.w);
            if (p.scale < 0) continue; // Behind camera

            pheroList.push({ p, foodVal, homeVal });
        }

        // Sort by z (back to front)
        pheroList.sort((a, b) => b.p.z - a.p.z);

        // Draw pheromone circles
        for (const item of pheroList) {
            const x = item.p.x;
            const y = item.p.y;
            const radius = 4 * item.p.scale;

            // Food pheromone: green
            if (item.foodVal >= this.minThreshold) {
                const alpha = Math.min(0.6, item.foodVal / maxFood);
                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#44ff44';
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            }

            // Home pheromone: blue
            if (item.homeVal >= this.minThreshold) {
                const alpha = Math.min(0.6, item.homeVal / maxHome);
                ctx.globalAlpha = alpha;
                ctx.fillStyle = '#4488ff';
                ctx.beginPath();
                ctx.arc(x, y + radius * 0.5, radius * 0.8, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        ctx.globalAlpha = 1.0;
    }
}
