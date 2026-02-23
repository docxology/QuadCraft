/**
 * Pheromone Visualizer for 4D SimAnt — Enhanced
 *
 * Renders food, home, and danger pheromone trails as translucent circles
 * with gradient color mapping and glow effects.
 *
 * Channels:
 *   Food pheromones:   green→yellow gradient (intensity-based)
 *   Home pheromones:   blue→purple gradient
 *   Danger pheromones: red→orange glow
 *
 * Intensity maps to alpha and size for depth perception.
 *
 * @module PheromoneVisualizer
 */

// Import pheromone channel constants if available
if (typeof PHERO_CHANNELS === 'undefined') {
    var PHERO_CHANNELS = 6;
    var PHERO_YELLOW_FOOD = 0;
    var PHERO_YELLOW_HOME = 1;
    var PHERO_RED_FOOD = 2;
    var PHERO_RED_HOME = 3;
    var PHERO_YELLOW_DANGER = 4;
    var PHERO_RED_DANGER = 5;
}

class PheromoneVisualizer {
    constructor() {
        this.enabled = false;
        this.minThreshold = 1.0; // Minimum pheromone to render
        this.showFood = true;
        this.showHome = true;
        this.showDanger = true;
    }

    render(ctx, board, projectionFn) {
        if (!this.enabled) return;

        // Find max pheromone values for normalization
        let maxFood = 1;
        let maxHome = 1;
        let maxDanger = 1;
        for (let i = 0; i < board.volume; i++) {
            const foodVal = board.pheromones[i * PHERO_CHANNELS + PHERO_YELLOW_FOOD]
                + board.pheromones[i * PHERO_CHANNELS + PHERO_RED_FOOD];
            const homeVal = board.pheromones[i * PHERO_CHANNELS + PHERO_YELLOW_HOME]
                + board.pheromones[i * PHERO_CHANNELS + PHERO_RED_HOME];
            const dangerVal = board.pheromones[i * PHERO_CHANNELS + PHERO_YELLOW_DANGER]
                + board.pheromones[i * PHERO_CHANNELS + PHERO_RED_DANGER];
            if (foodVal > maxFood) maxFood = foodVal;
            if (homeVal > maxHome) maxHome = homeVal;
            if (dangerVal > maxDanger) maxDanger = dangerVal;
        }

        // Collect pheromone cells to render
        const pheroList = [];
        for (let i = 0; i < board.volume; i++) {
            const foodVal = board.pheromones[i * PHERO_CHANNELS + PHERO_YELLOW_FOOD]
                + board.pheromones[i * PHERO_CHANNELS + PHERO_RED_FOOD];
            const homeVal = board.pheromones[i * PHERO_CHANNELS + PHERO_YELLOW_HOME]
                + board.pheromones[i * PHERO_CHANNELS + PHERO_RED_HOME];
            const dangerVal = board.pheromones[i * PHERO_CHANNELS + PHERO_YELLOW_DANGER]
                + board.pheromones[i * PHERO_CHANNELS + PHERO_RED_DANGER];

            if (foodVal < this.minThreshold && homeVal < this.minThreshold && dangerVal < this.minThreshold) continue;
            if (board.grid[i] !== TYPE_EMPTY) continue; // Only render in tunnels

            const c = board.coords(i);
            const p = projectionFn(c.a, c.b, c.c, c.d);
            if (p.scale < 0) continue; // Behind camera

            pheroList.push({ p, foodVal, homeVal, dangerVal });
        }

        // Sort by z (back to front)
        pheroList.sort((a, b) => b.p.z - a.p.z);

        // Draw pheromone circles
        for (const item of pheroList) {
            const x = item.p.x;
            const y = item.p.y;
            const radius = 4 * item.p.scale;

            // Food pheromone: green→yellow gradient
            if (this.showFood && item.foodVal >= this.minThreshold) {
                const intensity = item.foodVal / maxFood;
                const alpha = Math.min(0.7, intensity * 0.7);
                ctx.globalAlpha = alpha;

                // Gradient from green to yellow based on intensity
                const r = Math.floor(68 + intensity * 187); // 44 → FF
                const g = Math.floor(255);
                const b = Math.floor(68 - intensity * 34);  // 44 → 22
                ctx.fillStyle = `rgb(${r},${g},${b})`;

                ctx.beginPath();
                ctx.arc(x, y, radius * (0.8 + intensity * 0.4), 0, Math.PI * 2);
                ctx.fill();

                // Glow for strong trails
                if (intensity > 0.5) {
                    ctx.globalAlpha = intensity * 0.15;
                    ctx.beginPath();
                    ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            // Home pheromone: blue→purple gradient
            if (this.showHome && item.homeVal >= this.minThreshold) {
                const intensity = item.homeVal / maxHome;
                const alpha = Math.min(0.6, intensity * 0.6);
                ctx.globalAlpha = alpha;

                // Gradient from blue to purple based on intensity
                const r = Math.floor(68 + intensity * 120);  // 44 → BC
                const g = Math.floor(136 - intensity * 68);   // 88 → 44
                const b2 = 255;
                ctx.fillStyle = `rgb(${r},${g},${b2})`;

                ctx.beginPath();
                ctx.arc(x, y + radius * 0.5, radius * (0.6 + intensity * 0.3), 0, Math.PI * 2);
                ctx.fill();
            }

            // Danger pheromone: red→orange glow
            if (this.showDanger && item.dangerVal >= this.minThreshold) {
                const intensity = item.dangerVal / maxDanger;
                const alpha = Math.min(0.5, intensity * 0.5);
                ctx.globalAlpha = alpha;

                // Red-orange gradient
                const r = 255;
                const g = Math.floor(50 + intensity * 100);  // 32 → 96
                const b3 = Math.floor(30);
                ctx.fillStyle = `rgb(${r},${g},${b3})`;

                ctx.beginPath();
                ctx.arc(x, y - radius * 0.3, radius * (0.5 + intensity * 0.8), 0, Math.PI * 2);
                ctx.fill();

                // Danger glow ring
                if (intensity > 0.3) {
                    ctx.globalAlpha = intensity * 0.12;
                    ctx.strokeStyle = `rgb(${r},${g},${b3})`;
                    ctx.lineWidth = 1.5;
                    ctx.beginPath();
                    ctx.arc(x, y, radius * 2.5, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }

        ctx.globalAlpha = 1.0;
    }
}
