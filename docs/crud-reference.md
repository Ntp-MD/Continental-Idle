# CRUD Reference

Every store CRUD in this project, grouped by module — same idea as `src/dev/UiShowcase.vue` (one section per group, real function names, real file paths). All functions are exposed through `useAssetsStore()` in `src/blueprint-editor/store/index.ts`.

> Keep-up-to-date gate (`skill.md` Layout rule 4): a new/changed/removed store CRUD function must update this file in the same change.

Conventions: every CUD awaits `saveBlueprintData()` (POST `__blueprint-data`, verify read-back, revert to last-saved snapshot on fail) under `withStateLock`. Reads never mutate.

## Floors — `src/blueprint-editor/store/floors.ts`

| Function | Kind | About | How (click / drag / hover / keys) |
|---|---|---|---|
| `addFloor()` | Create | New empty floor (name `Floor N`, label `F{n}`, `defaultWalkable:true`), save, return it | FloorModal: click `Add Floor` |
| `deleteFloor(id)` | Delete | Remove floor (block if last); fix `currentFloorId`/`streetFloorId`, clear selection | FloorModal footer: click `Delete` (confirm modal) |
| `duplicateFloor(id)` | Create | Deep clone + remap `obj.id`/`linkGroupId`, insert after original | FloorModal footer: click `Duplicate` |
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
| `toggleObjectLock(id)` | Update | Lock = undeletable/unmovable | Canvas: `L` key on selected object; Object panel: click `Lock`/`Unlock` |
| `flattenToSvgAsset(name?)` | Create+Delete | Merge N objects into one `flattened` SVG asset + single object; drops edge spots | PropertiesPanel multi-select: type name + click `Flatten` (confirm, needs 2+ selected, blocked if locked) |

## Assets (origin definitions) — `src/blueprint-editor/store/assets.ts`

| Function | Kind | About | How (click / drag / hover / keys) |
|---|---|---|---|
| `addSvgAsset(name, w, h, svg)` | Create | Validate viewBox/sanitize/convert colors; `origin:svg-import` | UiShowcase only: click `ImportSvgModal` button, type name, paste SVG, click `Import SVG` |
| `updateAsset(id, patch)` | Update | Colors/tags/interact/queue/walkable; `w/h` immutable; re-normalize, resize/clamp all instances | AssetProperties: TagPicker type plus Enter/comma or click dropdown suggestion, click tag x to remove; click Manage opens AssetEditModal: General tab type name/label plus change commit, pick fill/outline color, click Reset to clear, type corner radius plus link-toggle sync, click Portal ON/OFF; Walk tab click Walk/Block tool then click or mousedown plus mouseenter-drag tiles, click row/col headers to fill, click All Walk/All Block; Spots tab click walkable tile adds spot, click Fill All Walkable/Clear All; Assign tab type capacity/duration/queue numbers auto-save; Passable ON/OFF toggle |
| `duplicateAsset(id)` | Create | Clone as `drawn` with `copy` name | AssetProperties panel: click `Duplicate` (selects the copy) |
| `deleteAsset(id)` | Delete | Block if placed on any floor | AssetProperties panel: click `Delete` (confirm dialog; blocked with warning if placed); draw-cancel path also deletes draft asset |
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
| `syncNpcConfigToState(config)` | Update | In-memory replace only (no save) | No UI: internal step of updateNpcConfig |
| `persistNpcConfigToDisk()` | Update | Save current state; throw if not saved | No UI: internal step of updateNpcConfig |

## Canvas / mode / settings — `src/blueprint-editor/store/mode.ts`

| Function | Kind | About | How (click / drag / hover / keys) |
|---|---|---|---|
| `setMode(mode)` | Update | `object`/`draw`/`move`/`npc-preview`; clears `tileBrush` + selection | Toolbar: click Free tool/Draw/Move; Deploy NPCs enters npc-preview; PropertiesPanel Exit/Clear returns to move |
| `setTileBrush(brush\|null)` | Update | `walkable`/`blocked`/`door`; clears selection | Toolbar: click Walk/Wall/Door (click active brush again for off) |
| `resizeCanvas(w, h, tileSize)` | Update | Resize + renormalize/reclamp all objects | SettingsModal Canvas tab: type W/H/Tile numbers plus click Apply Size (confirm when objects placed) |
| `setCanvasBgColor(c)` / `setCanvasLabelColor(c)` / `setCanvasWallColor(c)` | Update | Canvas colors (validated, deletable via `undefined`) | SettingsModal Canvas tab: pick color on commit, click Reset to clear |
| `setStreetFloor(id\|null)` | Update | Which floor owns the street ring | SettingsModal Street row: select dropdown on change |
| `setStreetWidth(tiles\|null)` | Update | 5-20 tiles, else default 8 | SettingsModal Street row: select ring width on change |
| `setEditorSettings(patch)` | Update | Validated via `EDITOR_FIELD_SPECS` | SettingsModal editor tabs: type number plus change per field, or click Apply All |
| `resetEditorSettings()` | Delete | Drop overrides back to defaults | SettingsModal footer: click Reset |

