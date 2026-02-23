/**
 * rogue_board.js — 4D Rogue on IVM Grid
 *
 * Procedural dungeon crawl with inventory, experience, FOV,
 * pathfinding enemy AI, and multiple enemy types — all on the
 * Quadray/IVM tetrahedral grid.
 *
 * Uses:
 *   - Quadray: toKey, cellType, toIVM, toCartesian
 *   - GridUtils: generateGrid, neighbors, boundedNeighbors, inBounds, shuffle, key
 *   - QuadrayPathfinder: shortestPath, lineOfSight, cellsInRange, floodFill
 *   - BaseBoard: grid ops, distances, metadata
 *   - TurnManager: player/enemy alternation
 *   - SYNERGETICS: constants
 *
 * @module RogueBoard
 */

// Node.js compatibility
if (typeof Quadray === 'undefined' && typeof require !== 'undefined') {
    const _q = require('../../4d_generic/quadray.js'); globalThis.Quadray = _q.Quadray;
}
if (typeof GridUtils === 'undefined' && typeof require !== 'undefined') {
    const _g = require('../../4d_generic/grid_utils.js'); globalThis.GridUtils = _g.GridUtils;
}
if (typeof BaseBoard === 'undefined' && typeof require !== 'undefined') {
    const _bb = require('../../4d_generic/base_board.js'); globalThis.BaseBoard = _bb.BaseBoard;
}
if (typeof SYNERGETICS === 'undefined' && typeof require !== 'undefined') {
    const _s = require('../../4d_generic/synergetics.js');
    globalThis.SYNERGETICS = _s.SYNERGETICS;
    globalThis.verifyRoundTrip = _s.verifyRoundTrip;
    globalThis.verifyGeometricIdentities = _s.verifyGeometricIdentities;
}
if (typeof TurnManager === 'undefined' && typeof require !== 'undefined') {
    const _t = require('../../4d_generic/turn_manager.js'); globalThis.TurnManager = _t.TurnManager;
}
if (typeof QuadrayPathfinder === 'undefined' && typeof require !== 'undefined') {
    const _pf = require('../../4d_generic/pathfinding.js'); globalThis.QuadrayPathfinder = _pf.QuadrayPathfinder;
}

/** Tile type constants */
const TILE = {
    FLOOR: 0, WALL: 1, PLAYER: 2, ENEMY: 3,
    STAIRS: 4, POTION: 5, GOLD: 6,
    WEAPON: 7, ARMOR: 8,
};

/** Enemy type definitions */
const ENEMY_TYPES = {
    goblin: { name: 'Goblin', hp: 3, atk: 1, def: 0, xp: 5, speed: 2, symbol: 'g', color: '#27ae60', chaseRange: 5 },
    skeleton: { name: 'Skeleton', hp: 5, atk: 2, def: 1, xp: 10, speed: 1, symbol: 's', color: '#bdc3c7', chaseRange: 6 },
    ogre: { name: 'Ogre', hp: 10, atk: 4, def: 2, xp: 20, speed: 1, symbol: 'O', color: '#8e44ad', chaseRange: 4 },
    wraith: { name: 'Wraith', hp: 7, atk: 3, def: 0, xp: 25, speed: 1, symbol: 'W', color: '#2980b9', chaseRange: 8, phasing: true },
};

class RogueBoard extends BaseBoard {

    constructor(size = 8) {
        super(size, { name: 'RogueBoard', verify: true });
        this.turns = new TurnManager(['player', 'enemies']);

        // Player state
        this.player = null;
        this.hp = 20;
        this.maxHp = 20;
        this.baseAtk = 3;
        this.baseDef = 0;
        this.xp = 0;
        this.level = 1;
        this.xpToLevel = 20;

        // Inventory
        this.gold = 0;
        this.weapon = null;   // { name, bonus }
        this.armor = null;    // { name, bonus }
        this.potions = 3;

        // Dungeon state
        this.depth = 1;
        this.moveCount = 0;
        this.enemies = [];
        this.items = [];      // { pos, type, data }
        this.combatLog = [];  // Recent combat messages
        this.maxLog = 8;

        // FOV
        this.visible = new Set();   // Keys of currently visible cells
        this.explored = new Set();  // Keys of ever-seen cells

        // Grid
        this.cells = GridUtils.generateGrid(size);
        this._generateDungeon();

        console.log(`[RogueBoard] ${size}⁴ IVM dungeon, depth ${this.depth}`);
    }

