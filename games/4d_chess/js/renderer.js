/**
 * renderer.js — 4D Quadray Chess Canvas Renderer
 *
 * Extends BaseRenderer to project Quadray positions to 2D,
 * draw the IVM grid structure, pieces with glowing effects,
 * valid move indicators, and HUD overlays.
 *
 * Uses all BaseRenderer methods:
 *   _project(), _drawAxes(), _clearCanvas(), _drawHUD(),
 *   _drawCircle(), _drawDiamond()
 * Plus: GridUtils.depthSort(), Quadray.cellType(), Quadray.toString()
 *
 * @module ChessRenderer
 */

class Renderer extends BaseRenderer {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {Board} board
     */
    constructor(canvas, board) {
        super(canvas, board, {
            scale: 50,
            cameraDist: 500,
            rotX: 0.4,
            rotY: 0.3,
            bgColor: '#0a0a1a',
        });

        // Animation state
        this.time = 0;
        this.selectedPiece = null;
        this.validMoves = [];
        this.hoveredPosition = null;

        // Visual settings
        this.gridOpacity = 0.3;
        this.pieceScale = 24;

        // Current player (synced from game controller)
        this.currentPlayer = PlayerColor.WHITE;

        // Colors
        this.colors = {
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

        console.log('[Renderer] Initialized with BaseRenderer + full quadray methods');
    }

    /**
     * Project a Quadray position to 2D screen coordinates.
     * Uses BaseRenderer._project() for consistent projection.
     * @param {Quadray} q
     * @returns {{x: number, y: number, z: number}}
     */
    _projectQ(q) {
        const p = this._project(q.a, q.b, q.c, q.d);
        // Also compute z-depth for sorting (using Cartesian conversion)
        const cart = q.toCartesian();
        const cosX = Math.cos(this.rotX);
        const sinX = Math.sin(this.rotX);
        const cosY = Math.cos(this.rotY);
        const sinY = Math.sin(this.rotY);
        const z = cart.x * sinY + cart.z * cosY;
        const z2 = cart.y * sinX + z * cosX;
        return { x: p.x, y: p.y, z: z2, scale: p.scale };
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
            const p1 = this._projectQ(pos);

            // Connect to neighbors in each basis direction
            for (const basis of Quadray.BASIS) {
                const neighbor = pos.add(basis);
                if (this.board.isValidPosition(neighbor)) {
                    const p2 = this._projectQ(neighbor);

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
            const p = this._projectQ(pos);
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
            const p = this._projectQ(move);
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
     * Draw chess pieces with depth sorting.
     */
    drawPieces() {
        // Sort pieces by z-depth for proper rendering
        const piecesWithDepth = [];
        for (const piece of this.board.pieces.values()) {
            const p = this._projectQ(piece.position);
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
        this.ctx.fillText('QUADRAY MATH', panelX + 15, panelY + 25);

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
            this.ctx.fillText('-> Cartesian:', panelX + 15, panelY + 100);
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
            this.ctx.fillText('D = sqrt((a^2+b^2+c^2+d^2)/2)', panelX + 15, panelY + 170);
        } else {
            this.ctx.fillStyle = '#666';
            this.ctx.font = '12px "Segoe UI"';
            this.ctx.fillText('Select a piece to see coordinates', panelX + 15, panelY + 50);
        }
    }

    /**
     * Draw board HUD overlay using BaseRenderer._drawHUD().
     */
    _drawBoardHUD(currentPlayer, isCheck) {
        const meta = this.board.getMetadata();
        const lines = [
            `Tetra: ${meta.tetraCount} | Octa: ${meta.octaCount} | Vol T:O:C=${meta.volumeRatios.tetra}:${meta.volumeRatios.octa}:${meta.volumeRatios.cubo}`,
            `W: ${meta.whitePieces} pcs | B: ${meta.blackPieces} pcs | Captured W:${meta.capturedWhite} B:${meta.capturedBlack}`,
        ];
        this._drawHUD(lines, { color: 'rgba(148, 163, 184, 0.7)', fontSize: 11 });
    }

    /**
     * Main render loop — uses BaseRenderer infrastructure.
     * Called by BaseGame's game loop (no arguments).
     * Uses this.currentPlayer (synced by game controller).
     */
    render() {
        this.time = performance.now() / 1000;

        // Clear using BaseRenderer
        this._clearCanvas();

        // Draw axes using BaseRenderer
        this._drawAxes();

        // Draw layers
        this.drawGrid();
        this.drawValidMoves();
        this.drawPieces();
        this._drawBoardHUD(this.currentPlayer, this.board.isInCheck(this.currentPlayer));
        this.drawMathPanel();
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
            const p = this._projectQ(pos);
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
            const p = this._projectQ(piece.position);
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Renderer };
}
