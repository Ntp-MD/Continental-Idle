# Zed theme tooling (personal)

Visual theme map + localhost server for editing Zed `experimental.theme_overrides`.

## Files

- `zed-theme-map.html` - generated visual map (do not hand-edit; regenerate it)
- `sync-theme-map.mjs` - regenerates the map from `%APPDATA%\Zed\settings.json`
- `theme-server.mjs` - localhost server: serves the map, saves picks, live-reloads
- `highlight.mjs` - server-side tree-sitter highlighting (needs `node_modules` + `queries/` next to it, see below)

## Use

1. Copy this folder next to your Zed `settings.json` (`%APPDATA%\Zed\` on Windows).
2. `npm i web-tree-sitter@0.22.6 tree-sitter-wasms`, fetch `queries/*.scm`, then `node theme-server.mjs`.
3. Open `http://127.0.0.1:18751/`.

## Not here on purpose

`settings.json` itself - it holds personal/account config. A `.zed/settings.json` in a repo would override project settings for every collaborator, so the live settings file never lives here.
