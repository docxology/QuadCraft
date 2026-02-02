/**
 * Renderer.js - 3D Visualization for 4D Quadray Chess
 * 
 * Projects the 4D Quadray space into 3D for display on HTML5 Canvas.
 * Uses stunning visual effects: glowing pieces, animated grid, smooth transitions.
 */

class Renderer {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {Board} board
     */
    constructor(canvas, board) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.board = board;

        // Camera/view settings
        this.cameraAngleX = 0.4;
        this.cameraAngleY = 0.3;
        this.cameraDistance = 500;
        this.centerX = canvas.width / 2;
        this.centerY = canvas.height / 2;

        // Animation state
        this.time = 0;
        this.selectedPiece = null;
        this.validMoves = [];
        this.hoveredPosition = null;

        // Visual settings
        this.gridOpacity = 0.3;
        this.pieceScale = 24;

        // Colors
        this.colors = {
            background: '#0a0a1a',
            gridLine: '#334466',
            gridNode: '#446688',
            validMove: '#44ff88',
            selectedPiece: '#ffdd44',
            whitePiece: '#ffeedd',
            blackPiece: '#332244',
            whiteGlow: '#ffcc66',
            blackGlow: '#9966ff',
            axisA: '#ff6666',
            axisB: '#66ff66',
            axisC: '#6666ff',
            axisD: '#ffff66'
        };
    }

    /**
     * Convert Quadray position to 2D screen coordinates.
     * @param {Quadray} q
     * @returns {{x: number, y: number, z: number}}
     */
    project(q) {
        // First convert to Cartesian 3D
        const cart = q.toCartesian();

        // Apply rotation
        const cosX = Math.cos(this.cameraAngleX);
        const sinX = Math.sin(this.cameraAngleX);
        const cosY = Math.cos(this.cameraAngleY);
        const sinY = Math.sin(this.cameraAngleY);

        // Rotate around Y axis
        let x = cart.x * cosY - cart.z * sinY;
        let z = cart.x * sinY + cart.z * cosY;
        let y = cart.y;

        // Rotate around X axis
        const y2 = y * cosX - z * sinX;
        const z2 = y * sinX + z * cosX;

        // Zoom factor: smaller cameraDistance = more zoom (larger visual scale)
        // Base zoom at cameraDistance 500 = 1.0, zooming in (200) = 2.5x, zooming out (1000) = 0.5x
        const zoomFactor = 500 / this.cameraDistance;

        // Scale with perspective and zoom
        const perspectiveScale = this.cameraDistance / (this.cameraDistance + z2);
        const baseScale = 50;
        const screenX = this.centerX + x * perspectiveScale * baseScale * zoomFactor;
        const screenY = this.centerY - y2 * perspectiveScale * baseScale * zoomFactor;

        return { x: screenX, y: screenY, z: z2 };
    }

    /**
     * Render a glowing circle.
     */
    drawGlow(x, y, radius, color, intensity = 1) {
        const gradient = this.ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.3, color + '88');
        gradient.addColorStop(1, color + '00');

        this.ctx.globalAlpha = intensity * 0.5;
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
    }

    /**
     * Draw the IVM grid structure.
     */
    drawGrid() {
        const positions = this.board.getAllPositions();

        // Draw edges (connections between adjacent positions)
        this.ctx.strokeStyle = this.colors.gridLine;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = this.gridOpacity;

        for (const pos of positions) {
            const p1 = this.project(pos);

            // Connect to neighbors in each basis direction
            for (const basis of Quadray.BASIS) {
                const neighbor = pos.add(basis);
                if (this.board.isValidPosition(neighbor)) {
                    const p2 = this.project(neighbor);

                    this.ctx.beginPath();
                    this.ctx.moveTo(p1.x, p1.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }
        }

        this.ctx.globalAlpha = 1;

        // Draw nodes
        for (const pos of positions) {
            const p = this.project(pos);
            const pulse = 0.7 + 0.3 * Math.sin(this.time * 2 + pos.a + pos.b);

            this.ctx.fillStyle = this.colors.gridNode;
            this.ctx.globalAlpha = 0.5 * pulse;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        }
    }

    /**
     * Draw valid move indicators with numbered labels.
     */
    drawValidMoves() {
        let moveNum = 1;
        for (const move of this.validMoves) {
            const p = this.project(move);
            const pulse = 0.6 + 0.4 * Math.sin(this.time * 4);

            // Glow effect
            this.drawGlow(p.x, p.y, 15, this.colors.validMove, pulse);

            // Ring
            this.ctx.strokeStyle = this.colors.validMove;
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = pulse;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;

            // Number label (1-9)
            if (moveNum <= 9) {
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(moveNum.toString(), p.x, p.y);
                moveNum++;
            }
        }
    }

    /**
     * Draw chess pieces.
     */
    drawPieces() {
        // Sort pieces by z-depth for proper rendering
        const piecesWithDepth = [];
        for (const piece of this.board.pieces.values()) {
            const p = this.project(piece.position);
            piecesWithDepth.push({ piece, screenPos: p });
        }
        piecesWithDepth.sort((a, b) => b.screenPos.z - a.screenPos.z);

        for (const { piece, screenPos } of piecesWithDepth) {
            const isSelected = this.selectedPiece && piece.position.equals(this.selectedPiece.position);

            // Glow
            const glowColor = piece.color === PlayerColor.WHITE ? this.colors.whiteGlow : this.colors.blackGlow;
            const glowIntensity = isSelected ? 1.5 : 0.8;
            this.drawGlow(screenPos.x, screenPos.y, this.pieceScale, glowColor, glowIntensity);

            // Piece body
            const bodyColor = piece.color === PlayerColor.WHITE ? this.colors.whitePiece : this.colors.blackPiece;
            this.ctx.fillStyle = bodyColor;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, this.pieceScale * 0.8, 0, Math.PI * 2);
            this.ctx.fill();

            // Selection ring
            if (isSelected) {
                this.ctx.strokeStyle = this.colors.selectedPiece;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(screenPos.x, screenPos.y, this.pieceScale, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            // Piece symbol
            this.ctx.fillStyle = piece.color === PlayerColor.WHITE ? '#222' : '#fff';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(piece.getSymbol(), screenPos.x, screenPos.y);
        }
    }

    /**
     * Draw coordinate axes legend.
     */
    drawAxes() {
        const origin = this.project(Quadray.ORIGIN);
        const axisLength = 0.5;

        const axes = [
            { dir: Quadray.A, color: this.colors.axisA, label: 'a' },
            { dir: Quadray.B, color: this.colors.axisB, label: 'b' },
            { dir: Quadray.C, color: this.colors.axisC, label: 'c' },
            { dir: Quadray.D, color: this.colors.axisD, label: 'd' }
        ];

        this.ctx.lineWidth = 2;

        for (const axis of axes) {
            const end = this.project(axis.dir.scale(axisLength));

            // Draw axis line
            this.ctx.strokeStyle = axis.color;
            this.ctx.beginPath();
            this.ctx.moveTo(origin.x, origin.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();

            // Draw label
            this.ctx.fillStyle = axis.color;
            this.ctx.font = 'bold 14px monospace';
            this.ctx.fillText(axis.label, end.x + 5, end.y);
        }
    }

    /**
     * Draw HUD elements.
     */
    drawHUD(currentPlayer, isCheck) {
        // Turn indicator
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 18px "Segoe UI", Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`${currentPlayer.toUpperCase()}'s Turn`, 20, 30);

        if (isCheck) {
            this.ctx.fillStyle = '#ff4444';
            this.ctx.fillText('CHECK!', 20, 55);
        }

        // Instructions
        this.ctx.fillStyle = '#888';
        this.ctx.font = '14px "Segoe UI", Arial';
        this.ctx.fillText('Drag to rotate | Click piece to select', 20, this.canvas.height - 20);

        // Quadray legend
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = '#666';
        this.ctx.fillText('4D Quadray Chess', this.canvas.width - 20, 30);
        this.ctx.fillText('IVM Tetrahedral Grid', this.canvas.width - 20, 50);

        // Draw math panel on canvas
        this.drawMathPanel();
    }

    /**
     * Draw real-time math panel showing Quadray coordinates and calculations.
     */
    drawMathPanel() {
        const panelX = 20;
        const panelY = 70;
        const panelWidth = 280;
        const panelHeight = this.selectedPiece ? 180 : 60;

        // Panel background with glassmorphism effect
        this.ctx.fillStyle = 'rgba(20, 20, 40, 0.85)';
        this.ctx.strokeStyle = 'rgba(100, 150, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 10);
        this.ctx.fill();
        this.ctx.stroke();

        // Panel title
        this.ctx.fillStyle = '#9966ff';
        this.ctx.font = 'bold 14px "Segoe UI", monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('📐 QUADRAY MATH', panelX + 15, panelY + 25);

        if (this.selectedPiece) {
            const pos = this.selectedPiece.position;
            const norm = pos.normalized();
            const cart = pos.toCartesian();

            // Selected piece info
            this.ctx.fillStyle = '#aaa';
            this.ctx.font = '12px monospace';
            this.ctx.fillText(`Selected: ${this.selectedPiece.color} ${this.selectedPiece.type}`, panelX + 15, panelY + 50);

            // Quadray coordinates with color coding
            this.ctx.fillStyle = '#ff6666';
            this.ctx.fillText(`a = ${norm.a.toFixed(2)}`, panelX + 15, panelY + 75);
            this.ctx.fillStyle = '#66ff66';
            this.ctx.fillText(`b = ${norm.b.toFixed(2)}`, panelX + 80, panelY + 75);
            this.ctx.fillStyle = '#6666ff';
            this.ctx.fillText(`c = ${norm.c.toFixed(2)}`, panelX + 145, panelY + 75);
            this.ctx.fillStyle = '#ffff66';
            this.ctx.fillText(`d = ${norm.d.toFixed(2)}`, panelX + 210, panelY + 75);

            // Cartesian conversion
            this.ctx.fillStyle = '#888';
            this.ctx.fillText('→ Cartesian:', panelX + 15, panelY + 100);
            this.ctx.fillStyle = '#66ddff';
            this.ctx.fillText(`(${cart.x.toFixed(2)}, ${cart.y.toFixed(2)}, ${cart.z.toFixed(2)})`, panelX + 100, panelY + 100);

            // Distance from origin
            const dist = pos.length();
            this.ctx.fillStyle = '#888';
            this.ctx.fillText('Distance from origin:', panelX + 15, panelY + 125);
            this.ctx.fillStyle = '#ffaa44';
            this.ctx.fillText(`${dist.toFixed(3)} units`, panelX + 160, panelY + 125);

            // Valid moves count
            this.ctx.fillStyle = '#888';
            this.ctx.fillText('Valid moves:', panelX + 15, panelY + 150);
            this.ctx.fillStyle = '#44ff88';
            this.ctx.fillText(`${this.validMoves.length} positions`, panelX + 100, panelY + 150);

            // Formula hint
            this.ctx.fillStyle = '#555';
            this.ctx.font = '10px monospace';
            this.ctx.fillText('D = √((a²+b²+c²+d²)/2)', panelX + 15, panelY + 170);
        } else {
            this.ctx.fillStyle = '#666';
            this.ctx.font = '12px "Segoe UI"';
            this.ctx.fillText('Select a piece to see coordinates', panelX + 15, panelY + 50);
        }
    }

    /**
     * Main render loop.
     */
    render(currentPlayer) {
        this.time = performance.now() / 1000;

        // Clear
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw layers
        this.drawGrid();
        this.drawAxes();
        this.drawValidMoves();
        this.drawPieces();
        this.drawHUD(currentPlayer, this.board.isInCheck(currentPlayer));
    }

    /**
     * Find the closest board position to a screen point.
     * @param {number} screenX
     * @param {number} screenY
     * @returns {Quadray|null}
     */
    getPositionAtScreen(screenX, screenY) {
        let closest = null;
        let closestDist = 30; // Minimum click distance

        for (const pos of this.board.getAllPositions()) {
            const p = this.project(pos);
            const dx = p.x - screenX;
            const dy = p.y - screenY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < closestDist) {
                closestDist = dist;
                closest = pos;
            }
        }

        // Also check piece positions (they may not be on all grid nodes)
        for (const piece of this.board.pieces.values()) {
            const p = this.project(piece.position);
            const dx = p.x - screenX;
            const dy = p.y - screenY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < closestDist) {
                closestDist = dist;
                closest = piece.position;
            }
        }

        return closest;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Renderer };
}
