// tests/_visual-audit.tmp.mjs - throwaway Playwright visual audit of the lobby floor.
// Screenshots go to the session scratchpad, never into the repo. Deleted same session.
import { chromium } from 'playwright';

const OUT = process.env.OUT_DIR;
const URL = 'http://localhost:5199/';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const problems = [];
page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') problems.push(`${m.type()}: ${m.text().slice(0, 200)}`); });
page.on('pageerror', e => problems.push(`pageerror: ${String(e).slice(0, 200)}`));

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${OUT}/lobby-01-overview.png`, fullPage: false });

const buttons = await page.getByRole('button').allInnerTexts();
console.log('BUTTONS:', JSON.stringify(buttons.map(b => b.replace(/\s+/g, ' ').trim()).filter(Boolean)));
const status = await page.getByRole('status').allInnerTexts();
const alerts = await page.getByRole('alert').allInnerTexts();
console.log('STATUS:', JSON.stringify(status.map(s => s.replace(/\s+/g, ' ').trim()).slice(0, 12)));
console.log('ALERTS:', JSON.stringify(alerts.slice(0, 6)));

// switch to the tile view so walls/doors/floor are legible, then shoot again
const tileBtn = page.getByRole('button', { name: /wall|tile|grid/i }).first();
if (await tileBtn.count()) { try { await tileBtn.click({ timeout: 3000 }); } catch { /* ignore */ } }
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/lobby-02-tiles.png` });

// NPC preview: does the simulation actually run on this plan?
const preview = page.getByRole('button', { name: /preview|simulation|deploy|npc/i }).first();
if (await preview.count()) {
  try {
    await preview.click({ timeout: 4000 });
    await page.waitForTimeout(4000);
    await page.screenshot({ path: `${OUT}/lobby-03-preview.png` });
    console.log('PREVIEW: clicked');
  } catch (e) { console.log('PREVIEW: click failed -', String(e).slice(0, 120)); }
}
const canvasBoxes = await page.locator('canvas').evaluateAll(els => els.map(e => `${e.width}x${e.height}`));
console.log('CANVAS elements:', JSON.stringify(canvasBoxes));

// wiring badge as the user sees it, with the full tooltip list
const badge = await page.evaluate(() => {
  const el = [...document.querySelectorAll('[title]')].find(e => /wiring|spawn zone|post/i.test(e.getAttribute('title') || ''));
  if (!el) return null;
  return { text: (el.textContent || '').trim().slice(0, 40), title: el.getAttribute('title') };
});
if (badge) {
  const items = badge.title.split('\n').map(s => s.trim()).filter(Boolean);
  const mine = items.filter(s => /Floor "G"/i.test(s));
  console.log(`BADGE: "${badge.text}" issues=${items.length} about-floor-g=${mine.length}`);
  for (const s of mine) console.log('  MINE: ' + s);
} else {
  console.log('BADGE: no wiring element found');
}

// make sure room labels are ON (toggles are stateful - read before clicking)
const labelToggle = page.getByRole('button', { name: /^Labels$/i }).first();
if (await labelToggle.count()) {
  const pressed = await labelToggle.getAttribute('aria-pressed');
  if (pressed === 'false') { try { await labelToggle.click({ timeout: 2500 }); } catch { /* ignore */ } }
  console.log('LABELS: was', pressed);
}
const fit = page.getByRole('button', { name: /fit|reset view|zoom to/i }).first();
if (await fit.count()) { try { await fit.click({ timeout: 2500 }); console.log('FIT: clicked'); } catch { /* ignore */ } }
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/lobby-04-labelled.png` });
console.log('CONSOLE PROBLEMS:', problems.length ? problems.slice(0, 10).join(' | ') : 'none');
await browser.close();
