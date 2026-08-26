# ADR-0002: Browser storage is limited to visual toggles

Date: 2026-08-25

## Context

The editor persisted UI state in browser storage: `blueprint-editor-ui-state`
(currentFloorId, mode, selection, selectedAssetId) and `blueprint-zoom-state`
(zoom/pan). Blueprint data (floor ids like `floor-ecf72c4c8f`) lives in
git-tracked files and travels between machines, but localStorage does not.
Switching devices (work/home workflow) guaranteed stale persisted ids pointing
at floors that no longer exist; `currentFloor` resolved to undefined and the
floor switcher UI vanished (`v-if="floor"` in EditorCanvas). The zoom key was
additionally broken by design: writes went to localStorage while reads came
from sessionStorage, so it never restored anything.

## Decision

Browser persistence is restricted to `blueprint-view-toggles` (grid, labels,
walkable overlay, interact spots, walls, highlights, building bounds, npc
guides). Everything else opens deterministic per session:

- currentFloorId: never persisted; boot resolves to the first floor (G).
- mode/selection/selectedAssetId: session-local defaults.
- zoom/pan: reset each mount; EditorCanvas fits to screen on mount.
- Guards remain as safety nets: stale currentFloorId falls back to the first
  floor at boot and after reloadEditorData.

HMR `_editorLayout` (import.meta.hot.data) stays - it is in-memory dev-only
state, not browser storage.

## Trade-off

- Refreshing no longer restores the active floor, tool mode or selection;
  reopening them costs a click. Deterministic cross-device behavior was judged
  worth more than single-device convenience for this project.

## Revisit trigger

If session restore on a single device becomes important again, persist only
against a data fingerprint (e.g. hash of floor ids) so any divergence between
storage layers auto-invalidates instead of dangling.
