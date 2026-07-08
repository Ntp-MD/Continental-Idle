const RAW_CONFIG = {
  layoutVersion: 1,
  historyLimit: 50,
  syncKey: 'blueprint-synced-layout',
  saveEndpoint: '/__save-layout',
  saveDebounceMs: 500,
  defaultCanvas: {
    width: 1200,
    height: 600,
    tileSize: 25,
  },
} as const

function validateConfig(config: typeof RAW_CONFIG): void {
  if (config.historyLimit < 1) throw new Error('historyLimit must be >= 1')
  if (config.saveDebounceMs < 0) throw new Error('saveDebounceMs must be >= 0')
  if (config.defaultCanvas.tileSize < 1) throw new Error('tileSize must be >= 1')
  if (config.defaultCanvas.width <= 0) throw new Error('canvas width must be > 0')
  if (config.defaultCanvas.height <= 0) throw new Error('canvas height must be > 0')
}

validateConfig(RAW_CONFIG)

export const EDITOR_CONFIG = RAW_CONFIG
