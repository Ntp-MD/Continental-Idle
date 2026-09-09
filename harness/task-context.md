## Mission
<!-- Original instruction - translated to English -->
<!-- Received: YYYY-MM-DD HH:MM UTC+7 -->
Remove wall-segment system; replace with tile-based walk/wall/door/erase tools on the toolbar; clean dead code. Batch uncommitted since e66f07f.

## Plan
- [x] Strip wall fields from origin assets + verify-assets + types + store + sync payload
- [x] Delete wall composables/tests (useWallPaint, useDoorAnimation, useCanvasWallStyle, gridEditing, door-animation, door-passage-engine, wall-paint)
- [x] Add tile brush tools (Walk/Wall/Door/Erase) with drag-cover gesture in FloorWalkablePanel
- [x] Erase toggle fix (walk↔blocked) so painted walk tiles can be unplotted
- [x] Move tile tools from FloorWalkablePanel (deleted) into main Toolbar.vue — CRUD follows currentFloorId
- [x] New useCanvasTilePaint composable (window-level drag-cover + preview rect)
- [x] Wire store (tileBrush state, setTileBrush, paintFloorTiles) + EditorCanvas integration
- [x] Clean dead refs (3 npm scripts, skill.md parity note)
- [ ] Commit full batch

## Blockers
<!-- [HARD] blocks everything | [SOFT] blocks only this step -->
<!-- Format: [HARD/SOFT] - what - what is needed to unblock -->
None.

## Hand-off Note
<!-- Next action must be directly executable -->
<!-- Leave blank if not handing off -->
All changes verified green (typecheck, lint:bem, lint:css, verify check). 61 files changed, uncommitted since e66f07f. Next: user confirms commit, or issues next task.
