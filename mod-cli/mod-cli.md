# mod-cli

> **A portable UI for coding CLIs.** Drop one folder into any Node project and it instantly gets a chat-first AI IDE — no build, no lock-in, bring your own CLI sign-in.

**mod-cli** is not a terminal. It is a real UI (chat, panels, settings) that wraps an existing coding CLI behind it. The core rule: **if the CLI can do it, the UI can do it** — mod-cli never reinvents agent logic, it only changes the front.

Paste the `mod-cli/` folder into a Node project, wire two mounting points, run `npm run dev` — and the project now serves its own AI IDE at `http://localhost:xxxx/mod-cli/cline`. The UI binds to *that* project: every run executes with the project root as context.

## Why

Coding CLIs are powerful, but they live in terminals. A chat-first workflow wants things a terminal gives you reluctantly: streaming output with collapsible thinking, session history, a model picker, usage meters, and a settings panel — without leaving the project you are already running. mod-cli keeps the CLI as the single source of truth (sessions, history, model catalog) and puts a calm UI on top.

## Features

### Chat & sessions
- Session chat bound to the host project — every run starts an ACP session with the project root as cwd
- Streaming replies and thinking, exactly as the agent emits them (ACP `session/update` stream)
- **Resume actually continues**: sessions are loaded over the ACP wire (`session/load`), so follow-up messages keep the same session and full context
- Browse past sessions from the CLI's own history and resume one (model / provider restored); delete a session from the drawer (with confirm)
- New chat, Stop mid-run (graceful `session/cancel`), Act / Plan mode
- Auto-approve tools toggle (default on) — turning it off lets the agent ask first (cline)
- Live tool-call lines: every tool the agent runs appears as a status-tracked line (pending → running → done / failed)
- Lightweight TODO panel: a per-session checklist kept in this browser (add, tick, delete, clear done) that survives a refresh, plus **Use as prompt** to hand the open steps to the composer

### Permissions (approve / reject per action)
- With auto-approve off, the agent's permission requests appear as inline cards with the CLI's own options (allow / reject, once / always)
- One click answers the pending request over the wire (`POST /__cline/permission`); cards lock after answering or when the run ends

### Providers & models
- Provider selected by URL path: `/mod-cli/cline` (default) or `/mod-cli/opencode`
- Model dropdown built from the **agent's own catalog** (harvested live over ACP, cached 5 min) — never hardcoded
- Context window read live from the CLI catalog per model (cline), or adopted from the agent's live usage updates (opencode)
- Changing provider / model / reasoning mid-session starts a fresh session (with a guard note in chat)

### Settings & connection
- Connection test proves CLI reachability per provider; a live connection dot reflects provider / model drift against the tested record
- An API key can still be stored in the browser — but the ACP wire does not accept raw keys, so runs use the CLI's own stored sign-in (see limitations)

### Usage & context meters
- Per-session context gauge: used tokens vs the model's context window (from the catalog, or the agent's live `usage_update` window) — warn at 70%, danger at 90% or on `context_window_exceeded`
- In/out ratio bar as fallback when the window is unknown
- Session usage & cost committed to a local usage log (40-day / 500-record retention)

### Portability
- One self-contained folder: Vue 3 is the only peer dependency
- Isolated, scoped CSS (`mod-cli-*` prefix); design tokens live in a cascade layer, so the host project can retheme the UI by overriding `--mod-cli-*` variables unlayered
- Works on Windows / macOS / Linux

## How it works

```
Browser UI (mod-cli/src)  <-- NDJSON stream -->  Host dev server bridge (/__cline/*)  -->  ACP agent (cline --acp | opencode acp)
```

The bridge speaks **ACP (Agent Client Protocol) over stdio** with the CLI: `initialize`, `session/new` / `session/load`, `session/prompt`, `session/set_config_option` (model / mode / auto-approve), `session/update` (message / thought / tool-call / usage / plan), `session/request_permission`, `fs/read_text_file` / `fs/write_text_file` (confined to the project root), `session/cancel`. Everything is translated to the same NDJSON line contract the UI consumes:

| Line | Role |
| --- | --- |
| `bridge` start / session / exit / raw | run lifecycle (runId, sessionId, exit code) |
| `bridge` **permission** | a pending `session/request_permission` (permissionId + options) |
| `agent_event` content / tool_call / usage / note / error | mapped from `session/update` |
| `run_result` | finishReason + duration + aggregated usage |

| File | Role |
| --- | --- |
| `src/ModCLI.vue` | The whole UI (chat / settings / sessions / gauges) + client logic |
| `src/modCliBridge.ts` | Typed client for the `__cline` bridge (fetch + NDJSON stream) |
| `src/modCliViteAdapter.ts` | Vite plugin that maps `/mod-cli...` routes to the SPA |
| `style/ModCLI.css` | Self-contained, scoped styles + `@layer` token defaults |

The host project wires exactly two points: mount `<ModCLI :initial-provider>` on the route, and plug in `modCliPlugin()` plus the server-side bridge. The bridge is a thin, honest layer over the CLI:

