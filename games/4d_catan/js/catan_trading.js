/**
 * catan_trading.js — Trading System for 4D Catan
 * Bank trades at 4:1, 3:1 (generic port), 2:1 (specific port)
 */

const PortType = {
    GENERIC_3_1: 'generic_3_1',
    WOOD_2_1: 'wood_2_1',
    BRICK_2_1: 'brick_2_1',
    WHEAT_2_1: 'wheat_2_1',
    SHEEP_2_1: 'sheep_2_1',
    ORE_2_1: 'ore_2_1'
};

const PORT_RESOURCE_MAP = {
    [PortType.WOOD_2_1]: ResourceType.WOOD,
    [PortType.BRICK_2_1]: ResourceType.BRICK,
    [PortType.WHEAT_2_1]: ResourceType.WHEAT,
    [PortType.SHEEP_2_1]: ResourceType.SHEEP,
    [PortType.ORE_2_1]: ResourceType.ORE
};

// canAfford and deductCost are defined in catan_board.js (loaded first)

function tradeBankDefault(player, give4, receive1) {
    if (give4 === receive1) return false;
    if ((player.resources[give4] || 0) < 4) return false;
    player.resources[give4] -= 4;
    player.resources[receive1] = (player.resources[receive1] || 0) + 1;
    console.log(`[Catan] ${player.name} traded 4 ${give4} for 1 ${receive1}`);
    return true;
}

function tradeBank31(player, give3, receive1) {
    if (give3 === receive1) return false;
    if ((player.resources[give3] || 0) < 3) return false;
    player.resources[give3] -= 3;
    player.resources[receive1] = (player.resources[receive1] || 0) + 1;
    console.log(`[Catan] ${player.name} traded 3 ${give3} for 1 ${receive1} (3:1 port)`);
    return true;
}

function tradeBank21(player, give2, receive1) {
    if (give2 === receive1) return false;
    if ((player.resources[give2] || 0) < 2) return false;
    player.resources[give2] -= 2;
    player.resources[receive1] = (player.resources[receive1] || 0) + 1;
    console.log(`[Catan] ${player.name} traded 2 ${give2} for 1 ${receive1} (2:1 port)`);
    return true;
}

/**
 * Get the best trade ratio available for a player giving a specific resource.
 * For now, all players have default 4:1. Ports could be added via board positions.
 */
function getBestTradeRatio(player, resource) {
    // Check for 2:1 port access
    if (player.ports) {
        for (const port of player.ports) {
            const mapped = PORT_RESOURCE_MAP[port];
            if (mapped === resource) return 2;
            if (port === PortType.GENERIC_3_1) return 3;
        }
    }
    return 4; // Default bank trade
}

function executeBestTrade(player, give, receive) {
    const ratio = getBestTradeRatio(player, give);
    if ((player.resources[give] || 0) < ratio) return false;
    if (give === receive) return false;
    player.resources[give] -= ratio;
    player.resources[receive] = (player.resources[receive] || 0) + 1;
    console.log(`[Catan] ${player.name} traded ${ratio} ${give} for 1 ${receive}`);
    return true;
}
