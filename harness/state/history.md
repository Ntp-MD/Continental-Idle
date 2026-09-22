# History - shared cross-agent intent log

Entries only. Pattern lives in `harness/HARNESS.md` (History pattern) -
follow it when logging below. Continental-Idle project work only - no
mod-cli records, no harness-meta records.

## Entries (Doing - Finished (Agent, Model) + Detail Bullets)

### modal input fill-width - 2026-09-22 11:37 UTC+7 (opencode, muse-spark-1.3-contributor-free)
- components.css: `.form__col` gets `min-width: 0` + direct `input/select/textarea` children stretch to `width: 100%; min-width: 0; max-width: 100%` - inputs fill their parent column and can no longer push past the modal edge
- NpcRoleDetail label/skin text inputs gained `size--stretch` so row-based inputs also fill remaining space
- decision: stretch via `.form__col > input` context selector (over: global `input { width: 100% }` - because row layouts like label+input+button pairs rely on field-sizing content for the input to shrink between siblings)
- verified: prettier clean; lint:bem pass; lint:css pass; typecheck pass (app + test + node)

### modal layout redesign - 2026-09-22 11:37 UTC+7 (opencode, muse-spark-1.3-contributor-free)
- SettingsModal Canvas tab: color sections (Background/Labels/Walls/Grid) pair into a wrapping two-column grid; Street split into controls vs Street Colors; Street Rendering numeric fields go horizontal
- SettingsModal editor tabs: numeric field groups render as wrapping label-over-input columns (radius dot sits beside its input)
- ImportSvgModal: Name + auto Size as two labeled columns, textarea gets its own labeled block (8 rows)
- AssetPickerModal: "click asset, then click canvas" usage hint under search
- DeployNpcModal Simulation: Walk speed + Spawn floor as two labeled columns with hints under each
- NpcManagerModal library: dropped redundant Tags/Tasks panel headers (sub-tabs already carry names + counts)
- decision: two-column wrapping grids via existing form__row/form--wrap/form__col only (over: new grid classes - because ui-layout.md rule 1 requires approval for new shared classes and form primitives already express the layout)
- verified: prettier clean; lint:bem pass; lint:css pass; typecheck pass (app + test + node)

### toolbar modal interiors redesign - 2026-09-22 11:37 UTC+7 (opencode, muse-spark-1.3-contributor-free)
- SettingsModal unified to instant-apply: Apply All + isEditorDirty removed, per-tab instant hints, Reset-only footer
- FloorModal: Duplicate moved into Details header, new Danger zone section (Clear objects + Delete floor), footer reduced to Close
- DeployNpcModal: Total moved into header status (errors still override), footer keeps Cancel/Deploy
- WorkspaceModal: Export/Import as side-by-side wrapping cards + Close footer
- NpcManagerModal + ShortcutsModal: Close footers (footer convention now complete on every toolbar modal)
- decision: drop Apply All instead of extending it to canvas (over: per-tab footers everywhere - because every editor field already applies on change, Apply All was a redundant second path)
- verified: prettier --write on 5 files; lint:bem pass; lint:css pass; typecheck pass (app + test + node)

### design-system polish pass - 2026-09-22 11:37 UTC+7 (opencode, muse-spark-1.3-contributor-free)
- variables.css: added missing `--gap-lg: 24px` step (gap scale jumped 16 -> 40); modal body now breathes (gap-md inner, lg vertical padding)
- reset.css: input/select/textarea gained `:focus-visible` outline (keyboard users had no focus indicator, only mouse border-color)
- components.css: tabs__tab sized (font-sm, min-height 30px) to match body text; card__item--remove got horizontal padding (bare 10px x buttons were sub-target)
- ToastContainer: toast icon inherits currentColor + weight 700 (was same weight as message, no tone emphasis)
- EditorCanvas: View-toggle tooltips normalized to sentence case matching aria-labels
- decision: token + shared-layer only (over: per-modal fixes - because spacing/focus/tab sizing are cross-cutting; per-page patches would fork the system)
- verified: prettier clean; lint:bem pass; lint:css pass; typecheck pass (app + test + node)

