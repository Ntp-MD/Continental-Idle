// Syncs the visual theme map from Zed's real settings.json.
// Run: node sync-theme-map.mjs (outputs zed-theme-map.html next to this script)
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.dirname(fileURLToPath(import.meta.url))
const settingsPath = path.join(
  process.env.APPDATA ?? '',
  'Zed',
  'settings.json'
)
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
const span = (text, { color, style }, g) =>
  `<span${g ? ` class="hot" data-goto="${g}" onclick="goto(this)"` : ''} style="color:${color}${style ? `;font-weight:${style === 'bold' ? 'bold' : 'normal'}${style === 'italic' ? ';font-style:italic' : ''}` : ''}">${text}</span>`

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

const editorKeys = [
  ['editor.foreground', c('editor.foreground', '#6e7681'), 'Default code text color.', 'code', 'color'],
  ['editor.background', c('editor.background', '#0d1117'), 'Code area background.', 'bg', 'bg'],
  ['editor.line_number', c('editor.line_number', '#6e7681'), 'Gutter numbers.', '3', 'color'],
  ['editor.active_line_number', c('editor.active_line_number', '#b8bcc1'), 'Number of the line your cursor is on.', null, null],
  ['editor.selection', c('editor.selection', '#264f78'), 'Highlight behind selected text.', null, null],
  ['editor.gutter.background', c('editor.gutter.background', '#0d1117'), 'Background of the line-number column.', '3', 'bg'],
]
const uiKeys = [
  ['text', c('text', '#b8bcc1'), 'Main UI text: panel names, tabs, menus.', 'App.vue'],
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
  ['tag', s('tag', '#9da1a7'), 'HTML/XML tags.', '&lt;div&gt;'],
  ['tag.doctype', s('tag.doctype', '#6e7681', 'italic'), 'Doctypes.', '&lt;!DOCTYPE&gt;'],
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
const git = [['created', '#3fb950', '+ NewFile.vue', 'added'], ['modified', '#d29922', 'o main.ts', 'changed'], ['deleted', '#f85149', '- Old.vue', 'removed'], ['conflict', '#ff0000', '! Clash.vue', 'conflict'], ['ignored', '#484f58', 'node_modules/', 'ignored'], ['renamed', '#9da1a7', '~ Moved.vue', 'moved']]
const ansi = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'bright_black', 'bright_red', 'bright_green', 'bright_yellow', 'bright_blue', 'bright_magenta', 'bright_cyan', 'bright_white']

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

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Zed theme map (generated)</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #010409; color: #c9d1d9; font: 14px/1.55 -apple-system, "Segoe UI", sans-serif; }
  header { position: sticky; top: 0; z-index: 10; background: rgba(1,4,9,.92); backdrop-filter: blur(6px); border-bottom: 1px solid #21262d; padding: 14px 28px; display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
  header h1 { font-size: 15px; font-weight: 600; }
  header h1 code { color: #79c0ff; font-weight: 400; font-size: 12px; }
  nav { display: flex; gap: 4px; flex-wrap: wrap; }
  nav a { color: #8b949e; text-decoration: none; font-size: 12px; padding: 4px 10px; border-radius: 6px; }
  nav a:hover { background: #161b22; color: #f0f6fc; }
  #q { margin-left: auto; background: #0d1117; border: 1px solid #30363d; color: #f0f6fc; border-radius: 6px; padding: 6px 10px; font-size: 12px; width: 200px; }
  main { max-width: 1100px; margin: 0 auto; padding: 26px 28px 60px; }
  section { margin-bottom: 40px; scroll-margin-top: 70px; }
  section > h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .08em; color: #8b949e; margin-bottom: 4px; }
  section > p.d { color: #6e7681; font-size: 12px; margin-bottom: 14px; }
  .win { border: 1px solid #30363d; border-radius: 10px; overflow: hidden; box-shadow: 0 12px 40px rgba(0,0,0,.5); }
  .titlebar { background: ${c('title_bar.background', '#0d1117')}; padding: 10px 16px; color: #8b949e; font-size: 12px; border-bottom: 1px solid #30363d; display: flex; justify-content: space-between; }
  .tabs { display: flex; background: ${c('tab.inactive_background', '#010409')}; border-bottom: 1px solid #30363d; }
  .tab { padding: 9px 20px; color: #8b949e; font-size: 12px; background: ${c('tab.inactive_background', '#010409')}; border-right: 1px solid #30363d; cursor: pointer; }
  .hot { cursor: pointer; border-radius: 3px; }
  .hot:hover { outline: 1px dashed #1f6feb; outline-offset: 1px; }
  .tabnote { margin-left: auto; align-self: center; font-size: 11px; color: #6e7681; padding-right: 12px; }
  @keyframes flash { 0%,100% { box-shadow: none; } 25%,75% { box-shadow: 0 0 0 2px #1f6feb; } }
  .flash { animation: flash 1s ease 2; border-radius: 8px; }
  .tab.on { background: ${c('tab.active_background', '#0d1117')}; color: ${c('text', '#b8bcc1')}; box-shadow: inset 0 2px 0 #1f6feb; }
  .tab .dotmod { color: ${c('modified', '#d29922')}; }
  .crumb { background: ${c('tab.active_background', '#0d1117')}; border-bottom: 1px solid #30363d; padding: 5px 16px; font-size: 11.5px; color: #8b949e; }
  .curline { background: rgba(38,79,120,.28); display: block; margin: 0 -16px; padding: 0 16px; }
  .cursor { display: inline-block; width: 7px; height: 14px; background: #1f6feb; vertical-align: -2px; }
  .gadd { color: ${c('created', '#3fb950')}; } .gmod { color: ${c('modified', '#d29922')}; }
  .minimap { width: 46px; flex-shrink: 0; background: ${c('editor.background', '#0d1117')}; border-left: 1px solid #21262d; padding: 12px 8px; }
  .minimap i { display: block; height: 3px; border-radius: 2px; margin-bottom: 4px; }
  .botpanel { border-top: 1px solid #30363d; background: ${c('panel.background', '#0d1117')}; }
  .botpanel .btabs { display: flex; gap: 2px; padding: 6px 12px 0; font-size: 11.5px; }
  .botpanel .btab { padding: 4px 12px; color: #8b949e; border-radius: 6px 6px 0 0; }
  .botpanel .btab.on { background: ${c('editor.background', '#0d1117')}; color: ${c('text', '#b8bcc1')}; }
  .term { background: ${c('editor.background', '#0d1117')}; font-family: Consolas, monospace; font-size: 12px; line-height: 1.7; padding: 8px 16px 12px; color: ${c('editor.foreground', '#6e7681')}; }
  .mid { display: flex; min-height: 260px; }
  .panel { width: 270px; flex-shrink: 0; background: ${c('panel.background', '#0d1117')}; border-right: 1px solid #30363d; padding: 12px 14px; font-size: 12.5px; }
  .panel .ph { font-size: 10.5px; text-transform: uppercase; letter-spacing: .08em; color: ${c('text.muted', '#6e7681')}; margin: 8px 0 4px; }
  .panel div.f { padding: 2.5px 0; }
  .ed { flex: 1; background: ${c('editor.background', '#0d1117')}; display: flex; min-width: 0; }
  .gut { background: ${c('editor.gutter.background', '#0d1117')}; color: ${c('editor.line_number', '#6e7681')}; text-align: right; padding: 12px 10px; user-select: none; font-family: Consolas, monospace; font-size: 12.5px; border-right: 1px solid #21262d; }
  .gut .act { color: ${c('editor.active_line_number', '#b8bcc1')}; }
  .code { padding: 12px 16px; color: ${c('editor.foreground', '#6e7681')}; font-family: Consolas, monospace; font-size: 13px; white-space: pre; overflow-x: auto; }
  .code .sel { background: ${c('editor.selection', '#264f78')}; border-radius: 2px; }
  .status { background: ${c('status_bar.background', '#0d1117')}; border-top: 1px solid #30363d; padding: 7px 16px; color: #8b949e; font-size: 12px; display: flex; gap: 18px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 12px; }
  .card { background: ${c('element.background', '#161b22')}; border: 1px solid #21262d; border-radius: 8px; padding: 12px 14px; transition: border-color .15s; }
  .card:hover { border-color: #30363d; }
  .card.hide { display: none; }
  .chead { display: flex; align-items: center; gap: 8px; }
  .dot { width: 14px; height: 14px; border-radius: 4px; border: 1px solid rgba(255,255,255,.18); flex-shrink: 0; }
  .card code { color: #f0f6fc; font-size: 12px; word-break: break-all; }
  .hex { font-family: Consolas, monospace; font-size: 11px; color: #8b949e; margin-top: 2px; }
  .card p { color: #8b949e; font-size: 12px; margin-top: 6px; }
  .card .prev { font-family: Consolas, monospace; font-size: 13px; background: ${c('editor.background', '#0d1117')}; border: 1px solid #21262d; border-radius: 6px; padding: 8px 10px; margin-top: 10px; overflow-x: auto; white-space: nowrap; }
  .row { display: flex; gap: 8px; margin-top: 10px; align-items: center; }
  .row input[type=color] { width: 34px; height: 26px; border: 1px solid #30363d; border-radius: 6px; background: #0d1117; padding: 2px; cursor: pointer; }
  .row button, .hbtn { background: #161b22; color: #c9d1d9; border: 1px solid #30363d; border-radius: 6px; padding: 5px 12px; font-size: 12px; cursor: pointer; }
  .row button:hover, .hbtn:hover { background: #21262d; color: #f0f6fc; }
  .ansi { display: grid; grid-template-columns: repeat(8, 1fr); gap: 8px; }
  .ansi div { border-radius: 6px; padding: 12px 4px; font-size: 10.5px; text-align: center; color: #010409; font-family: Consolas, monospace; }
  @media (max-width: 760px) { .mid { flex-direction: column; } .panel { width: auto; border-right: 0; border-bottom: 1px solid #30363d; } .ansi { grid-template-columns: repeat(4, 1fr); } }
</style>
</head>
<body>
<header>
  <h1>Zed theme map <code>experimental.theme_overrides</code></h1>
  <nav><a href="#live">Live window</a><a href="#editor">Editor</a><a href="#ui">UI text</a><a href="#syntax">Syntax</a><a href="#git">Git status</a><a href="#term">Terminal</a></nav>
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
    <div class="tabs" data-goto="tab.inactive_background" onclick="if(event.target===this)goto(this)"><div class="tab on" onclick="showTab(event,'t-vue')">App.vue <span class="dotmod hot" data-goto="modified" onclick="event.stopPropagation();goto(this)">●</span></div><div class="tab" onclick="showTab(event,'t-json')">settings.json</div><div class="tab" onclick="showTab(event,'t-md')">history.md <span style="color:#8b949e">×</span></div><div class="tab" onclick="showTab(event,'t-ts')">types.ts <span class="dotmod hot" data-goto="modified" onclick="event.stopPropagation();goto(this)">●</span></div><div class="tab" onclick="showTab(event,'t-css')">layout.css</div><div class="tab" onclick="showTab(event,'t-html')">index.html</div><span class="hot tabnote" data-goto="tab.active_background" onclick="goto(this)">tabs →</span></div>
    <div class="crumb" data-goto="tab.active_background" onclick="if(event.target===this)goto(this)"><span class="hot" data-goto="text" onclick="goto(this)">src</span> <span class="hot" data-goto="text.disabled" onclick="goto(this)" style="color:#484f58">›</span> <span class="hot" data-goto="text" onclick="goto(this)">App.vue</span> <span class="hot" data-goto="text.disabled" onclick="goto(this)" style="color:#484f58">›</span> <span class="hot" data-goto="text" onclick="goto(this)" style="color:${c('text', '#b8bcc1')}">setup()</span></div>
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
        <div class="code" id="t-vue" data-goto="editor.foreground" onclick="if(event.target===this)goto(this)">${span('import', kw, 'syntax.keyword')} { ref } ${span('from', kw, 'syntax.keyword')} ${span("'vue'", str, 'syntax.string')}
${span('const', kw, 'syntax.keyword')} ${span('count', vr, 'syntax.variable')}<span class="cursor hot" data-goto="text.accent" onclick="goto(this)"></span> ${span('=', opr, 'syntax.operator')} ${span('ref', fn, 'syntax.function')}${span('(0)', pu, 'syntax.punctuation')} <span class="sel hot" data-goto="editor.selection" onclick="goto(this)">selected</span>
${span('// click any token to jump to its card', com, 'syntax.comment')}
<span class="curline" data-goto="editor.selection" onclick="if(event.target===this)goto(this)">${span('interface', kw, 'syntax.keyword')} ${span('Props', typ, 'syntax.type')} ${span('{ title: string }', pr, 'syntax.property')}</span></div>
        <div class="code" id="t-json" data-goto="editor.foreground" onclick="if(event.target===this)goto(this)" style="display:none">${span('{', pu, 'syntax.punctuation')}
  ${span('"editor.foreground"', pr, 'syntax.property')}${span(':', opr, 'syntax.operator')} ${span('"#6e7681"', str, 'syntax.string')}${span(',', pu, 'syntax.punctuation')}
  ${span('"keyword"', pr, 'syntax.property')}${span(':', opr, 'syntax.operator')} ${span('{ "color": "#ff7b72" }', typ, 'syntax.type')}
${span('}', pu, 'syntax.punctuation')}</div>
        <div class="code" id="t-md" data-goto="editor.foreground" onclick="if(event.target===this)goto(this)" style="display:none">${span('# History', s('title', '#b8bcc1', 'bold'), 'syntax.title')}
${span('-', s('punctuation.list_marker', '#9da1a7'), 'syntax.punctuation.list_marker')} ${span('plain text', { color: c('editor.foreground', '#6e7681'), style: '' }, 'editor.foreground')}
${span('// a comment', com, 'syntax.comment')} ${span('[link](https://...)', s('link_text', '#1f6feb', 'bold'), 'syntax.link_text')}</div>
        <div class="code" id="t-ts" data-goto="editor.foreground" onclick="if(event.target===this)goto(this)" style="display:none">${span('export', kw, 'syntax.keyword')} ${span('interface', kw, 'syntax.keyword')} ${span('Tile', typ, 'syntax.type')} ${span('{', pu, 'syntax.punctuation')}
  ${span('walkable', pr, 'syntax.property')}${span(':', opr, 'syntax.operator')} ${span('boolean', s('type.builtin', '#ffa657', 'bold'), 'syntax.type.builtin')}${span(';', pu, 'syntax.punctuation')}
  ${span('state', pr, 'syntax.property')}${span(':', opr, 'syntax.operator')} ${span("'wall' | 'door'", str, 'syntax.string')} ${span('|', opr, 'syntax.operator')} ${span('null', s('constant.builtin', '#79c0ff', 'bold'), 'syntax.constant.builtin')}
${span('}', pu, 'syntax.punctuation')}
${span('export', kw, 'syntax.keyword')} ${span('const', kw, 'syntax.keyword')} ${span('SCALE', s('constant', '#79c0ff'), 'syntax.constant')} ${span('=', opr, 'syntax.operator')} ${span('0.5', num, 'syntax.number')} ${span('as', kw, 'syntax.keyword')} ${span('const', kw, 'syntax.keyword')}</div>
        <div class="code" id="t-css" data-goto="editor.foreground" onclick="if(event.target===this)goto(this)" style="display:none">${span('.editor', s('tag', '#7ee787'), 'syntax.tag')} ${span('{', pu, 'syntax.punctuation')}
  ${span('color', s('attribute', '#79c0ff'), 'syntax.attribute')}${span(':', opr, 'syntax.operator')} ${span('#6e7681', num, 'syntax.number')}${span(';', pu, 'syntax.punctuation')}
  ${span('font-weight', s('attribute', '#79c0ff'), 'syntax.attribute')}${span(':', opr, 'syntax.operator')} ${span('bold', typ, 'syntax.type')}${span(';', pu, 'syntax.punctuation')}
${span('}', pu, 'syntax.punctuation')}</div>
        <div class="code" id="t-html" data-goto="editor.foreground" onclick="if(event.target===this)goto(this)" style="display:none">${span('<!DOCTYPE>', s('tag.doctype', '#8b949e', 'italic'), 'syntax.tag.doctype')}
${span('<', s('tag', '#7ee787'), 'syntax.tag')}${span('html', s('tag', '#7ee787'), 'syntax.tag')} ${span('lang', s('attribute', '#79c0ff'), 'syntax.attribute')}${span('=', opr, 'syntax.operator')}${span('"en"', str, 'syntax.string')}${span('>', s('tag', '#7ee787'), 'syntax.tag')}
  ${span('<!-- page root -->', com, 'syntax.comment')}
  ${span('<', s('tag', '#7ee787'), 'syntax.tag')}${span('div', s('tag', '#7ee787'), 'syntax.tag')} ${span('id', s('attribute', '#79c0ff'), 'syntax.attribute')}${span('=', opr, 'syntax.operator')}${span('"app"', str, 'syntax.string')}${span('>', s('tag', '#7ee787'), 'syntax.tag')}${span('Hello', { color: c('editor.foreground', '#6e7681'), style: '' }, 'editor.foreground')}${span('</', s('tag', '#7ee787'), 'syntax.tag')}${span('div', s('tag', '#7ee787'), 'syntax.tag')}${span('>', s('tag', '#7ee787'), 'syntax.tag')}
${span('</', s('tag', '#7ee787'), 'syntax.tag')}${span('html', s('tag', '#7ee787'), 'syntax.tag')}${span('>', s('tag', '#7ee787'), 'syntax.tag')}</div>
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
  <h2>Editor</h2>
  <p class="d">Colors inside the code area.</p>
  <div class="grid">
${editorKeys.map(keyCard).join('\n')}
  </div>
</section>
<section id="ui">
  <h2>UI text &amp; surfaces</h2>
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
<section id="git">
  <h2>Git status</h2>
  <p class="d">File/folder tint in the panel by version-control state.</p>
  <div class="grid">
${git.map(([k, fb, , w]) => `    <div class="card" data-key="${k}" data-color="${c(k, fb)}"><div class="chead"><span class="dot" style="background:${c(k, fb)}"></span><code>${k}</code></div><div class="hex">${c(k, fb)}</div><p>Files that are ${w}.</p><div class="prev" data-live style="font-family:inherit;color:${c(k, fb)}">example.vue (${k})</div><div class="row"><input type="color" value="${c(k, fb)}" oninput="pick(this)"><button onclick="copyJSON(this)">Copy JSON</button></div></div>`).join('\n')}
  </div>
</section>
<section id="term">
  <h2>Terminal ANSI · 16 colors</h2>
  <p class="d">Integrated terminal palette. Covered by Save like every other card.</p>
  <div class="grid">
${ansi.map((n) => { const k = 'terminal.ansi.' + n; const v = o[k] ?? '#888888'; return `    <div class="card" data-key="${k}" data-color="${v}"><div class="chead"><span class="dot" style="background:${v}"></span><code>${k}</code></div><div class="hex">${v}</div><p>Terminal ${n.replace('bright_', 'bright ')}.</p><div class="prev" data-livebg style="background:${v};color:#010409">${n}</div><div class="row"><input type="color" value="${v}" oninput="pick(this)"><button onclick="copyJSON(this)">Copy JSON</button></div></div>` }).join('\n')}
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
const SAMPLES = {
  't-vue': { lang: 'typescript', code: "import { ref } from 'vue'\\nconst count = ref(0)\\n// click any token to jump to its card\\ninterface Props { title: string }" },
  't-json': { lang: 'json', code: '{\\n  "editor.foreground": "#6e7681",\\n  "keyword": { "color": "#ff7b72" }\\n}' },
  't-ts': { lang: 'typescript', code: "export interface Tile {\\n  walkable: boolean;\\n  state: 'wall' | 'door' | null\\n}\\nexport const SCALE = 0.5 as const" },
  't-css': { lang: 'css', code: '.editor {\\n  color: #6e7681;\\n  font-weight: bold;\\n}' },
  't-html': { lang: 'html', code: '<!DOCTYPE>\\n<html lang="en">\\n  <!-- page root -->\\n  <div id="app">Hello</div>\\n</html>' },
};
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
fs.writeFileSync(path.join(dir, 'zed-theme-map.html'), html)
console.log(`map regenerated from ${settingsPath}`)
