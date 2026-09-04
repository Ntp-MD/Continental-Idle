# Duplicate-logic Improvement Plan

Source: verified findings 1-8 (all re-checked against exact code).
Order: D1 -> D2 -> D3 -> D4 -> D5 -> D6 (D7 engine-gated, D8 parked).

Progress: D1-D6 done and verified (typecheck + lint + lint:bem + test:unit).
Note: clampInt landed in domain/types.ts, not storeUtils.ts. useDebouncedCallback
now returns DebouncedCallback<T> = T & { cancel: () => void } (cancel needed by
NpcManagerModal/DeployNpcModal/WalkableGridEditor flush paths). reportSaved
converted 9 binary ok/fail sites; one-sided and conditional-toast sites left
as-is to keep copy verbatim. Remaining: D7 (gated), D8 (parked).

## D1. streetTiles computed - FloorModal.vue:288

Replace the per-render `:street-tiles="resolveStreetTiles(store.state.layout)"`
binding on FloorWalkablePanel with one `streetTiles` computed (same pattern as
EditorCanvas / BlueprintEditor). Input only changes when canvas/street settings
change.

Files: 1. Risk: none - same input, cached.
Verify: lint:bem + typecheck.

## D2. Single rounded-rect builder - objects.ts:514-518, geometry.ts:120-145

Replace the inline Q-path + clamp lambda in flattenToSvgAsset with
`roundedRectPath`; null falls back to the existing rect branch. Side effect
(fix, not risk): all-zero-rx objects currently emit a degenerate Q path;
after the change they correctly fall back to rect. Note: flattened corner
pixels change slightly (Q approx vs true arcs) - intended alignment with canvas.

Files: 1.
Verify: test:wall-paint + typecheck.

## D3. Central asset resolve - EditorCanvas.vue (7 sites)

Change objFillColor / objIsWall / assetSvg / svgTransform / svgColorVars
(+2 more) to take the already-resolved def instead of calling
`findAssetCached(store.assetMap(), ...)` each; pass `objDef(obj)` at template
call sites. Source stays `objDefMap` + existing fallback, so no output change.
Each lookup today is only a Map.get - the win is fewer calls per render.

Files: 1. Risk: missed call site keeps old signature - typecheck catches it.
Verify: typecheck + lint:bem + manual canvas check.

## D4. clampInt helper - storeUtils.ts + 8 sites

Add `clampInt(v, min, max)`: floor first, NaN -> min (declared contract).
Replace types.ts x4, npcDefault.ts, DeployNpcModal.vue, NpcManagerModal.vue,
useNpcSimulationCore.ts one by one without changing bounds. Deploy/NpcManager
sites keep their `(x || 0)` guard behavior via the NaN rule.

Files: 2 (helper + call sites across 5 files, one pattern).
Verify: test:blueprint-schema + test:npc-engine + typecheck.

## D5. Shared debounce - 4 sites

Replace hand-rolled trailing timers with `useDebouncedCallback` (unmount
cleanup included), keeping each site's current delay unchanged:
NpcManagerModal rateTimer, DeployNpcModal persistTimer, WalkableGridEditor
autoSaveTimer, useCanvasViewport zoomTimer. saveStateTimer excluded
(delayed-reset, not debounce).

Files: 4.
Verify: typecheck + open each modal/panel once (no direct suite).

## D6. Save-toast helper - 3 modals (~14 sites)

Add `reportSaved(ok, okMsg, failMsg)` next to `useToast`; replace
FloorModal / NpcManagerModal / SettingsModal sites keeping copy verbatim
(no rewording this round - consistency first).

Files: 4 (helper + 3 modals).
Verify: typecheck + lint.

## D7. GATED - layoutBuild local hoist (needs explicit src/engine approval)

Extract a row/col resolver in engine/npc/layoutBuild.ts so resolveTileState
and objectBlocksTile share it; no walk/blocked logic change.

Files: 1.
Verify: test:npc-engine + test:door-passage-engine.

## D8. PARKED

SVG render guards stay as-is (vSvgContent / useSvgPreview / thumbHtml have
differing visibility semantics). Revisit on 4th occurrence using the
thumbHtml string-compare convention.

## Checkpoints

D1+D2 -> verify -> D3+D4 -> verify (suites above + typecheck) -> D5+D6 ->
verify -> D7 only with engine approval -> lint/lint:bem/lint:css at end.
No full test matrix unless asked. No perf/scale/behavior suites per repo bans.