    // ─── Dungeon Generation ─────────────────────────────────────────

    /** Generate a new dungeon level with rooms, corridors, enemies, and items. */
    _generateDungeon() {
        // Clear grid
        for (const c of this.cells) this.setCell(c, TILE.WALL);

        // Carve rooms using random walk with branching
        const mid = Math.floor(this.size / 2);
        const start = { a: mid, b: mid, c: mid, d: mid };
        const carved = new Set();
        const queue = [start];
        const targetCells = Math.floor(this.cells.length * 0.45);

        while (queue.length > 0 && carved.size < targetCells) {
            const cur = queue.shift();
            const k = this.key(cur.a, cur.b, cur.c, cur.d);
            if (carved.has(k)) continue;
            carved.add(k);
            this.setCell(cur, TILE.FLOOR);

            const nbrs = GridUtils.boundedNeighbors(cur.a, cur.b, cur.c, cur.d, this.size);
            GridUtils.shuffle(nbrs);
            const branches = Math.random() < 0.6 ? 3 : (Math.random() < 0.3 ? 4 : 2);
            for (const n of nbrs.slice(0, branches)) queue.push(n);
        }

        const floors = this.cells.filter(c => this.getCell(c) === TILE.FLOOR);
        GridUtils.shuffle(floors);

        if (floors.length < 5) {
            // Fallback: ensure minimum dungeon size
            for (let i = 0; i < 5 && i < this.cells.length; i++) {
                this.setCell(this.cells[i], TILE.FLOOR);
            }
            return this._generateDungeon(); // retry
        }

        let idx = 0;

        // Place player
        this.player = floors[idx++];
        this.setCell(this.player, TILE.PLAYER);

        // Place stairs (verify reachable using pathfinding)
        let stairsPlaced = false;
        const isWalkable = (pos) => {
            const tile = this.getCell(pos);
            return tile !== TILE.WALL;
        };
        for (let i = Math.floor(floors.length * 0.6); i < floors.length; i++) {
            const path = QuadrayPathfinder.bfs(this.player, floors[i], isWalkable, this.size);
            if (path && path.length > 3) {
                this.setCell(floors[i], TILE.STAIRS);
                stairsPlaced = true;
                break;
            }
        }
        if (!stairsPlaced && idx < floors.length) {
            this.setCell(floors[floors.length - 1], TILE.STAIRS);
        }

        // Spawn enemies — variety scales with depth
        this.enemies = [];
        const numEnemies = Math.min(3 + this.depth, Math.floor(floors.length / 8));
        const enemyPool = this._getEnemyPool();

        for (let i = 0; i < numEnemies && idx < floors.length; i++) {
            const pos = floors[idx++];
            const typeName = enemyPool[Math.floor(Math.random() * enemyPool.length)];
            const template = ENEMY_TYPES[typeName];
            this.enemies.push({
                pos,
                type: typeName,
                name: template.name,
                hp: template.hp + Math.floor(this.depth * 0.5),
                maxHp: template.hp + Math.floor(this.depth * 0.5),
                atk: template.atk + Math.floor(this.depth * 0.3),
                def: template.def,
                xp: template.xp + this.depth * 2,
                speed: template.speed,
                symbol: template.symbol,
                color: template.color,
                chaseRange: template.chaseRange,
                phasing: template.phasing || false,
            });
            this.setCell(pos, TILE.ENEMY);
        }

        // Spawn items
        this.items = [];
        this._spawnItems(floors, idx);

        // Compute initial FOV
        this._computeFOV();

        this._log(`Entered dungeon depth ${this.depth}`);
    }

    /** Get the enemy pool based on current depth. */
    _getEnemyPool() {
        if (this.depth <= 2) return ['goblin'];
        if (this.depth <= 4) return ['goblin', 'skeleton'];
        if (this.depth <= 6) return ['goblin', 'skeleton', 'ogre'];
        return ['skeleton', 'ogre', 'wraith'];
    }

