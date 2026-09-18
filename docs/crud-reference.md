# CRUD Reference

Every store CRUD in this project, grouped by module — same idea as `src/dev/UiShowcase.vue` (one section per group, real function names, real file paths). The store is one instance per app: `App.vue` builds it with `createBlueprintStore({ persistence, sync, seed })` (`src/blueprint-editor/store/createStore.ts`) and provides it, so everything below is a method on that instance (`store.<fn>`), reached in components through `useAssetsStore()` (`src/blueprint-editor/store/index.ts`). Only `editorLog` / `dragState` stay shared module exports (`store/storeUtils.ts` / `store/state.ts`).

> Keep-up-to-date gate (`docs/skill/ui-layout.md` rule 4): a new/changed/removed store CRUD function must update this file in the same change.

Conventions: every CUD awaits `store.save()` inside the store's `runExclusive()` single-writer queue - `save()` serializes on the `PersistencePort` (POST `__blueprint-data`, verify read-back), snapshots on success, and on failure reverts in-memory state to that snapshot plus an error toast. Reads never mutate.

## Floors — `src/blueprint-editor/store/floors.ts`

| Function | Kind | About | How (click / drag / hover / keys) |
|---|---|---|---|
| `addFloor()` | Create | New empty floor (name `Floor N`, label `F{n}`, `defaultWalkable:true`), save, return it | FloorModal: click `Add Floor` |
| `deleteFloor(id)` | Delete | Remove floor (block if last); fix `currentFloorId`/`streetFloorId`, clear selection | FloorModal footer: click `Delete` (confirm modal) |
| `duplicateFloor(id)` | Create | Deep clone + remap `obj.id`/`linkGroupId`, insert after original | FloorModal footer: click `Duplicate` |
| `clearFloor(id)` | Update | Remove all objects on the floor (floor, tiles, spawn zones kept); clear selection; no save when already empty | FloorModal footer: click `Clear` (confirm modal; disabled when floor has no objects) |
| `renameFloor(id, name)` | Update | Rename floor | FloorModal: dblclick name → type + `Enter` (blur commit) |
| `reorderFloors(fromIndex, toIndex)` | Update | Drag-reorder floor list | FloorModal list: drag row (`dragstart`) → drop onto another row (`dragover`/`drop`); hover row dims |
| `selectFloor(id)` | Update | Switch `state.currentFloorId`, clear selection | FloorModal list: click row; canvas floor-nav: click dropdown → click floor |
| `updateFloor(id, patch)` | Update | Patch `allowedRoleIds`/`defaultWalkable`/`walkable`/`spawnZones`/`name`/`label` via normalize helpers | FloorModal detail: dblclick label → type + `Enter`; click role chip checkbox (`@change`); checkbox default-walkable (disabled while deployed); type zone form (`Enter` on label = add) + click `Add`; click zone `x` to remove |
| `paintFloorTiles(floorId, brush, rect)` | Update | Tile CRUD: `Walk/Wall/Door` brush paints rect on active floor (`Free tool` marquees wall/door cells when no object is hit - `Delete` key clears them to `walkable`; wall/door cells inside the marquee highlight red; selection clears on floor change or paint commit); explicit paint wins everywhere incl. street ring (unpainted ring stays `walkable`); rebuild `walkableGrid` | Toolbar: click `Walk/Wall/Door` brush, then drag marquee on canvas (`mousedown`→`mousemove`→`mouseup` commit); `Free tool`: drag marquee over wall/door cells (no objects hit) to select, press `Delete` to clear (`Esc` cancels); clicking an object selects it instead; hover shows live preview rect |

## Objects (placed instances) — `src/blueprint-editor/store/objects.ts`

