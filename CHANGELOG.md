# Changelog

All notable changes to the Continental Idle blueprint editor.

## 1.0.0

First release-ready cut.

- Production build is now usable: persistence is chosen at boot - dev uses the Vite
  middleware, a build uses IndexedDB - and a missing IndexedDB or a corrupt/unreachable store
  fails loudly instead of showing an empty editor.
- Workspace export/import as a single `.json` file (Toolbar, Manage row).
- Schema version gate with explicit errors for newer or malformed files, plus a golden
  round-trip fixture.
- `blueprint-data.json` is the single source: the `*.data.ts` seed modules and
  `seed:blueprint-data` are retired; tests seed from the JSON.
- Single-writer queue covers every command that saves; payload-cap failures report a specific
  message.
- Asset delete cascades instances (locked included) and clears task posts; added a bulk
  "Delete All" for the palette.
- Portal spot-count mismatch no longer dead-ends cross-floor travel; validation warns.
- Flattened assets default to walkable.
- `domain/types.ts` split into `domain/schema/*` with a barrel and an enforced import boundary
  (engine + schema kernel cannot import store/UI/Vue).
- Engine code is included in coverage measurement.