    /** Spawn items on floor tiles starting from index. */
    _spawnItems(floors, startIdx) {
        let idx = startIdx;
        const itemCount = 2 + Math.floor(this.depth * 0.5);

        for (let i = 0; i < itemCount && idx < floors.length; i++) {
            const pos = floors[idx++];
            const roll = Math.random();

            if (roll < 0.4) {
                // Gold pile
                const amount = 5 + Math.floor(Math.random() * 10 * this.depth);
                this.setCell(pos, TILE.GOLD);
                this.items.push({ pos, type: 'gold', data: { amount } });
            } else if (roll < 0.65) {
                // Potion
                this.setCell(pos, TILE.POTION);
                this.items.push({ pos, type: 'potion', data: { heal: 5 + this.depth } });
            } else if (roll < 0.85) {
                // Weapon
                const bonus = 1 + Math.floor(Math.random() * this.depth);
                const names = ['Dagger', 'Short Sword', 'Mace', 'Axe', 'Halberd'];
                const name = names[Math.min(bonus - 1, names.length - 1)];
                this.setCell(pos, TILE.WEAPON);
                this.items.push({ pos, type: 'weapon', data: { name, bonus } });
            } else {
                // Armor
                const bonus = 1 + Math.floor(Math.random() * Math.ceil(this.depth / 2));
                const names = ['Leather', 'Chain Mail', 'Plate', 'Dragon Scale'];
                const name = names[Math.min(bonus - 1, names.length - 1)];
                this.setCell(pos, TILE.ARMOR);
                this.items.push({ pos, type: 'armor', data: { name, bonus } });
            }
        }
    }

    // ─── FOV (Field of View) ────────────────────────────────────────

    /** Compute visible cells from the player's position using lineOfSight. */
    _computeFOV() {
        this.visible = new Set();
        if (!this.player) return;

        // Player's own cell is always visible
        const pk = this.key(this.player.a, this.player.b, this.player.c, this.player.d);
        this.visible.add(pk);
        this.explored.add(pk);

        // Cast rays along all 12 IVM directions
        const directions = GridUtils.DIRECTIONS;
        const isBlocking = (pos) => this.getCell(pos) === TILE.WALL;
        const fovRange = 5;

        for (const dir of directions) {
            const cells = QuadrayPathfinder.lineOfSight(
                this.player, dir, isBlocking, this.size, fovRange
            );
            for (const c of cells) {
                const k = this.key(c.a, c.b, c.c, c.d);
                this.visible.add(k);
                this.explored.add(k);
            }
        }

        // Also mark adjacent cells of visible cells for smoother FOV
        const extraVisible = new Set();
        for (const k of this.visible) {
            // Parse key back to coords (key format: "a,b,c,d")
            const parts = k.split(',').map(Number);
            if (parts.length === 4) {
                const nbrs = GridUtils.boundedNeighbors(parts[0], parts[1], parts[2], parts[3], this.size);
                for (const n of nbrs) {
                    if (this.getCell(n) !== TILE.WALL) {
                        const nk = this.key(n.a, n.b, n.c, n.d);
                        extraVisible.add(nk);
                        this.explored.add(nk);
                    }
                }
            }
        }
        for (const k of extraVisible) this.visible.add(k);
    }

    /** Check if a position is currently visible to the player. */
    isVisible(pos) {
        return this.visible.has(this.key(pos.a, pos.b, pos.c, pos.d));
    }

    /** Check if a position has been explored (seen at least once). */
    isExplored(pos) {
        return this.explored.has(this.key(pos.a, pos.b, pos.c, pos.d));
    }

    // ─── Movement & Combat ──────────────────────────────────────────

