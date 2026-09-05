/**
 * TDGame.js -- 4D Tower Defense Game Controller
 *
 * Extends BaseGame for lifecycle, camera sync, input, and HUD management.
 * Tower placement, selection, upgrade/sell, speed controls, keyboard shortcuts.
 *
 * Uses:
 *   - BaseGame: init, togglePause, reset, _syncCamera, _updateHUD, _setupBaseInput
 *   - HUD: set, gameOver, paused, playing, warning
 *   - ScoreManager: addScore, reset, toJSON
 *   - verifyGeometricIdentities: startup integrity check
 *   - angleBetweenQuadrays: geometric verification
 *   - GridUtils: manhattan, euclidean, shuffle, key, parseKey
 *   - Quadray: distance, distanceTo, toKey, toCartesian, clone, add, BASIS
 *
 * Controls:
 *   Click       : Place tower / Select existing
 *   R-Click     : Cancel selection
 *   Shift+drag  : Rotate view
 *   Scroll      : Zoom in/out
 *   1-4         : Tower types
 *   U           : Upgrade tower
 *   X           : Sell tower
 *   Space       : Toggle speed
 *   N           : Send next wave
 *   A           : Toggle auto-wave
 *   P           : Pause
 *   R           : Reset
 *   Esc         : Deselect
 *
 * @module TDGame
 */

class TDGame extends BaseGame {
    constructor(canvas, hudElement) {
        const board = new TowerDefenseBoard(6);
        const renderer = new TDRenderer(canvas, board);
        super(canvas, hudElement, board, renderer, {
            name: 'TowerDefenseGame',
            tickRate: 16,
            zoomOpts: { min: 30, max: 160 },
            cameraMode: 'shift-drag',
        });

        // Give renderer a back-reference to game for tower selection state
        this.renderer.game = this;

        // Score tracking via ScoreManager
        this.scoring = new ScoreManager({
            lives: 20,
            levelThreshold: 1000,
            storageKey: 'towerDefense4D_highScore',
        });

        // Tower selection state
        this.selectedTowerType = 'tetra';
        this.selectedTowerInstance = null;   // tower object being inspected
        this.autoWave = false;                // auto-send next wave

        // Click tracking (to distinguish click from drag)
        this._clickStart = null;

        // Spawn the first wave
        this.board.spawnWave();

        // Startup integrity check
        this._runGeometricVerification();
    }

