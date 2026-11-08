import { state } from './helpers.mjs';

// A presentation selection, not a replacement for the thirty-game runtime gate.
export const galleryViews = [
    { name: 'minecraft', category: 'Geometry / sandbox', title: 'Projected block editing',
        action: 'Alt-click removes a visible block; 3 selects a block type.',
        limit: 'Browser Canvas projection, not the native OpenGL world.' },
    { name: 'hex', category: 'Strategy / picking', title: 'Moves after camera rotation',
        action: 'Click, Shift-drag and wheel, then click a second cell.',
        limit: 'Canonical quadray cells; four coefficients, three physical dimensions.' },
    { name: 'life', category: 'Simulation / cellular automaton', title: 'Birth, death and a reseeded board',
        action: 'Step evolves; Shift-drag rotates; R reseeds; P pauses.',
        limit: 'Raw four-index automaton rules, not physical growth or diffusion.' },
    { name: 'tetris', category: 'Arcade / falling pieces', title: 'Hard drop, lock and respawn',
        action: 'Left moves; Space drops; P pauses and resumes gravity.',
        limit: 'Game-specific discrete board rules, not rigid-body physics.' },
];

export async function captureGalleryView(page, name, path) {
    const view = galleryViews.find(view => view.name === name);
    if (!view) throw new Error(`No gallery view for ${name}`);
    const observed = await state(page, name => {
        const b = game.board;
        if (name === 'minecraft') return { blocks: b.blocks.size, removed: b.blocksRemoved, selectedType: b.selectedBlock };
        if (name === 'hex') return { moves: b.moveCount, currentPlayer: b.turns.currentPlayer };
        if (name === 'life') return { livingCells: b.cells.size, generation: b.generation,
            intervalMs: game.speed };
        if (name === 'tetris') return { lockedCells: b.getLockedCells().length, score: b.score,
            activePosition: { ...b.activePiece.pos } };
        throw new Error(`No state reader for ${name}`);
    }, name);
    const handle = await page.evaluateHandle(() => game.canvas);
    const canvas = handle.asElement();
    if (!canvas) throw new Error(`${name}: game.canvas is not a DOM element`);
    const dimensions = await canvas.evaluate(canvas => ({ width: canvas.width, height: canvas.height,
        displayWidth: canvas.getBoundingClientRect().width, displayHeight: canvas.getBoundingClientRect().height }));
    await canvas.screenshot({ path });
    await handle.dispose();
    return { ...view, source: `games/4d_${name}/index.html`,
        scenario: name === 'life' || name === 'tetris'
            ? 'games/tests/browser/simulation-scenarios.mjs' : 'games/tests/browser/smoke.mjs',
        observed, dimensions };
}
