/**
 * pong_board.js — 4D Pong in Quadray Space
 *
 * Ball has continuous position and velocity as Quadray vectors.
 * Two paddles on opposite tetrahedral faces.
 * Ball bounces off walls using Quadray reflection.
 *
 * Deeply integrated with all Quadray/IVM shared modules:
 *   - Quadray: toKey, normalized, add, toCartesian, distance, distanceTo,
 *              length, scale, toIVM, cellType, cellVolume, clone, BASIS
 *   - GridUtils: key, parseKey, neighbors, manhattan, euclidean
 *   - SYNERGETICS: constants, volume ratios
 *   - verifyRoundTrip, verifyGeometricIdentities, angleBetweenQuadrays
 *
 * @module PongBoard
 */

// Node.js compatibility — load shared modules if not already in scope.
// IMPORTANT: Do NOT use `var` here. `var` hoisting creates a script-scope
// binding that shadows the global, which breaks browsers where globals
// are set by prior <script> tags.
if (typeof Quadray === 'undefined' && typeof require !== 'undefined') {
    /* eslint-disable no-global-assign */
    const _q = require('../../4d_generic/quadray.js');
    globalThis.Quadray = _q.Quadray;
}
if (typeof GridUtils === 'undefined' && typeof require !== 'undefined') {
    const _g = require('../../4d_generic/grid_utils.js');
    globalThis.GridUtils = _g.GridUtils;
}
if (typeof SYNERGETICS === 'undefined' && typeof require !== 'undefined') {
    const _s = require('../../4d_generic/synergetics.js');
    globalThis.SYNERGETICS = _s.SYNERGETICS;
    globalThis.angleBetweenQuadrays = _s.angleBetweenQuadrays;
    globalThis.verifyRoundTrip = _s.verifyRoundTrip;
    globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities;
}

class PongBoard {
    /**
     * @param {number} courtSize - Court size in Quadray units
     */
    constructor(courtSize = 10) {
        this.courtSize = courtSize;
        this.ball = { a: 5, b: 5, c: 5, d: 5 };       // Position
        this.ballVel = { a: 0.15, b: 0.08, c: 0.05, d: -0.03 }; // Velocity
        this.ballSpeed = 0.2;

        // Paddles defined on A axis extremes
        this.paddle1 = { b: 5, c: 5, d: 5, size: 2 }; // at A=0
        this.paddle2 = { b: 5, c: 5, d: 5, size: 2 }; // at A=courtSize

        this.score1 = 0;
        this.score2 = 0;
        this.maxScore = 7;
        this.gameOver = false;
        this.winner = 0;
        this.rally = 0;

        // Synergetics metadata
        this.volumeRatios = {
            tetra: SYNERGETICS?.TETRA_VOL ?? 1,
            octa: SYNERGETICS?.OCTA_VOL ?? 4,
            cubo: SYNERGETICS?.CUBO_VOL ?? 20,
        };
        this.cellVolumeUnit = typeof Quadray !== 'undefined' && Quadray.cellVolume
            ? Quadray.cellVolume() : 1;
        this.s3Constant = SYNERGETICS?.S3 ?? 1.0607;

        // Integrity check — verify round-trip on corner positions
        this._verifyIntegrity();

        console.log(`[PongBoard] Court ${courtSize}^4 Quadray space`);
        console.log(`[PongBoard] Cell volume: ${this.cellVolumeUnit}, S3: ${this.s3Constant}`);
        console.log(`[PongBoard] Volume ratios T:O:C = ${this.volumeRatios.tetra}:${this.volumeRatios.octa}:${this.volumeRatios.cubo}`);
    }

    /** Verify geometric integrity on construction. */
    _verifyIntegrity() {
        if (typeof verifyRoundTrip !== 'function') return;
        const cs = this.courtSize;
        const corners = [
            new Quadray(0, 0, 0, 0),
            new Quadray(cs, cs, cs, cs),
            new Quadray(cs, 0, 0, 0),
            new Quadray(0, cs, 0, 0),
        ];
        let allPassed = true;
        for (const corner of corners) {
            const result = verifyRoundTrip(corner);
            if (!result.passed) {
                console.warn(`[PongBoard] Round-trip failed for ${corner.toString()}: error=${result.error.toFixed(6)}`);
                allPassed = false;
            }
        }
        if (allPassed) console.log('[PongBoard] Round-trip integrity verified on corner positions');
    }

    /** Reset ball to center with random velocity. */
    resetBall(serveToPlayer = 1) {
        const mid = this.courtSize / 2;
        this.ball = { a: mid, b: mid, c: mid, d: mid };
        const angle1 = Math.random() * Math.PI * 2;
        const angle2 = Math.random() * Math.PI * 2;
        const dir = serveToPlayer === 1 ? -1 : 1;
        this.ballVel = {
            a: dir * this.ballSpeed * 0.7,
            b: Math.sin(angle1) * this.ballSpeed * 0.5,
            c: Math.cos(angle1) * this.ballSpeed * 0.3,
            d: Math.sin(angle2) * this.ballSpeed * 0.2
        };
        this.rally = 0;
    }

    /** Move paddle by IVM offsets. */
    movePaddle(player, db, dc, dd) {
        const p = player === 1 ? this.paddle1 : this.paddle2;
        p.b = Math.max(p.size, Math.min(this.courtSize - p.size, p.b + db));
        p.c = Math.max(p.size, Math.min(this.courtSize - p.size, p.c + dc));
        p.d = Math.max(p.size, Math.min(this.courtSize - p.size, p.d + dd));
    }