### modal UX/UI redesign, all modals, desktop - 2026-09-22 13:40 UTC+7 (opencode, opencode-go/deepseek-v4.1-flash)
- user order: redesign every modal under `components/modals/` - no new class names, desktop-only fluid, audit with Playwright
- SettingsModal was the only measured defect: `div.color` + `button.color__transparent` clipped past the modal edge at 1440 and 1024 because long ColorInput placeholders inflated the field; fixed by shortening placeholders to `#RRGGBB` and making groups wrap 2-up (`.settings__panel .form__row.form--start > .form--section { flex: 1 1 300px }`, fields `1 1 220px`)
- decision: tag library renders as wrapping `card__item` chips (over: full-width rows - because a 1200px-wide single-column tag list wastes the modal and strands each delete `x` far right)
- FloorModal floor-list pinned to 300px / detail fills, edit inputs `size--stretch`; DeployNpc sidebar `0 1 260px` / detail `1 1 360px`; AssetPicker fixed frame `min(82vh,720px)` + truncated names; AssetEdit preview rail stretches instead of `flex-start`
- list/zone/task/role delete `x` reuse existing `card__item--remove` (quieter); NpcRoleDetail appearance placeholders shortened + skin/spot inputs stretched
- verified: Playwright audit 1440x900 + 1024x768 - 0 overflowers, 0 console errors, `docOverflowX` false for all 11 modals; prettier + lint:bem + lint:css + typecheck green; verify.mjs check pass

### ui-layout.md route fixed + UI rules re-homed - 2026-09-22 14:30 UTC+7 (opencode, opencode-go/deepseek-v4.1-flash)
- user confirmed `docs/skill/ui-layout.md` was deleted on purpose (uncommitted working-tree delete); the file still existed in HEAD so earlier work this session cited it - gap owned
- `skill.md`: Editor UI row retargeted from `docs/skill/ui-layout.md` to `AGENTS.md` (UI conventions) - dangling route gone
- `AGENTS.md`: added a compact UI conventions block (BEM + `flag--*` state vocabulary, cascade/layer scope, ModalShell/async modals/shared tabs, store + concurrency + confirm/toast, field specs + player labels)
- decision: re-homed only the enforced/architectural rules and dropped the visual-freeze rules that lived only in the deleted doc (reuse-first + approval-to-add, no-box-shadow/borders-only, 3+-call-site shared-class bar, input max-width ban) - over: re-homing them verbatim, because they are the constraint behind the "re-UI always looks the same" complaint
- verified: `node harness/scripts/verify.mjs check` pass; no `.vue`/`.css` touched so no routed suite

### modal layouts reworked, zero new classes - 2026-09-22 14:48 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order: redesign every UI layout in `components/modals/` with no new classes, visibly different and easier to use - template-only rework of all 11 Vue files, `settingsFields.ts` untouched (data-only)
- every modal gets a `form__header` summary strip (counts in `badge`, hints, primary action); reused pool limited to tokens already defined under `src/` (`card`, `form__row--border`, `truncate`, modal `__` classes) so lint:css orphan/dead rules stay green, no `<style>` touched
- AssetEdit preview rail moved left of the editor (tabs | preview | content); AssetPicker search+count badge in header, place-hint to footer; ImportSvg paste-first `card` with WxH badge; Workspace import-first `card` stack with filename badge
- FloorModal +Add moved to header, Spawn Zones above Allowed Roles, danger row split by `form__row--border`; SettingsModal Apply+Reset in header, color/street sections before Canvas Size, footer reduced to hint; DeployNpcModal detail-first mirror with header total + Manager jump (per-detail jump buttons removed)
- NpcManagerModal header counts + "+ Add Task" moved above search; NpcRoleList "+ Add Role" moved to header; NpcRoleDetail tabs reordered Basics/Spawn/Tasks/Tags/Rates with Default `badge`, Delete moved to bottom danger row; NpcTaskCard header (label + usage + delete) with station block before tags
- decision: mirrored Deploy panes but NOT Floor panes (over: symmetric mirroring - because Floor widths are `:first-child`/`:last-child` order-based while Deploy widths are class-based, so a Floor swap would squeeze the detail pane)
- verified: `lint:bem` pass, `lint:css` pass, `typecheck` (all three projects) pass