    /**
     * Move player in a direction (0-11 for 12 IVM neighbors).
     * @param {number} dirIndex - Index into GridUtils.DIRECTIONS
     * @returns {string} Result: 'moved', 'attacked', 'blocked', 'stairs', 'dead', 'invalid'
     */
    move(dirIndex) {
        if (this.gameOver || dirIndex < 0 || dirIndex >= 12) return 'invalid';

        const nbrs = GridUtils.neighbors(this.player.a, this.player.b, this.player.c, this.player.d);
        const target = nbrs[dirIndex];
        if (!GridUtils.inBounds(target.a, target.b, target.c, target.d, this.size)) return 'blocked';

        const tile = this.getCell(target);

        // Wall
        if (tile === TILE.WALL) return 'blocked';

        // Enemy — attack
        if (tile === TILE.ENEMY) {
            const enemy = this.enemies.find(e =>
                e.pos.a === target.a && e.pos.b === target.b &&
                e.pos.c === target.c && e.pos.d === target.d
            );
            if (enemy) {
                this._playerAttack(enemy);
                this.moveCount++;
                this.turns.nextTurn();
                this._enemyTurn();
                this._computeFOV();
                return this.gameOver ? 'dead' : 'attacked';
            }
        }

        // Stairs — descend
        if (tile === TILE.STAIRS) {
            this.depth++;
            this._log(`Descended to depth ${this.depth}`);
            this._generateDungeon();
            return 'stairs';
        }

        // Pick up items
        if (tile === TILE.POTION || tile === TILE.GOLD || tile === TILE.WEAPON || tile === TILE.ARMOR) {
            this._pickupItem(target);
        }

        // Move player
        this.setCell(this.player, TILE.FLOOR);
        this.player = target;
        this.setCell(target, TILE.PLAYER);
        this.moveCount++;
        this.turns.nextTurn();
        this._enemyTurn();
        this._computeFOV();

        return this.gameOver ? 'dead' : 'moved';
    }

    /** Player attacks an enemy. */
    _playerAttack(enemy) {
        const weaponBonus = this.weapon ? this.weapon.bonus : 0;
        const totalAtk = this.baseAtk + weaponBonus;
        const damage = Math.max(1, totalAtk - enemy.def);
        enemy.hp -= damage;

        this._log(`You hit ${enemy.name} for ${damage} damage!`);

        if (enemy.hp <= 0) {
            this._log(`${enemy.name} defeated! +${enemy.xp} XP`);
            this.enemies = this.enemies.filter(e => e !== enemy);
            this.setCell(enemy.pos, TILE.FLOOR);
            this.xp += enemy.xp;
            this._checkLevelUp();
        }
    }

    /** Enemy attacks the player. */
    _enemyAttack(enemy) {
        const armorBonus = this.armor ? this.armor.bonus : 0;
        const totalDef = this.baseDef + armorBonus;
        const damage = Math.max(1, enemy.atk - totalDef);
        this.hp -= damage;

        this._log(`${enemy.name} hits you for ${damage}!`);

        if (this.hp <= 0) {
            this.hp = 0;
            this.gameOver = true;
            this._log(`☠️ You died on depth ${this.depth}!`);
        }
    }

    /** Check and apply level-up. */
    _checkLevelUp() {
        while (this.xp >= this.xpToLevel) {
            this.xp -= this.xpToLevel;
            this.level++;
            this.maxHp += 5;
            this.hp = Math.min(this.hp + 5, this.maxHp);
            this.baseAtk += 1;
            this.xpToLevel = Math.floor(this.xpToLevel * 1.5);
            this._log(`⬆️ Level ${this.level}! HP+5, ATK+1`);
        }
    }

    /** Pick up an item at position. */
    _pickupItem(pos) {
        const item = this.items.find(i =>
            i.pos.a === pos.a && i.pos.b === pos.b &&
            i.pos.c === pos.c && i.pos.d === pos.d
        );
        if (!item) return;

        switch (item.type) {
            case 'gold':
                this.gold += item.data.amount;
                this._log(`Found ${item.data.amount} gold!`);
                break;
            case 'potion':
                this.potions++;
                this._log(`Found a potion!`);
                break;
            case 'weapon':
                if (!this.weapon || item.data.bonus > this.weapon.bonus) {
                    this.weapon = item.data;
                    this._log(`Equipped ${item.data.name} (+${item.data.bonus} ATK)`);
                } else {
                    this.gold += item.data.bonus * 5;
                    this._log(`Sold ${item.data.name} for ${item.data.bonus * 5}g`);
                }
                break;
            case 'armor':
                if (!this.armor || item.data.bonus > this.armor.bonus) {
                    this.armor = item.data;
                    this._log(`Equipped ${item.data.name} (+${item.data.bonus} DEF)`);
                } else {
                    this.gold += item.data.bonus * 5;
                    this._log(`Sold ${item.data.name} for ${item.data.bonus * 5}g`);
                }
                break;
        }

        this.items = this.items.filter(i => i !== item);
    }

