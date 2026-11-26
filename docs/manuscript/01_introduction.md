# Introduction

The QuadCraft repository contains a native C++ prototype, historical
browser and server experiments, and a separate browser game portfolio
[@friedman2026quadcraft]. Quadray terminology appears across these
runtimes. This study isolates the physical coordinate convention and
world storage in the native implementation [@quadcraftcoordinatecontract].

A native physical position has four coefficients with a redundant
common offset. The world still needs an unambiguous key for looking up a
chunk, storing its elements, and placing its mesh. The question is how
the implementation crosses those representations at negative and positive
positions and whether a change of quadray representative changes the
result.
