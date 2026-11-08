# Native Game loop, input and sampled block picking maintenance

Maintain the single processInput entrypoint and seconds-based native delta. Follow GameInputDelegate instead of casting callback user pointers to Game. Picking, camera motion and mesh geometry have distinct limitations; do not describe sampled queries as exact intersections or claim a native gameplay run from source inspection.

Read the adjacent [directory guide](README.md) before changing this area. Report source inspection separately from executed runtime checks.
