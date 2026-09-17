# Enabling the `cline-pass` provider in opencode under Zed (for the home machine)

> Personal note, not project documentation — do NOT commit this file to git (it contains personal machine paths and setup steps).

## How it works (why this is needed)

`cline-pass` does not come from the project config, and it does not come from Zed — it is a **provider embedded in the opencode binary itself**. It activates when both conditions are met:

1. **The opencode binary contains the provider** (recent builds ship it built-in).
2. **A credential is present**, in either form:
   - an entry `cline-pass` in `%USERPROFILE%\.local\share\opencode\auth.json` shaped like `{"type":"api","key":"sk_..."}`, or
   - the env var `CLINE_API_KEY`.

With `agent_servers.opencode.type = "registry"`, Zed does **not** run the opencode you installed yourself. It auto-downloads its own copy to:

```
%LOCALAPPDATA%\Zed\external_agents\registry\opencode\v_<version>_<hash>\opencode.exe
```

and spawns it as `opencode.exe acp` (a child of `Zed.exe`) — **but it still uses the same data dir**, `%USERPROFILE%\.local\share\opencode\`. So writing the credential there is enough for Zed to see it.

In short: Zed does not store opencode's auth → a new machine must create the credential itself, and that one credential is shared by both the CLI and Zed.

---

## Pre-flight checks on the home machine

Run in PowerShell:

```powershell
# 1) Is the cline-pass credential already present?
$a = Get-Content -Raw "$env:USERPROFILE\.local\share\opencode\auth.json" -ErrorAction SilentlyContinue | ConvertFrom-Json
$a.PSObject.Properties.Name      # must include cline-pass

# 2) Or is the env var set?
$env:CLINE_API_KEY

# 3) Which opencode build did Zed download / does it embed the provider?
Get-ChildItem "$env:LOCALAPPDATA\Zed\external_agents\registry\opencode" -Directory | Select-Object Name
# If several builds exist, check the newest one:
$e = Get-ChildItem "$env:LOCALAPPDATA\Zed\external_agents\registry\opencode\*\opencode.exe" |
     Sort-Object LastWriteTime -Descending | Select-Object -First 1
$t = [Text.Encoding]::ASCII.GetString([IO.File]::ReadAllBytes($e.FullName))
$t.IndexOf('"cline-pass":')     # -1 = old build, provider not embedded
```

Interpretation:
- `IndexOf` = **-1** → build too old → update Zed, then reconnect so it downloads a newer build (or delete the old registry folder).
- `auth.json` has no `cline-pass` and `CLINE_API_KEY` is empty → do "Option 1 / 2" below.

---

## Option 1 (recommended) — log in via the opencode CLI

The opencode CLI and the Zed-managed build share the same `auth.json`.

```powershell
# Install the opencode CLI (if missing) — pick one
npm i -g opencode-ai
# or use the official opencode installer

# Log in
opencode auth login
# → select provider "ClinePass" (id: cline-pass)
# → paste the API key starting with sk_...
```

Then **quit Zed completely and reopen it** (config/auth load only once at startup) → open the agent panel → the model dropdown will list the `cline-pass/...` family.

---

## Option 2 (fallback) — write `auth.json` directly

Use this if you don't want to install the CLI. This **merges** with the existing file and does not overwrite other providers.

```powershell
$dir = "$env:USERPROFILE\.local\share\opencode"
New-Item -ItemType Directory -Force -Path $dir | Out-Null
$f = Join-Path $dir "auth.json"

$obj = if (Test-Path -LiteralPath $f) {
  Get-Content -Raw -LiteralPath $f | ConvertFrom-Json
} else { [pscustomobject]@{} }

# Replace <YOUR_KEY> with the real key (see below for how to get it)
$obj | Add-Member -NotePropertyName 'cline-pass' -NotePropertyValue ([pscustomobject]@{
  type = 'api'
  key  = '<YOUR_KEY>'
}) -Force

$obj | ConvertTo-Json -Depth 10 | Set-Content -LiteralPath $f -Encoding utf8
Write-Output "written: $f"
```

**Get the key from this machine** (run it on THIS machine, not the home one):
```powershell
(Get-Content -Raw "$env:USERPROFILE\.local\share\opencode\auth.json" | ConvertFrom-Json).'cline-pass'.key
```
Move the key to the home machine over a secure channel (do not paste it into chat / git / public synced files).

> Alternative without `auth.json`: set the `CLINE_API_KEY` env var at User scope, then **restart Zed** (all Zed processes must be closed, because GUI-launched processes only receive env vars at startup).

---

## Configure Zed `settings.json` (home machine)

Open `%APPDATA%\Zed\settings.json` and add/edit the `agent_servers.opencode` block:

```json
"agent_servers": {
  "opencode": {
    "type": "registry",
    "favorite_config_option_values": {
      "model": [
        "cline-pass/cline-pass/deepseek-v4.1-flash",
        "cline-pass/cline-pass/glm-5.3-flash"
      ]
    },
    "default_config_options": {
      "effort": "high",
      "model": "cline-pass/cline-pass/deepseek-v4.1-flash"
    }
  }
}
```

**Gotcha:** Zed model ids are `providerID/modelID`, and this provider's modelID already starts with `cline-pass/` → so it becomes `cline-pass/cline-pass/...` (double). Do not collapse it to a single level, or it will not resolve.

> Note: Zed settings sync only syncs `settings.json` (model names), never the credential — the names may show up, but without a key they still won't work.

---

## Verify it works

1. **Check opencode alone** — open the TUI (not through Zed):
   ```powershell
   opencode
   # type /models and check whether cline-pass/... is listed
   ```
2. **Check Zed** — fully quit and reopen Zed → agent panel → the model dropdown must show `cline-pass`.
3. **Confirm which build Zed is running**:
   ```powershell
   Get-CimInstance Win32_Process -Filter "Name='opencode.exe'" |
     Select-Object ProcessId, CommandLine, ExecutablePath
   ```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| TUI has no cline-pass | Binary too old, provider not embedded | `opencode upgrade` / update Zed |
| TUI has it but Zed doesn't | Zed is still using a cached old build | Update Zed, delete the old `%LOCALAPPDATA%\Zed\external_agents\registry\opencode`, reconnect |
| Zed lists the model but errors when calling it | No credential | Do Option 1 or 2 |
| Key is in env but Zed doesn't see it | Zed started before the env was set / GUI doesn't pick up new env | Set the env var at User scope, then restart all of Zed |
| Change has no effect | auth/config load only at startup | Quit and reopen Zed |

---

## Security

- `auth.json` stores the key in plaintext — treat it as a per-machine secret.
- Do not commit either `auth.json` or this file to git.
- If the key leaks: revoke/rotate it at Cline and log in again.
