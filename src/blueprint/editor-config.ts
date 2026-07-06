export const EDITOR_CONFIG = {
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
