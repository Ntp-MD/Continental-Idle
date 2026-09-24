/**
 * Artifact cleaner: removes generated and captured files that must never pile up in the tree.
 * Everything listed here is git-ignored by design, so it is regenerable, not a source of truth.
 *   node scripts/clean-artifacts.mjs          delete
 *   node scripts/clean-artifacts.mjs --check  report only, exit 1 when artifacts exist
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const ARTIFACTS = [
	'dist',
	'dist-ssr',
	'test-results',
	'playwright-report',
	'blob-report',
	'coverage',
	'.playwright-mcp',
	'test-output.txt',
	'tests/e2e/__screenshots__',
];
const PATTERNS = [/\.cpuprofile$/, /\.log$/, /\.tmp\d*$/, /\.old$/, /\.bak$/, /~$/, /^qr-.*\.png$/];
const SKIP_DIRS = new Set(['node_modules', '.git']);

function walk(dir, out = []) {
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		if (SKIP_DIRS.has(entry.name)) continue;
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) walk(full, out);
		else out.push(full);
	}
	return out;
}

const check = process.argv.includes('--check');
const targets = [];

for (const name of ARTIFACTS) {
	const full = path.join(ROOT, name);
	if (fs.existsSync(full)) targets.push(full);
}
for (const file of walk(ROOT)) {
	const base = path.basename(file);
	if (PATTERNS.some(re => re.test(base))) targets.push(file);
}

const report = targets.map(f => {
	const size = fs.statSync(f).size;
	return `${path.relative(ROOT, f).split(path.sep).join('/')} (${size > 1024 ? `${Math.round(size / 1024)} KB` : `${size} B`})`;
});

if (!targets.length) {
	console.log('clean-artifacts: tree is clean, no generated files found');
	process.exit(0);
}

if (check) {
	console.error(`clean-artifacts: ${targets.length} artifact(s) present\n  ${report.join('\n  ')}`);
	process.exit(1);
}

for (const f of targets) fs.rmSync(f, { recursive: true, force: true });
console.log(`clean-artifacts: removed ${targets.length} path(s)\n  ${report.join('\n  ')}`);
