// Syncs the visual theme map from Zed's real settings.json.
// Run: node sync-theme-map.mjs (outputs zed-theme-map.html next to this script)
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import { resolveSettingsPath, candidateSettingsPaths } from './resolve-settings.mjs'

const dir = path.dirname(fileURLToPath(import.meta.url))
const settingsPath = resolveSettingsPath(dir)
if (!fs.existsSync(settingsPath)) {
  throw new Error(`settings.json not found. Tried: ${candidateSettingsPaths().join(', ')}. Set ZED_SETTINGS_PATH to override.`)
}
const raw = fs.readFileSync(settingsPath, 'utf8')
const json = raw
  .split('\n')
  .filter((line) => !/^\s*\/\//.test(line))
  .join('\n')
const settings = JSON.parse(json)
const o = settings['experimental.theme_overrides'] ?? {}
const syn = o.syntax ?? {}
const c = (key, fb) => o[key] ?? fb
const s = (key, fb = '#6e7681', st = '') => ({
  color: syn[key]?.color ?? fb,
  style: syn[key]?.font_style ?? st,
})
const esc = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const span = (text, { color, style }, g) =>
  `<span${g ? ` class="hot" data-goto="${g}" onclick="goto(this)"` : ''} style="color:${color}${style ? `;font-weight:${style === 'bold' ? 'bold' : 'normal'}${style === 'italic' ? ';font-style:italic' : ''}` : ''}">${esc(text)}</span>`

const kw = s('keyword', '#b8bcc1', 'bold')
const fn = s('function', '#9da1a7', 'bold')
const str = s('string')
const com = s('comment', '#6e7681', 'italic')
const typ = s('type', '#9da1a7')
const num = s('number')
const opr = s('operator', '#9da1a7')
const vr = s('variable', '#1f6feb')
const pr = s('property')
const pu = s('punctuation')
const brack = s('punctuation.bracket')
const delim = s('punctuation.delimiter')
const tagSt = s('tag', '#7ee787')
const attrSt = s('attribute', '#79c0ff')
const varSt = s('variable', '#f0f6fc')
const strSpec = s('string.special')
const fgTc = { color: c('editor.foreground', '#6e7681'), style: '' }
const bl = s('boolean', '#9da1a7')
const cst = s('constant', '#79c0ff')
const cbi = s('constant.builtin', '#79c0ff', 'bold')
const tbi = s('type.builtin', '#ffa657', 'bold')
const vsp = s('variable.special', '#1f6feb', 'bold')
const vpar = s('variable.parameter', '#6e7681', 'italic')
const cmdoc = s('comment.doc', '#9da1a7', 'italic')
const ttl = s('title', '#b8bcc1', 'bold')
const sesc = s('string.escape', '#9da1a7')
const srgx = s('string.regex', '#9da1a7')
const lmk = s('punctuation.list_marker', '#9da1a7')
const psp = s('punctuation.special', '#9da1a7')
const ltx = s('link_text', '#1f6feb', 'bold')
const luri = s('link_uri', '#1f6feb')
const emph = s('emphasis', '#9da1a7', 'italic')
const estr = s('emphasis.strong', '#b8bcc1', 'bold')
const tlit = s('text.literal')
const ctor = s('constructor', '#9da1a7')
const enm = s('enum', '#9da1a7')
const lbl = s('label', '#9da1a7')
const fg = (t) => span(t, { color: c('editor.foreground', '#6e7681'), style: '' }, 'editor.foreground')

const editorKeys = [
  ['editor.foreground', c('editor.foreground', '#6e7681'), 'Default code text color.', 'code', 'color'],
  ['editor.background', c('editor.background', '#0d1117'), 'Code area background.', 'bg', 'bg'],
  ['editor.line_number', c('editor.line_number', '#6e7681'), 'Gutter numbers.', '3', 'color'],
  ['editor.active_line_number', c('editor.active_line_number', '#b8bcc1'), 'Number of the line your cursor is on.', null, null],
  ['editor.selection', c('editor.selection', '#264f78'), 'Highlight behind selected text.', null, null],
  ['editor.gutter.background', c('editor.gutter.background', '#0d1117'), 'Background of the line-number column.', '3', 'bg'],
  ['editor.active_line.background', c('editor.active_line.background', '#161b22'), 'Background of the line your cursor is on.', 'line bg', 'bg'],
  ['editor.highlighted_line.background', c('editor.highlighted_line.background', '#161b22'), 'Background of highlighted lines (references).', 'ref bg', 'bg'],
  ['editor.invisible', c('editor.invisible', '#484f58'), 'Invisible characters (spaces, tabs).', '· →', 'color'],
  ['editor.indent_guide', c('editor.indent_guide', '#21262d'), 'Indent guide lines.', '│', 'color'],
  ['editor.indent_guide_active', c('editor.indent_guide_active', '#30363d'), 'Indent guide of the active scope.', '┃', 'color'],
  ['editor.wrap_guide', c('editor.wrap_guide', '#21262d'), 'Vertical wrap guides.', '│ 80', 'color'],
  ['editor.active_wrap_guide', c('editor.active_wrap_guide', '#30363d'), 'Active wrap guide.', '│ 100', 'color'],
  ['editor.subheader.background', c('editor.subheader.background', '#0d1117'), 'Sticky-scroll / subheader background.', 'subheader', 'bg'],
  ['editor.document_highlight.read_background', c('editor.document_highlight.read_background', '#264f78'), 'Read occurrence of the symbol under cursor.', 'read bg', 'bg'],
  ['editor.document_highlight.write_background', c('editor.document_highlight.write_background', '#264f78'), 'Write occurrence of the symbol under cursor.', 'write bg', 'bg'],
  ['editor.document_highlight.bracket_background', c('editor.document_highlight.bracket_background', '#264f78'), 'Matching bracket background.', 'bracket bg', 'bg'],
]
const uiKeys = [
  ['text', c('text', '#b8bcc1'), 'Main UI text: panel names, tabs, menus.', 'example.vue'],
  ['text.muted', c('text.muted', '#6e7681'), 'Muted UI text + project panel file/folder names.', '128 files'],
  ['text.accent', c('text.accent', '#1f6feb'), 'Links, badges, active highlights.', 'Learn more'],
  ['text.disabled', c('text.disabled', '#484f58'), 'Greyed-out, unavailable items.', 'Unavailable'],
  ['panel.background', c('panel.background', '#0d1117'), 'Side panel background.', 'panel swatch', 'bg'],
  ['tab.active_background', c('tab.active_background', '#0d1117'), 'Active tab background.', 'active tab', 'bg'],
  ['tab.inactive_background', c('tab.inactive_background', '#010409'), 'Inactive tab background.', 'inactive tab', 'bg'],
  ['status_bar.background', c('status_bar.background', '#0d1117'), 'Status bar background.', 'status swatch', 'bg'],
  ['title_bar.background', c('title_bar.background', '#0d1117'), 'Title bar background.', 'title swatch', 'bg'],
  ['toolbar.background', c('toolbar.background', '#0d1117'), 'Toolbar background.', 'toolbar swatch', 'bg'],
  ['border', c('border', '#30363d'), 'Lines between panels, tabs, edges.', 'framed box', 'border'],
  ['element.background', c('element.background', '#161b22'), 'Cards, popups, menus, pickers.', 'popup card', 'bg'],
  ['text.placeholder', c('text.placeholder', '#6e7681'), 'Placeholder text in inputs.', 'Search...', 'color'],
  ['link_text.hover', c('link_text.hover', '#1f6feb'), 'Link color on hover.', 'hover me', 'color'],
]
const borderKeys = [
  ['border.variant', c('border.variant', '#21262d'), 'Subtle borders inside panels.', 'inner box', 'border'],
  ['border.focused', c('border.focused', '#1f6feb'), 'Border of the focused element.', 'focused box', 'border'],
  ['border.selected', c('border.selected', '#1f6feb'), 'Border of the selected element.', 'selected box', 'border'],
  ['border.transparent', c('border.transparent', '#000000'), 'Invisible layout border.', 'ghost box', 'border'],
  ['border.disabled', c('border.disabled', '#21262d'), 'Border of disabled elements.', 'disabled box', 'border'],
]
const elementKeys = [
  ['element.hover', c('element.hover', '#21262d'), 'Hover background for list rows, buttons.', 'hover row', 'bg'],
  ['element.active', c('element.active', '#30363d'), 'Pressed / active background.', 'active row', 'bg'],
  ['element.selected', c('element.selected', '#264f78'), 'Selected row background.', 'selected row', 'bg'],
  ['element.disabled', c('element.disabled', '#0d1117'), 'Disabled element background.', 'disabled row', 'bg'],
  ['ghost_element.background', c('ghost_element.background', '#000000'), 'Transparent action-button background.', 'ghost btn', 'bg'],
  ['ghost_element.hover', c('ghost_element.hover', '#21262d'), 'Ghost button on hover.', 'ghost hover', 'bg'],
  ['ghost_element.active', c('ghost_element.active', '#30363d'), 'Ghost button when pressed.', 'ghost active', 'bg'],
  ['ghost_element.selected', c('ghost_element.selected', '#264f78'), 'Ghost button when selected.', 'ghost sel', 'bg'],
  ['ghost_element.disabled', c('ghost_element.disabled', '#0d1117'), 'Ghost button when disabled.', 'ghost dis', 'bg'],
]
const surfaceKeys = [
  ['background', c('background', '#0d1117'), 'Root window background.', 'root', 'bg'],
  ['surface.background', c('surface.background', '#0d1117'), 'Default surface background.', 'surface', 'bg'],
  ['elevated_surface.background', c('elevated_surface.background', '#161b22'), 'Elevated popups, modals, tooltips.', 'modal', 'bg'],
  ['drop_target.background', c('drop_target.background', '#264f78'), 'Drop-target highlight while dragging.', 'drop here', 'bg'],
  ['tab_bar.background', c('tab_bar.background', '#010409'), 'Tab bar strip background.', 'tab strip', 'bg'],
  ['title_bar.inactive_background', c('title_bar.inactive_background', '#010409'), 'Title bar when window is unfocused.', 'inactive title', 'bg'],
]
const paneKeys = [
  ['pane.focused_border', c('pane.focused_border', '#1f6feb'), 'Outline of the focused pane.', 'pane box', 'border'],
  ['pane_group.border', c('pane_group.border', '#30363d'), 'Border between pane groups.', 'split box', 'border'],
  ['panel.focused_border', c('panel.focused_border', '#1f6feb'), 'Outline of the focused panel.', 'panel box', 'border'],
  ['panel.indent_guide', c('panel.indent_guide', '#21262d'), 'Tree indent guides in panels.', '│ tree', 'color'],
  ['panel.indent_guide_active', c('panel.indent_guide_active', '#30363d'), 'Active tree indent guide.', '┃ tree', 'color'],
  ['panel.indent_guide_hover', c('panel.indent_guide_hover', '#1f6feb'), 'Tree indent guide on hover.', '┃ hover', 'color'],
]
const scrollKeys = [
  ['scrollbar.track.background', c('scrollbar.track.background', '#0d1117'), 'Scrollbar track.', 'track', 'bg'],
  ['scrollbar.track.border', c('scrollbar.track.border', '#21262d'), 'Scrollbar track border.', 'track box', 'border'],
  ['scrollbar.thumb.background', c('scrollbar.thumb.background', '#30363d'), 'Scrollbar thumb.', 'thumb', 'bg'],
  ['scrollbar.thumb.border', c('scrollbar.thumb.border', '#21262d'), 'Scrollbar thumb border.', 'thumb box', 'border'],
  ['scrollbar.thumb.hover_background', c('scrollbar.thumb.hover_background', '#484f58'), 'Scrollbar thumb on hover.', 'thumb hover', 'bg'],
  ['search.match_background', c('search.match_background', '#264f78'), 'Search match highlight.', 'match', 'bg'],
]
const tri = (name, fb, desc) => [
  [name, c(name, fb), desc, desc.split(',')[0], 'color'],
  [`${name}.background`, c(`${name}.background`, '#0d1117'), `${desc} Background wash.`, 'wash', 'bg'],
  [`${name}.border`, c(`${name}.border`, fb), `${desc} Border.`, 'outline', 'border'],
]
const diagCards = [
  ...tri('error', '#f85149', 'Errors, failed checks.'),
  ...tri('warning', '#d29922', 'Warnings.'),
  ...tri('info', '#58a6ff', 'Info notices.'),
  ...tri('success', '#3fb950', 'Success notices.'),
  ...tri('hint', '#8b949e', 'Hints.'),
  ...tri('unreachable', '#6e7681', 'Unreachable items.'),
  ...tri('hidden', '#484f58', 'Hidden items.'),
]
const iconKeys = [
  ['icon', c('icon', '#8b949e'), 'Default icon fill.', '✦ icon', 'color'],
  ['icon.accent', c('icon.accent', '#1f6feb'), 'Accent icon fill.', '✦ accent', 'color'],
  ['icon.muted', c('icon.muted', '#6e7681'), 'Muted icon fill.', '✦ muted', 'color'],
  ['icon.disabled', c('icon.disabled', '#484f58'), 'Disabled icon fill.', '✦ off', 'color'],
  ['icon.placeholder', c('icon.placeholder', '#484f58'), 'Placeholder icon fill.', '✦ empty', 'color'],
]
const termKeys = [
  ['terminal.background', c('terminal.background', '#0d1117'), 'Terminal background.', 'term bg', 'bg'],
  ['terminal.foreground', c('terminal.foreground', '#6e7681'), 'Terminal text.', 'term text', 'color'],
  ['terminal.bright_foreground', c('terminal.bright_foreground', '#f0f6fc'), 'Bright terminal text.', 'bright', 'color'],
  ['terminal.dim_foreground', c('terminal.dim_foreground', '#484f58'), 'Dim terminal text.', 'dim', 'color'],
  ['terminal.ansi.background', c('terminal.ansi.background', '#0d1117'), 'ANSI background cell.', 'ansi bg', 'bg'],
]
const synCards = [
  ['keyword', kw, 'import, from, const, if, return...', 'import return if const'],
  ['function', fn, 'Function names when called.', 'fetchData() render()'],
  ['string', str, "'quoted text'.", `'hello world' "vue"`],
  ['comment', com, '// comments.', '// fix this later'],
  ['comment.doc', s('comment.doc', '#9da1a7', 'italic'), 'Doc comments.', '/** docs */'],
  ['type', typ, 'Class / interface / type names.', 'Props User Order'],
  ['type.builtin', s('type.builtin', '#9da1a7', 'bold'), 'Built-in types.', 'string number'],
  ['number', num, 'Numeric literals.', '42 3.14 0xFF'],
  ['boolean', s('boolean', '#9da1a7'), 'true / false.', 'true false'],
  ['operator', opr, '= + - > && ...', '= + - > && !=='],
  ['variable', vr, 'Variable names you declared.', 'count userName items'],
  ['variable.special', s('variable.special', '#1f6feb', 'bold'), 'this, self, ...', 'this self'],
  ['variable.parameter', s('variable.parameter', '#6e7681', 'italic'), 'Function parameters.', '(props, emit)'],
  ['property', pr, 'obj.key after the dot.', 'user.name items.length'],
  ['punctuation', pu, 'Brackets, commas, semicolons.', '{ } ( ) [ ] ; ,'],
  ['punctuation.bracket', s('punctuation.bracket'), 'Brackets only.', '{ } ( ) [ ]'],
  ['punctuation.delimiter', s('punctuation.delimiter'), 'Delimiters.', ', ; :'],
  ['punctuation.list_marker', s('punctuation.list_marker', '#9da1a7'), 'Markdown list markers.', '- * 1.'],
  ['punctuation.special', s('punctuation.special', '#9da1a7'), 'Special punctuation.', '#{} ${}'],
  ['attribute', s('attribute', '#9da1a7'), 'HTML/Vue attributes, decorators.', ':open @close v-if'],
  ['constant', s('constant', '#9da1a7'), 'UPPER_CASE constants.', 'MAX_SIZE null'],
  ['constant.builtin', s('constant.builtin', '#9da1a7', 'bold'), 'Built-in constants.', 'undefined NaN'],
  ['constructor', s('constructor', '#9da1a7'), 'new ClassName().', 'new Date() new Map()'],
  ['enum', s('enum', '#9da1a7'), 'Enum members.', 'Color.Red Size.L'],
  ['variant', s('variant', '#9da1a7'), 'Variant values.', 'Some Ok'],
  ['preproc', s('preproc', '#9da1a7'), 'Preprocessor directives.', '#include #define'],
  ['tag', s('tag', '#9da1a7'), 'HTML/XML tags.', '<div>'],
  ['tag.doctype', s('tag.doctype', '#6e7681', 'italic'), 'Doctypes.', '<!DOCTYPE>'],
  ['string.escape', s('string.escape', '#9da1a7'), 'Escapes in strings.', '\\n \\t \\"'],
  ['string.regex', s('string.regex', '#9da1a7'), 'Regular expressions.', '/\\d+/g'],
  ['string.special', s('string.special', '#9da1a7'), 'Special strings.', 'sql`...`'],
  ['string.special.symbol', s('string.special.symbol', '#9da1a7'), 'Symbols.', ':ok'],
  ['link_text', s('link_text', '#1f6feb', 'bold'), 'Link text.', '[click here]'],
  ['link_uri', s('link_uri', '#1f6feb'), 'Link targets.', 'https://...'],
  ['title', s('title', '#b8bcc1', 'bold'), 'Markdown headings.', '# Big heading'],
  ['label', s('label', '#9da1a7'), 'Labels, keys.', 'label: key:'],
  ['embedded', s('embedded'), 'Embedded language chunks.', 'css`...`'],
  ['emphasis', s('emphasis', '#9da1a7', 'italic'), 'Emphasized text.', '*soft*'],
  ['emphasis.strong', s('emphasis.strong', '#b8bcc1', 'bold'), 'Strong text.', '**loud**'],
  ['hint', s('hint', '#484f58', 'italic'), 'Inlay hints.', ': string'],
  ['predictive', s('predictive', '#484f58', 'italic'), 'Ghost / predictive text.', '…suggestion'],
  ['primary', s('primary', '#b8bcc1'), 'Primary elements.', 'primary'],
  ['text.literal', s('text.literal'), 'Literal text blocks.', '`code`'],
]
const gitBase = [['created', '#3fb950', '+ NewFile.vue', 'added'], ['modified', '#d29922', 'o main.ts', 'changed'], ['deleted', '#f85149', '- Old.vue', 'removed'], ['conflict', '#ff0000', '! Clash.vue', 'conflict'], ['ignored', '#484f58', 'node_modules/', 'ignored'], ['renamed', '#9da1a7', '~ Moved.vue', 'moved']]
const git = gitBase
const gitExt = gitBase.flatMap(([k, fb, , w]) => [
  [`${k}.background`, c(`${k}.background`, '#0d1117'), `Background wash for ${w} files.`, 'wash', 'bg'],
  [`${k}.border`, c(`${k}.border`, fb), `Border tint for ${w} files.`, 'outline', 'border'],
])
const ansi = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'bright_black', 'bright_red', 'bright_green', 'bright_yellow', 'bright_blue', 'bright_magenta', 'bright_cyan', 'bright_white']
const ansiDim = ['dim_black', 'dim_red', 'dim_green', 'dim_yellow', 'dim_blue', 'dim_magenta', 'dim_cyan', 'dim_white']

