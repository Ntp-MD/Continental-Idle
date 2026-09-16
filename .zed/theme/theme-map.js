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
  navigator.clipboard.writeText('"experimental.theme_overrides": {\n' + top.join(',\n') + ',\n    "syntax": {\n' + syn.join(',\n') + '\n    }\n  }');
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
const SAMPLES = {"t-vue":{"lang":"typescript","code":"import { ref } from 'vue'\n/** counter state */\nconst count = ref<number>(0)\nconst ok = true\nconst msg = `total: ${count.value}!`\nconst re = /\\d+/g\nconst path = \"C:\\\\bin\"\nfunction bump(step: number = 1): void {\n  if (!ok) return\n  count.value += step // increase\n}"},"t-json":{"lang":"json","code":"{\n  \"name\": \"app\",\n  \"debug\": false,\n  \"retries\": 3,\n  \"ratio\": 0.5,\n  \"token\": null,\n  \"path\": \"C:\\\\bin\",\n  \"tags\": [\"a\", \"b\"],\n  \"theme\": { \"dark\": true }\n}"},"t-ts":{"lang":"typescript","code":"/** tile kinds */\nexport enum Kind { Walk, Door }\nexport interface Tile {\n  walkable: boolean;\n  state: 'wall' | 'door' | null;\n}\nexport const MAX = 10 as const;\nexport const missing = undefined;\nexport class Grid {\n  constructor(public size: number = 1) {}\n  reset(): void {\n    this.size = 0;\n  }\n}\nexport function load(path: string): string[] {\n  const re = /\\d+/g;\n  const esc = \"a\\nb\";\n  outer: for (const m of [re]) {\n    console.log(m, this);\n  }\n  return [path];\n}\nconst g = new Grid(4);"},"t-css":{"lang":"css","code":"/* theme tokens */\n* { box-sizing: border-box; }\n@media (min-width: 760px) {\n  input[type=\"text\"] {\n    color: #6e7681;\n  }\n  .editor > #app:hover::before {\n    --main: #6e7681;\n    color: var(--main);\n    margin: 0 auto !important;\n    width: calc(100vw - 16px);\n    content: \"hi\";\n  }\n}"},"t-html":{"lang":"html","code":"<!DOCTYPE>\n<html lang=\"en\">\n  <!-- page root -->\n  <head>\n    <meta charset=\"utf-8\">\n    <title>Hello</title>\n  </head>\n  <body>\n    <h1 id=\"top\">Hi</h1>\n    <ul>\n      <li>one</li>\n      <li>two</li>\n    </ul>\n    <input type=\"text\" disabled>\n  </body>\n</html>"}};
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
