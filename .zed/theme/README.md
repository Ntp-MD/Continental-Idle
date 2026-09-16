# Zed theme tooling (personal)

Visual theme map + localhost server for editing Zed `experimental.theme_overrides`.

## Files

- `zed-theme-map.html` - generated visual map (do not hand-edit; regenerate it)
- `tokens.css` - generated design tokens: gap / size / font / color (do not hand-edit; edit the `TOKENS_CSS` block in `sync-theme-map.mjs` instead)
- `theme-map.css` - generated stylesheet for the map (do not hand-edit)
- `theme-map.js` - generated client script for the map (do not hand-edit)
- `resolve-settings.mjs` - finds the live Zed `settings.json` across OSes (`ZED_SETTINGS_PATH` overrides)
- `settings.json` - committed backup seed for devices without a live Zed config
- `sync-theme-map.mjs` - regenerates the map from `%APPDATA%\Zed\settings.json`
- `theme-server.mjs` - localhost server: serves the map, saves picks, live-reloads
- `highlight.mjs` - server-side tree-sitter highlighting (needs `node_modules` + `queries/` next to it, see below)

## Use

1. Copy this folder next to your Zed `settings.json` (`%APPDATA%\Zed\` on Windows).
2. `npm i web-tree-sitter@0.22.6 tree-sitter-wasms`, fetch `queries/*.scm`, then `node theme-server.mjs`.
3. Open `http://127.0.0.1:18751/`.

## Not here on purpose

`settings.json` itself - it holds personal/account config. A `.zed/settings.json` in a repo would override project settings for every collaborator, so the live settings file never lives here.