const keyCard = ([key, color, desc, ex, mode]) => {
  let prev
  if (key === 'editor.active_line_number') prev = `<div class="prev"><span style="color:${c('editor.line_number', '#6e7681')}">2 </span><span data-live style="color:${color}">3</span><span style="color:${c('editor.line_number', '#6e7681')}"> 4</span></div>`
  else if (key === 'editor.selection') prev = `<div class="prev"><span data-livebg style="background:${color}">selected</span></div>`
  else if (mode === 'bg') prev = `<div class="prev" data-livebg style="background:${color};color:${c('text', '#b8bcc1')}">${ex}</div>`
  else if (mode === 'border') prev = `<div class="prev" style="border:2px solid ${color};color:${c('editor.foreground', '#6e7681')}">${ex}</div>`
  else prev = `<div class="prev" data-live style="color:${color}">${ex}</div>`
  return `    <div class="card" data-key="${key}" data-color="${color}"><div class="chead"><span class="dot" style="background:${color}"></span><code>${key}</code></div><div class="hex">${color}</div><p>${desc}</p>${prev}<div class="row"><input type="color" value="${color}" oninput="pick(this)"><button onclick="copyJSON(this)">Copy JSON</button></div></div>`
}
const synCard = ([key, st, desc, ex]) =>
  `    <div class="card" data-key="syntax.${key}" data-color="${st.color}"${st.style ? ` data-style="${st.style}"` : ''}><div class="chead"><span class="dot" style="background:${st.color}"></span><code>syntax.${key}</code></div><div class="hex">${st.color}${st.style ? ` · ${st.style}` : ''}</div><p>${desc}</p><div class="prev">${span(ex, st).replace('<span ', '<span data-live ')}</div><div class="row"><input type="color" value="${st.color}" oninput="pick(this)"><button onclick="copyJSON(this)">Copy JSON</button></div></div>`