| Endpoint | Role |
| --- | --- |
| `GET /__cline/config` | Per-provider CLI availability / version / cwd |
| `POST /__cline/run` | Start an ACP agent per prompt (cwd = project root); streams the NDJSON lines above |
| `POST /__cline/permission` | Answer a pending permission (runId + permissionId + optionId) |
| `POST /__cline/stop` | Graceful `session/cancel`, then kill the run by `runId` |
| `GET /__cline/history` | Session summaries per provider (cline history / opencode `session/list`) |
| `POST /__cline/delete-session` | cline `history delete` / opencode `session/close` |
| `POST /__cline/test-connection` | Prove the CLI is reachable per provider |
| `POST /__cline/model-info` | Context window for a model, from the cline catalog |
| `POST /__cline/models` | Model list harvested from the agent's own config options (cached) |

## Requirements

- A Node + npm project you can start with `npm run dev` (other stacks are out of scope for now)
- A coding CLI installed locally: `cline` (3.x, ACP mode) and/or `opencode` (1.18+, `acp`); signed in to at least one provider in the CLI itself
- Vue 3.5+ in the host project (only peer dependency)

## Installation

**Option 1 — Copy the folder (works today)**

1. Copy `mod-cli/` into your project
2. Wire two points in the host:
   - Mount `<ModCLI :initial-provider>` on the `/mod-cli...` path (see `src/modCliViteAdapter.ts`)
   - Serve the bridge endpoints under `/__cline/*`
3. Run `npm run dev` as usual — no build step needed

**Option 2 — Install as a package (planned, not published yet)**

```bash
npm i mod-cli   # or: pnpm add mod-cli / bun add mod-cli
```

## Quick start

1. Open `http://localhost:xxxx/mod-cli/cline` (or `/mod-cli/opencode`)
2. Press **Test Connection** to confirm the CLI is reachable
3. Pick a model (preselected from the agent's own default) and Act / Plan mode
4. Type a prompt and send — with auto-approve off, answer the inline permission cards as the agent works

## Configuration

```jsonc
// lives in the browser (localStorage), additive fields
{
  "provider": "cline | opencode", // from the URL path
  "apiKey": "USER_API_KEY",       // optional; stored only (the ACP wire does not consume keys yet)
  "model": ""                     // optional; empty = agent default
}
```

## Host theming

Override any token from your own CSS (unlayered) and mod-cli follows the host:

```css
.mod-cli-chat {
	--mod-cli-bg-primary: #101418;
	--mod-cli-accent: #e9573f;
	--mod-cli-font-mono: "SFMono-Regular", monospace;
}
```

## Data & privacy

- Your API key lives in your browser's `localStorage` only and is **never sent to the bridge runs** (the ACP wire has no key channel). It is echoed only in masked form (last 4 chars) in the connection summary.
- Settings save instantly on every change and survive refreshes.
- Per-run usage (cost / tokens) is kept locally (`cline-chat-usage-v1`, 40 days / 500 records).
- The TODO checklist is kept locally too (`cline-chat-todos-v1`), tagged with the session it belongs to; **New chat** clears it along with the transcript.
- Chat logs are **not persisted** — refresh and the transcript is gone. The source of truth for history is the CLI itself.

## Known limitations

**Proven ACP wire limits (cline 3.0.61 / opencode 1.18.10):**

- Neither agent's ACP wire accepts raw API keys (`-P`/`-k` argv is ignored in `--acp` mode; `authenticate` triggers interactive sign-in flows) — runs use the CLI's own stored sign-in
- cline's ACP wire carries no usage/tokens and no context window — the gauge fills from CLI history after the run
- cline may stream the reply only as thought blocks (no separate message chunk) — the UI auto-opens the last thinking item when no message block arrives
- cline model ids carry their sign-in provider as a prefix (`cline-pass/glm-5.3-flash`); the bridge switches the provider config option first, and the model dropdown sweeps all of the CLI's sign-in providers
- Reasoning effort is not a settable config option over the ACP wire (probed live: cline's catalog is only provider/model/mode, opencode rejects every reasoning id) — the provider default applies; the UI notes this once per selected effort, not on every run
- Worktree (isolated) runs are not supported over the ACP wire — the checkbox was removed
- A model that is not valid under the CLI's active sign-in provider runs but returns an empty reply (the CLI's own auth state, not a wire error)
- opencode `session/list` carries title/timestamps only — no per-session usage or model

**Current UI gaps (honest status):**

- Session titles for opencode come from opencode's own naming ("New session - ...")
- Chat transcript is per-page-load; the sessions drawer is the durable history
- Theme follows mod-cli's tokens; a host retheme requires overriding the token block

## Roadmap

- [x] `/mod-cli` route + provider paths + UI wrapper over the stock CLI
- [x] Settings + Test Connection + connection status (per provider)
- [x] Settings auto-persist on every change; model changes never flag a retest
- [x] Model list + context windows from the agent's own catalog
- [x] Context usage gauge (% of model window) + session usage
- [x] Approve/reject per action over ACP (`session/request_permission` → inline cards)
- [x] OpenCode execution bridge (ACP transport, model harvest, session list)
- [x] Session deletion (cline history delete / opencode session close)
- [x] Lightweight per-session TODO list (local, session-tagged, survives a refresh)
- [x] Host theme inheritance via `@layer` token defaults
- [ ] Publish as an installable package + real-world trials on 2-3 Node projects

## Status & license

Experimental, actively developed, and currently private. A license will be decided before any public release — pick one (MIT is the usual default for this kind of tool) before publishing.
