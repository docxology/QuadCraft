/**
 * catan_ai.js — AI Opponent for 4D Catan
 * Player 2 (Blue) automated turns: roll, trade, build, dev cards
 */

// 2d6 probability distribution: how many combos yield each sum
const DICE_PROB = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1 };

function aiScoreTile(tile) {
    if (tile.resource === ResourceType.DESERT) return 0;
    return DICE_PROB[tile.number] || 0;
}

function aiScoreSettlementSpot(board, pos) {
    let score = 0;
    const resourceSet = new Set();
    for (const tile of board.tiles) {
        const dist = Math.abs(tile.pos.a - pos.a) + Math.abs(tile.pos.b - pos.b);
        if (dist <= 1 && tile.resource !== ResourceType.DESERT) {
            score += aiScoreTile(tile);
            resourceSet.add(tile.resource);
        }
    }
    // Bonus for resource diversity
    score += resourceSet.size * 2;
    return score;
}

function aiFindBestSettlement(board, playerIdx) {
    const p = board.players[playerIdx];
    let bestPos = null;
    let bestScore = -1;

    for (const tile of board.tiles) {
        const pos = tile.pos;
        // Check not already occupied
        let occupied = false;
        for (const pl of board.players) {
            if (pl.settlements.some(s => s.a === pos.a && s.b === pos.b && s.c === pos.c && s.d === pos.d)) {
                occupied = true;
                break;
            }
        }
        if (occupied) continue;

        // Check distance rule (>= 2 edges from other settlements)
        let tooClose = false;
        for (const pl of board.players) {
            for (const s of pl.settlements) {
                const d = Math.abs(s.a - pos.a) + Math.abs(s.b - pos.b) + Math.abs(s.c - pos.c) + Math.abs(s.d - pos.d);
                if (d < 2 && d > 0) { tooClose = true; break; }
            }
            if (tooClose) break;
        }
        if (tooClose) continue;

        const score = aiScoreSettlementSpot(board, pos);
        if (score > bestScore) {
            bestScore = score;
            bestPos = { ...pos };
        }
    }
    return bestPos;
}

function aiFindBestRoad(board, playerIdx) {
    const p = board.players[playerIdx];
    if (p.settlements.length === 0) return null;
    // Build road extending from a settlement toward unexplored directions
    const from = p.settlements[p.settlements.length - 1];
    // Try small offsets from last settlement
    const offsets = [
        { a: 1, b: 0, c: 0, d: 0 }, { a: 0, b: 1, c: 0, d: 0 },
        { a: 0, b: 0, c: 1, d: 0 }, { a: 0, b: 0, c: 0, d: 1 },
        { a: -1, b: 0, c: 0, d: 0 }, { a: 0, b: -1, c: 0, d: 0 }
    ];
    for (const off of offsets) {
        const to = { a: from.a + off.a, b: from.b + off.b, c: from.c + off.c, d: from.d + off.d };
        // Check not duplicate road
        const dup = p.roads.some(r =>
            (r.from.a === from.a && r.from.b === from.b && r.to.a === to.a && r.to.b === to.b) ||
            (r.from.a === to.a && r.from.b === to.b && r.to.a === from.a && r.to.b === from.b)
        );
        if (!dup) return { from: { ...from }, to };
    }
    return null;
}

function aiTryTrade(board, playerIdx) {
    const p = board.players[playerIdx];
    // If we have 4+ of something, trade for what we need most
    const resTypes = [ResourceType.WOOD, ResourceType.BRICK, ResourceType.WHEAT, ResourceType.SHEEP, ResourceType.ORE];
    let minRes = null, minAmt = Infinity;
    let maxRes = null, maxAmt = 0;

    for (const r of resTypes) {
        const amt = p.resources[r] || 0;
        if (amt < minAmt) { minAmt = amt; minRes = r; }
        if (amt > maxAmt) { maxAmt = amt; maxRes = r; }
    }

    if (maxAmt >= 4 && minRes !== maxRes) {
        tradeBankDefault(p, maxRes, minRes);
    }
}