    /** Run verifyGeometricIdentities() on startup and log results. */
    _runGeometricVerification() {
        if (typeof verifyGeometricIdentities !== 'function') return;
        const results = verifyGeometricIdentities();
        const passCount = results.checks.filter(c => c.passed).length;
        const totalCount = results.checks.length;
        if (results.allPassed) {
            console.log(`[TowerDefenseGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
        } else {
            console.warn(`[TowerDefenseGame] Geometric verification: ${passCount}/${totalCount} checks passed`);
            results.checks.filter(c => !c.passed).forEach(c =>
                console.warn(`  ${c.name}: expected ${c.expected}, got ${JSON.stringify(c.actual)}`)
            );
        }
    }

    /**
     * Override BaseGame._setupGameInput() -- bind game-specific keys.
     */
    _setupGameInput() {
        this.input.bind(['1'], () => this.selectTowerType('tetra'));
        this.input.bind(['2'], () => this.selectTowerType('octa'));
        this.input.bind(['3'], () => this.selectTowerType('cubo'));
        this.input.bind(['4'], () => this.selectTowerType('rhombic'));
        this.input.bind(['u'], () => this.upgradeSelected());
        this.input.bind(['x', 'Delete', 'Backspace'], () => this.sellSelected());
        this.input.bind([' '], () => this.toggleSpeed());
        this.input.bind(['n'], () => this.sendNextWave());
        this.input.bind(['Escape'], () => {
            this.selectedTowerInstance = null;
            this._updateUI();
        });
        this.input.bind(['a'], () => this.toggleAutoWave());
    }

    /**
     * Override BaseGame.init() -- add mouse/canvas bindings.
     */
    init() {
        this._bindMouse();
        this._bindCanvasCamera();
        super.init();
    }

    /**
     * Override BaseGame.update() -- step the board simulation.
     */
    update() {
        this.board.update();
        // Auto-wave: immediately spawn when countdown starts
        if (this.autoWave && !this.board.waveActive && this.board.waveCountdown > 0 && !this.board.gameOver) {
            this.board.waveCountdown = 0;
            this.board.spawnWave();
        }
    }

    /**
     * Override BaseGame.reset() -- also reset scoring and board.
     */
    reset() {
        this.scoring.reset();
        this.selectedTowerType = 'tetra';
        this.selectedTowerInstance = null;
        super.reset();
        this.board.spawnWave();
        this._updateUI();
    }

    // ─── Tower Type Selection ───────────────────────────────────────────
    selectTowerType(type) {
        if (TOWER_TYPES[type]) {
            this.selectedTowerType = type;
            this.selectedTowerInstance = null;
            this._updateTowerButtons();
        }
    }

    // ─── Mouse Bindings ─────────────────────────────────────────────────
    _bindMouse() {
        const canvas = this.canvas;

        // Left click = place tower / select existing tower (when not dragging)
        canvas.addEventListener('mousedown', e => {
            if (e.button === 0 && !e.shiftKey && !e.ctrlKey) {
                this._clickStart = { x: e.clientX, y: e.clientY, time: Date.now() };
            }
        });

        canvas.addEventListener('mouseup', e => {
            if (e.button === 0 && this._clickStart) {
                const dx = e.clientX - this._clickStart.x;
                const dy = e.clientY - this._clickStart.y;
                const dt = Date.now() - this._clickStart.time;
                // Only count as click if mouse didn't move much and was quick
                if (Math.hypot(dx, dy) < 6 && dt < 400) {
                    this._handleClick(e);
                }
                this._clickStart = null;
            }
        });

        // Right click = cancel / deselect
        canvas.addEventListener('contextmenu', e => {
            e.preventDefault();
            if (this.selectedTowerInstance) {
                this.selectedTowerInstance = null;
                this._updateUI();
            }
        });

        // Mouse move for hover detection
        canvas.addEventListener('mousemove', e => {
            const rect = canvas.getBoundingClientRect();
            this.renderer.mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            this.renderer._updateHover();
        });

        canvas.addEventListener('mouseleave', () => {
            this.renderer.mousePos = { x: -1, y: -1 };
            this.renderer.hoveredNode = null;
        });
    }

    /**
     * Bind canvas camera controls (rotation, panning, zoom).
     * These supplement the CameraController from BaseGame with
     * TD-specific drag behaviors and renderer pan offset.
     */
    _bindCanvasCamera() {
        const canvas = this.canvas;
        let isDragging = false;
        let isPanning = false;
        let lastMouse = { x: 0, y: 0 };

        // Left drag = rotate (shift+drag), Middle/Ctrl+drag = pan
        canvas.addEventListener('mousedown', e => {
            if (e.button === 1 || (e.button === 0 && e.ctrlKey)) {
                isPanning = true;
                lastMouse = { x: e.clientX, y: e.clientY };
                e.preventDefault();
            } else if (e.button === 2 || (e.button === 0 && e.shiftKey)) {
                isDragging = true;
                lastMouse = { x: e.clientX, y: e.clientY };
                e.preventDefault();
            }
        });

        canvas.addEventListener('mousemove', e => {
            if (isDragging) {
                this.renderer.rotY += (e.clientX - lastMouse.x) * 0.006;
                this.renderer.rotX += (e.clientY - lastMouse.y) * 0.006;
                this.renderer.rotX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.renderer.rotX));
                lastMouse = { x: e.clientX, y: e.clientY };
            }
            if (isPanning) {
                this.renderer.panX += (e.clientX - lastMouse.x);
                this.renderer.panY += (e.clientY - lastMouse.y);
                lastMouse = { x: e.clientX, y: e.clientY };
            }
        });

        canvas.addEventListener('mouseup', () => {
            isDragging = false;
            isPanning = false;
        });

        canvas.addEventListener('mouseleave', () => {
            isDragging = false;
            isPanning = false;
        });

        canvas.addEventListener('wheel', e => {
            e.preventDefault();
            const zoom = e.deltaY > 0 ? 0.92 : 1.08;
            this.renderer.scale = Math.max(30, Math.min(160, this.renderer.scale * zoom));
        }, { passive: false });
    }

    // ─── Click Handling ─────────────────────────────────────────────────
    _handleClick(e) {
        const board = this.board;
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;

        // Check if clicking an existing tower first
        for (const t of board.towers) {
            const p = this.renderer._projectQ(t.pos);
            if (Math.hypot(p.x - mx, p.y - my) < 18) {
                this.selectedTowerInstance = t;
                this.selectedTowerType = null;
                this._updateUI();
                return;
            }
        }

        // Otherwise try to place a tower
        if (!this.selectedTowerType) return;
        const hovered = this.renderer.hoveredNode;
        if (!hovered) return;

        const success = board.placeTower(hovered, this.selectedTowerType);
        if (success) {
            this.scoring.addScore(10); // Small score for building
            this._updateUI();
        }
    }

    // ─── Tower Upgrade ──────────────────────────────────────────────────
    upgradeSelected() {
        if (!this.selectedTowerInstance) return;
        const success = this.board.upgradeTower(this.selectedTowerInstance);
        if (success) this._updateUI();
    }

    // ─── Tower Sell ─────────────────────────────────────────────────────
    sellSelected() {
        if (!this.selectedTowerInstance) return;
        this.board.sellTower(this.selectedTowerInstance);
        this.selectedTowerInstance = null;
        this._updateUI();
    }

    // ─── Speed Toggle ───────────────────────────────────────────────────
    toggleSpeed() {
        const speeds = [1, 2, 3];
        const idx = speeds.indexOf(this.board.speed);
        this.board.speed = speeds[(idx + 1) % speeds.length];
        this._updateSpeedButtons();
    }

    setSpeed(s) {
        this.board.speed = s;
        this._updateSpeedButtons();
    }

    // ─── Send Next Wave ─────────────────────────────────────────────────
    sendNextWave() {
        if (!this.board.waveActive && this.board.waveCountdown > 0) {
            this.board.waveCountdown = 0;
            this.board.spawnWave();
        }
    }

    // ─── Auto-Wave Toggle ───────────────────────────────────────────────
    toggleAutoWave() {
        this.autoWave = !this.autoWave;
        if (typeof updateAutoWaveBtn === 'function') updateAutoWaveBtn();
    }

    /**
     * Override BaseGame._getHUDState() -- rich status with wave/lives/gold info.
     * @returns {{ text: string, color: string }}
     */
    _getHUDState() {
        const meta = this.board.getMetadata();
        const scoreLabel = ` | Score: ${meta.score} | High: ${this.scoring.highScore}`;

        if (meta.gameOver) {
            return {
                text: `GAME OVER | Wave: ${meta.wave} | Kills: ${meta.totalKills}${scoreLabel} | Press R`,
                color: '#f87171',
            };
        }

        const livesColor = meta.lives <= 5 ? '#ff4444' : '#55cc55';
        const waveInfo = meta.waveActive ? `Wave ${meta.wave}` : `Prep (${Math.ceil(meta.waveCountdown / 60)}s)`;

        return {
            text: `${waveInfo} | Lives: ${meta.lives} | Gold: ${meta.gold} | Towers: ${meta.towerCount} (${meta.totalTV} TV)${scoreLabel}`,
            color: meta.lives <= 5 ? '#fb923c' : '#94a3b8',
        };
    }

    // ─── UI Updates ─────────────────────────────────────────────────────
    _updateUI() {
        this._updateTowerButtons();
        this._updateSpeedButtons();
        this._updateSidebar();
    }

    _updateTowerButtons() {
        document.querySelectorAll('.tower-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tower === this.selectedTowerType);
        });
    }

    _updateSpeedButtons() {
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.speed) === this.board.speed);
        });
    }

    _updateSidebar() {
        const board = this.board;
        const meta = board.getMetadata();

        // Stats
        const statEl = document.getElementById('statLabel');
        if (statEl) {
            statEl.innerHTML = `
                <div class="stat-row"><span>\u2665 Lives</span><span class="val ${board.lives <= 5 ? 'danger' : ''}">${board.lives}</span></div>
                <div class="stat-row"><span>\u25C6 Gold</span><span class="val gold">${board.gold}</span></div>
                <div class="stat-row"><span>Score</span><span class="val">${board.score}</span></div>
                <div class="stat-row"><span>Kills</span><span class="val">${board.totalKills}</span></div>
            `;
        }

        // Synergetics
        const wpEl = document.getElementById('waypointLabel');
        if (wpEl) wpEl.textContent = meta.waypointCount;
        const tvEl = document.getElementById('towerTVLabel');
        if (tvEl) tvEl.textContent = meta.towerCount > 0 ? `${meta.towerCount} (${meta.totalTV} TV)` : '\u2014';
        const rvEl = document.getElementById('rangeTVLabel');
        if (rvEl) rvEl.textContent = meta.towerCount > 0 ? meta.totalRangeTV.toFixed(1) : '\u2014';
        const polyEl = document.getElementById('polyLabel');
        if (polyEl) polyEl.textContent = `T:${meta.tetraCount} O:${meta.octaCount} C:${meta.cuboCount} R:${meta.rhombicCount}`;

        // Selected tower panel
        const infoPanel = document.getElementById('towerInfoPanel');
        if (infoPanel) {
            if (this.selectedTowerInstance) {
                const t = this.selectedTowerInstance;
                const def = TOWER_TYPES[t.type];
                const upCost = t.getUpgradeCost();
                const sellVal = t.getSellValue();
                infoPanel.style.display = '';
                infoPanel.innerHTML = `
                    <h3 class="tower-info-name" style="color:${def.color}">${def.symbol} ${def.name} Lv${t.level}</h3>
                    <div class="stat-row"><span>Damage</span><span class="val">${t.damage}</span></div>
                    <div class="stat-row"><span>Range</span><span class="val">${t.range.toFixed(1)}</span></div>
                    <div class="stat-row"><span>Fire Rate</span><span class="val">${t.fireRate}ms</span></div>
                    <div class="stat-row"><span>Kills</span><span class="val">${t.kills}</span></div>
                    <div class="tower-info-actions">
                        ${upCost > 0 ? `<button class="action-btn upgrade-btn" onclick="game.upgradeSelected()" ${this.board.gold < upCost ? 'disabled' : ''}>Upgrade (${upCost}g)</button>` : '<span class="tower-info-maxed">MAX LEVEL</span>'}
                        <button class="action-btn sell-btn" onclick="game.sellSelected()">Sell (${sellVal}g)</button>
                    </div>
                `;
            } else {
                infoPanel.style.display = 'none';
            }
        }

        // Wave label
        const waveEl = document.getElementById('waveLabel');
        if (waveEl) waveEl.textContent = board.wave;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TDGame };
}
