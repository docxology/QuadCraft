# Demonstrating Quadray Chess — source-bounded narration and capture guide

Use the [game guide](../README.md) to launch from the parent games tree. This is a suggested narration, not evidence of learning outcomes, playing strength or completed browser verification.

## Opening Hook

“QuadCraft calls this variant 4D Quadray Chess. The four numbers are tetrahedral coefficients, but their physical projection is three-dimensional: shifting all four by the same amount leaves a point unchanged. Let’s explore the rules the software actually implements.”

## What are Quadrays?

Show the four basis directions and rotate the overview. Explain zero-minimum normalization as choosing a representative, not shrinking a vector to unit length. Use the actual coordinate/math panel; if showing a distance, compare it with [the physical metric](quadray-math.md), not a four-coordinate Euclidean norm.

## Demonstration: The Interface

Select a piece, show highlighted destinations and the optional selected-piece view. Demonstrate clicking a destination or a numbered choice. Shift+drag rotates the overview; the wheel or +/− zooms. The selected-piece camera is another view of the same board, not evidence of a fourth independent physical direction.

## How Pieces Move

“Kings add one positive basis step. Rooks slide along positive basis directions; bishops slide along positive pairs. Queens combine those moves. Knights use twelve ordered +2/+1 offsets, and pawns advance along +A for White or +B for Black.”

Show a currently available move rather than promise the default setup leaves every example clear. Note that bounds and blockers reduce choices and that the generators are directed.

## Features and Gameplay

Show Space/M random move and A random autoplay, then turn autoplay off before another demonstration. Explain that the interval is separate from loop pause. Reset with R/N and inspect actual turn/selection state.

“Check is detected from generated enemy destinations, but this is not full orthodox chess: self-check is not filtered, kings can be captured, and castling, en passant and promotion are absent.”

The Save/Load buttons expose legacy code with a current TurnManager record mismatch. Do not stage a successful archival/replay demonstration or claim reliable restore; point viewers to [record compatibility](notation.md). Likewise, do not describe named metrics as proven strategy or educational benefit.

## Closing and Capture Checklist

- Capture the actual served page and console/network state, not a fictional UI.
- Show coordinates, one generated move, rotation/zoom and reset.
- Distinguish a helper math-verification display from complete rules/UI testing.
- Identify the checkout revision when reporting behavior or results.
- Link [rules](game-rules.md), [source architecture](architecture.md) and [test scope](../tests/README.md).