### toolbar button order reworked - 2026-09-22 15:05 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order: button order in `Toolbar.vue` was wrong (Settings gear led, workflow scrambled) - DOM reorder only, no logic/class changes
- new order: Tools -> Floor paint -> Undo -> Manage (Floor Manager, NPC Manager + wiring badge, Refresh Objects, Workspace) -> Preview (Deploy NPCs) -> utilities (Settings, Shortcuts) last
- decision: structure (Floor) before actors (NPC) before culminating Deploy; rare utilities last (over: keeping original positions - because Settings-first buried daily tools and NPC-before-Floor broke the build flow)
- verified: `lint:bem` + `lint:css` + `typecheck` pass

### origin defaultLabel not reaching placed objects - fixed - 2026-09-22 15:20 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user report: some origin-asset values never reach placed assets - root cause is `normalizeObject` (`domain/geometry.ts:40`): the single resolve path used at placement/refresh/migrate/flatten/mode-change copied w/h/radius/labelPadding/locked/padding/rx/fillColor but dropped `resolved.label`, so placed objects got the Default Label only when the origin was edited post-placement via `updateAsset` (`store/assets.ts:156`)
- downstream impact: sync egress `buildSyncedObject` (`syncedPayload.ts:226`) reads label only from the placed snapshot with no origin fallback, so the game payload missed labels for objects placed before any origin edit (canvas looked right because it resolves live via `resolvePlacedObject`)
- non-bugs ruled out with evidence: fill/stroke resolve live with override fallback at render (`EditorCanvas.vue:823`) and flatten (`flatten.ts:117-118`); grids/spots/interact/queue resolve live in `resolvePlacedObject`/`buildSyncedObject` - only `label` is snapshot-only with no fallback, and no UI writes `obj.label` directly so there is no override to clobber
- fix: one line `o.label = resolved.label` in `normalizeObject` (also clears stale labels when the origin default is removed, matching `updateAsset` semantics) + regression block in `tests/test-sync-payload.ts` (resolve -> snapshot -> synced egress, plus clear-on-remove)
- verified: `test-sync-payload`/`test-migrate`/`test-persistence`/`test-store-crud`/`test-asset-schema`/`test-blueprint-schema`/`test-settings-completeness` all exit 0; `lint` + `typecheck` pass

### inherit-def holes fixed: locked clobber + fill wipe - 2026-09-22 15:35 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- fix A (`store/assets.ts`): `updateAsset` captured pre-edit `defaultLocked` and now only overwrites placed instances whose lock matches it (inheriting); explicitly toggled locks survive origin edits, matching the refresh path (`placement.locked ?? default`)
- fix B (`domain/geometry.ts`): `normalizeObject` passes `fillColor`/`strokeColor` through the resolve placement - before, `resolved.fillColor` was always undefined so every refresh/migrate/load wiped persisted per-instance fill overrides (stroke survived only by accident, never assigned)
- tests (`tests/test-store-crud.ts`): `updateAsset() keeps explicit per-instance locks...` (discriminates: explicit lock survives undefined->false) + `refreshOriginInstances() preserves per-instance color overrides`
- verified: `test-store-crud` 45/45 (incl. 2 new), `test-sync-payload`/`test-migrate`/`test-persistence`/`test-asset-schema` exit 0, `lint` + `typecheck` pass
- known heuristic limit: an explicit toggle that coincides with the old default is indistinguishable from inheriting and still follows it

