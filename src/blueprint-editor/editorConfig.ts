const ENV = (import.meta as any).env ?? {}

const RAW_CONFIG = {
	layoutVersion: 2,
	historyLimit: 50,
	saveEndpoint: ENV.VITE_BLUEPRINT_SAVE_ENDPOINT || '/__save-layout',
	assetsSaveEndpoint: ENV.VITE_BLUEPRINT_ASSETS_ENDPOINT || '/__save-assets',
	npcConfigSaveEndpoint: ENV.VITE_BLUEPRINT_NPC_CONFIG_ENDPOINT || '/__save-npc-config',
	loadLayoutEndpoint: ENV.VITE_BLUEPRINT_LOAD_LAYOUT_ENDPOINT || '/__load-layout',
	loadNpcConfigEndpoint: ENV.VITE_BLUEPRINT_LOAD_NPC_CONFIG_ENDPOINT || '/__load-npc-config',
	loadOriginAssetsEndpoint: ENV.VITE_BLUEPRINT_LOAD_ORIGIN_ASSETS_ENDPOINT || '/__load-origin-assets',
	saveDebounceMs: 500,
	defaultCanvas: {
		width: 1600,
		height: 1200,
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
