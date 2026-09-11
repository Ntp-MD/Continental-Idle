<!-- Slot protocol (harness/harness.md): write-through triggers - user order/context
shift, finding or root cause, decision options or landed choice. Append here FIRST,
then resume the task. Writes are silent (never narrate or quote in chat). Never
defer - a context cutoff on an unwritten slot defeats this file. Clear only when
fully done (plan ticked + history logged). -->

## Mission

mod-cli: let the user explicitly select the cline auth/billing provider over the ACP wire. Live cline 3.0.61 `provider` config option (probed): `cline` ("Cline Usage-Billing"), `cline-pass` ("ClinePass"), `openai-codex` ("OpenAI ChatGPT Subscription"). Today the provider is only switched implicitly when a model id carries a matching prefix; an explicit selector is needed. Build it from the CLI's own option list (never hardcode).

## Plan

- [x] Probe live cline ACP: provider option values + per-provider model values (probed: cline="Cline Usage-Billing", cline-pass="ClinePass", openai-codex="OpenAI ChatGPT Subscription"; model values per-provider, some prefixed `cline-pass/...`, some not `z-ai/...`)
- [x] modCliBridge.ts: `providerAccount` on run request; `ModCliConfigOption`(+Choice) type; parse `providerOption` from /models
- [x] vite.config.ts: harvest + expose `providerOption`; honor `providerAccount` in `applyRunConfig` (authoritative, set before model); validate in /run
- [x] ModCLI.vue: Provider select (from live catalog) + persist + rebind + forward in run
- [x] Verify: npm run typecheck (3 configs) + lint:bem (35) + lint:css (35) - all green
- [ ] Runtime smoke test (see Hand-off Note) - NOT done: agent shell could not keep a dev server reachable
- [ ] mod-cli/mod-cli.md: document provider selector + config field
- [ ] Slot clear + history log

## Blockers

- Live dev-server smoke test could not run from the agent shell (background `vite` never became reachable / command aborted). Needs the user's own `npm run dev` terminal.

## Hand-off Note

mod-cli explicit auth/billing provider selector. Code is COMPLETE and type/lint green; the runtime smoke test is the only unverified part.

DONE (code):
- mod-cli/src/modCliBridge.ts: `ModCliRunRequest.providerAccount`; `ModCliConfigOption` + `ModCliConfigOptionChoice`; `ModCliModelsResult.providerOption`; `parseModCliConfigOption()`; `fetchModCliModels` now parses `payload.providerOption`.
- vite.config.ts: `ClineRunBody.providerAccount`; `ModCliAuthProviderOption` interface; `modelsCache` carries `providerOption`; `harvestModels` captures/sweeps/caches/returns it; `/models` returns `providerOption`; `applyRunConfig` sets the provider config option FIRST when `providerAccount` matches a provider option value (authoritative - model applies under it), else keeps the legacy model-prefix path; `/run` validates `providerAccount` with `CLINE_ID_PATTERN` -> 400 "Invalid provider account".
- mod-cli/src/ModCLI.vue: `providerAccount` + `boundProviderAccount` refs, `cliProviderOption` ref, `providerAccountOptions` computed, Provider `<select>` in Settings (`v-if` options exist, label = CLI option's own name), persisted in `cline-chat-settings-v1`, wired into watch/load/bind/newChat/send + forwarded in the run request.

EXACT NEXT ACTION (runtime smoke test):
1. In the user's own terminal run `npm run dev` (do NOT use a background Start-Process from the agent shell - it did not stay reachable).
2. Models endpoint (proves providerOption reaches the client), PowerShell:
   `Invoke-WebRequest -Uri "http://127.0.0.1:<port>/__cline/models" -Method POST -Headers @{ 'x-blueprint-client'='1'; 'Content-Type'='application/json' } -Body '{"provider":"cline"}' -UseBasicParsing | Select-Object -ExpandProperty Content`
   Expect JSON with `providerOption: { id:"provider", options:[{cline,"Cline Usage-Billing"},{cline-pass,"ClinePass"},{openai-codex,"OpenAI ChatGPT Subscription"}] }`.
3. UI: open `/mod-cli/cline` -> Settings -> Provider select shows "CLI default" + the three names; pick "ClinePass"; refresh and confirm it persisted.
4. Live run: send a 2+ word prompt with Provider=ClinePass and confirm it succeeds.

REMAINING DONE-DEFINITION:
- run the smoke test above.
- update `mod-cli/mod-cli.md`: Features "Providers & models" (explicit auth-provider selector) + Configuration sample (`providerAccount`) + limitation (model list stays merged across providers; the explicit provider wins over a model's prefix).
- then clear this slot and append a `harness/history.md` entry.

VERIFY ALREADY RUN (green): `npm run typecheck` (3 configs), `npm run lint:bem` (35 files), `npm run lint:css` (35 files).
Temp probe scripts (`tests/_*.tmp.mjs`) were deleted; the probe recipe is the code snippet in step 2 plus a `session/new` ACP call.