### origin edits fan out to every placed instance - 2026-09-22 15:50 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user order: every edit on an origin asset must apply to every placed asset - dropped the per-field `patch.key !== undefined` gates in `updateAsset` (`store/assets.ts`): any edit now unconditionally re-resolves padding/rx/label/radius/labelPadding on all instances (also heals stale pre-fix snapshots); size+clamp behavior unchanged
- decision: explicit locks and fill/stroke colors stay instance-owned and are never overwritten (over: literal full overwrite - because per-instance lock has a UI writer in `toggleObjectLock` and the user already approved override preservation; fill/stroke have live origin fallback at render)
- test (`tests/test-store-crud.ts`): `updateAsset() re-resolves every placed instance on any edit` - unrelated `{name}` patch heals drifted label/radius while lock+fill survive
- verified: `test-store-crud` 46/46, `test-sync-payload`/`test-migrate`/`test-persistence`/`test-settings-completeness` exit 0, `lint` + `typecheck` pass

### plain-shape outline ignored origin stroke - fixed - 2026-09-22 16:05 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user report: obj-7080119261 kept its border after the origin outline was removed - data was clean (object has no override; origin `custom-draft-object` has `defaultStrokeColor: "transparent"`), so not a propagation bug
- root cause: canvas renders plain (non-SVG) shapes with hardcoded `stroke="var(--text-primary)"` (`EditorCanvas.vue` path + rect branches) - origin/instance stroke never consulted (SVG-backed shapes were fine via `--obj-stroke`)
- fix: `objStrokeColor()` helper (override -> origin -> legacy `var(--text-primary)` fallback, mirroring `objFillColor`) bound on both plain branches; unset origins render exactly as before, `"transparent"` now truly borderless
- verified: `lint:bem` + `lint:css` pass, `typecheck` exit 0

### pruned dead asset fields + derived grids out of persistence - 2026-09-22 16:15 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- option 1: removed reader-less `custom` + `category` from `AssetBase`, `normalizeOriginAsset`, `ASSET_DEF_FIELD_COVERAGE`, `serializeAsset`, and the schema fixture - old files still load (normalizer ignores unknown keys); next save prunes them (JSON left untouched by hand per authoring rule)
- option 2: `serializeAsset` no longer persists `svgRoles`/`walkableGrid` - re-derivation is two-layered: `initAssetFields` (`store/state.ts`) rebuilds grids from svg or derives via `tileStatesToWalkableGrid` (guarded so edited tileStates are never clobbered by an svg rebuild), and `resolveObjectDef` (`domain/schema/interact.ts`) falls back to deriving the grid from tileStates, which also covers runtime asset maps that bypass init
- decision: kept both fields in the type + ingress normalize (over: full type removal - because in-memory resolve/validation/editor still use them and legacy files must keep loading)
- tests (`tests/test-asset-schema.ts`): fixture minus dead keys; serialize contract now exempts derived keys and asserts the drop; added legacy-load + resolve-derivation asserts (one self-caught fix: door cells derive to `true`)
- verified: 9 tsx suites exit 0 (asset/blueprint/sync/store-crud/migrate/persistence/settings/tags/collision), vitest 38/38, `lint` + `typecheck` pass

### wiring validation gaps closed (focus + orphan tags) - 2026-09-22 16:30 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- F1 (`assets/validation.ts`): `validateSettingsCompleteness` takes an optional managed-tag set and adds 3 checks - role focus-no-match, role orphan tags, task orphan tags; wording matches the wiring-badge regex so all three surface on the toolbar badge
- wired the set through all 3 callers (Toolbar, DeployNpcModal, persistence syncToGame); 3-arg calls keep old behavior (orphan checks skipped)
- tests (`test-settings-completeness.ts`): focus-no-match fires, matched+defined stays quiet, orphan fires only with the managed set
- verified: settings suite green (incl. 3 new blocks), `lint` + `typecheck` pass, vitest 38/38

