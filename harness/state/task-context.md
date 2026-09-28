## Mission

Stop placed objects and assets from sharing space with each other and with painted wall/door geometry, and keep the asset browser usable for repeated deletes.

## Plan

- [x] Asset-browser delete: per-row `Del` stuck `disabled` after one delete (`pending` read inside the `v-memo` row) - guard moved to JS, repro test in `tests/component/assetPickerDelete.test.ts`
- [x] Same `v-memo` freeze in the sidebar asset list (move-button guards, size label, incomplete badge) - memo deps now cover every value the row reads; `tests/component/assetToolbarRows.test.ts`
- [x] One placement gate in the store: `placementBlocked(rect, type, excludeIds)` (`src/blueprint-editor/store/objects.ts:51`) = object bodies + `rectHitsStructure` (`src/blueprint-editor/domain/collision.ts:76`, blocked/door cells); wired into drop, click-place, draw-rect, drag, rotate, paste, flatten
- [x] Wall/door role assets (`data-role`) count as geometry: `assetIsStructural` (`src/blueprint-editor/assets/assetUtils.ts:77`) + `placementCollides`, and `recalcCollapsed` flags the clash both ways
- [x] Escape hatch so a buried object is never trapped; paint-over stays allowed but reports how many objects it buries
- [x] Dead params removed from `scripts/arch/build-lobby.ts` (`seatsOf` height, `renderAscii` height) so the routed `npm run lint` passes; `arch:selftest` still green

## Blockers

- (none)

## Hand-off Note

Next action (awaiting go): commit `tests/e2e/overlap.spec.ts` against the production build (IndexedDB, never `data/blueprint-data.json`) that imports an SVG, paints a wall with the Wall brush, drags the asset onto that cell and asserts the object count plus the refusal alert - the jsdom suites prove the rule, only the canvas drag path is unproven in a browser. Also awaiting their wording call: a toolbar badge for objects sitting on wall geometry (today it is a transient toast). Known inert: the `data-role` rule does not fire on the current workspace - its 29 assets carry no roles, walls are painted tiles (260 blocked + 8 door cells inside the building, 8% of it).
