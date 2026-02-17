/**
 * FPVRenderer.js - First-Person View Renderer for 4D Quadray Chess
 * 
 * Renders the board from the selected piece's perspective.
 * Shows the 4D Quadray space as seen from a piece's position.
 * @version 1.0.0
 */

class FPVRenderer {
    /**
     * @param {HTMLCanvasElement} canvas - The FPV canvas element
     * @param {Board} board - The game board
     */
    constructor(canvas, board) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.board = board;

        // Current piece being viewed from
        this.piece = null;

        // Valid moves for the current piece
        this.validMoves = [];

        // Camera settings for FPV
        this.viewAngleX = 0;
        this.viewAngleY = 0;
        this.viewDistance = 150;

        // Mouse drag state for 360° rotation
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        // Visual settings
        this.colors = {
            background: '#050510',
            gridLine: '#223344',
            gridNode: '#335566',
            crosshair: '#ffffff44',
            validMove: '#44ff88',
            enemyPiece: '#ff4466',
            friendlyPiece: '#44ff44',
            selectedGlow: '#ffdd44',
            axisA: '#ff6666',
            axisB: '#66ff66',
            axisC: '#6666ff',
            axisD: '#ffff66'
        };

        // Animation state
        this.time = 0;

        // Set up mouse interaction
        this.setupEventListeners();
    }

    /**
     * Set up mouse event listeners for 360° rotation.
     */
    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });

        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging && this.piece) {
                const deltaX = e.clientX - this.lastMouseX;
                const deltaY = e.clientY - this.lastMouseY;

                // Rotate view based on mouse drag
                this.viewAngleY += deltaX * 0.01;
                this.viewAngleX += deltaY * 0.01;

                // Clamp vertical rotation to avoid flipping
                this.viewAngleX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.viewAngleX));

                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });

        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.canvas.style.cursor = this.piece ? 'grab' : 'default';
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'default';
        });

        this.canvas.addEventListener('mouseenter', () => {
            if (this.piece) {
                this.canvas.style.cursor = 'grab';
            }
        });

        // Touch support for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.isDragging = true;
            this.lastMouseX = touch.clientX;
            this.lastMouseY = touch.clientY;
        });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isDragging && this.piece) {
                const touch = e.touches[0];
                const deltaX = touch.clientX - this.lastMouseX;
                const deltaY = touch.clientY - this.lastMouseY;

                this.viewAngleY += deltaX * 0.01;
                this.viewAngleX += deltaY * 0.01;
                this.viewAngleX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.viewAngleX));

                this.lastMouseX = touch.clientX;
                this.lastMouseY = touch.clientY;
            }
        });

        this.canvas.addEventListener('touchend', () => {
            this.isDragging = false;
        });

        // Mouse wheel zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (this.piece) {
                const zoomSpeed = 0.1;
                const delta = e.deltaY > 0 ? 1 + zoomSpeed : 1 - zoomSpeed;
                this.viewDistance = Math.max(50, Math.min(500, this.viewDistance * delta));
            }
        }, { passive: false });
    }

    /**
     * Set the piece whose perspective we're viewing from.
     * @param {Piece|null} piece
     */
    setPiece(piece) {
        this.piece = piece;
        // Reset view angle when changing piece
        this.viewAngleX = 0;
        this.viewAngleY = 0;
        // Update cursor
        this.canvas.style.cursor = piece ? 'grab' : 'default';
    }

    /**
     * Set valid moves for highlighting in FPV.
     * @param {Quadray[]} moves
     */
    setValidMoves(moves) {
        this.validMoves = moves || [];
    }

    /**
     * Project a position relative to the piece's position.
     * @param {Quadray} targetPos - The position to project
     * @returns {{x: number, y: number, z: number, distance: number}}
     */
    projectFromPiece(targetPos) {
        if (!this.piece) {
            return { x: this.canvas.width / 2, y: this.canvas.height / 2, z: 0, distance: 0 };
        }

        // Get relative position (target - piece position)
        const relativeQuadray = targetPos.subtract(this.piece.position);
        const cart = relativeQuadray.toCartesian();

        // Calculate distance
        const distance = relativeQuadray.length();

        // Apply view rotation
        const cosX = Math.cos(this.viewAngleX);
        const sinX = Math.sin(this.viewAngleX);
        const cosY = Math.cos(this.viewAngleY);
        const sinY = Math.sin(this.viewAngleY);

        // Rotate around Y axis
        let x = cart.x * cosY - cart.z * sinY;
        let z = cart.x * sinY + cart.z * cosY;
        let y = cart.y;

        // Rotate around X axis
        const y2 = y * cosX - z * sinX;
        const z2 = y * sinX + z * cosX;

        // Perspective projection with zoom
        const fov = 200;
        const scale = fov / (fov + z2 + 2);
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;

        // Zoom factor: smaller viewDistance = more zoom
        const zoomFactor = 150 / this.viewDistance;

        const screenX = centerX + x * scale * 50 * zoomFactor;
        const screenY = centerY - y2 * scale * 50 * zoomFactor;

        return { x: screenX, y: screenY, z: z2, distance };
    }

    /**
     * Draw crosshair at center (piece's position).
     */
    drawCrosshair() {
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        const size = 15;

        this.ctx.strokeStyle = this.colors.crosshair;
        this.ctx.lineWidth = 1;

        // Horizontal line
        this.ctx.beginPath();
        this.ctx.moveTo(cx - size, cy);
        this.ctx.lineTo(cx + size, cy);
        this.ctx.stroke();

        // Vertical line
        this.ctx.beginPath();
        this.ctx.moveTo(cx, cy - size);
        this.ctx.lineTo(cx, cy + size);
        this.ctx.stroke();

        // Center dot
        this.ctx.fillStyle = '#ffffff88';
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, 3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Draw directional indicators toward valid moves.
     */
    drawMoveDirections() {
        if (!this.piece || this.validMoves.length === 0) return;

        const pulse = 0.6 + 0.4 * Math.sin(this.time * 4);

        for (const move of this.validMoves) {
            const p = this.projectFromPiece(move);

            // Only draw if in front of camera (z > -1)
            if (p.z > -1) {
                // Draw glowing indicator
                const gradient = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 20);
                gradient.addColorStop(0, this.colors.validMove);
                gradient.addColorStop(0.5, this.colors.validMove + '66');
                gradient.addColorStop(1, this.colors.validMove + '00');

                this.ctx.globalAlpha = pulse * 0.8;
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
                this.ctx.fill();

                // Draw circle
                this.ctx.strokeStyle = this.colors.validMove;
                this.ctx.lineWidth = 2;
                this.ctx.globalAlpha = pulse;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 10, 0, Math.PI * 2);
                this.ctx.stroke();

                // Draw distance label
                this.ctx.globalAlpha = 0.8;
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '10px monospace';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`Δ${p.distance.toFixed(1)}`, p.x, p.y + 22);
            }
        }

        this.ctx.globalAlpha = 1;
    }

    /**
     * Draw nearby pieces as seen from the current piece's perspective.
     */
    drawVisiblePieces() {
        if (!this.piece) return;

        const piecesWithDepth = [];

        for (const otherPiece of this.board.pieces.values()) {
            // Skip the piece we're viewing from
            if (otherPiece.position.equals(this.piece.position)) continue;

            const p = this.projectFromPiece(otherPiece.position);
            if (p.z > -2) { // Only render pieces reasonably in front
                piecesWithDepth.push({ piece: otherPiece, screenPos: p });
            }
        }

        // Sort by depth (back to front)
        piecesWithDepth.sort((a, b) => b.screenPos.z - a.screenPos.z);

        for (const { piece, screenPos } of piecesWithDepth) {
            const isEnemy = piece.color !== this.piece.color;
            const glowColor = isEnemy ? this.colors.enemyPiece : this.colors.friendlyPiece;

            // Size based on distance (closer = larger)
            const baseSize = 15;
            const distanceFactor = Math.max(0.3, 1 - screenPos.distance / 8);
            const size = baseSize * distanceFactor;

            // Draw glow
            const gradient = this.ctx.createRadialGradient(
                screenPos.x, screenPos.y, 0,
                screenPos.x, screenPos.y, size * 2
            );
            gradient.addColorStop(0, glowColor);
            gradient.addColorStop(0.4, glowColor + '66');
            gradient.addColorStop(1, glowColor + '00');

            this.ctx.globalAlpha = 0.6;
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, size * 2, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw piece body
            this.ctx.globalAlpha = 0.9;
            const bodyColor = piece.color === PlayerColor.WHITE ? '#ffeedd' : '#332244';
            this.ctx.fillStyle = bodyColor;
            this.ctx.beginPath();
            this.ctx.arc(screenPos.x, screenPos.y, size * 0.8, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw piece symbol
            this.ctx.globalAlpha = 1;
            this.ctx.fillStyle = piece.color === PlayerColor.WHITE ? '#222' : '#fff';
            this.ctx.font = `bold ${Math.max(10, size)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(piece.getSymbol(), screenPos.x, screenPos.y);
        }

        this.ctx.globalAlpha = 1;
    }

    /**
     * Draw local IVM grid structure around the piece.
     */
    drawLocalGrid() {
        if (!this.piece) return;

        this.ctx.strokeStyle = this.colors.gridLine;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.3;

        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;

        // Draw lines toward each basis direction
        for (let i = 0; i < 4; i++) {
            const basis = Quadray.BASIS[i];
            const axisColors = [this.colors.axisA, this.colors.axisB, this.colors.axisC, this.colors.axisD];

            // Draw axis line
            for (let dist = 1; dist <= 3; dist++) {
                const targetPos = this.piece.position.add(basis.scale(dist));
                if (this.board.isValidPosition(targetPos)) {
                    const p = this.projectFromPiece(targetPos);

                    // Draw line from center to this point
                    this.ctx.strokeStyle = axisColors[i];
                    this.ctx.globalAlpha = 0.4 / dist;
                    this.ctx.beginPath();

                    if (dist === 1) {
                        this.ctx.moveTo(cx, cy);
                    } else {
                        const prevPos = this.piece.position.add(basis.scale(dist - 1));
                        const prevP = this.projectFromPiece(prevPos);
                        this.ctx.moveTo(prevP.x, prevP.y);
                    }

                    this.ctx.lineTo(p.x, p.y);
                    this.ctx.stroke();

                    // Draw node
                    this.ctx.fillStyle = this.colors.gridNode;
                    this.ctx.globalAlpha = 0.4;
                    this.ctx.beginPath();
                    this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }

        this.ctx.globalAlpha = 1;
    }

    /**
     * Draw piece info overlay.
     */
    drawPieceInfo() {
        if (!this.piece) return;

        const pos = this.piece.position.normalized();

        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(5, 5, 100, 45);

        // Piece info
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 11px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`${this.piece.getSymbol()} ${this.piece.type}`, 10, 20);

        // Quadray coordinates (compact)
        this.ctx.font = '9px monospace';
        this.ctx.fillStyle = this.colors.axisA;
        this.ctx.fillText(`a:${pos.a.toFixed(0)}`, 10, 35);
        this.ctx.fillStyle = this.colors.axisB;
        this.ctx.fillText(`b:${pos.b.toFixed(0)}`, 35, 35);
        this.ctx.fillStyle = this.colors.axisC;
        this.ctx.fillText(`c:${pos.c.toFixed(0)}`, 60, 35);
        this.ctx.fillStyle = this.colors.axisD;
        this.ctx.fillText(`d:${pos.d.toFixed(0)}`, 85, 35);

        // Moves count
        this.ctx.fillStyle = this.colors.validMove;
        this.ctx.font = '9px monospace';
        this.ctx.fillText(`${this.validMoves.length} moves`, 10, 47);
    }

    /**
     * Draw placeholder when no piece is selected.
     */
    drawPlaceholder() {
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = '#444';
        this.ctx.font = '14px "Segoe UI", Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('Select a piece', this.canvas.width / 2, this.canvas.height / 2 - 12);
        this.ctx.fillText('to see its view', this.canvas.width / 2, this.canvas.height / 2 + 12);

        // Draw faint crosshair
        this.drawCrosshair();
    }

    /**
     * Main render function.
     */
    render() {
        this.time = performance.now() / 1000;

        // Clear canvas
        this.ctx.fillStyle = this.colors.background;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        if (!this.piece) {
            this.drawPlaceholder();
            return;
        }

        // Draw layers (back to front)
        this.drawLocalGrid();
        this.drawCrosshair();
        this.drawMoveDirections();
        this.drawVisiblePieces();
        this.drawPieceInfo();
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FPVRenderer };
}