### removed Refresh Objects + Workspace buttons - 2026-09-22 16:30 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- Refresh Objects removed end-to-end: toolbar button + `onSyncOrigins`, `store.refreshOriginInstances` + `BlueprintStore` interface entry - sole caller was the button; sim half was already covered by the deep-watcher auto-refresh, data half by fan-out/normalize paths
- Manage-group Workspace button removed; modal + `showWorkspace` state kept because the no-floors bootstrap block still opens it for Import
- tests (`tests/test-store-crud.ts`): the 2 ex-refresh cases now trigger through `updateAsset` (size re-derive + color preserve on an unrelated edit)
- verified: `test-store-crud` 46/46, sync/migrate/persistence/asset/blueprint exit 0, vitest 38/38, `lint` + `typecheck` pass

### truthful tile guide for draw/zone drag - 2026-09-22 16:45 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- user asked why Draw Object shows no tile guide: the drag rect rendered raw pointer pixels while commit snaps to tiles, and the 4px display threshold differed from the commit threshold - guide lied about the outcome
- fix (`EditorCanvas.vue`): `tileGuideRect` computed reuses the exact commit math per mode (round for draw, floor/ceil for zone) with a tile-count label, shown only when the drag passes the commit threshold; object marquee untouched, no new classes
- verified: `lint:bem` + `lint:css` pass, `typecheck` exit 0

### asset list reorder buttons - 2026-09-22 17:00 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- sidebar Origin Assets list gets per-row up/down buttons (`AssetToolbar.vue`, no new classes): registry-index based, disabled at the ends and while searching; mousedown/click/keydown stopped so row drag-select never fires
- `store.reorderAssets(fromIndex, toIndex)` mirrors `reorderFloors` (bounds-checked splice + save) + `BlueprintStore` interface entry
- test (`test-store-crud.ts`): move-to-end, move-back, and 3 rejected moves leaving order untouched
- verified: `test-store-crud` 47/47, `lint:bem` + `lint:css` + `lint` + `typecheck` pass

### IDE-like resizable sidebars - 2026-09-22 17:20 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- both sidebars (assets left, properties right) get an edge drag handle: shared `usePanelResize` composable (drag 200-480px, arrow keys, dblclick/Home reset, localStorage `blueprint-panel-width-*`) + `.sidebar__resizer` styles in the shared `layout.css` layer (no scoped redefinition)
- decision: one composable + shared CSS over per-panel copies (over: native CSS `resize` - handle sits bottom-right only, not the IDE edge-drag asked for)
- verified: `lint:bem` + `lint:css` + `lint` + `typecheck` pass

### dead code cleared (syncToGame) - 2026-09-22 17:30 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- removed `syncToGame` (store command + `BlueprintStore` interface entry) - sole dead item from the freshness audit: no caller, no UI trigger since the Sync Game button removal; dragged-out unused imports (`editorLog`/`validateSettingsCompleteness`/`buildSyncedPayload`) and the dead `assetMap` closure
- decision: kept `syncedPayload.buildSyncedPayload` (test-covered single egress module) and the wired `SyncPort` - dormant infra, not dead; `docs/skill/data-flow.md` line updated to state nothing currently emits
- verified: persistence/sync/store-crud exit 0, vitest 38/38, `lint` + `typecheck` pass

### move landing guide + selection color answer - 2026-09-22 17:45 UTC+7 (opencode, opencode/muse-spark-1.3-contributor-free)
- `moveGuideRect` (`EditorCanvas.vue`): while dragging a selection, a green dashed landing rect shows the selection's true bounds (linked members included) snapped to the tile grid and clamped to the building area - the exact `commitMove` math (`clamp(snap(minX), snap(minY), w, h)`); appears only after the drag threshold (`_dragHasMoved`), multi-select aware, no new classes
- selection-color answer (read-only): NOT one setting - canvas selection + highlight share `--accent-gold` (`editor__overlay--selected`/`--highlight`), UI active states + links use `--accent-blue`, focus outlines `--accent-primary`; all are theme token references, no user-facing color setting exists
- verified: `lint` + `typecheck` (fixed floor shadowing + missing import mid-task), `lint:bem` + `lint:css` pass
