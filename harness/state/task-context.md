## Mission

Lobby floor authored on `floor-g` with only the 20 surviving assets, audited in real Chromium
(Playwright). Build + both audits are DONE; cleanup + Done gates are NOT.

## Plan

- (all remaining items are cleanup, see Hand-off Note)

## Blockers

- (none)

## Hand-off Note

State of the tree right now (2026-09-24):

- `src/blueprint-editor/data/blueprint-data.json` - holds the authored lobby: `tileStates` 50x80
  (2489 blocked / 1487 walkable / 24 door), 28 objects, 8 spawn zones, 4 lift cars, 11 openings.
  Envelope rows 8-41 / cols 8-71; vestibule + arrival door north; lobby hall / lift hall centre;
  west band lounge+kitchen+staff; east band bar+restrooms+gym.
- Same file was MUTATED by the host during the Playwright Deploy run: `pruneNpcReferences` deleted
  11 dangling task posts (concierge-desk, greeting-desk, pass-window, dish-return, cafe-counter,
  linen-shelf, dry-store-shelf, control-panel, riser-closet, ahu, spa-bed). Toast confirmed it.
  Wiring badge went 17 -> 5. Pre-authorized (pre-release standing order), no action needed.
- Dev server `b17x80lkl` is STILL RUNNING on http://localhost:5199/ - stop it.
- Temp files to delete this session (AGENTS.md hygiene):
  `tests/_build-lobby.tmp.mjs`, `tests/_verify-lobby.tmp.ts`, `tests/_probe.tmp.ts`,
  `tests/_visual-audit.tmp.mjs`, `tests/_preview-audit.tmp.mjs`.
- Then `npm run clean` and the routed gates ONCE: `npm run verify:assets` + one human-pick schema
  suite for the `data/**` row (there is no `test:blueprint-schema` script; `test:unit` covers it).
- Verify tooling is reproducible: `node tests/_build-lobby.tmp.mjs` rebuilds the plan from scratch,
  `npx tsx tests/_verify-lobby.tmp.ts` prints ingress / integrity / 10 derived rooms / role
  reachability / wiring split. Last run: `INGRESS ok`, `validateLayoutIntegrity: no issues`,
  Lobby 393 tiles = 98.3 m2, Kitchen 99, Bar 108, Bathroom 90, Staff Room 88, Lounge 66, Gym 216,
  3 circulation regions; reachability 100 % for all 10 roles from the STREET spawn tile 33,5 via
  real A*.
- Playwright result: preview banner shown, status `Running`, 12 NPCs (guest 8, receptionist 2,
  security 1, bartender 1), `Moving 8 Interacting 3 Waiting 1` at t+20 s, zero console errors,
  zero alerts. Screenshots in the session scratchpad (`lobby-01..05`).
- Open question for the user, from an earlier instruction ("after improved delete report file"):
  `docs/analysis/wiring-efficiency-audit.md` is still in the tree. Ask before deleting.
- Known content gap, NOT a defect: the 5 remaining wiring notes are all "pool count is 0"
  (Chef x3, Housekeeper, Laundry Attendant) - those roles are configured but never deployed, so
  kitchen / laundry tasks idle. Fixing it is a NPC-pool decision, not a floor-plan one.

Next action: run the cleanup list above, then report DONE.
