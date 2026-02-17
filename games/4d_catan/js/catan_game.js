/**
 * CatanGame.js — 4D Catan Game Controller
 *
 * Extends BaseGame for lifecycle, camera sync, input, and HUD management.
 * Integrates HUD, ScoreManager, and AI opponent with Quadray-native evaluation.
 *
 * Turn phases: ROLL -> TRADE/BUILD -> END_TURN
 * Integrates cards, trading, robber, and AI modules.
 *
 * Uses:
 *   - BaseGame: init, togglePause, reset, _syncCamera, _updateHUD, _setupBaseInput
 *   - HUD: set, gameOver, paused, playing, warning
 *   - ScoreManager: addScore, reset, toJSON
 *   - verifyGeometricIdentities: startup integrity check
 *   - angleBetweenQuadrays: geometric evaluation
 *   - GridUtils: manhattan, euclidean, shuffle
 *   - Quadray: distance, distanceTo, toKey, normalized, clone
 *
 * Controls:
 *   Click       : Build / place robber
 *   N           : New game
 *   R           : Reset
 *   P           : Pause
 *   Shift+drag  : Rotate camera
 *
 * @module CatanGame
 */

class CatanGame extends BaseGame {
    constructor(canvas, hudElement) {
        const board = new CatanBoard();
        const renderer = new CatanRenderer(canvas, board);
        super(canvas, hudElement, board, renderer, {
            name: 'CatanGame',
            tickRate: 1000 / 30,    // Render-only tick rate (turn-based game)
            zoomOpts: { min: 20, max: 100 },
            cameraMode: 'shift-drag',
        });

        // Wire renderer back-reference to game (for phase/buildMode access)
        this.renderer.game = this;

        // Dev card deck
        this.deck = new CardDeck();

        // Turn state
        this.phase = TurnPhase.ROLL;
        this.buildMode = null;      // 'settlement', 'road', 'city', or null
        this.freeRoads = 0;
        this.selectedFrom = null;   // For road building: first click
        this.log = [];

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            lives: 0,               // unlimited — turn-based game
            levelThreshold: 10,     // level up every 10 VP
            storageKey: 'catan4D_highScore',
        });

        // Startup integrity check
        this._runGeometricVerification();

        this.addLog('Game started. Red goes first. Click Roll Dice.');
        console.log('[4D Catan] Board generated, full game ready');
    }

    /** Run verifyGeometricIdentities() on startup and log results. */
    _runGeometricVerification() {
        if (typeof verifyGeometricIdentities !== 'function') return;
        const results = verifyGeometricIdentities();
        const passCount = results.checks.filter(c => c.passed).length;
        const totalCount = results.checks.length;
        if (results.allPassed) {
            console.log(`[CatanGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
        } else {
            console.warn(`[CatanGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
            results.checks.filter(c => !c.passed).forEach(c =>
                console.warn(`  ${c.name}: expected ${c.expected}, got ${JSON.stringify(c.actual)}`)
            );
        }
    }

    /**
     * Override BaseGame._setupGameInput() — bind game-specific keys.
     */
    _setupGameInput() {
        this.input.bind(['n'], () => this.newGame());
    }

    /**
     * Override BaseGame.init() — add mouse bindings.
     */
    init() {
        this._bindMouse();
        super.init();
    }

    /** Start a new game, preserving scores. */
    newGame() {
        this.board.reset();
        this.deck = new CardDeck();
        this.phase = TurnPhase.ROLL;
        this.buildMode = null;
        this.freeRoads = 0;
        this.selectedFrom = null;
        this.log = [];
        this.addLog('New game! Red goes first. Roll dice.');
        this.updateUI();
    }

    /** Override BaseGame.reset() — also reset scoring. */
    reset() {
        this.scoring.reset();
        this.newGame();
    }

    // ── Logging ──────────────────────────────────────────────

    addLog(msg) {
        this.log.push(msg);
        if (this.log.length > 50) this.log.shift();
        const el = document.getElementById('logArea');
        if (el) {
            el.textContent = this.log.slice(-8).join('\n');
            el.scrollTop = el.scrollHeight;
        }
    }

    // ── Mouse / Click handling ────────────────────────────────

    /** Bind mouse click and move events. Camera rotation handled by CameraController. */
    _bindMouse() {
        this.canvas.addEventListener('mousedown', e => {
            if (!e.shiftKey && e.button === 0) {
                this.handleClick(e);
            }
        });
        this.canvas.addEventListener('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            this.renderer.mouseX = e.clientX - rect.left;
            this.renderer.mouseY = e.clientY - rect.top;
            // Track drag state for tooltip suppression
            this.renderer.isDragging = this.camera ? this.camera.isDragging : false;
        });
    }

    handleClick(e) {
        if (this.board.winner()) return;
        if (this.board.currentPlayer !== 0) return;

        const rect = this.renderer.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left, my = e.clientY - rect.top;

        // Hit-test via renderer
        const hit = this.renderer.hitTest(mx, my);
        const clickedTileIdx = hit ? hit.tileIdx : -1;
        const clickedTile = hit ? hit.tile : null;

        // Robber placement phase
        if (this.phase === TurnPhase.ROBBER) {
            if (clickedTileIdx >= 0 && clickedTile !== this.board.robber) {
                moveRobber(this, clickedTileIdx);
                this.phase = TurnPhase.TRADE;
                this.addLog(`Robber moved to tile ${clickedTileIdx}`);
                this.updateUI();
            }
            return;
        }

        // Build mode: settlement
        if (this.phase === TurnPhase.BUILD && this.buildMode === 'settlement' && clickedTile) {
            if (this.board.buildSettlement(0, clickedTile.pos)) {
                this.addLog('Built settlement!');
                this.buildMode = null;
                this.updateUI();
            } else {
                this.addLog('Cannot build settlement here.');
            }
            return;
        }

        // Build mode: road (two-click: from, then to)
        if (this.phase === TurnPhase.BUILD && this.buildMode === 'road' && clickedTile) {
            if (!this.selectedFrom) {
                this.selectedFrom = { ...clickedTile.pos };
                this.addLog('Road start selected. Click destination tile.');
            } else {
                const to = { ...clickedTile.pos };
                if (this.freeRoads > 0) {
                    this.board.buildFreeRoad(0, this.selectedFrom, to);
                    this.freeRoads--;
                    this.addLog(`Free road built! (${this.freeRoads} remaining)`);
                } else if (this.board.buildRoad(0, this.selectedFrom, to)) {
                    this.addLog('Road built!');
                } else {
                    this.addLog('Cannot build road (no resources).');
                }
                this.selectedFrom = null;
                if (this.freeRoads <= 0) this.buildMode = null;
                this.updateUI();
            }
            return;
        }

        // Build mode: city upgrade
        if (this.phase === TurnPhase.BUILD && this.buildMode === 'city' && clickedTile) {
            const p = this.board.players[0];
            for (let i = 0; i < p.settlements.length; i++) {
                const s = p.settlements[i];
                if (s.a === clickedTile.pos.a && s.b === clickedTile.pos.b && !s.isCity) {
                    if (this.board.upgradeToCity(0, i)) {
                        this.addLog('Upgraded to city!');
                        this.buildMode = null;
                        this.updateUI();
                        return;
                    }
                }
            }
            this.addLog('No settlement here to upgrade.');
            return;
        }
    }

    // ── Game Actions (called from buttons) ────────────────────

    rollDice() {
        if (this.phase !== TurnPhase.ROLL) return;
        if (this.board.currentPlayer !== 0) return;

        this.board.rollDice();
        const sum = this.board.dice[0] + this.board.dice[1];
        this.addLog(`Rolled ${this.board.dice[0]}+${this.board.dice[1]} = ${sum}`);

        if (sum === 7) {
            handleRobberRoll(this);
            return;
        }

        this.phase = TurnPhase.TRADE;
        this.updateUI();
    }

    startRobberPlacement() {
        this.phase = TurnPhase.ROBBER;
        this.addLog('Move the robber! Click a tile.');
        this.updateUI();
    }

    bankTrade(give, receive) {
        if (this.phase !== TurnPhase.TRADE && this.phase !== TurnPhase.BUILD) return false;
        const p = this.board.players[this.board.currentPlayer];
        if (executeBestTrade(p, give, receive)) {
            this.addLog(`Traded ${give} for ${receive}`);
            this.updateUI();
            return true;
        }
        this.addLog(`Cannot trade ${give} for ${receive}`);
        return false;
    }

    startBuild(type) {
        if (this.phase !== TurnPhase.TRADE && this.phase !== TurnPhase.BUILD) return;
        this.phase = TurnPhase.BUILD;
        this.buildMode = type;
        this.selectedFrom = null;
        this.addLog(`Select location for ${type}.`);
        this.updateUI();
    }

    cancelBuild() {
        this.buildMode = null;
        this.selectedFrom = null;
        this.updateUI();
    }

    buyDevCard() {
        if (this.phase !== TurnPhase.TRADE && this.phase !== TurnPhase.BUILD) return;
        const p = this.board.players[this.board.currentPlayer];
        if (!canAfford(p, BUILD_COSTS.devCard)) {
            this.addLog('Cannot afford dev card (1 ore, 1 wheat, 1 sheep).');
            return;
        }
        if (this.deck.remaining() === 0) {
            this.addLog('No dev cards left!');
            return;
        }
        deductCost(p, BUILD_COSTS.devCard);
        const card = this.deck.draw();
        p.devCards.push(card);
        p.cardsBoughtThisTurn.push(card);
        if (card === DevCardType.VICTORY_POINT) {
            this.board.recalcPoints();
            this.addLog(`Bought dev card: Victory Point!`);
        } else {
            this.addLog(`Bought dev card: ${DEV_CARD_LABELS[card]} (play next turn)`);
        }
        this.updateUI();
    }

    playDevCard(type) {
        if (this.board.currentPlayer !== 0) return;
        const p = this.board.players[0];

        switch (type) {
            case DevCardType.KNIGHT:
                if (playKnight(this)) {
                    this.addLog('Played Knight! Move the robber.');
                }
                break;
            case DevCardType.ROAD_BUILDING:
                if (playRoadBuilding(this)) {
                    this.addLog('Played Road Building! Place 2 free roads.');
                }
                break;
            case DevCardType.YEAR_OF_PLENTY: {
                const resTypes = ['wood', 'brick', 'wheat', 'sheep', 'ore'];
                resTypes.sort((a, b) => (p.resources[a] || 0) - (p.resources[b] || 0));
                if (playYearOfPlenty(this, resTypes[0], resTypes[1])) {
                    this.addLog(`Year of Plenty: +1 ${resTypes[0]}, +1 ${resTypes[1]}`);
                }
                break;
            }
            case DevCardType.MONOPOLY: {
                const resTypes = ['wood', 'brick', 'wheat', 'sheep', 'ore'];
                let bestRes = resTypes[0], bestAmt = 0;
                for (const r of resTypes) {
                    let otherTotal = 0;
                    for (const other of this.board.players) {
                        if (other === p) continue;
                        otherTotal += other.resources[r] || 0;
                    }
                    if (otherTotal > bestAmt) { bestAmt = otherTotal; bestRes = r; }
                }
                if (playMonopoly(this, bestRes)) {
                    this.addLog(`Monopoly on ${bestRes}! Stole ${bestAmt}`);
                }
                break;
            }
        }
        this.updateUI();
    }

    endTurn() {
        if (this.phase === TurnPhase.ROLL) return;
        if (this.phase === TurnPhase.ROBBER) return;

        this.board.recalcPoints();

        // Check win
        if (this.board.winner()) {
            const w = this.board.winner();
            this.board.gameOver = true;
            this.scoring.addScore(w.points);
            this.addLog(`${w.name} wins with ${w.points} VP!`);
            this.updateUI();
            return;
        }

        this.board.endTurn();
        this.phase = TurnPhase.ROLL;
        this.buildMode = null;
        this.selectedFrom = null;
        this.freeRoads = 0;
        this.addLog(`Turn ended. Now ${this.board.players[this.board.currentPlayer].name}'s turn.`);
        this.updateUI();

        // If it's AI's turn, run AI after a short delay
        if (this.board.currentPlayer === 1) {
            setTimeout(() => this.runAI(), 500);
        }
    }

    runAI() {
        if (this.board.winner()) return;
        this.addLog('Blue (AI) is thinking...');
        aiTurn(this);

        // Check win after AI turn
        this.board.recalcPoints();
        if (this.board.winner()) {
            const w = this.board.winner();
            this.board.gameOver = true;
            this.addLog(`${w.name} wins with ${w.points} VP!`);
            this.updateUI();
            return;
        }

        // End AI turn, back to human
        this.board.endTurn();
        this.phase = TurnPhase.ROLL;
        this.buildMode = null;
        this.freeRoads = 0;
        this.addLog(`Blue done. Your turn! Roll dice.`);
        this.updateUI();
    }

    // ── UI Update ─────────────────────────────────────────────

    updateUI() {
        const p = this.board.players[0]; // Human player
        const ai = this.board.players[1]; // AI player

        // Turn label
        const turnEl = document.getElementById('turnLabel');
        if (turnEl) {
            const current = this.board.players[this.board.currentPlayer];
            turnEl.textContent = `${current.name} | Phase: ${(this.phase || 'setup').toUpperCase()}`;
            turnEl.style.color = current.color;
        }

        // Resources
        const resEl = document.getElementById('resLabel');
        if (resEl) {
            resEl.innerHTML =
                `<span style="color:#4CAF50">W:${p.resources.wood}</span> ` +
                `<span style="color:#E65100">B:${p.resources.brick}</span> ` +
                `<span style="color:#FFD54F">Wh:${p.resources.wheat}</span> ` +
                `<span style="color:#81C784">S:${p.resources.sheep}</span> ` +
                `<span style="color:#78909C">O:${p.resources.ore}</span>`;
        }

        // Score breakdown
        const scoreEl = document.getElementById('scoreBreakdown');
        if (scoreEl) {
            const settlements = p.settlements.filter(s => !s.isCity).length;
            const cities = p.settlements.filter(s => s.isCity).length;
            const vpCards = p.devCards.filter(c => c === DevCardType.VICTORY_POINT).length;
            scoreEl.innerHTML =
                `Settlements: ${settlements} (${settlements}VP)<br>` +
                `Cities: ${cities} (${cities * 2}VP)<br>` +
                `Longest Road: ${p.hasLongestRoad ? 'YES (+2VP)' : 'No'}<br>` +
                `Largest Army: ${p.hasLargestArmy ? 'YES (+2VP)' : 'No'} (${p.knightsPlayed} knights)<br>` +
                `VP Cards: ${vpCards}<br>` +
                `<strong>Total: ${p.points} VP</strong>`;
        }

        // Dev cards hand
        const cardsEl = document.getElementById('cardsHand');
        if (cardsEl) {
            const cardCounts = {};
            for (const c of p.devCards) {
                if (c === DevCardType.VICTORY_POINT) continue;
                cardCounts[c] = (cardCounts[c] || 0) + 1;
            }
            let html = '';
            for (const [type, count] of Object.entries(cardCounts)) {
                html += `<button class="card-btn" onclick="game.playDevCard('${type}')">${DEV_CARD_LABELS[type]} (${count})</button> `;
            }
            const vpCount = p.devCards.filter(c => c === DevCardType.VICTORY_POINT).length;
            if (vpCount > 0) html += `<span style="color:#FFD54F">VP Cards: ${vpCount}</span>`;
            if (!html) html = '<span style="color:#668">No cards</span>';
            cardsEl.innerHTML = html;
        }

        // AI status
        const aiEl = document.getElementById('aiStatus');
        if (aiEl) {
            aiEl.innerHTML =
                `VP: ${ai.points} | Knights: ${ai.knightsPlayed} | ` +
                `Roads: ${ai.roads.length} | Settlements: ${ai.settlements.length}` +
                (ai.hasLongestRoad ? ' | LONGEST ROAD' : '') +
                (ai.hasLargestArmy ? ' | LARGEST ARMY' : '');
        }

        // Dice display
        const diceEl = document.getElementById('diceDisplay');
        if (diceEl) {
            if (this.board.dice[0] > 0) {
                diceEl.textContent = `${this.board.dice[0]} + ${this.board.dice[1]} = ${this.board.dice[0] + this.board.dice[1]}`;
            } else {
                diceEl.textContent = '? + ? = ?';
            }
        }

        // Deck remaining
        const deckEl = document.getElementById('deckCount');
        if (deckEl) {
            deckEl.textContent = `${this.deck.remaining()} cards left`;
        }

        // Enable/disable buttons based on phase
        const rollBtn = document.getElementById('rollBtn');
        const endBtn = document.getElementById('endTurnBtn');
        if (rollBtn) rollBtn.disabled = (this.phase !== TurnPhase.ROLL || this.board.currentPlayer !== 0);
        if (endBtn) endBtn.disabled = (this.phase === TurnPhase.ROLL || this.phase === TurnPhase.ROBBER || this.board.currentPlayer !== 0);
    }

    /**
     * Override BaseGame._getHUDState() — rich status with quadray info.
     * @returns {{ text: string, color: string }}
     */
    _getHUDState() {
        const b = this.board;
        const meta = b.getMetadata();
        const scoreLabel = ` | Wins: ${this.scoring.score}`;
        const cp = b.players[b.currentPlayer];

        if (b.gameOver) {
            const w = b.winner();
            if (w) {
                return {
                    text: `${w.name} wins with ${w.points} VP!${scoreLabel} | Press N`,
                    color: w.color,
                };
            }
            return {
                text: `Game over!${scoreLabel} | Press N`,
                color: '#94a3b8',
            };
        }

        const phaseLabel = this.phase ? this.phase.toUpperCase() : 'SETUP';
        return {
            text: `${cp.name} | Phase: ${phaseLabel} | VP: ${cp.points}${scoreLabel} | Tiles: ${meta.totalTiles} (T:${meta.tetraCount} O:${meta.octaCount})`,
            color: cp.color,
        };
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CatanGame };
}