## Clipboard — `src/blueprint-editor/store/metadata.ts`

| Function | Kind | About | How (click / drag / hover / keys) |
|---|---|---|---|
| `copySelected()` | Read | Snapshot selection into in-memory clipboard (no save) | Canvas: Ctrl/Cmd+C keys (no button) |
| `pasteObjects()` | Create | Paste at `+1 tile` offset; overlap-skip; remap `linkGroupId` | Canvas: Ctrl/Cmd+V keys (no button) |

## Persistence / sync — `src/blueprint-editor/store/persistence.ts`, `dataLoader.ts`

| Function | Kind | About | How (click / drag / hover / keys) |
|---|---|---|---|
| `saveBlueprintData()` | Update | `buildBlueprintData()` to POST, verify read-back, snapshot; revert on fail | No button: auto-called by every CUD above |
| `syncToGame()` | Read | `buildSyncedPayload` + `window blueprint:sync` event; report settings issues | Toolbar: click Sync Game (toast success/fail) |
| `buildBlueprintData(layout?, assets?, config?, tags?)` | Read | Assemble `BlueprintDataFile` from state | No UI: internal step of save |
| `fetchBlueprintDataFromDisk()` | Read | GET + normalize, `null` on failure | No UI: boot path on BlueprintEditor mount plus showcases |
| `buildSavedLayout()` | Read | Default layout from `floorPlan.data` + `npcSettings.data` | No UI: seed fallback |

## Selection — `src/blueprint-editor/store/selection.ts`

| Function | Kind | About | How (click / drag / hover / keys) |
|---|---|---|---|
| `selectAsset(id\|null)` | Update | Asset-panel selection; clears object selection | AssetToolbar: click asset row (also Enter/Space when focused); AssetPickerModal: click card |
| `selectedAsset` | Read | Computed: resolved `AssetDef` or `null` | PropertiesPanel reads it to render AssetProperties |
| `select(ref\|null)` | Update | Object selection write | Canvas: click object; Object panel: click Deselect |
| `clearSelection()` | Delete | Empty selection | Canvas: Esc key; click empty canvas |
| `selectedObject()` | Read | Primary selected `ObjectData` | ObjectPropertiesForm plus shortcuts R/L/arrows read it |
| `selectedObjectIds()` | Read | All selected object ids | Canvas highlight plus multi-select panel read it |

## State / snapshots / guards — `src/blueprint-editor/store/state.ts`, `storeUtils.ts`, `migrate.ts`

| Function | Kind | About | How (click / drag / hover / keys) |
|---|---|---|---|
| `reloadEditorData()` | Update | Re-fetch disk via `migrate()`, replace state + snapshots | No button: BlueprintEditor mount plus UiShowcase mount |
| `migrate(data, assets?)` | Update | Normalize canvas/floors/objects/NPC/street; drop unknown asset types | No UI: internal step of reload |
| `loadInitial()` | Read | Clone of `buildSavedLayout()` for boot | No UI: boot default |
| `assetMap()` / `currentFloor` / `snap()` / `clamp()` | Read | Cached asset map, active floor, grid snap, building-area clamp | No UI: every place/move path uses them |
| `withStateLock(fn)` / `isStateLocked()` | Guard | One mutation at a time; warn + reject on overlap | No UI: wraps every CUD |
| `startAssetDrag` / `endAssetDrag` / `dragState` | Update | Palette drag state | AssetToolbar row mousedown starts drag with ghost on hover; canvas mouseup drop or Esc ends |
| `initLastSavedSnapshot` / `updateLastSavedSnapshot` / `revertToLastSavedSnapshot` | Guard | Save-point capture + rollback on failed save | No UI: internal to save flow |
| `genId` / `genAssetId` / `cloneDeepRaw` / `emptyNpcConfig` / `taskMatchesQuery` / `assignSyncKey` | Util | Id gen, deep-clone via `toRaw`, empty NPC defaults, search, sync-key assign | NpcManagerModal search box reads taskMatchesQuery; rest internal |
