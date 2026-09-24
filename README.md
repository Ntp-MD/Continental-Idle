# Continental Idle - Blueprint Editor

Browser-based authoring tool for Continental Idle floor plans and NPC settings. It edits a
single workspace (floors, objects, origin assets, tags, NPC config) and either persists it
locally in the browser or syncs a compact payload to the game.

## Requirements

- Node.js 22+
- A modern browser (IndexedDB is required for the production build)

End-to-end tests need the Chromium browser once per machine:

```bash
npm run test:e2e:install
```

They build the app and serve it with `vite preview`, so they exercise the real
production persistence path (IndexedDB) and never touch the dev store file.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL. In dev the workspace is read from and written to
`src/blueprint-editor/data/blueprint-data.json` through the Vite middleware at
`/__blueprint-data` (atomic temp+rename writes) - that file is the canonical dev store.

## Production build

```bash
npm run build     # emits dist/
npm run preview   # serve the build locally
```

A production build is a static app: there is no backend, so the workspace is stored in the
browser's IndexedDB. Use **Workspace -> Export / Import** (Toolbar, Manage row) to move a
workspace between machines as a single `.json` file. On first load with no local data the
editor starts empty.

Persistence selection is automatic and can be overridden with `VITE_PERSISTENCE`:

- `VITE_PERSISTENCE=http` - use `VITE_BLUEPRINT_DATA_ENDPOINT` (default `/__blueprint-data`)
- `VITE_PERSISTENCE=local` - always use IndexedDB
- unset - dev server uses http, a production build uses IndexedDB

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server with the blueprint-data middleware |
| `npm run build` | Type-check and build to `dist/` |
| `npm run preview` | Serve the production build |
| `npm run test:unit` | vitest only (unit + component suites) |
| `npm run test:e2e` | Playwright browser smoke against the production build |
| `npm run test:e2e:install` | Download the Chromium browser (once per machine) |
| `npm run verify` | typecheck + lint + BEM/CSS lint + unit + asset verification |
| `npm run verify:assets` | Validate the origin assets in `blueprint-data.json` |
| `npm run typecheck` / `npm run lint` | Type and lint gates |

## Architecture

- `src/blueprint-editor/domain/schema/` - pure schema kernel (types + normalization +
  resolution), split by dependency order; `domain/types.ts` re-exports it.
- `src/blueprint-editor/store/` - single-writer command bus (`runExclusive`), persistence
  ports (`httpPorts`, `localPort`, `persistenceFactory`), schema version gate
  (`schemaMigration`), workspace file (`workspaceFile`).
- `src/engine/` - framework-free NPC simulation shared by the editor preview and the runtime.
- `src/blueprint-editor/components/` - Vue UI only.

A save is whole-file and atomic: one entity past a persistence limit makes every later save
fail, so construction paths and ingress normalizers share the caps in
`src/blueprint-editor/limits.ts`.

## Privacy

No telemetry, analytics, or third-party requests. The production build makes no network calls
at all; the dev server talks only to its own loopback middleware.

## License

Private project - all rights reserved.
