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
			hint: 'Tolerances for hit, drag, cycle and box select.',
			fields: [
				{ key: 'dragThresholdPx', label: 'Drag threshold px', step: 0.5 },
				{ key: 'cycleThresholdPx', label: 'Cycle threshold px', step: 0.5 },
				{ key: 'boxSelectThresholdPx', label: 'Box select px', step: 0.5 },
			],
		},
	],
	display: [
		{
			title: 'Overlay Sizes',
			hint: 'Radius in screen px of spot dots, lock indicators and NPC dots.',
			fields: [
				{ key: 'interactSpotRadiusPx', label: 'Interact spot radius px', step: 0.5, preview: 'radius' },
				{ key: 'lockIndicatorRadiusPx', label: 'Lock indicator radius px', step: 0.5, preview: 'radius' },
				{ key: 'npcDotSize', label: 'NPC dot radius px', step: 0.5, preview: 'radius' },
			],
		},
		{
			title: 'Font Sizes',
			hint: 'Text sizes in px, scaled by 1/zoom.',
			fields: [
				{ key: 'labelFontSizePx', label: 'Object label', step: 0.5 },
				{ key: 'lockLabelFontSizePx', label: 'Lock label', step: 0.5 },
				{ key: 'interactSpotFontSizePx', label: 'Interact spot label', step: 0.5 },
				{ key: 'zoneLabelFontSizePx', label: 'Zone label', step: 0.5 },
				{ key: 'emptyStateFontSizePx', label: 'Empty state', step: 1 },
				{ key: 'rulerTickFontSizePx', label: 'Ruler tick', step: 0.5 },
			],
		},
		{
			title: 'Ruler',
			hint: 'Bar size clamps relative to zoom (sqrt scaling).',
			fields: [
				{ key: 'rulerMinPx', label: 'Min px', step: 1 },
				{ key: 'rulerMaxPx', label: 'Max px', step: 1 },
				{ key: 'rulerBasePx', label: 'Base px', step: 1 },
			],
		},
	],
	grid: [
		{
			title: 'Walkable Grid Editor',
			hint: 'Tile size constraints for the grid modal.',
			fields: [
				{ key: 'walkableGridMinTilePx', label: 'Min tile px', step: 1 },
				{ key: 'walkableGridMaxTilePx', label: 'Max tile px', step: 1 },
				{ key: 'walkableGridMaxWidthPx', label: 'Max width px', step: 10 },
				{ key: 'walkableGridMaxHeightPx', label: 'Max height px', step: 10 },
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
		hint: 'Ring width drives placement boundary and NPC walkable zone; ratios style dash/gap/sidewalk.',
		fields: [
			{ key: 'streetDashRatio', label: 'Dash ratio', step: 0.01 },
			{ key: 'streetGapRatio', label: 'Gap ratio', step: 0.01 },
			{ key: 'sidewalkTileRatio', label: 'Sidewalk tile ratio', step: 0.01 },
		],
	},
]