| Function | Kind | About | How (click / drag / hover / keys) |
|---|---|---|---|
| `beginDrawnObject(name, w, h, x, y)` | Create | Create `drawn` AssetDef + place object; overlap-check, select it | Canvas: Toolbar click `Draw`, then click-drag marquee on canvas to draw rect → Save-origin modal (type name, pick fill color) click `Save` = `updateAsset`, click `Cancel` = `deleteSelected`+`deleteAsset` |
| `addObject(type, x, y)` | Create | Place existing asset at snapped/clamped pos; overlap-check | AssetToolbar: `mousedown` on asset row (starts `startAssetDrag`, ghost follows hover) → drag over canvas → `mouseup` drop to place; AssetPickerModal grid: click card = drag-start + close |
| `canPlaceObject(type, x, y)` | Read | Placement check, no mutation | No UI — hover ghost validity check while dragging palette asset |
| `select(ref)` / `toggleMultiSelect(id)` | Update | Selection write (delegates to `selection.ts`) | Canvas: click object = select (cycles overlapping on repeat click); `Shift/Ctrl/Cmd+click` = multi (`toggleMultiSelect`); click-drag empty = box-select marquee; `Esc` = clear |
| `deleteSelected()` | Delete | Delete selected; skip `locked`, dissolve `<2` link groups, `recalcCollapsed` | Object panel: click `Delete` (confirm); canvas: `Delete/Backspace` keys (confirm) |
| `moveSelectedTo(x, y)` | Update | Live drag (in-memory, no save) | Canvas: `mousedown` on object + `mousemove` drag (in-memory ghost) |
| `commitMove()` | Update | Snap/clamp commit with overlap rollback + save | Canvas: `mouseup` after drag; or `Arrow` keys (`Shift` = x10) nudge + commit |
| `rotateSelected()` | Update | Rotate 90 deg (`w/h` swap); block if `locked`/`linked`/overlap | Object panel: click `Rotate`; canvas: `R` key |
| `linkObjects(ids)` | Update | Group-move via shared `linkGroupId` | PropertiesPanel multi-select: click `Link Objects` (needs 2+ selected); canvas: `Ctrl/Cmd+L` |
| `unlinkObject(id)` | Update | Remove one member; dissolve small groups | Object panel: click `Unlink`; multi-select: click `Unlink`; canvas: `Ctrl/Cmd+Shift+L` |
| `getLinkedObjects(obj)` | Read | Other objects on the current floor sharing `obj.linkGroupId` | No UI: internal to link-group move/delete |
| `toggleObjectLock(id)` | Update | Lock = undeletable/unmovable | Canvas: `L` key on selected object; Object panel: click `Lock`/`Unlock` |
| `flattenToSvgAsset(name?)` | Create+Delete | Merge N objects into one `flattened` SVG asset + single object; drops edge spots | PropertiesPanel multi-select: type name + click `Flatten` (confirm, needs 2+ selected, blocked if locked) |

## Assets (origin definitions) — `src/blueprint-editor/store/assets.ts`

| Function | Kind | About | How (click / drag / hover / keys) |
|---|---|---|---|
| `addSvgAsset(name, w, h, svg)` | Create | Validate viewBox/sanitize/convert colors; `origin:svg-import` | UiShowcase only: click `ImportSvgModal` button, type name, paste SVG, click `Import SVG` |
| `updateAsset(id, patch)` | Update | Colors/tags/interact/queue/walkable; `w/h` immutable; re-normalize, resize/clamp all instances | AssetProperties: TagPicker type plus Enter/comma or click dropdown suggestion, click tag x to remove; click Manage opens AssetEditModal: General tab type name/label plus change commit, pick fill/outline color, click Reset to clear, type corner radius plus link-toggle sync, click Portal ON/OFF; Walk tab click Walk/Block tool then click or mousedown plus mouseenter-drag tiles, click row/col headers to fill, click All Walk/All Block; Spots tab click walkable tile adds spot, click Fill All Walkable/Clear All; Assign tab type capacity/duration/queue numbers auto-save; Passable ON/OFF toggle |
| `duplicateAsset(id)` | Create | Clone as `drawn` with `copy` name | AssetProperties panel: click `Duplicate` (selects the copy) |
| `deleteAsset(id)` | Delete | Cascade: remove the asset + every instance on all floors (locked included), dissolve orphan link groups, clear `task.post` refs | AssetProperties panel: click `Delete` (confirm dialog shows the placed object count); draw-cancel path also deletes the draft asset |
| `deleteAllAssets()` | Delete | Purge the whole palette + every instance in one save; returns the count | AssetToolbar "Assets List" header: click `Delete All` (confirm shows assets/instances/floors) |
| `refreshOriginInstances()` | Update | Re-normalize all instances from defs; returns count | Toolbar: click `Refresh Objects` |

## Tags — `src/blueprint-editor/store/tags.ts`

| Function | Kind | About | How (click / drag / hover / keys) |
|---|---|---|---|
| `addTag(tag)` | Create | Add `tagDefinitions` entry (normalized, deduped) | NpcManagerModal Tags tab: type plus Enter or click Add |
| `removeTag(tag)` | Delete | Remove definition + cascade-strip from `assets`/`npcConfig.roles`/`tasks`/`tagTriggerRates` | NpcManagerModal Tags tab: click tag x (confirm dialog) |
| `ensureTag(tag)` | Read | Warn-only if tag not in NPC Manager | TagPicker: type unknown tag plus Enter warns; Role detail add-tag warns |
| `tagCatalog` / `globalTags` / `managedTagSet` | Read | Computed catalog + id list + set | TagPicker dropdown reads globalTags on focus/hover; AssetProperties orphan-tag warning reads managedTagSet |

## NPC config — `src/blueprint-editor/store/npcDefault.ts`

