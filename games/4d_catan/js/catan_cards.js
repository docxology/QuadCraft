/**
 * catan_cards.js — Development Card System for 4D Catan
 * Card types: Knight(14), VictoryPoint(5), RoadBuilding(2), YearOfPlenty(2), Monopoly(2)
 */

// DevCardType is defined in catan_board.js (loaded first)

const DEV_CARD_LABELS = {
    [DevCardType.KNIGHT]: 'Knight',
    [DevCardType.VICTORY_POINT]: 'Victory Point',
    [DevCardType.ROAD_BUILDING]: 'Road Building',
    [DevCardType.YEAR_OF_PLENTY]: 'Year of Plenty',
    [DevCardType.MONOPOLY]: 'Monopoly'
};

const DEV_CARD_COST = BUILD_COSTS.devCard;

class CardDeck {
    constructor() {
        this.cards = [];
        this._init();
        this.shuffle();
    }

    _init() {
        this.cards = [];
        for (let i = 0; i < 14; i++) this.cards.push(DevCardType.KNIGHT);
        for (let i = 0; i < 5; i++) this.cards.push(DevCardType.VICTORY_POINT);
        for (let i = 0; i < 2; i++) this.cards.push(DevCardType.ROAD_BUILDING);
        for (let i = 0; i < 2; i++) this.cards.push(DevCardType.YEAR_OF_PLENTY);
        for (let i = 0; i < 2; i++) this.cards.push(DevCardType.MONOPOLY);
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    draw() {
        if (this.cards.length === 0) return null;
        return this.cards.pop();
    }

    remaining() {
        return this.cards.length;
    }
}

function playKnight(game) {
    const p = game.board.players[game.board.currentPlayer];
    const idx = p.devCards.indexOf(DevCardType.KNIGHT);
    if (idx === -1) return false;
    // Cannot play a card bought this turn
    if (p.cardsBoughtThisTurn && p.cardsBoughtThisTurn.includes(DevCardType.KNIGHT)) return false;
    if (p.playedDevCardThisTurn) return false;
    p.devCards.splice(idx, 1);
    p.knightsPlayed = (p.knightsPlayed || 0) + 1;
    p.playedDevCardThisTurn = true;
    game.startRobberPlacement();
    console.log(`[Catan] ${p.name} played Knight (#${p.knightsPlayed})`);
    return true;
}

function playRoadBuilding(game) {
    const p = game.board.players[game.board.currentPlayer];
    const idx = p.devCards.indexOf(DevCardType.ROAD_BUILDING);
    if (idx === -1) return false;
    if (p.cardsBoughtThisTurn && p.cardsBoughtThisTurn.includes(DevCardType.ROAD_BUILDING)) return false;
    if (p.playedDevCardThisTurn) return false;
    p.devCards.splice(idx, 1);
    p.playedDevCardThisTurn = true;
    game.freeRoads = 2;
    game.phase = TurnPhase.BUILD;
    game.buildMode = 'road';
    console.log(`[Catan] ${p.name} played Road Building (2 free roads)`);
    return true;
}

function playYearOfPlenty(game, res1, res2) {
    const p = game.board.players[game.board.currentPlayer];
    const idx = p.devCards.indexOf(DevCardType.YEAR_OF_PLENTY);
    if (idx === -1) return false;
    if (p.cardsBoughtThisTurn && p.cardsBoughtThisTurn.includes(DevCardType.YEAR_OF_PLENTY)) return false;
    if (p.playedDevCardThisTurn) return false;
    p.devCards.splice(idx, 1);
    p.playedDevCardThisTurn = true;
    p.resources[res1] = (p.resources[res1] || 0) + 1;
    p.resources[res2] = (p.resources[res2] || 0) + 1;
    console.log(`[Catan] ${p.name} played Year of Plenty: +1 ${res1}, +1 ${res2}`);
    return true;
}

function playMonopoly(game, resource) {
    const p = game.board.players[game.board.currentPlayer];
    const idx = p.devCards.indexOf(DevCardType.MONOPOLY);
    if (idx === -1) return false;
    if (p.cardsBoughtThisTurn && p.cardsBoughtThisTurn.includes(DevCardType.MONOPOLY)) return false;
    if (p.playedDevCardThisTurn) return false;
    p.devCards.splice(idx, 1);
    p.playedDevCardThisTurn = true;
    let stolen = 0;
    for (const other of game.board.players) {
        if (other === p) continue;
        const amt = other.resources[resource] || 0;
        stolen += amt;
        other.resources[resource] = 0;
    }
    p.resources[resource] = (p.resources[resource] || 0) + stolen;
    console.log(`[Catan] ${p.name} played Monopoly on ${resource}: stole ${stolen}`);
    return true;
}
