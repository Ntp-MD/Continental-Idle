import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export function candidateSettingsPaths() {
  const out = []
  const override = process.env.ZED_SETTINGS_PATH ?? process.env.THEME_MAP_SETTINGS
  if (override) out.push(override)
  if (os.platform() === 'win32') {
    if (process.env.APPDATA) out.push(path.join(process.env.APPDATA, 'Zed', 'settings.json'))
    if (process.env.USERPROFILE) out.push(path.join(process.env.USERPROFILE, 'AppData', 'Roaming', 'Zed', 'settings.json'))
  } else {
    if (process.env.XDG_CONFIG_HOME) out.push(path.join(process.env.XDG_CONFIG_HOME, 'zed', 'settings.json'))
    const home = os.homedir()
    if (home) {
      out.push(path.join(home, '.config', 'zed', 'settings.json'))
      if (os.platform() === 'darwin') out.push(path.join(home, 'Library', 'Application Support', 'Zed', 'settings.json'))
    }
  }
  return [...new Set(out)]
}

export function resolveSettingsPath(localDir) {
  for (const p of candidateSettingsPaths()) {
    try {
      if (p && fs.existsSync(p) && fs.statSync(p).isFile()) return p
    } catch {}
  }
  const fallback = path.join(localDir, 'settings.json')
  try {
    if (fs.existsSync(fallback) && fs.statSync(fallback).isFile()) return fallback
  } catch {}
  return candidateSettingsPaths()[0] ?? fallback
}