    /** Simple AI for paddle 2. */
    aiMove() {
        const speed = 0.15;
        const p = this.paddle2;
        if (p.b < this.ball.b) p.b += speed;
        else if (p.b > this.ball.b) p.b -= speed;
        if (p.c < this.ball.c) p.c += speed;
        else if (p.c > this.ball.c) p.c -= speed;
        if (p.d < this.ball.d) p.d += speed;
        else if (p.d > this.ball.d) p.d -= speed;
    }

    /**
     * Advance physics one step.
     * @returns {string} 'play', 'score1', 'score2', 'gameover'
     */
    step() {
        if (this.gameOver) return 'gameover';

        // Move ball
        this.ball.a += this.ballVel.a;
        this.ball.b += this.ballVel.b;
        this.ball.c += this.ballVel.c;
        this.ball.d += this.ballVel.d;

        // Bounce off B, C, D walls
        for (const axis of ['b', 'c', 'd']) {
            if (this.ball[axis] <= 0) {
                this.ball[axis] = -this.ball[axis];
                this.ballVel[axis] = Math.abs(this.ballVel[axis]);
            } else if (this.ball[axis] >= this.courtSize) {
                this.ball[axis] = 2 * this.courtSize - this.ball[axis];
                this.ballVel[axis] = -Math.abs(this.ballVel[axis]);
            }
        }

        // Paddle 1 (A=0)
        if (this.ball.a <= 0.5) {
            if (this._paddleHit(this.paddle1, this.ball)) {
                this.ball.a = 0.5;
                this.ballVel.a = Math.abs(this.ballVel.a);
                this._addSpin(this.paddle1);
                this.rally++;
                return 'play';
            } else if (this.ball.a <= 0) {
                // Player 2 scores
                this.score2++;
                if (this.score2 >= this.maxScore) { this.gameOver = true; this.winner = 2; return 'gameover'; }
                this.resetBall(1);
                return 'score2';
            }
        }

        // Paddle 2 (A=courtSize)
        if (this.ball.a >= this.courtSize - 0.5) {
            if (this._paddleHit(this.paddle2, this.ball)) {
                this.ball.a = this.courtSize - 0.5;
                this.ballVel.a = -Math.abs(this.ballVel.a);
                this._addSpin(this.paddle2);
                this.rally++;
                return 'play';
            } else if (this.ball.a >= this.courtSize) {
                this.score1++;
                if (this.score1 >= this.maxScore) { this.gameOver = true; this.winner = 1; return 'gameover'; }
                this.resetBall(2);
                return 'score1';
            }
        }

        return 'play';
    }

    /** Check if ball is within paddle's range. */
    _paddleHit(paddle, ball) {
        const db = Math.abs(paddle.b - ball.b);
        const dc = Math.abs(paddle.c - ball.c);
        const dd = Math.abs(paddle.d - ball.d);
        return db <= paddle.size && dc <= paddle.size && dd <= paddle.size;
    }

    /** Add spin based on where ball hits paddle. */
    _addSpin(paddle) {
        this.ballVel.b += (this.ball.b - paddle.b) * 0.03;
        this.ballVel.c += (this.ball.c - paddle.c) * 0.02;
        this.ballVel.d += (this.ball.d - paddle.d) * 0.01;
        // Speed up gradually
        const factor = 1.02;
        this.ballVel.a *= factor;
        this.ballVel.b *= factor;
        this._clampVelocity();
    }

    /** Prevent runaway ball speed. */
    _clampVelocity() {
        const maxV = 0.5;
        for (const axis of ['a', 'b', 'c', 'd']) {
            this.ballVel[axis] = Math.max(-maxV, Math.min(maxV, this.ballVel[axis]));
        }
    }

    /**
     * Calculate Manhattan distance between ball and a paddle center.
     * Uses GridUtils.manhattan().
     * @param {number} player
     * @returns {number}
     */
    ballPaddleDistance(player) {
        const p = player === 1 ? this.paddle1 : this.paddle2;
        const pA = player === 1 ? 0 : this.courtSize;
        return GridUtils.manhattan(
            { a: this.ball.a, b: this.ball.b, c: this.ball.c, d: this.ball.d },
            { a: pA, b: p.b, c: p.c, d: p.d }
        );
    }

    /** Full game reset. */
    reset() {
        this.score1 = 0;
        this.score2 = 0;
        this.gameOver = false;
        this.winner = 0;
        this.rally = 0;
        this.resetBall(1);
        const mid = this.courtSize / 2;
        this.paddle1 = { b: mid, c: mid, d: mid, size: 2 };
        this.paddle2 = { b: mid, c: mid, d: mid, size: 2 };
    }

    /** Get ball as Quadray. */
    getBallQuadray() {
        return typeof Quadray !== 'undefined'
            ? new Quadray(this.ball.a, this.ball.b, this.ball.c, this.ball.d)
            : null;
    }

    /**
     * Get cell data at a Quadray position.
     * @param {Quadray} q
     * @returns {Object|null}
     */
    getCell(q) { return null; }

    /**
     * Set cell data at a Quadray position.
     * @param {Quadray} q
     * @param {*} v
     */
    setCell(q, v) { /* no-op for continuous physics game */ }

    /**
     * Get board metadata for HUD display.
     * @returns {Object}
     */
    getMetadata() {
        const ballQ = this.getBallQuadray();
        const ballCellType = ballQ && typeof Quadray !== 'undefined'
            ? Quadray.cellType(this.ball.a, this.ball.b, this.ball.c, this.ball.d)
            : 'unknown';
        return {
            score1: this.score1,
            score2: this.score2,
            rally: this.rally,
            winner: this.winner,
            gameOver: this.gameOver,
            courtSize: this.courtSize,
            ballCellType,
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PongBoard };
}
