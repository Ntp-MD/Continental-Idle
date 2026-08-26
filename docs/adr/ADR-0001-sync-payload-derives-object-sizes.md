# ADR-0001: Sync payload derives object dimensions from origin assets

Date: 2026-08-25

## Context

`serializeObject` persists placements without `w`/`h` by design (dimensions are
derived from the origin asset at load time). The game boot path
(`loadPersistedSyncPayload` -> `buildSyncedPayload`) copied `o.w`/`o.h`
verbatim, so every synced object had undefined dimensions on a fresh page
load. Renderers drew zero-size rects / NaN transforms: objects reported as
placed were invisible (e.g. custom-table-1 on Lobby). Pressing "Sync Game"
from the editor masked the bug because live editor state carries resolved
sizes.

## Decision

`buildSyncedObject` (src/blueprint-editor/syncedPayload.ts) treats missing or
non-positive `w`/`h` as absent and derives size via `assetSizeFor(type,
rotation, tileSize, assets)`, including the 90/270 rotation swap. Explicit
positive sizes still pass through untouched.

## Trade-off

- Objects whose asset is missing from the registry sync as 0x0 (same visible
  result as before; unknown types already degrade elsewhere).
- One extra size computation per object per sync; negligible.

## Revisit trigger

If persisted placements ever start carrying authoritative sizes again (schema
change to serializeObject), drop the derivation branch and assert sizes exist
instead of silently defaulting to 0.