function aiTurn(game) {
    const board = game.board;
    const pi = board.currentPlayer;
    const p = board.players[pi];

    // Phase 1: Roll dice
    board.rollDice();
    const sum = board.dice[0] + board.dice[1];
    console.log(`[AI] ${p.name} rolled ${sum}`);

    // Handle robber on 7
    if (sum === 7) {
        // Auto discard handled by handleRobberRoll
        for (const player of board.players) {
            const total = totalResources(player);
            if (total > 7) {
                const discardCount = Math.floor(total / 2);
                const pool = [];
                for (const [res, amt] of Object.entries(player.resources)) {
                    for (let i = 0; i < amt; i++) pool.push(res);
                }
                for (let i = pool.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [pool[i], pool[j]] = [pool[j], pool[i]];
                }
                for (let i = 0; i < discardCount; i++) {
                    player.resources[pool[i]]--;
                }
            }
        }
        // Move robber to highest-value non-desert tile not already robbed
        let bestTile = 0, bestVal = -1;
        for (let i = 0; i < board.tiles.length; i++) {
            const t = board.tiles[i];
            if (t === board.robber || t.resource === ResourceType.DESERT) continue;
            // Prefer tiles adjacent to opponent settlements
            const hasOpponent = board.players.some((pl, idx) =>
                idx !== pi && pl.settlements.some(s =>
                    Math.abs(s.a - t.pos.a) + Math.abs(s.b - t.pos.b) <= 1
                )
            );
            const val = aiScoreTile(t) + (hasOpponent ? 10 : 0);
            if (val > bestVal) { bestVal = val; bestTile = i; }
        }
        moveRobber(game, bestTile);
    } else {
        // Distribute resources (already done by rollDice for non-robber tiles)
    }

    // Phase 2: Try trading
    aiTryTrade(board, pi);

    // Phase 3: Build — prioritize city > settlement > dev card > road
    // Try city upgrade first
    if (canAfford(p, { ore: 3, wheat: 2 })) {
        // Find a settlement to upgrade
        for (let i = 0; i < p.settlements.length; i++) {
            if (!p.settlements[i].isCity) {
                board.upgradeToCity(pi, i);
                console.log(`[AI] ${p.name} upgraded to city`);
                break;
            }
        }
    }

    // Try building settlement
    if (canAfford(p, { wood: 1, brick: 1, wheat: 1, sheep: 1 })) {
        const pos = aiFindBestSettlement(board, pi);
        if (pos) {
            board.buildSettlement(pi, pos);
            console.log(`[AI] ${p.name} built settlement`);
        }
    }

    // Buy dev card if affordable and no better option
    if (canAfford(p, DEV_CARD_COST) && game.deck.remaining() > 0) {
        deductCost(p, DEV_CARD_COST);
        const card = game.deck.draw();
        if (card) {
            p.devCards.push(card);
            if (card === DevCardType.VICTORY_POINT) {
                p.points++;
                console.log(`[AI] ${p.name} got VP card!`);
            } else {
                console.log(`[AI] ${p.name} bought dev card`);
            }
        }
    }

    // Try building road
    if (canAfford(p, { wood: 1, brick: 1 })) {
        const road = aiFindBestRoad(board, pi);
        if (road) {
            board.buildRoad(pi, road.from, road.to);
            console.log(`[AI] ${p.name} built road`);
        }
    }

    // Play knight if we have one (and didn't buy it this turn)
    const knightIdx = p.devCards.indexOf(DevCardType.KNIGHT);
    if (knightIdx !== -1 && !p.playedDevCardThisTurn &&
        !(p.cardsBoughtThisTurn && p.cardsBoughtThisTurn.includes(DevCardType.KNIGHT))) {
        // AI plays knight: move robber to best spot
        p.devCards.splice(knightIdx, 1);
        p.knightsPlayed = (p.knightsPlayed || 0) + 1;
        let bestTile = 0, bestVal = -1;
        for (let i = 0; i < board.tiles.length; i++) {
            const t = board.tiles[i];
            if (t === board.robber || t.resource === ResourceType.DESERT) continue;
            const val = aiScoreTile(t);
            if (val > bestVal) { bestVal = val; bestTile = i; }
        }
        moveRobber(game, bestTile);
        console.log(`[AI] ${p.name} played Knight`);
    }

    // Recalculate points
    board.recalcPoints();
}