| Function | Kind | About | How (click / drag / hover / keys) |
|---|---|---|---|
| `updateNpcConfig(config)` | Update | Replace `layout.npcConfig` (roles/tasks/pool/rates) + save | NpcManagerModal: click Roles/Tags-and-Tasks tabs, click role in list, type rename, pick color, click task chips, click Add/Delete role, type new task plus Add, click task x; DeployNpcModal: click role, click minus/plus steppers or type count plus change, checkbox spawn floors, type target tag plus Enter, click tag x, drag speed slider plus change, click Deploy/Cancel (all edits auto-persist debounced) |
| `mergeNpcConfig(config)` | Read | Prune dangling `taskIds`/`roleIds`, clamp rates 0-100 | No UI: internal normalize used by editor plus sim ingest |
| `syncNpcConfigToState(config)` | Update | Normalize via `normalizeNpcConfig`, then in-memory replace (no save); falls back to the raw input only when normalization fails | No UI: internal step of updateNpcConfig |
| `persistNpcConfigToDisk()` | Update | Save current state; throw if not saved | No UI: internal step of updateNpcConfig |

## Canvas / mode / settings — `src/blueprint-editor/store/mode.ts`

| Function | Kind | About | How (click / drag / hover / keys) |
|---|---|---|---|
| `setMode(mode)` | Update | `object`/`draw`/`move`/`npc-preview`; clears `tileBrush` + selection | Toolbar: click Free tool/Draw/Move; Deploy NPCs enters npc-preview; PropertiesPanel Exit/Clear returns to move |
| `setTileBrush(brush\|null)` | Update | `walkable`/`blocked`/`door`; clears selection | Toolbar: click Walk/Wall/Door (click active brush again for off) |
| `resizeCanvas(w, h, tileSize)` | Update | Resize + renormalize/reclamp all objects | SettingsModal Canvas tab: type W/H/Tile numbers plus click Apply Size (confirm when objects placed) |
| `setCanvasBgColor(c)` / `setCanvasLabelColor(c)` / `setCanvasWallColor(c)` / `setCanvasGridColor(c)` | Update | Canvas colors (validated, deletable via `undefined`) | SettingsModal Canvas tab: pick color on commit, click Reset to clear |
| `setStreetFloor(id\|null)` | Update | Which floor owns the street ring | SettingsModal Street row: select dropdown on change |
| `setStreetWidth(tiles\|null)` | Update | 5-20 tiles, else default 8 | SettingsModal Street row: select ring width on change |
| `setEditorSettings(patch)` | Update | Validated via `EDITOR_FIELD_SPECS` | SettingsModal editor tabs: type number plus change per field, or click Apply All |
| `resetEditorSettings()` | Delete | Drop overrides back to defaults | SettingsModal footer: click Reset |

## Clipboard — `src/blueprint-editor/store/metadata.ts`

| Function | Kind | About | How (click / drag / hover / keys) |
|---|---|---|---|
| `copySelected()` | Read | Snapshot selection into in-memory clipboard (no save) | Canvas: Ctrl/Cmd+C keys (no button) |
| `pasteObjects()` | Create | Paste at `+1 tile` offset; overlap-skip; remap `linkGroupId` | Canvas: Ctrl/Cmd+V keys (no button) |

## Persistence / sync — `src/blueprint-editor/store/persistence.ts`, `persistenceFactory.ts`, `httpPorts.ts`, `localPort.ts`, `ports.ts`, `schemaMigration.ts`, `workspaceFile.ts`, `dataLoader.ts`

