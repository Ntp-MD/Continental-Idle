import type { EditorSettings } from '../../domain/types'

export type FieldKey = keyof EditorSettings

export interface FieldDef {
	key: FieldKey
	label: string
	step: number
	preview?: 'radius'
}

export interface EditorGroup {
	title: string
	hint: string
	fields: FieldDef[]
}

export type SettingsTab = 'canvas' | 'interaction' | 'display' | 'grid'

export const settingsTabs: { key: SettingsTab; label: string }[] = [
	{ key: 'canvas', label: 'Canvas' },
	{ key: 'interaction', label: 'Interaction' },
	{ key: 'display', label: 'Display' },
	{ key: 'grid', label: 'Grid Editor' },
]

export const editorTabs = settingsTabs.filter((t) => t.key !== 'canvas') as {
	key: Exclude<SettingsTab, 'canvas'>
	label: string
}[]

export const editorGroupsByTab: Record<Exclude<SettingsTab, 'canvas'>, EditorGroup[]> = {
	interaction: [
		{
			title: 'Hit Testing',
			hint: 'How far the pointer may move or reach before it counts as a drag, stacked-object pick, or box select.',
			fields: [
				{ key: 'dragThresholdPx', label: 'Drag start distance (px)', step: 0.5 },
				{ key: 'cycleThresholdPx', label: 'Stacked-object pick radius (px)', step: 0.5 },
				{ key: 'boxSelectThresholdPx', label: 'Box select edge (px)', step: 0.5 },
			],
		},
	],
	display: [
		{
			title: 'Overlay Sizes',
			hint: 'Dot sizes in screen px - spot dots, lock indicators and NPC dots.',
			fields: [
				{ key: 'interactSpotRadiusPx', label: 'Spot dot size (px)', step: 0.5, preview: 'radius' },
				{ key: 'lockIndicatorRadiusPx', label: 'Lock dot size (px)', step: 0.5, preview: 'radius' },
				{ key: 'npcDotSize', label: 'NPC dot size (px)', step: 0.5, preview: 'radius' },
			],
		},
		{
			title: 'Font Sizes',
			hint: 'Text sizes in screen px - they stay the same size when you zoom.',
			fields: [
				{ key: 'labelFontSizePx', label: 'Object label (px)', step: 0.5 },
				{ key: 'lockLabelFontSizePx', label: 'Lock label (px)', step: 0.5 },
				{ key: 'interactSpotFontSizePx', label: 'Interact spot label (px)', step: 0.5 },
				{ key: 'zoneLabelFontSizePx', label: 'Zone label (px)', step: 0.5 },
				{ key: 'emptyStateFontSizePx', label: 'Empty message (px)', step: 1 },
				{ key: 'rulerTickFontSizePx', label: 'Ruler tick (px)', step: 0.5 },
			],
		},
		{
			title: 'Ruler',
			hint: 'Ruler bar size limits - the bar shrinks as you zoom out.',
			fields: [
				{ key: 'rulerMinPx', label: 'Ruler min size (px)', step: 1 },
				{ key: 'rulerMaxPx', label: 'Ruler max size (px)', step: 1 },
				{ key: 'rulerBasePx', label: 'Ruler base size (px)', step: 1 },
			],
		},
	],
	grid: [
		{
			title: 'Walkable Grid Editor',
			hint: 'Tile display size limits for the asset grid editor.',
			fields: [
				{ key: 'walkableGridMinTilePx', label: 'Smallest tile (px)', step: 1 },
				{ key: 'walkableGridMaxTilePx', label: 'Largest tile (px)', step: 1 },
				{ key: 'walkableGridMaxWidthPx', label: 'Grid max width (px)', step: 10 },
				{ key: 'walkableGridMaxHeightPx', label: 'Grid max height (px)', step: 10 },
			],
		},
	],
}

export function settingsFieldKeys(): FieldKey[] {
	return [
		...canvasEditorGroups.flatMap((group) => group.fields.map((field) => field.key)),
		...editorTabs.flatMap((tab) => editorGroupsByTab[tab.key].flatMap((group) => group.fields.map((field) => field.key))),
	]
}

export const canvasEditorGroups: EditorGroup[] = [
	{
		title: 'Street Rendering',
		hint: 'Street width sets the build boundary and NPC walking area; the ratios style the road dashes and sidewalk tiles.',
		fields: [
			{ key: 'streetDashRatio', label: 'Road dash length', step: 0.01 },
			{ key: 'streetGapRatio', label: 'Road gap length', step: 0.01 },
			{ key: 'sidewalkTileRatio', label: 'Sidewalk tile size', step: 0.01 },
		],
	},
]
