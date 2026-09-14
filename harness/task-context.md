## Mission

Disconnect mod-cli from the host (user no longer wants it): remove all wiring, move mod-cli/ to _archive/ with git mv, keep everything recoverable in the archive.

## Plan

- [ ] Inspect: all consumers (vite.config.ts bridge, ModCLI route mount in src/, tests/test-mod-cli-agent-state.ts, package.json scripts), tsconfig coverage of _archive
- [ ] Remove ModCLI route mount from src/
- [ ] Remove clineBridgePlugin + modCliPlugin + imports from vite.config.ts
- [ ] package.json: drop test:mod-cli-agent-state + aggregate entry
- [ ] git mv mod-cli -> _archive/mod-cli; git mv tests/test-mod-cli-agent-state.ts -> _archive/ (fix import path)
- [ ] Grep old paths/basenames repo-wide; clean leftovers
- [ ] Verify: typecheck + lint + lint:bem + lint:css + verify.mjs route/check
- [ ] Done: history entry, clear slot

## Blockers

- (none)

## Hand-off Note

(empty - next action: grep all mod-cli consumers)