| Function | Kind | About | How (click / drag / hover / keys) |
|---|---|---|---|
| `store.save()` | Update | `buildBlueprintData()` to `PersistencePort.save`, snapshot on success, revert + error toast on fail (queued, one writer) | No button: auto-called by every CUD above |
| `syncToGame()` | Read | `buildSyncedPayload` + `SyncPort.emit`; report settings issues | Toolbar: click Sync Game (toast success/fail) |
| `exportWorkspace()` | Read | Assemble the current `BlueprintDataFile` for download | Workspace modal: click Export |
| `importWorkspace(file)` | Update | Replace layout/assets/tags/npcConfig from a parsed file, reset selection, save once (queued) | Workspace modal: pick a `.json` file |
| `buildBlueprintData(layout?, assets?, config?, tags?)` | Read | Assemble `BlueprintDataFile` from state | No UI: internal step of save |
| `readBlueprintDataFile(raw)` | Read | Version gate + migration + normalize; throws `UnsupportedBlueprintVersionError` (newer) / `InvalidBlueprintDataError` (malformed) | No UI: ingress for every port |
| `createPersistencePort()` | Read | Pick the port: `VITE_PERSISTENCE` else dev -> http, build -> IndexedDB | No UI: app boot |
| `PersistencePort.load()` | Read | Returns `null` only when no workspace exists; throws when unreachable/corrupt/newer | No UI: step of `reloadEditorData()` |
| `PersistencePort.save(data)` | Update | HTTP: POST + verify read-back, 3 attempts, 413 stops immediately. Local: IndexedDB put with a byte pre-check | No UI: the port behind `store.save()` |
| `createLocalPersistencePort(storage)` | Read | Storage-agnostic local port; `createIndexedDbStorage` in the app, `createMemoryStorage` in tests | No UI: the local port |
| `serializeWorkspace(file)` / `parseWorkspace(text)` | Read | JSON text <-> `BlueprintDataFile` for the export/import file | No UI: internal to the Workspace modal |
| `SyncPort.emit(payload)` | Update | `createWindowSyncPort`: dispatch the `blueprint:sync` event | No UI: step of `syncToGame()` |
| `buildSyncedPayload(layout, assets, npcConfig)` | Read | Egress DTO: floors keyed by stable sync key + canvas + npcConfig | No UI: step of `syncToGame()` |
| `loadSyncedPayload(payload)` | Read | Ingress loader: normalize payload -> runtime `FloorData[]` + canvas (game boot) | No UI: runtime boot + `observe:hotel` |
| `assignSyncKeys(floors)` / `compareFloorKeys(a, b)` | Read | Stable floor sync keys (canonical label, else id order) + G-first runtime floor order | No UI: internal to both payload functions |
| `buildSavedLayout(layout, config)` | Read | Pure: runtime layout from a `BlueprintLayoutFile` + npc config | No UI: internal to the seed module |

## Selection — `src/blueprint-editor/store/selection.ts`

| Function | Kind | About | How (click / drag / hover / keys) |
|---|---|---|---|
| `selectAsset(id\|null)` | Update | Asset-panel selection; clears object selection | AssetToolbar: click asset row (also Enter/Space when focused); AssetPickerModal: click card |
| `selectedAsset` | Read | Computed: resolved `AssetDef` or `null` | PropertiesPanel reads it to render AssetProperties |
| `select(ref\|null)` | Update | Object selection write | Canvas: click object; Object panel: click Deselect |
| `clearSelection()` | Delete | Empty selection | Canvas: Esc key; click empty canvas |
| `selectedObject()` | Read | Primary selected `ObjectData` | ObjectPropertiesForm plus shortcuts R/L/arrows read it |
| `selectedObjectIds()` | Read | All selected object ids | Canvas highlight plus multi-select panel read it |

## State / snapshots / guards — `src/blueprint-editor/store/createStore.ts`, `state.ts`, `storeUtils.ts`, `migrate.ts`

| Function | Kind | About | How (click / drag / hover / keys) |
|---|---|---|---|
| `reloadEditorData()` | Update | `PersistencePort.load()` via `migrate()`, replace state + snapshots | No button: BlueprintEditor mount plus UiShowcase mount |
| `migrate(data, assets?)` | Update | Normalize canvas/floors/objects/NPC/street; drop unknown asset types | No UI: internal step of reload |
| `emptySeed()` | Read | Empty boot seed (default canvas, no floors/assets/tags) for `App.vue`; real data arrives via `reloadEditorData()` | No UI: boot default in `App.vue` |
| `defaultSeed()` (`store/seed.ts`) | Read | Test/fixture seed read from the canonical `blueprint-data.json`; not imported by the app bundle | No UI: tests only |
| `initAssetFields(asset)` | Update | Lazily fill derived asset fields (`svgRoles`, `walkableGrid`, `tileStates`, `walkable`/`doorRequired` defaults) | No UI: internal, runs when an asset enters the registry |
| `assetMap()` / `currentFloor` / `snap()` / `clamp()` | Read | Cached asset map, active floor, grid snap, building-area clamp | No UI: every place/move path uses them |
| `runExclusive(fn)` | Guard | Single-writer queue: overlapping mutations run one after another, never rejected | No UI: wraps every CUD |
| `startAssetDrag` / `endAssetDrag` / `dragState` | Update | Palette drag state | AssetToolbar row mousedown starts drag with ghost on hover; canvas mouseup drop or Esc ends |
| `captureSnapshot` / `restoreSnapshot` | Guard | Save-point capture + rollback on failed save (rollback installs clones, so live state never aliases the save point) | No UI: internal to `createStore.ts` |
| `genId` / `genAssetId` / `cloneDeepRaw` / `emptyNpcConfig` / `taskMatchesQuery` | Util | Id gen, deep-clone via `toRaw`, empty NPC defaults, search | NpcManagerModal search box reads taskMatchesQuery; rest internal |
| `editorLog` | Util | `info`/`warn`/`error` console diagnostics wrapper | No UI: used by store/migration/portal code |
