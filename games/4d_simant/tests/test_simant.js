(function () {
    'use strict';
    const S = typeof window === 'undefined' ? require('../js/simant_board.js') : {
        SimAntBoard, TYPE_EMPTY, TYPE_DIRT, TYPE_BEDROCK, TYPE_FOOD,
        CASTE_WORKER, CASTE_SOLDIER, CASTE_SCOUT, PHERO_CHANNELS, PHERO_YELLOW_FOOD
    };
    const check = (condition, message) => { if (!condition) throw new Error(message); };
    const at = (board, da, db = 0) => {
        const n = board.nests[0];
        return {a:n.a + da, b:n.b + db, c:n.c, d:n.d};
    };
    const index = (board, q) => board.idx(q.a,q.b,q.c,q.d);
    function fixture(caste, terrain = S.TYPE_BEDROCK) {
        const board = new S.SimAntBoard(12, {seed: 17});
        board.grid.fill(terrain);
        board.pheromones.fill(0);
        board.tunnelSet.clear();
        board.ants = board.queens.slice();
        board.redAI = null;
        const start = at(board, 4);
        const actor = board.spawnAnt(start.a,start.b,start.c,start.d,0,caste);
        return {board, actor};
    }
    function carve(board, points) {
        for (const [a,b] of points) board.grid[index(board, at(board,a,b))] = S.TYPE_EMPTY;
    }
    function step(board, actor) {
        const before = {a:actor.a,b:actor.b,c:actor.c,d:actor.d};
        board.update();
        const distance = GridUtils.manhattan(before, actor);
        check(distance <= 1, 'Each decision must stay put or traverse one raw edge');
        check(board.grid[index(board, actor)] !== S.TYPE_BEDROCK, 'No entering bedrock');
    }
    function deliver(board, actor, limit = 24) {
        const stored = board.foodStored[0];
        for (let k = 0; k < limit && board.foodStored[0] === stored; k++) step(board, actor);
        check(board.foodStored[0] === stored + 10, 'Food reaches colony storage exactly once');
        check(board.stats.yellowFoodCollected === 10 && actor.carrying === 0, 'Delivery updates consumer statistics and unloads');
    }
    const detour = [[0,0],[1,0],[2,0],[2,1],[3,1],[4,1],[4,0]];
    function runTests() {
        let passed = 0, failed = 0;
        function scenario(name, run) {
            let failure = null;
            try { run(); } catch (error) { failure = error; }
            if (failure) failed++;
            else passed++;
            if (typeof window !== 'undefined') {
                window.assert(failure === null, failure ? `${name}: ${failure.message}` : name);
            } else if (failure) console.error(`FAIL: ${name}: ${failure.stack}`);
            else console.log(`PASS: ${name}`);
        }
        scenario('Worker excavates beyond an empty retreat, forages and delivers', () => {
            const {board, actor} = fixture(S.CASTE_WORKER);
            Object.assign(actor, at(board,0));
            carve(board, [[0,0],[1,0]]);
            for (const a of [2,3]) board.grid[index(board,at(board,a))] = S.TYPE_DIRT;
            board.grid[index(board,at(board,4))] = S.TYPE_FOOD;
            deliver(board, actor);
            for (const a of [2,3]) {
                const q = at(board,a);
                check(board.grid[index(board,q)] === S.TYPE_EMPTY, 'Actual dirt is excavated');
                check(board.tunnelSet.has(GridUtils.key(q.a,q.b,q.c,q.d)), 'Excavation registers a tunnel');
            }
            check(board.grid[index(board,at(board,4))] === S.TYPE_EMPTY, 'Food is consumed at its source');
            check(board.fieldTotals()[S.PHERO_YELLOW_FOOD] > 0, 'Returning ant leaves a food trail');
        });
        for (const [name,caste,terrain] of [
            ['Worker',S.CASTE_WORKER,S.TYPE_BEDROCK],
            ['Soldier',S.CASTE_SOLDIER,S.TYPE_DIRT]
        ]) scenario(`${name} delivers through a corridor whose first step goes away from home`, () => {
            const {board,actor} = fixture(caste,terrain);
            carve(board,detour);
            board.grid[index(board,actor)] = S.TYPE_FOOD;
            step(board,actor);
            check(GridUtils.manhattan(actor,at(board,4,1)) === 0, 'The necessary first detour step is taken');
            check(GridUtils.manhattan(actor,board.queens[0]) === 5, 'Distance initially increases from four to five');
            check(actor.carrying === 10, 'Pickup happens before homing');
            deliver(board,actor);
        });
        scenario('A newly blocked next step replans around live terrain', () => {
            const {board,actor} = fixture(S.CASTE_SOLDIER);
            carve(board,[...detour,[4,2],[3,2],[2,2],[1,2],[1,1]]);
            board.grid[index(board,actor)] = S.TYPE_FOOD;
            step(board,actor);
            board.grid[index(board,at(board,3,1))] = S.TYPE_BEDROCK;
            step(board,actor);
            check(GridUtils.manhattan(actor,at(board,4,2)) === 0, 'Blocked route is replaced by the alternative corridor');
            deliver(board,actor);
        });
        scenario('An unreachable carrier discovers a reopened corridor on retry', () => {
            const {board,actor} = fixture(S.CASTE_SOLDIER);
            board.grid[index(board,actor)] = S.TYPE_FOOD;
            step(board,actor);
            check(actor.carrying === 10 && GridUtils.manhattan(actor,at(board,4)) === 0, 'Unreachable food is held without teleportation');
            carve(board,detour);
            deliver(board,actor);
        });
        for (const [name,caste] of [['Worker',S.CASTE_WORKER],['Scout',S.CASTE_SCOUT]]) {
            scenario(`${name} may excavate a required home step`, () => {
                const {board,actor} = fixture(caste);
                carve(board,[[0,0],[1,0],[2,0],[4,0]]);
                board.grid[index(board,at(board,3))] = S.TYPE_DIRT;
                board.grid[index(board,actor)] = S.TYPE_FOOD;
                deliver(board,actor);
                check(board.grid[index(board,at(board,3))] === S.TYPE_EMPTY, 'Home route excavates dirt');
            });
        }
        scenario('Soldier cannot excavate the only route home', () => {
            const {board,actor} = fixture(S.CASTE_SOLDIER);
            carve(board,[[0,0],[1,0],[2,0],[4,0]]);
            board.grid[index(board,at(board,3))] = S.TYPE_DIRT;
            board.grid[index(board,actor)] = S.TYPE_FOOD;
            const stored = board.foodStored[0];
            for (let k=0;k<12;k++) step(board,actor);
            check(board.foodStored[0] === stored && actor.carrying === 10, 'Blocked soldier retains undelivered food');
            check(board.grid[index(board,at(board,3))] === S.TYPE_DIRT, 'Soldier leaves dirt intact');
        });
        if (typeof window === 'undefined') {
            console.log(`RESULTS: ${passed} passed, ${failed} failed`);
            if (failed) process.exitCode = 1;
        }
        return {passed,failed};
    }
    if (typeof window !== 'undefined') window.runTests = runTests;
    else if (require.main === module) runTests();
})();
