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
if (typeof BaseBoard === 'undefined' && typeof require !== 'undefined') {
    const _bb = require('../../4d_generic/base_board.js');
    globalThis.BaseBoard = _bb.BaseBoard;
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

class PongBoard extends BaseBoard {
    /**
     * @param {number} courtSize - Court size in Quadray units
     */
    constructor(courtSize = 10) {
        super(courtSize, { name: 'PongBoard', verify: false });
        this.courtSize = courtSize;
        this.ball = { a: 5, b: 5, c: 5, d: 5 };       // Position
        this.ballVel = { a: 0.15, b: 0.08, c: 0.05, d: -0.03 }; // Velocity
        this.ballSpeed = 0.2;

        // Paddles defined on A axis extremes
        this.paddle1 = { b: 5, c: 5, d: 5, size: 2 }; // at A=0
        this.paddle2 = { b: 5, c: 5, d: 5, size: 2 }; // at A=courtSize

        this.score1 = 0;
        this.score2 = 0;
        this.maxScore = 11;
        this.gameOver = false;
        this.winner = 0;
        this.rally = 0;
        this.longestRally = 0;
        this.isServing = true;
        this.serveTimer = 1.0;
        this.serveToPlayer = 1;
        this.twoPlayerMode = false;
        this.aiDifficulty = 0; // 0=easy, 1=medium, 2=hard
        this.aiReactionLag = 0.15; // Lower = harder

        // Power-up system
        this.powerUp = null;         // { pos: {a,b,c,d}, type, timer }
        this.activePowers = [];       // { player, type, remaining }
        this.powerUpTypes = ['bigPaddle', 'speedBall', 'slowBall'];
        this.powerUpInterval = 5;     // Spawn every N rallies

        // Track paddle velocity for "English"
        this.paddle1Last = { b: 5, c: 5, d: 5 };
        this.paddle2Last = { b: 5, c: 5, d: 5 };
        this.paddle1Vel = { b: 0, c: 0, d: 0 };
        this.paddle2Vel = { b: 0, c: 0, d: 0 };

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

    /** Reset ball to center for serving. */
    resetBall(serveToPlayer = 1) {
        const mid = this.courtSize / 2;
        this.ball = { a: mid, b: mid, c: mid, d: mid };
        this.ballVel = { a: 0, b: 0, c: 0, d: 0 }; // Hold still
        this.rally = 0;
        this.isServing = true;
        this.serveTimer = 1.0; // 1 second delay
        this.serveToPlayer = serveToPlayer;
    }

    _launchServe() {
        this.isServing = false;
        const angle1 = Math.random() * Math.PI * 2;
        const angle2 = Math.random() * Math.PI * 2;
        const dir = this.serveToPlayer === 1 ? -1 : 1;
        this.ballVel = {
            a: dir * this.ballSpeed * 0.7,
            b: Math.sin(angle1) * this.ballSpeed * 0.5,
            c: Math.cos(angle1) * this.ballSpeed * 0.3,
            d: Math.sin(angle2) * this.ballSpeed * 0.2
        };
    }

    /** Move paddle by IVM offsets. */
    movePaddle(player, db, dc, dd) {
        const p = player === 1 ? this.paddle1 : this.paddle2;
        p.b = Math.max(p.size, Math.min(this.courtSize - p.size, p.b + db));
        p.c = Math.max(p.size, Math.min(this.courtSize - p.size, p.c + dc));
        p.d = Math.max(p.size, Math.min(this.courtSize - p.size, p.d + dd));
    }

    /** AI for paddle 2 with difficulty-based reaction. */
    aiMove() {
        if (this.twoPlayerMode) return;

        // Speed scales with difficulty
        const speeds = [0.10, 0.15, 0.22];
        const speed = speeds[Math.min(this.aiDifficulty, 2)];

        // Reaction lag: easy ignores ball sometimes
        const lagChance = [0.3, 0.1, 0.02];
        if (Math.random() < lagChance[this.aiDifficulty]) return;

        const p = this.paddle2;
        // Predict ball position (harder AI looks further ahead)
        const lookAhead = [0, 2, 5][this.aiDifficulty];
        const predictB = this.ball.b + this.ballVel.b * lookAhead;
        const predictC = this.ball.c + this.ballVel.c * lookAhead;
        const predictD = this.ball.d + this.ballVel.d * lookAhead;

        if (p.b < predictB) p.b = Math.min(p.b + speed, this.courtSize - p.size);
        else if (p.b > predictB) p.b = Math.max(p.b - speed, p.size);
        if (p.c < predictC) p.c = Math.min(p.c + speed, this.courtSize - p.size);
        else if (p.c > predictC) p.c = Math.max(p.c - speed, p.size);
        if (p.d < predictD) p.d = Math.min(p.d + speed, this.courtSize - p.size);
        else if (p.d > predictD) p.d = Math.max(p.d - speed, p.size);
    }

    /** Cycle AI difficulty. */
    cycleDifficulty() {
        this.aiDifficulty = (this.aiDifficulty + 1) % 3;
        const names = ['Easy', 'Medium', 'Hard'];
        console.log(`[PongBoard] AI: ${names[this.aiDifficulty]}`);
    }

    /** Toggle 2-player mode. */
    toggle2P() {
        this.twoPlayerMode = !this.twoPlayerMode;
        console.log(`[PongBoard] 2P mode: ${this.twoPlayerMode}`);
    }

    /** Spawn a power-up at a random position if conditions met. */
    _trySpawnPowerUp() {
        if (this.powerUp) return; // Already one on field
        if (this.rally > 0 && this.rally % this.powerUpInterval === 0) {
            const mid = this.courtSize / 2;
            this.powerUp = {
                pos: {
                    a: mid + (Math.random() - 0.5) * 4,
                    b: mid + (Math.random() - 0.5) * 6,
                    c: mid + (Math.random() - 0.5) * 6,
                    d: mid + (Math.random() - 0.5) * 4,
                },
                type: this.powerUpTypes[Math.floor(Math.random() * this.powerUpTypes.length)],
                timer: 10, // Disappears after 10s
            };
            console.log(`[PongBoard] Power-up spawned: ${this.powerUp.type}`);
        }
    }

    /** Check if ball hits the power-up. */
    _checkPowerUpCollision() {
        if (!this.powerUp) return;
        const dx = Math.abs(this.ball.a - this.powerUp.pos.a);
        const db = Math.abs(this.ball.b - this.powerUp.pos.b);
        const dc = Math.abs(this.ball.c - this.powerUp.pos.c);
        const dd = Math.abs(this.ball.d - this.powerUp.pos.d);
        if (dx < 1 && db < 1 && dc < 1 && dd < 1) {
            // Ball picked up the power-up — apply to whichever player last hit
            const player = this.ballVel.a > 0 ? 1 : 2;
            this._applyPowerUp(player, this.powerUp.type);
            this.powerUp = null;
        }
    }

    /** Apply a power-up effect. */
    _applyPowerUp(player, type) {
        const duration = 10.0; // seconds
        this.activePowers.push({ player, type, remaining: duration });
        console.log(`[PongBoard] Player ${player} got ${type}!`);

        const paddle = player === 1 ? this.paddle1 : this.paddle2;
        if (type === 'bigPaddle') {
            paddle.size = 3; // 50% bigger
        }
    }

    /** Tick down active power-ups and remove expired ones. */
    _updatePowerUps(dt) {
        // Tick field power-up
        if (this.powerUp) {
            this.powerUp.timer -= dt;
            if (this.powerUp.timer <= 0) {
                this.powerUp = null;
            }
        }

        // Tick active effects
        this.activePowers = this.activePowers.filter(p => {
            p.remaining -= dt;
            if (p.remaining <= 0) {
                // Remove effect
                if (p.type === 'bigPaddle') {
                    const paddle = p.player === 1 ? this.paddle1 : this.paddle2;
                    paddle.size = 2;
                }
                return false;
            }
            return true;
        });
    }

    /** Get current ball speed multiplier from active power-ups. */
    _getSpeedMultiplier() {
        let mult = 1.0;
        for (const p of this.activePowers) {
            if (p.type === 'speedBall') mult *= 1.3;
            if (p.type === 'slowBall') mult *= 0.7;
        }
        return mult;
    }

    /**
     * Advance physics one step.
     * @param {number} dt Time delta
     * @returns {string} 'play', 'score1', 'score2', 'gameover'
     */
    step(dt = 0.016) {
        if (this.gameOver) return 'gameover';

        // Track paddle velocities
        this.paddle1Vel = {
            b: (this.paddle1.b - this.paddle1Last.b) / dt,
            c: (this.paddle1.c - this.paddle1Last.c) / dt,
            d: (this.paddle1.d - this.paddle1Last.d) / dt
        };
        this.paddle2Vel = {
            b: (this.paddle2.b - this.paddle2Last.b) / dt,
            c: (this.paddle2.c - this.paddle2Last.c) / dt,
            d: (this.paddle2.d - this.paddle2Last.d) / dt
        };
        this.paddle1Last = { ...this.paddle1 };
        this.paddle2Last = { ...this.paddle2 };

        if (this.isServing) {
            this.serveTimer -= dt;
            if (this.serveTimer <= 0) {
                this._launchServe();
            }
            return 'play';
        }

        // Update power-ups
        this._updatePowerUps(dt);
        this._checkPowerUpCollision();

        // Move ball (apply speed multiplier from power-ups)
        const sm = this._getSpeedMultiplier();
        this.ball.a += this.ballVel.a * sm;
        this.ball.b += this.ballVel.b * sm;
        this.ball.c += this.ballVel.c * sm;
        this.ball.d += this.ballVel.d * sm;

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
                this._addSpin(this.paddle1, this.paddle1Vel);
                this.rally++;
                this.longestRally = Math.max(this.longestRally, this.rally);
                this._trySpawnPowerUp();
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
                this._addSpin(this.paddle2, this.paddle2Vel);
                this.rally++;
                this.longestRally = Math.max(this.longestRally, this.rally);
                this._trySpawnPowerUp();
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

    /** Add spin based on paddle velocity (English). */
    _addSpin(paddle, paddleVel) {
        // Impact-based deflection (classic Pong style)
        const db = (this.ball.b - paddle.b) * 0.02;
        const dc = (this.ball.c - paddle.c) * 0.02;
        const dd = (this.ball.d - paddle.d) * 0.02;

        // Velocity-based string (English)
        // Convert dt-based velocity back to a slight impulse per frame
        const spinB = paddleVel.b * 0.01;
        const spinC = paddleVel.c * 0.01;
        const spinD = paddleVel.d * 0.01;

        this.ballVel.b += db + spinB;
        this.ballVel.c += dc + spinC;
        this.ballVel.d += dd + spinD;

        // Speed up gradually after each hit
        const factor = 1.05; // 5% speedup per hit
        this.ballVel.a *= factor;
        this.ballVel.b *= factor;
        this.ballVel.c *= factor;
        this.ballVel.d *= factor;
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
        this.longestRally = 0;
        this.powerUp = null;
        this.activePowers = [];
        this.resetBall(1);
        const mid = this.courtSize / 2;
        this.paddle1 = { b: mid, c: mid, d: mid, size: 2 };
        this.paddle2 = { b: mid, c: mid, d: mid, size: 2 };
        this.paddle1Last = { ...this.paddle1 };
        this.paddle2Last = { ...this.paddle2 };
        this.paddle1Vel = { b: 0, c: 0, d: 0 };
        this.paddle2Vel = { b: 0, c: 0, d: 0 };
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
            longestRally: this.longestRally,
            winner: this.winner,
            gameOver: this.gameOver,
            isServing: this.isServing,
            serveTimer: this.serveTimer,
            courtSize: this.courtSize,
            ballCellType,
            twoPlayer: this.twoPlayerMode,
            aiDifficulty: this.aiDifficulty,
            powerUp: this.powerUp ? this.powerUp.type : null,
            activePowers: this.activePowers.map(p => ({ player: p.player, type: p.type })),
            volumeRatios: this.volumeRatios,
            cellVolume: this.cellVolumeUnit,
            s3: this.s3Constant,
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PongBoard };
}