const sampleData = {
  't-vue': { lang: 'typescript', code: [
    "import { ref } from 'vue'",
    '/** counter state */',
    'const count = ref<number>(0)',
    'const ok = true',
    'const msg = `total: ${count.value}!`',
    'const re = /\\d+/g',
    'const path = "C:\\\\bin"',
    'function bump(step: number = 1): void {',
    '  if (!ok) return',
    '  count.value += step // increase',
    '}',
  ].join('\n') },
  't-json': { lang: 'json', code: [
    '{',
    '  "name": "app",',
    '  "debug": false,',
    '  "retries": 3,',
    '  "ratio": 0.5,',
    '  "token": null,',
    '  "path": "C:\\\\bin",',
    '  "tags": ["a", "b"],',
    '  "theme": { "dark": true }',
    '}',
  ].join('\n') },
  't-ts': { lang: 'typescript', code: [
    '/** tile kinds */',
    'export enum Kind { Walk, Door }',
    'export interface Tile {',
    "  walkable: boolean;",
    "  state: 'wall' | 'door' | null;",
    '}',
    'export const MAX = 10 as const;',
    'export const missing = undefined;',
    'export class Grid {',
    '  constructor(public size: number = 1) {}',
    '  reset(): void {',
    '    this.size = 0;',
    '  }',
    '}',
    'export function load(path: string): string[] {',
    '  const re = /\\d+/g;',
    '  const esc = "a\\nb";',
    '  outer: for (const m of [re]) {',
    '    console.log(m, this);',
    '  }',
    '  return [path];',
    '}',
    'const g = new Grid(4);',
  ].join('\n') },
  't-css': { lang: 'css', code: [
    '/* theme tokens */',
    '* { box-sizing: border-box; }',
    '@media (min-width: 760px) {',
    '  input[type="text"] {',
    '    color: #6e7681;',
    '  }',
    '  .editor > #app:hover::before {',
    '    --main: #6e7681;',
    '    color: var(--main);',
    '    margin: 0 auto !important;',
    '    width: calc(100vw - 16px);',
    '    content: "hi";',
    '  }',
    '}',
  ].join('\n') },
  't-html': { lang: 'html', code: [
    '<!DOCTYPE>',
    '<html lang="en">',
    '  <!-- page root -->',
    '  <head>',
    '    <meta charset="utf-8">',
    '    <title>Hello</title>',
    '  </head>',
    '  <body>',
    '    <h1 id="top">Hi</h1>',
    '    <ul>',
    '      <li>one</li>',
    '      <li>two</li>',
    '    </ul>',
    '    <input type="text" disabled>',
    '  </body>',
    '</html>',
  ].join('\n') },
}

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Zed theme map (generated)</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: var(--map-bg); color: var(--map-fg); font: var(--map-text-base)/1.55 var(--map-font-sans); }
  header { position: sticky; top: 0; z-index: 10; background: var(--map-header-bg); backdrop-filter: blur(6px); border-bottom: 1px solid var(--map-line); padding: var(--map-gap-md) var(--map-gap-lg); display: flex; align-items: center; gap: var(--map-gap-md); flex-wrap: wrap; }
  header h1 { font-size: var(--map-text-h); font-weight: 600; }
  header h1 code { color: var(--map-sky); font-weight: 400; font-size: var(--map-text-sm); }
  nav { display: flex; gap: var(--map-gap-xs); flex-wrap: wrap; }
  nav a { color: var(--map-heading); text-decoration: none; font-size: var(--map-text-sm); padding: var(--map-gap-xs) var(--map-gap-sm); border-radius: var(--map-radius-sm); }
  nav a:hover { background: var(--map-raised); color: var(--map-bright); }
  #q { margin-left: auto; background: ${c('editor.background', '#0d1117')}; border: 1px solid var(--map-edge); color: var(--map-bright); border-radius: var(--map-radius-sm); padding: var(--map-gap-sm) var(--map-gap-sm); font-size: var(--map-text-sm); width: 200px; }
  main { max-width: var(--map-max-width); margin: 0 auto; padding: 26px var(--map-gap-lg) 60px; }
  section { margin-bottom: var(--map-gap-xl); scroll-margin-top: 70px; }
  section > h2 { font-size: var(--map-text-code); text-transform: uppercase; letter-spacing: .08em; color: var(--map-heading); margin-bottom: var(--map-gap-xs); }
  section > p.d { color: var(--map-dim); font-size: var(--map-text-sm); margin-bottom: var(--map-gap-md); }
  .win { border: 1px solid var(--map-edge); border-radius: var(--map-radius-md); overflow: hidden; box-shadow: 0 12px 40px var(--map-shadow); }
  .titlebar { background: ${c('title_bar.background', '#0d1117')}; padding: var(--map-gap-sm) var(--map-gap-md); color: var(--map-heading); font-size: var(--map-text-sm); border-bottom: 1px solid var(--map-edge); display: flex; justify-content: space-between; }
  .tabs { display: flex; background: ${c('tab.inactive_background', '#010409')}; border-bottom: 1px solid var(--map-edge); }
  .tab { padding: 9px 20px; color: var(--map-heading); font-size: var(--map-text-sm); background: ${c('tab.inactive_background', '#010409')}; border-right: 1px solid var(--map-edge); cursor: pointer; }
  .hot { cursor: pointer; border-radius: var(--map-radius-xs); }
  .hot:hover { outline: 1px dashed var(--map-accent); outline-offset: 1px; }
  .tabnote { margin-left: auto; align-self: center; font-size: var(--map-text-xs); color: var(--map-dim); padding-right: var(--map-gap-sm); }
  @keyframes flash { 0%,100% { box-shadow: none; } 25%,75% { box-shadow: 0 0 0 2px var(--map-accent); } }
  .flash { animation: flash 1s ease 2; border-radius: var(--map-radius-md); }
  .tab.on { background: ${c('tab.active_background', '#0d1117')}; color: ${c('text', '#b8bcc1')}; box-shadow: inset 0 2px 0 var(--map-accent); }
  .tab .dotmod { color: ${c('modified', '#d29922')}; }
  .crumb { background: ${c('tab.active_background', '#0d1117')}; border-bottom: 1px solid var(--map-edge); padding: 5px var(--map-gap-md); font-size: 11.5px; color: var(--map-heading); }
  .curline { background: var(--map-accent-soft); display: block; margin: 0 calc(var(--map-gap-md) * -1); padding: 0 var(--map-gap-md); }
  .cursor { display: inline-block; width: 7px; height: 14px; background: var(--map-accent); vertical-align: -2px; }
  .gadd { color: ${c('created', '#3fb950')}; } .gmod { color: ${c('modified', '#d29922')}; }
  .minimap { width: var(--map-minimap); flex-shrink: 0; background: ${c('editor.background', '#0d1117')}; border-left: 1px solid var(--map-line); padding: var(--map-gap-sm) var(--map-gap-sm); }
  .minimap i { display: block; height: 3px; border-radius: 2px; margin-bottom: var(--map-gap-xs); }
  .botpanel { border-top: 1px solid var(--map-edge); background: ${c('panel.background', '#0d1117')}; }
  .botpanel .btabs { display: flex; gap: 2px; padding: var(--map-gap-sm) var(--map-gap-sm) 0; font-size: 11.5px; }
  .botpanel .btab { padding: var(--map-gap-xs) var(--map-gap-sm); color: var(--map-heading); border-radius: var(--map-radius-sm) var(--map-radius-sm) 0 0; }
  .botpanel .btab.on { background: ${c('editor.background', '#0d1117')}; color: ${c('text', '#b8bcc1')}; }
  .term { background: ${c('editor.background', '#0d1117')}; font-family: var(--map-font-mono); font-size: var(--map-text-sm); line-height: 1.7; padding: var(--map-gap-sm) var(--map-gap-md) var(--map-gap-sm); color: ${c('editor.foreground', '#6e7681')}; }
  .mid { display: flex; min-height: 260px; }
  .panel { width: var(--map-panel); flex-shrink: 0; background: ${c('panel.background', '#0d1117')}; border-right: 1px solid var(--map-edge); padding: var(--map-gap-sm) var(--map-gap-md); font-size: var(--map-text-sm); }
  .panel .ph { font-size: var(--map-text-xs); text-transform: uppercase; letter-spacing: .08em; color: ${c('text.muted', '#6e7681')}; margin: var(--map-gap-sm) 0 var(--map-gap-xs); }
  .panel div.f { padding: 2.5px 0; }
  .ed { flex: 1; background: ${c('editor.background', '#0d1117')}; display: flex; min-width: 0; }
  .gut { background: ${c('editor.gutter.background', '#0d1117')}; color: ${c('editor.line_number', '#6e7681')}; text-align: right; padding: var(--map-gap-sm) var(--map-gap-sm); user-select: none; font-family: var(--map-font-mono); font-size: var(--map-text-sm); border-right: 1px solid var(--map-line); }
  .gut .act { color: ${c('editor.active_line_number', '#b8bcc1')}; }
  .code { padding: var(--map-gap-sm) var(--map-gap-md); color: ${c('editor.foreground', '#6e7681')}; font-family: var(--map-font-mono); font-size: var(--map-text-code); white-space: pre; overflow-x: auto; }
  .code .sel { background: ${c('editor.selection', '#264f78')}; border-radius: 2px; }
  .status { background: ${c('status_bar.background', '#0d1117')}; border-top: 1px solid var(--map-edge); padding: 7px var(--map-gap-md); color: var(--map-heading); font-size: var(--map-text-sm); display: flex; gap: 18px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: var(--map-gap-sm); }
  .card { background: ${c('element.background', '#161b22')}; border: 1px solid var(--map-line); border-radius: var(--map-radius-md); padding: var(--map-gap-sm) var(--map-gap-md); transition: border-color .15s; }
  .card:hover { border-color: var(--map-edge); }
  .card.hide { display: none; }
  .chead { display: flex; align-items: center; gap: var(--map-gap-sm); }
  .dot { width: 14px; height: 14px; border-radius: var(--map-radius-xs); border: 1px solid var(--map-dot-border); flex-shrink: 0; }
  .card code { color: var(--map-bright); font-size: var(--map-text-sm); word-break: break-all; }
  .hex { font-family: var(--map-font-mono); font-size: var(--map-text-xs); color: var(--map-heading); margin-top: 2px; }
  .card p { color: var(--map-heading); font-size: var(--map-text-sm); margin-top: var(--map-gap-sm); }
  .card .prev { font-family: var(--map-font-mono); font-size: var(--map-text-code); background: ${c('editor.background', '#0d1117')}; border: 1px solid var(--map-line); border-radius: var(--map-radius-sm); padding: var(--map-gap-sm) var(--map-gap-sm); margin-top: var(--map-gap-sm); overflow-x: auto; white-space: nowrap; }
  .row { display: flex; gap: var(--map-gap-sm); margin-top: var(--map-gap-sm); align-items: center; }
  .row input[type=color] { width: 34px; height: 26px; border: 1px solid var(--map-edge); border-radius: var(--map-radius-sm); background: #0d1117; padding: 2px; cursor: pointer; }
  .row button, .hbtn { background: var(--map-raised); color: var(--map-fg); border: 1px solid var(--map-edge); border-radius: var(--map-radius-sm); padding: 5px var(--map-gap-sm); font-size: var(--map-text-sm); cursor: pointer; }
  .row button:hover, .hbtn:hover { background: var(--map-line); color: var(--map-bright); }
  .ansi { display: grid; grid-template-columns: repeat(8, 1fr); gap: var(--map-gap-sm); }
  .ansi div { border-radius: var(--map-radius-sm); padding: var(--map-gap-sm) var(--map-gap-xs); font-size: var(--map-text-xs); text-align: center; color: var(--map-bg); font-family: var(--map-font-mono); }
  @media (max-width: 760px) { .mid { flex-direction: column; } .panel { width: auto; border-right: 0; border-bottom: 1px solid var(--map-edge); } .ansi { grid-template-columns: repeat(4, 1fr); } }
</style>
</head>
<body>
<header>
  <h1>Zed theme map <code>experimental.theme_overrides</code></h1>
  <nav><a href="#live">Live window</a><a href="#editor">Editor</a><a href="#borders">Borders</a><a href="#elements">Elements</a><a href="#surfaces">Surfaces</a><a href="#panes">Panes</a><a href="#scroll">Scrollbar</a><a href="#ui">UI text</a><a href="#syntax">Syntax</a><a href="#diag">Diagnostics</a><a href="#git">Git status</a><a href="#icons">Icons</a><a href="#term">Terminal</a></nav>
  <input id="q" type="search" placeholder="Filter keys..." oninput="document.querySelectorAll('.card').forEach(el=>el.classList.toggle('hide',!el.dataset.key.includes(this.value.trim())))">
  <button class="hbtn" onclick="copyAll()">Copy full overrides JSON</button>
  <button class="hbtn" id="savebtn" onclick="saveAll()" style="display:none">Save to settings.json</button>
</header>
<main>
<section id="live">
  <h2>Live window</h2>
  <p class="d">Full mock rendered in your exact colors. Regenerate with <code>node sync-theme-map.mjs</code>.</p>
  <div class="win" data-goto="border" onclick="if(event.target===this)goto(this)">
    <div class="titlebar" data-goto="title_bar.background" onclick="if(event.target===this)goto(this)"><span class="hot" data-goto="title_bar.background" onclick="goto(this)">Continental-Idle - Zed</span><span>- o x</span></div>
    <div class="tabs" data-goto="tab.inactive_background" onclick="if(event.target===this)goto(this)"><div class="tab on" onclick="showTab(event,'t-vue')">example.vue <span class="dotmod hot" data-goto="modified" onclick="event.stopPropagation();goto(this)">●</span></div><div class="tab" onclick="showTab(event,'t-json')">example.json</div><div class="tab" onclick="showTab(event,'t-md')">example.md <span style="color:#8b949e">×</span></div><div class="tab" onclick="showTab(event,'t-ts')">example.ts <span class="dotmod hot" data-goto="modified" onclick="event.stopPropagation();goto(this)">●</span></div><div class="tab" onclick="showTab(event,'t-css')">example.css</div><div class="tab" onclick="showTab(event,'t-html')">example.html</div><span class="hot tabnote" data-goto="tab.active_background" onclick="goto(this)">tabs →</span></div>
    <div class="crumb" data-goto="tab.active_background" onclick="if(event.target===this)goto(this)"><span class="hot" data-goto="text" onclick="goto(this)">src</span> <span class="hot" data-goto="text.disabled" onclick="goto(this)" style="color:#484f58">›</span> <span class="hot" data-goto="text" onclick="goto(this)">example.vue</span> <span class="hot" data-goto="text.disabled" onclick="goto(this)" style="color:#484f58">›</span> <span class="hot" data-goto="text" onclick="goto(this)" style="color:${c('text', '#b8bcc1')}">setup()</span></div>
    <div class="mid">
      <div class="panel" data-goto="panel.background" onclick="if(event.target===this)goto(this)">
        <div class="ph hot" data-goto="text.muted" onclick="goto(this)">Explorer</div>
        <div class="f hot" data-goto="text.muted" onclick="goto(this)" style="color:${c('text.muted', '#6e7681')}">src/</div>
${git.map(([k, fb, label]) => `        <div class="f hot" data-goto="${k}" onclick="goto(this)" style="color:${c(k, fb)}">${label}</div>`).join('\n')}
        <div class="ph hot" data-goto="text.muted" onclick="goto(this)">Outline</div>
        <div class="f hot" data-goto="text.muted" onclick="goto(this)" style="color:${c('text.muted', '#6e7681')}">App · setup() · 128 refs</div>
      </div>
      <div class="ed" data-goto="editor.background" onclick="if(event.target===this)goto(this)">
        <div class="gut" data-goto="editor.gutter.background" onclick="if(event.target===this)goto(this)"><span class="hot" data-goto="editor.line_number" onclick="goto(this)">1<br>2<br></span><span class="act hot" data-goto="editor.active_line_number" onclick="goto(this)">3</span><span class="hot" data-goto="editor.line_number" onclick="goto(this)"><br>4<br>5</span><br><span class="gadd hot" data-goto="created" onclick="goto(this)">+</span><br><span class="gmod hot" data-goto="modified" onclick="goto(this)">~</span></div>
        <div class="code" id="t-vue" data-goto="editor.foreground" onclick="if(event.target===this)goto(this)">${span('import', kw, 'syntax.keyword')} ${span('{', brack, 'syntax.punctuation.bracket')} ${span('ref', vr, 'syntax.variable')} ${span('}', brack, 'syntax.punctuation.bracket')} ${span('from', kw, 'syntax.keyword')} ${span("'vue'", str, 'syntax.string')}
${span('/** counter state */', cmdoc, 'syntax.comment.doc')}
${span('const', kw, 'syntax.keyword')} ${span('count', vr, 'syntax.variable')}<span class="cursor hot" data-goto="text.accent" onclick="goto(this)"></span> ${span('=', opr, 'syntax.operator')} ${span('ref', fn, 'syntax.function')}${span('<', brack, 'syntax.punctuation.bracket')}${span('number', tbi, 'syntax.type.builtin')}${span('>', brack, 'syntax.punctuation.bracket')}${span('(0)', pu, 'syntax.punctuation')} <span class="sel hot" data-goto="editor.selection" onclick="goto(this)">selected</span>
${span('const', kw, 'syntax.keyword')} ${span('ok', vr, 'syntax.variable')} ${span('=', opr, 'syntax.operator')} ${span('true', bl, 'syntax.boolean')}
${span('const', kw, 'syntax.keyword')} ${span('msg', vr, 'syntax.variable')} ${span('=', opr, 'syntax.operator')} ${span('`total: ', str, 'syntax.string')}${span('${', psp, 'syntax.punctuation.special')}${span('count', vr, 'syntax.variable')}${span('.', delim, 'syntax.punctuation.delimiter')}${span('value', pr, 'syntax.property')}${span('}', psp, 'syntax.punctuation.special')}${span('!', opr, 'syntax.operator')}${span('`', str, 'syntax.string')}
${span('const', kw, 'syntax.keyword')} ${span('re', vr, 'syntax.variable')} ${span('=', opr, 'syntax.operator')} ${span('/\\d+/g', srgx, 'syntax.string.regex')}
${span('const', kw, 'syntax.keyword')} ${span('path', vr, 'syntax.variable')} ${span('=', opr, 'syntax.operator')} ${span('"C:', str, 'syntax.string')}${span('\\\\', sesc, 'syntax.string.escape')}${span('bin"', str, 'syntax.string')}
<span class="curline" data-goto="editor.selection" onclick="if(event.target===this)goto(this)">${span('function', kw, 'syntax.keyword')} ${span('bump', fn, 'syntax.function')}${span('(', brack, 'syntax.punctuation.bracket')}${span('step', vpar, 'syntax.variable.parameter')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('number', tbi, 'syntax.type.builtin')} ${span('=', opr, 'syntax.operator')} ${span('1', num, 'syntax.number')}${span(')', brack, 'syntax.punctuation.bracket')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('void', tbi, 'syntax.type.builtin')} ${span('{', brack, 'syntax.punctuation.bracket')}</span>
${span('if', kw, 'syntax.keyword')} ${span('(', brack, 'syntax.punctuation.bracket')}${span('!', opr, 'syntax.operator')}${span('ok', vr, 'syntax.variable')}${span(')', brack, 'syntax.punctuation.bracket')} ${span('return', kw, 'syntax.keyword')}
${span('count', vr, 'syntax.variable')}${span('.', delim, 'syntax.punctuation.delimiter')}${span('value', pr, 'syntax.property')} ${span('+=', opr, 'syntax.operator')} ${span('step', vpar, 'syntax.variable.parameter')} ${span('// increase', com, 'syntax.comment')}
${span('}', brack, 'syntax.punctuation.bracket')}</div>
        <div class="code" id="t-json" data-goto="editor.foreground" onclick="if(event.target===this)goto(this)" style="display:none">${span('{', brack, 'syntax.punctuation.bracket')}
  ${span('"name"', pr, 'syntax.property')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('"app"', str, 'syntax.string')}${span(',', delim, 'syntax.punctuation.delimiter')}
  ${span('"debug"', pr, 'syntax.property')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('false', bl, 'syntax.boolean')}${span(',', delim, 'syntax.punctuation.delimiter')}
  ${span('"retries"', pr, 'syntax.property')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('3', num, 'syntax.number')}${span(',', delim, 'syntax.punctuation.delimiter')}
  ${span('"ratio"', pr, 'syntax.property')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('0.5', num, 'syntax.number')}${span(',', delim, 'syntax.punctuation.delimiter')}
  ${span('"token"', pr, 'syntax.property')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('null', cbi, 'syntax.constant.builtin')}${span(',', delim, 'syntax.punctuation.delimiter')}
  ${span('"path"', pr, 'syntax.property')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('"C:', str, 'syntax.string')}${span('\\\\', sesc, 'syntax.string.escape')}${span('bin"', str, 'syntax.string')}${span(',', delim, 'syntax.punctuation.delimiter')}
  ${span('"tags"', pr, 'syntax.property')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('[', brack, 'syntax.punctuation.bracket')}${span('"a"', str, 'syntax.string')}${span(',', delim, 'syntax.punctuation.delimiter')} ${span('"b"', str, 'syntax.string')}${span(']', brack, 'syntax.punctuation.bracket')}${span(',', delim, 'syntax.punctuation.delimiter')}
  ${span('"theme"', pr, 'syntax.property')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('{', brack, 'syntax.punctuation.bracket')} ${span('"dark"', pr, 'syntax.property')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('true', bl, 'syntax.boolean')} ${span('}', brack, 'syntax.punctuation.bracket')}
${span('}', brack, 'syntax.punctuation.bracket')}</div>
        <div class="code" id="t-md" data-goto="editor.foreground" onclick="if(event.target===this)goto(this)" style="display:none">${span('# Title here', ttl, 'syntax.title')}
${span('## Sub head', ttl, 'syntax.title')}
${span('-', lmk, 'syntax.punctuation.list_marker')} ${fg('item one')}
${span('-', lmk, 'syntax.punctuation.list_marker')} ${span('[docs]', ltx, 'syntax.link_text')}${span('(https://x.dev)', luri, 'syntax.link_uri')} ${fg('with')} ${span('*soft*', emph, 'syntax.emphasis')} ${fg('and')} ${span('**loud**', estr, 'syntax.emphasis.strong')} ${fg('plus')} ${span('`code`', tlit, 'syntax.text.literal')}
${span('1.', lmk, 'syntax.punctuation.list_marker')} ${fg('first')}
${span('2.', lmk, 'syntax.punctuation.list_marker')} ${fg('second')}
${span('<!-- note -->', com, 'syntax.comment')}</div>
        <div class="code" id="t-ts" data-goto="editor.foreground" onclick="if(event.target===this)goto(this)" style="display:none">${span('/** tile kinds */', cmdoc, 'syntax.comment.doc')}
${span('export', kw, 'syntax.keyword')} ${span('enum', kw, 'syntax.keyword')} ${span('Kind', typ, 'syntax.type')} ${span('{', brack, 'syntax.punctuation.bracket')} ${span('Walk', enm, 'syntax.enum')}${span(',', delim, 'syntax.punctuation.delimiter')} ${span('Door', enm, 'syntax.enum')} ${span('}', brack, 'syntax.punctuation.bracket')}
${span('export', kw, 'syntax.keyword')} ${span('interface', kw, 'syntax.keyword')} ${span('Tile', typ, 'syntax.type')} ${span('{', brack, 'syntax.punctuation.bracket')}
  ${span('walkable', pr, 'syntax.property')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('boolean', tbi, 'syntax.type.builtin')}${span(';', delim, 'syntax.punctuation.delimiter')}
  ${span('state', pr, 'syntax.property')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span("'wall'", str, 'syntax.string')} ${span('|', opr, 'syntax.operator')} ${span("'door'", str, 'syntax.string')} ${span('|', opr, 'syntax.operator')} ${span('null', cbi, 'syntax.constant.builtin')}${span(';', delim, 'syntax.punctuation.delimiter')}
${span('}', brack, 'syntax.punctuation.bracket')}
${span('export', kw, 'syntax.keyword')} ${span('const', kw, 'syntax.keyword')} ${span('MAX', cst, 'syntax.constant')} ${span('=', opr, 'syntax.operator')} ${span('10', num, 'syntax.number')} ${span('as', kw, 'syntax.keyword')} ${span('const', kw, 'syntax.keyword')}${span(';', delim, 'syntax.punctuation.delimiter')}
${span('export', kw, 'syntax.keyword')} ${span('const', kw, 'syntax.keyword')} ${span('missing', vr, 'syntax.variable')} ${span('=', opr, 'syntax.operator')} ${span('undefined', cbi, 'syntax.constant.builtin')}${span(';', delim, 'syntax.punctuation.delimiter')}
${span('export', kw, 'syntax.keyword')} ${span('class', kw, 'syntax.keyword')} ${span('Grid', typ, 'syntax.type')} ${span('{', brack, 'syntax.punctuation.bracket')}
  ${span('constructor', fn, 'syntax.function')}${span('(', brack, 'syntax.punctuation.bracket')}${span('public', kw, 'syntax.keyword')} ${span('size', vpar, 'syntax.variable.parameter')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('number', tbi, 'syntax.type.builtin')} ${span('=', opr, 'syntax.operator')} ${span('1', num, 'syntax.number')}${span(')', brack, 'syntax.punctuation.bracket')} ${span('{', brack, 'syntax.punctuation.bracket')}${span('}', brack, 'syntax.punctuation.bracket')}
  ${span('reset', fn, 'syntax.function')}${span('(', brack, 'syntax.punctuation.bracket')}${span(')', brack, 'syntax.punctuation.bracket')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('void', tbi, 'syntax.type.builtin')} ${span('{', brack, 'syntax.punctuation.bracket')}
    ${span('this', vsp, 'syntax.variable.special')}${span('.', delim, 'syntax.punctuation.delimiter')}${span('size', pr, 'syntax.property')} ${span('=', opr, 'syntax.operator')} ${span('0', num, 'syntax.number')}${span(';', delim, 'syntax.punctuation.delimiter')}
  ${span('}', brack, 'syntax.punctuation.bracket')}
${span('}', brack, 'syntax.punctuation.bracket')}
${span('export', kw, 'syntax.keyword')} ${span('function', kw, 'syntax.keyword')} ${span('load', fn, 'syntax.function')}${span('(', brack, 'syntax.punctuation.bracket')}${span('path', vpar, 'syntax.variable.parameter')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('string', tbi, 'syntax.type.builtin')}${span(')', brack, 'syntax.punctuation.bracket')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('string', tbi, 'syntax.type.builtin')}${span('[', brack, 'syntax.punctuation.bracket')}${span(']', brack, 'syntax.punctuation.bracket')} ${span('{', brack, 'syntax.punctuation.bracket')}
  ${span('const', kw, 'syntax.keyword')} ${span('re', vr, 'syntax.variable')} ${span('=', opr, 'syntax.operator')} ${span('/\\d+/g', srgx, 'syntax.string.regex')}${span(';', delim, 'syntax.punctuation.delimiter')}
  ${span('const', kw, 'syntax.keyword')} ${span('esc', vr, 'syntax.variable')} ${span('=', opr, 'syntax.operator')} ${span('"a', str, 'syntax.string')}${span('\\n', sesc, 'syntax.string.escape')}${span('b"', str, 'syntax.string')}${span(';', delim, 'syntax.punctuation.delimiter')}
  ${span('outer', lbl, 'syntax.label')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('for', kw, 'syntax.keyword')} ${span('(', brack, 'syntax.punctuation.bracket')}${span('const', kw, 'syntax.keyword')} ${span('m', vr, 'syntax.variable')} ${span('of', kw, 'syntax.keyword')} ${span('[', brack, 'syntax.punctuation.bracket')}${span('re', vr, 'syntax.variable')}${span(']', brack, 'syntax.punctuation.bracket')}${span(')', brack, 'syntax.punctuation.bracket')} ${span('{', brack, 'syntax.punctuation.bracket')}
    ${span('console', vr, 'syntax.variable')}${span('.', delim, 'syntax.punctuation.delimiter')}${span('log', fn, 'syntax.function')}${span('(', brack, 'syntax.punctuation.bracket')}${span('m', vr, 'syntax.variable')}${span(',', delim, 'syntax.punctuation.delimiter')} ${span('this', vsp, 'syntax.variable.special')}${span(')', brack, 'syntax.punctuation.bracket')}${span(';', delim, 'syntax.punctuation.delimiter')}
  ${span('}', brack, 'syntax.punctuation.bracket')}
  ${span('return', kw, 'syntax.keyword')} ${span('[', brack, 'syntax.punctuation.bracket')}${span('path', vr, 'syntax.variable')}${span(']', brack, 'syntax.punctuation.bracket')}${span(';', delim, 'syntax.punctuation.delimiter')}
${span('}', brack, 'syntax.punctuation.bracket')}
${span('const', kw, 'syntax.keyword')} ${span('g', vr, 'syntax.variable')} ${span('=', opr, 'syntax.operator')} ${span('new', kw, 'syntax.keyword')} ${span('Grid', ctor, 'syntax.constructor')}${span('(', brack, 'syntax.punctuation.bracket')}${span('4', num, 'syntax.number')}${span(')', brack, 'syntax.punctuation.bracket')}${span(';', delim, 'syntax.punctuation.delimiter')}</div>
        <div class="code" id="t-css" data-goto="editor.foreground" onclick="if(event.target===this)goto(this)" style="display:none">${span('/* theme tokens */', com, 'syntax.comment')}
${span('*', tagSt, 'syntax.tag')} ${span('{', brack, 'syntax.punctuation.bracket')}
  ${span('box-sizing', pr, 'syntax.property')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('border-box', str, 'syntax.string')}${span(';', delim, 'syntax.punctuation.delimiter')}
${span('}', brack, 'syntax.punctuation.bracket')}
${span('@media', kw, 'syntax.keyword')} ${span('(', brack, 'syntax.punctuation.bracket')}${span('min-width', pr, 'syntax.property')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('760', num, 'syntax.number')}${span('px', typ, 'syntax.type')}${span(')', brack, 'syntax.punctuation.bracket')} ${span('{', brack, 'syntax.punctuation.bracket')}
  ${span('input', tagSt, 'syntax.tag')}${span('[', fgTc)}${span('type', attrSt, 'syntax.attribute')}${span('=', opr, 'syntax.operator')}${span('"text"', str, 'syntax.string')}${span(']', fgTc)} ${span('{', brack, 'syntax.punctuation.bracket')}
    ${span('color', pr, 'syntax.property')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('#6e7681', strSpec, 'syntax.string.special')}${span(';', delim, 'syntax.punctuation.delimiter')}
  ${span('}', brack, 'syntax.punctuation.bracket')}
  ${span('.', delim, 'syntax.punctuation.delimiter')}${span('editor', pr, 'syntax.property')} ${span('>', opr, 'syntax.operator')} ${span('#', delim, 'syntax.punctuation.delimiter')}${span('app', pr, 'syntax.property')}${span(':', delim, 'syntax.punctuation.delimiter')}${span('hover', attrSt, 'syntax.attribute')}${span('::', delim, 'syntax.punctuation.delimiter')}${span('before', attrSt, 'syntax.attribute')} ${span('{', brack, 'syntax.punctuation.bracket')}
    ${span('--main', varSt, 'syntax.variable')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('#6e7681', strSpec, 'syntax.string.special')}${span(';', delim, 'syntax.punctuation.delimiter')}
    ${span('color', pr, 'syntax.property')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('var', fn, 'syntax.function')}${span('(', brack, 'syntax.punctuation.bracket')}${span('--main', varSt, 'syntax.variable')}${span(')', brack, 'syntax.punctuation.bracket')}${span(';', delim, 'syntax.punctuation.delimiter')}
    ${span('margin', pr, 'syntax.property')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('0', num, 'syntax.number')} ${span('auto', str, 'syntax.string')} ${span('!important', kw, 'syntax.keyword')}${span(';', delim, 'syntax.punctuation.delimiter')}
    ${span('width', pr, 'syntax.property')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('calc', fn, 'syntax.function')}${span('(', brack, 'syntax.punctuation.bracket')}${span('100', num, 'syntax.number')}${span('vw', typ, 'syntax.type')} ${span('-', opr, 'syntax.operator')} ${span('16', num, 'syntax.number')}${span('px', typ, 'syntax.type')}${span(')', brack, 'syntax.punctuation.bracket')}${span(';', delim, 'syntax.punctuation.delimiter')}
    ${span('content', pr, 'syntax.property')}${span(':', delim, 'syntax.punctuation.delimiter')} ${span('"hi"', str, 'syntax.string')}${span(';', delim, 'syntax.punctuation.delimiter')}
  ${span('}', brack, 'syntax.punctuation.bracket')}
${span('}', brack, 'syntax.punctuation.bracket')}</div>
        <div class="code" id="t-html" data-goto="editor.foreground" onclick="if(event.target===this)goto(this)" style="display:none">${span('<!DOCTYPE>', s('tag.doctype', '#8b949e', 'italic'), 'syntax.tag.doctype')}
${span('<', tagSt, 'syntax.tag')}${span('html', tagSt, 'syntax.tag')} ${span('lang', attrSt, 'syntax.attribute')}${span('=', opr, 'syntax.operator')}${span('"en"', str, 'syntax.string')}${span('>', tagSt, 'syntax.tag')}
  ${span('<!-- page root -->', com, 'syntax.comment')}
  ${span('<', tagSt, 'syntax.tag')}${span('head', tagSt, 'syntax.tag')}${span('>', tagSt, 'syntax.tag')}
    ${span('<', tagSt, 'syntax.tag')}${span('meta', tagSt, 'syntax.tag')} ${span('charset', attrSt, 'syntax.attribute')}${span('=', opr, 'syntax.operator')}${span('"utf-8"', str, 'syntax.string')}${span('>', tagSt, 'syntax.tag')}
    ${span('<', tagSt, 'syntax.tag')}${span('title', tagSt, 'syntax.tag')}${span('>', tagSt, 'syntax.tag')}${fg('Hello')}${span('</', tagSt, 'syntax.tag')}${span('title', tagSt, 'syntax.tag')}${span('>', tagSt, 'syntax.tag')}
  ${span('</', tagSt, 'syntax.tag')}${span('head', tagSt, 'syntax.tag')}${span('>', tagSt, 'syntax.tag')}
  ${span('<', tagSt, 'syntax.tag')}${span('body', tagSt, 'syntax.tag')}${span('>', tagSt, 'syntax.tag')}
    ${span('<', tagSt, 'syntax.tag')}${span('h1', tagSt, 'syntax.tag')} ${span('id', attrSt, 'syntax.attribute')}${span('=', opr, 'syntax.operator')}${span('"top"', str, 'syntax.string')}${span('>', tagSt, 'syntax.tag')}${fg('Hi')}${span('</', tagSt, 'syntax.tag')}${span('h1', tagSt, 'syntax.tag')}${span('>', tagSt, 'syntax.tag')}
    ${span('<', tagSt, 'syntax.tag')}${span('ul', tagSt, 'syntax.tag')}${span('>', tagSt, 'syntax.tag')}
      ${span('<', tagSt, 'syntax.tag')}${span('li', tagSt, 'syntax.tag')}${span('>', tagSt, 'syntax.tag')}${fg('one')}${span('</', tagSt, 'syntax.tag')}${span('li', tagSt, 'syntax.tag')}${span('>', tagSt, 'syntax.tag')}
      ${span('<', tagSt, 'syntax.tag')}${span('li', tagSt, 'syntax.tag')}${span('>', tagSt, 'syntax.tag')}${fg('two')}${span('</', tagSt, 'syntax.tag')}${span('li', tagSt, 'syntax.tag')}${span('>', tagSt, 'syntax.tag')}
    ${span('</', tagSt, 'syntax.tag')}${span('ul', tagSt, 'syntax.tag')}${span('>', tagSt, 'syntax.tag')}
    ${span('<', tagSt, 'syntax.tag')}${span('input', tagSt, 'syntax.tag')} ${span('type', attrSt, 'syntax.attribute')}${span('=', opr, 'syntax.operator')}${span('"text"', str, 'syntax.string')} ${span('disabled', attrSt, 'syntax.attribute')}${span('>', tagSt, 'syntax.tag')}
  ${span('</', tagSt, 'syntax.tag')}${span('body', tagSt, 'syntax.tag')}${span('>', tagSt, 'syntax.tag')}
${span('</', tagSt, 'syntax.tag')}${span('html', tagSt, 'syntax.tag')}${span('>', tagSt, 'syntax.tag')}</div>
      </div>
      <div class="minimap" data-goto="editor.background" onclick="if(event.target===this)goto(this)"><i class="hot" data-goto="syntax.keyword" onclick="goto(this)" style="background:#ff7b72"></i><i class="hot" data-goto="syntax.string" onclick="goto(this)" style="background:#7ee787"></i><i class="hot" data-goto="syntax.type" onclick="goto(this)" style="background:#ffa657"></i><i class="hot" data-goto="syntax.function" onclick="goto(this)" style="background:#d2a8ff"></i><i class="hot" data-goto="syntax.comment" onclick="goto(this)" style="background:#6e7681"></i><i class="hot" data-goto="syntax.variable" onclick="goto(this)" style="background:#f0f6fc"></i><i class="hot" data-goto="syntax.operator" onclick="goto(this)" style="background:#ffa657"></i><i class="hot" data-goto="syntax.property" onclick="goto(this)" style="background:#79c0ff"></i><i class="hot" data-goto="syntax.number" onclick="goto(this)" style="background:#79c0ff"></i><i class="hot" data-goto="syntax.punctuation" onclick="goto(this)" style="background:#6e7681"></i></div>
    </div>
    <div class="botpanel" data-goto="panel.background" onclick="if(event.target===this)goto(this)">
      <div class="btabs"><div class="btab on hot" data-goto="tab.active_background" onclick="goto(this)">Terminal</div><div class="btab hot" data-goto="tab.active_background" onclick="goto(this)">Problems <span class="hot" data-goto="text.accent" onclick="event.stopPropagation();goto(this)" style="color:${c('text.accent', '#1f6feb')}">3</span></div><div class="btab hot" data-goto="tab.active_background" onclick="goto(this)">Output</div></div>
      <div class="term" data-goto="editor.background" onclick="if(event.target===this)goto(this)">
        <div><span class="hot" data-goto="terminal.ansi.green" onclick="goto(this)" style="color:${c('terminal.ansi.green', '#3fb950')}">➜</span> <span class="hot" data-goto="terminal.ansi.cyan" onclick="goto(this)" style="color:${c('terminal.ansi.cyan', '#39c5cf')}">Continental-Idle</span> <span class="hot" data-goto="editor.foreground" onclick="goto(this)" style="color:${c('editor.foreground', '#6e7681')}">npm run check</span></div>
        <div><span class="hot" data-goto="terminal.ansi.green" onclick="goto(this)" style="color:${c('terminal.ansi.green', '#3fb950')}">✓</span> <span class="hot" data-goto="terminal.ansi.green" onclick="goto(this)" style="color:${c('terminal.ansi.green', '#3fb950')}">success</span> <span class="hot" data-goto="editor.foreground" onclick="goto(this)" style="color:${c('editor.foreground', '#6e7681')}">check passed</span></div>
        <div><span class="hot" data-goto="terminal.ansi.yellow" onclick="goto(this)" style="color:${c('terminal.ansi.yellow', '#d29922')}">⚠</span> <span class="hot" data-goto="terminal.ansi.yellow" onclick="goto(this)" style="color:${c('terminal.ansi.yellow', '#d29922')}">warning</span> <span class="hot" data-goto="editor.foreground" onclick="goto(this)" style="color:${c('editor.foreground', '#6e7681')}">2 deprecated keys</span></div>
        <div><span class="hot" data-goto="terminal.ansi.red" onclick="goto(this)" style="color:${c('terminal.ansi.red', '#f85149')}">✗</span> <span class="hot" data-goto="terminal.ansi.red" onclick="goto(this)" style="color:${c('terminal.ansi.red', '#f85149')}">error</span> <span class="hot" data-goto="editor.foreground" onclick="goto(this)" style="color:${c('editor.foreground', '#6e7681')}">3 tests failed</span></div>
      </div>
    </div>
    <div class="status" data-goto="status_bar.background" onclick="if(event.target===this)goto(this)"><span class="hot" data-goto="status_bar.background" onclick="goto(this)">main* ✓ check pass</span><span style="color:${c('text.accent', '#1f6feb')}" class="hot" data-goto="text.accent" onclick="goto(this)">3 problems</span><span style="color:${c('text.disabled', '#484f58')}" class="hot" data-goto="text.disabled" onclick="goto(this)">UTF-8</span></div>
  </div>
</section>
<section id="editor">
  <h2>Editor · ${editorKeys.length} keys</h2>
  <p class="d">Colors inside the code area.</p>
  <div class="grid">
${editorKeys.map(keyCard).join('\n')}
  </div>
</section>
<section id="borders">
  <h2>Borders · ${borderKeys.length + 1} keys</h2>
  <p class="d">Base <code>border</code> lives in UI text; variants here.</p>
  <div class="grid">
${borderKeys.map(keyCard).join('\n')}
  </div>
</section>
<section id="elements">
  <h2>Elements · ${elementKeys.length} keys</h2>
  <p class="d">Row, button, and ghost-button states.</p>
  <div class="grid">
${elementKeys.map(keyCard).join('\n')}
  </div>
</section>
<section id="surfaces">
  <h2>Surfaces · ${surfaceKeys.length} keys</h2>
  <p class="d">Window, popup, tab-strip, and drag-drop backgrounds.</p>
  <div class="grid">
${surfaceKeys.map(keyCard).join('\n')}
  </div>
</section>
<section id="panes">
  <h2>Panes · ${paneKeys.length} keys</h2>
  <p class="d">Focused outlines and tree indent guides.</p>
  <div class="grid">
${paneKeys.map(keyCard).join('\n')}
  </div>
</section>
<section id="scroll">
  <h2>Scrollbar &amp; search · ${scrollKeys.length} keys</h2>
  <p class="d">Scrollbar thumb/track plus search match highlight.</p>
  <div class="grid">
${scrollKeys.map(keyCard).join('\n')}
  </div>
</section>
<section id="ui">
  <h2>UI text &amp; surfaces · ${uiKeys.length} keys</h2>
  <p class="d">Panel names, tabs, bars, popups.</p>
  <div class="grid">
${uiKeys.map(keyCard).join('\n')}
  </div>
</section>
<section id="syntax">
  <h2>Syntax · ${synCards.length} captures</h2>
  <p class="d">Every token type Zed can paint, with a live preview in your style.</p>
  <div class="grid">
${synCards.map(synCard).join('\n')}
  </div>
</section>
<section id="diag">
  <h2>Diagnostics · ${diagCards.length} keys</h2>
  <p class="d">Error, warning, info, success, hint, unreachable, hidden - each with background wash and border.</p>
  <div class="grid">
${diagCards.map(keyCard).join('\n')}
  </div>
</section>
<section id="git">
  <h2>Git status · ${git.length + gitExt.length} keys</h2>
  <p class="d">File/folder tint in the panel by version-control state, plus background and border washes.</p>
  <div class="grid">
${git.map(([k, fb, , w]) => `    <div class="card" data-key="${k}" data-color="${c(k, fb)}"><div class="chead"><span class="dot" style="background:${c(k, fb)}"></span><code>${k}</code></div><div class="hex">${c(k, fb)}</div><p>Files that are ${w}.</p><div class="prev" data-live style="font-family:inherit;color:${c(k, fb)}">example.vue (${k})</div><div class="row"><input type="color" value="${c(k, fb)}" oninput="pick(this)"><button onclick="copyJSON(this)">Copy JSON</button></div></div>`).join('\n')}
${gitExt.map(keyCard).join('\n')}
  </div>
</section>
<section id="icons">
  <h2>Icons · ${iconKeys.length} keys</h2>
  <p class="d">Icon fill colors by state.</p>
  <div class="grid">
${iconKeys.map(keyCard).join('\n')}
  </div>
</section>
<section id="term">
  <h2>Terminal · ${termKeys.length + ansi.length + ansiDim.length} keys</h2>
  <p class="d">Terminal surfaces plus the full ANSI palette incl. dim variants. Covered by Save like every other card.</p>
  <div class="grid">
${termKeys.map(keyCard).join('\n')}
${[...ansi, ...ansiDim].map((n) => { const k = 'terminal.ansi.' + n; const v = o[k] ?? '#888888'; return `    <div class="card" data-key="${k}" data-color="${v}"><div class="chead"><span class="dot" style="background:${v}"></span><code>${k}</code></div><div class="hex">${v}</div><p>Terminal ${n.replace('bright_', 'bright ').replace('dim_', 'dim ')}.</p><div class="prev" data-livebg style="background:${v};color:#010409">${n}</div><div class="row"><input type="color" value="${v}" oninput="pick(this)"><button onclick="copyJSON(this)">Copy JSON</button></div></div>` }).join('\n')}
  </div>
</section>
</main>
<script>
function showTab(e, id) {  document.querySelectorAll('.tabs .tab').forEach(t => t.classList.remove('on'));
  e.currentTarget.classList.add('on');
  ['t-vue', 't-json', 't-md', 't-ts', 't-css', 't-html'].forEach(t => document.getElementById(t).style.display = t === id ? '' : 'none');
}
function goto(el) {
  const card = document.querySelector('.card[data-key="' + el.dataset.goto + '"]');
  if (!card) return;
  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  card.classList.remove('flash');
  void card.offsetWidth;
  card.classList.add('flash');
}
function pick(el) {
  const card = el.closest('.card');
  card.dataset.color = el.value;
  card.querySelector('.dot').style.background = el.value;
  card.querySelector('.hex').textContent = el.value + (card.dataset.style ? ' · ' + card.dataset.style : '');
  card.querySelectorAll('[data-live]').forEach(n => n.style.color = el.value);
  card.querySelectorAll('[data-livebg]').forEach(n => n.style.background = el.value);
  try { localStorage.setItem('ztm:' + card.dataset.key, el.value); } catch (e) {}
}
function restorePicks() {
  document.querySelectorAll('.card[data-key]').forEach(card => {
    let v = null;
    try { v = localStorage.getItem('ztm:' + card.dataset.key); } catch (e) {}
    if (!v) return;
    card.dataset.color = v;
    const input = card.querySelector('input[type=color]');
    if (input) input.value = v;
    card.querySelector('.dot').style.background = v;
    card.querySelector('.hex').textContent = v + (card.dataset.style ? ' · ' + card.dataset.style : '');
    card.querySelectorAll('[data-live]').forEach(n => n.style.color = v);
    card.querySelectorAll('[data-livebg]').forEach(n => n.style.background = v);
  });
}
function copyJSON(btn) {
  const card = btn.closest('.card');
  const key = card.dataset.key;
  const short = key.startsWith('syntax.') ? key.slice(7) : key;
  const style = card.dataset.style === 'bold' ? ', "font_weight": 700' : (card.dataset.style ? ', "font_style": "' + card.dataset.style + '"' : '');
  const out = key.startsWith('syntax.')
    ? '"' + short + '": { "color": "' + card.dataset.color + '"' + style + ' }'
    : '"' + short + '": "' + card.dataset.color + '"';
  navigator.clipboard.writeText(out);
  btn.textContent = 'Copied!';
  setTimeout(() => btn.textContent = 'Copy JSON', 1200);
}
function copyAll() {
  const syn = [], top = [];
  document.querySelectorAll('.card[data-key]').forEach(el => {
    const st = el.dataset.style === 'bold' ? ', "font_weight": 700' : (el.dataset.style ? ', "font_style": "' + el.dataset.style + '"' : '');
    if (el.dataset.key.startsWith('syntax.')) syn.push('      "' + el.dataset.key.slice(7) + '": { "color": "' + el.dataset.color + '"' + st + ' }');
    else top.push('    "' + el.dataset.key + '": "' + el.dataset.color + '"');
  });
  navigator.clipboard.writeText('"experimental.theme_overrides": {\\n' + top.join(',\\n') + ',\\n    "syntax": {\\n' + syn.join(',\\n') + '\\n    }\\n  }');
}
function collectOverrides() {
  const syn = {}, top = {};
  document.querySelectorAll('.card[data-key]').forEach(el => {
    if (el.dataset.key.startsWith('syntax.')) {
      const val = { color: el.dataset.color };
      if (el.dataset.style === 'bold') val.font_weight = 700;
      else if (el.dataset.style) val.font_style = el.dataset.style;
      syn[el.dataset.key.slice(7)] = val;
    } else {
      top[el.dataset.key] = el.dataset.color;
    }
  });
  const out = {};
  Object.keys(top).forEach(k => out[k] = top[k]);
  out.syntax = syn;
  return out;
}
async function saveAll() {
  const btn = document.getElementById('savebtn');
  btn.textContent = 'Saving...';
  try {
    const res = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ experimental: collectOverrides() }) });
    const out = await res.json();
    btn.textContent = out.ok ? 'Saved!' : 'Failed';
  } catch (e) {
    btn.textContent = 'Failed';
  }
  setTimeout(() => btn.textContent = 'Save to settings.json', 1500);
}
restorePicks();
document.querySelectorAll('.hot[data-goto]').forEach(el => el.title = '→ ' + el.dataset.goto);
const SAMPLES = ${JSON.stringify(sampleData)};
async function paintLive() {
  for (const [id, s] of Object.entries(SAMPLES)) {
    try {
      const res = await fetch('/api/highlight', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s) });
      const out = await res.json();
      if (out.ok && out.html) document.getElementById(id).innerHTML = out.html;
    } catch (e) { /* fallback spans stay */ }
  }
}
if (location.protocol.startsWith('http')) {
  document.getElementById('savebtn').style.display = '';
  paintLive();
  const es = new EventSource('/api/events');
  es.onmessage = (e) => { if (e.data === 'reload') location.reload(); };
}
</script>
</body>
</html>
`
const css = html.slice(html.indexOf('<style>') + '<style>'.length, html.indexOf('</style>')).trim() + '\n'
const page = html.replace(/<style>[^]*<\/style>/, '<link rel="stylesheet" href="tokens.css">\n<link rel="stylesheet" href="theme-map.css">')
const TOKENS_CSS = `:root {
  /* structural chrome (fixed - not from theme_overrides) */
  --map-bg: #010409;
  --map-fg: #c9d1d9;
  --map-bright: #f0f6fc;
  --map-heading: #8b949e;
  --map-dim: #6e7681;
  --map-line: #21262d;
  --map-edge: #30363d;
  --map-raised: #161b22;
  --map-accent: #1f6feb;
  --map-accent-soft: rgba(38, 79, 120, 0.28);
  --map-header-bg: rgba(1, 4, 9, 0.92);
  --map-shadow: rgba(0, 0, 0, 0.5);
  --map-dot-border: rgba(255, 255, 255, 0.18);
  --map-sky: #79c0ff;

  /* fonts */
  --map-font-sans: -apple-system, "Segoe UI", sans-serif;
  --map-font-mono: Consolas, monospace;

  /* sizes */
  --map-text-h: 15px;
  --map-text-base: 14px;
  --map-text-code: 13px;
  --map-text-sm: 12px;
  --map-text-xs: 11px;

  /* gaps */
  --map-gap-xs: 4px;
  --map-gap-sm: 8px;
  --map-gap-md: 14px;
  --map-gap-lg: 28px;
  --map-gap-xl: 40px;

  /* shape + layout */
  --map-radius-xs: 3px;
  --map-radius-sm: 6px;
  --map-radius-md: 8px;
  --map-max-width: 1100px;
  --map-panel: 270px;
  --map-minimap: 46px;
}
`
fs.writeFileSync(path.join(dir, 'tokens.css'), TOKENS_CSS)
const script = page.match(/<script>([^]*?)<\/script>/)[1]
new vm.Script(script)
const out = page.replace(/<script>[^]*?<\/script>/, '<script src="theme-map.js"></script>')
fs.writeFileSync(path.join(dir, 'theme-map.css'), css)
fs.writeFileSync(path.join(dir, 'theme-map.js'), script.trim() + '\n')
fs.writeFileSync(path.join(dir, 'zed-theme-map.html'), out)
console.log(`map regenerated from ${settingsPath}`)