    /** Use a health potion. */
    usePotion() {
        if (this.potions <= 0 || this.gameOver) return false;
        const heal = 5 + this.depth;
        this.hp = Math.min(this.maxHp, this.hp + heal);
        this.potions--;
        this._log(`Used potion (+${heal} HP)`);
        return true;
    }

    // ─── Enemy AI (Pathfinding) ─────────────────────────────────────

    /** Execute all enemy turns using pathfinding AI. */
    _enemyTurn() {
        const isWalkable = (pos) => {
            const tile = this.getCell(pos);
            return tile !== TILE.WALL && tile !== TILE.ENEMY;
        };
        const isWalkablePhasing = (pos) => {
            const tile = this.getCell(pos);
            return tile !== TILE.ENEMY;
        };

        for (const enemy of this.enemies) {
            if (this.gameOver) break;

            // Calculate distance to player
            const dist = GridUtils.manhattan(enemy.pos, this.player);

            if (dist <= 1) {
                // Adjacent — attack player
                this._enemyAttack(enemy);
            } else if (dist <= enemy.chaseRange) {
                // In range — use pathfinding to chase player
                const walkFn = enemy.phasing ? isWalkablePhasing : isWalkable;
                const path = QuadrayPathfinder.shortestPath(
                    enemy.pos, this.player, walkFn, this.size
                );

                if (path && path.length >= 2) {
                    const nextPos = path[1]; // First step toward player
                    const nextTile = this.getCell(nextPos);

                    if (nextTile === TILE.PLAYER) {
                        this._enemyAttack(enemy);
                    } else if (nextTile === TILE.FLOOR || (enemy.phasing && nextTile === TILE.WALL)) {
                        this.setCell(enemy.pos, TILE.FLOOR);
                        enemy.pos = nextPos;
                        this.setCell(nextPos, TILE.ENEMY);
                    }
                }
            } else {
                // Out of range — random wander
                const nbrs = GridUtils.boundedNeighbors(
                    enemy.pos.a, enemy.pos.b, enemy.pos.c, enemy.pos.d, this.size
                );
                const walkable = nbrs.filter(n => this.getCell(n) === TILE.FLOOR);
                if (walkable.length > 0 && Math.random() < 0.3) {
                    const dest = walkable[Math.floor(Math.random() * walkable.length)];
                    this.setCell(enemy.pos, TILE.FLOOR);
                    enemy.pos = dest;
                    this.setCell(dest, TILE.ENEMY);
                }
            }
        }

        this.turns.nextTurn();
    }

    // ─── Utility ────────────────────────────────────────────────────

    /** Add a message to the combat log. */
    _log(msg) {
        this.combatLog.push(msg);
        if (this.combatLog.length > this.maxLog) this.combatLog.shift();
        console.log(`[Rogue] ${msg}`);
    }

    /** Get total attack power. */
    getAttack() {
        return this.baseAtk + (this.weapon ? this.weapon.bonus : 0);
    }

    /** Get total defense. */
    getDefense() {
        return this.baseDef + (this.armor ? this.armor.bonus : 0);
    }

    /** Get board metadata for HUD display. */
    getMetadata() {
        return {
            ...this._baseMetadata(),
            hp: this.hp,
            maxHp: this.maxHp,
            gold: this.gold,
            depth: this.depth,
            level: this.level,
            xp: this.xp,
            xpToLevel: this.xpToLevel,
            attack: this.getAttack(),
            defense: this.getDefense(),
            weapon: this.weapon,
            armor: this.armor,
            potions: this.potions,
            enemies: this.enemies.length,
            moveCount: this.moveCount,
            combatLog: [...this.combatLog],
            visibleCells: this.visible.size,
            exploredCells: this.explored.size,
        };
    }

    /** Reset everything to a fresh game. */
    reset() {
        this.hp = 20;
        this.maxHp = 20;
        this.baseAtk = 3;
        this.baseDef = 0;
        this.xp = 0;
        this.level = 1;
        this.xpToLevel = 20;
        this.gold = 0;
        this.weapon = null;
        this.armor = null;
        this.potions = 3;
        this.depth = 1;
        this.moveCount = 0;
        this.gameOver = false;
        this.combatLog = [];
        this.visible = new Set();
        this.explored = new Set();
        this._generateDungeon();
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RogueBoard, TILE, ENEMY_TYPES };
}