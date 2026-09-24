// tests/_preview-audit.tmp.mjs - throwaway: run the real NPC preview on the authored lobby
// and capture it over time. Screenshots go to the session scratchpad. Deleted same session.
import { chromium } from 'playwright';

const OUT = process.env.OUT_DIR;
const URL = 'http://localhost:5199/';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const problems = [];
page.on('console', m => { if (m.type() === 'error') problems.push(`error: ${m.text().slice(0, 200)}`); });
page.on('pageerror', e => problems.push(`pageerror: ${String(e).slice(0, 200)}`));

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

// zoom in so the NPCs are legible, then start the simulation
for (let i = 0; i < 4; i++) {
  const plus = page.getByRole('button', { name: '+', exact: true }).first();
  if (await plus.count()) await plus.click().catch(() => {});
}
await page.getByRole('button', { name: 'Deploy NPCs', exact: true }).first().click();
await page.waitForTimeout(1200);
await page.screenshot({ path: `${OUT}/lobby-05-deploy-modal.png` });
const deployBtn = page.getByRole('button', { name: 'Deploy', exact: true }).last();
console.log('DEPLOY BUTTON:', (await deployBtn.count()) ? `enabled=${await deployBtn.isEnabled()}` : 'absent');
await deployBtn.click();
await page.waitForTimeout(2500);
const hint = await page.locator('text=NPCs are simulating').count();
console.log('PREVIEW MODE BANNER:', hint > 0 ? 'shown' : 'absent');

let elapsed = 0;
for (const target of [0, 6, 12, 20]) {
  await page.waitForTimeout((target - elapsed) * 1000);
  elapsed = target;
  await page.screenshot({ path: `${OUT}/lobby-05-sim-t${target}.png` });
  console.log(`shot t+${target}s`);
}

const status = await page.getByRole('status').allInnerTexts();
console.log('STATUS:', JSON.stringify(status.map(s => s.replace(/\s+/g, ' ').trim()).slice(0, 8)));
console.log('CONSOLE PROBLEMS:', problems.length ? problems.slice(0, 8).join(' | ') : 'none');
await browser.close();
