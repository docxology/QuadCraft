/**
 * catan_robber.js — Robber Mechanics for 4D Catan
 * Roll 7: discard, move robber, steal resource
 */

function totalResources(player) {
    let total = 0;
    for (const res of Object.values(player.resources)) {
        total += (res || 0);
    }
    return total;
}

function handleRobberRoll(game) {
    // Each player with >7 cards must discard half (auto-discard random)
    for (const player of game.board.players) {
        const total = totalResources(player);
        if (total > 7) {
            const discardCount = Math.floor(total / 2);
            let discarded = 0;
            // Build a pool of owned resources and randomly discard
            const pool = [];
            for (const [res, amt] of Object.entries(player.resources)) {
                for (let i = 0; i < amt; i++) pool.push(res);
            }
            // Shuffle pool
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }
            // Discard from shuffled pool
            for (let i = 0; i < discardCount && i < pool.length; i++) {
                player.resources[pool[i]]--;
                discarded++;
            }
            console.log(`[Catan] ${player.name} discarded ${discarded} cards (had ${total})`);
        }
    }
    // Now current player must move robber
    game.startRobberPlacement();
}

function moveRobber(game, tileIdx) {
    const board = game.board;
    const tile = board.tiles[tileIdx];
    if (!tile) return false;
    if (tile === board.robber) return false; // Must move to a different tile

    board.robber = tile;

    // Steal a random resource from a player with a settlement adjacent to this tile
    const currentPlayer = board.players[board.currentPlayer];
    for (const other of board.players) {
        if (other === currentPlayer) continue;
        const adjacent = other.settlements.filter(s => {
            return Math.abs(s.a - tile.pos.a) + Math.abs(s.b - tile.pos.b) <= 1;
        });
        if (adjacent.length > 0) {
            // Steal one random resource
            const pool = [];
            for (const [res, amt] of Object.entries(other.resources)) {
                for (let i = 0; i < amt; i++) pool.push(res);
            }
            if (pool.length > 0) {
                const stolen = pool[Math.floor(Math.random() * pool.length)];
                other.resources[stolen]--;
                currentPlayer.resources[stolen] = (currentPlayer.resources[stolen] || 0) + 1;
                console.log(`[Catan] ${currentPlayer.name} stole 1 ${stolen} from ${other.name}`);
            }
            break; // Only steal from one player
        }
    }
    return true;
}

function robberBlocks(board, tileIdx) {
    return board.robber === board.tiles[tileIdx];
}
