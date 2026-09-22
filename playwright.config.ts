import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const BASE_URL = `http://127.0.0.1:${PORT}`

/**
 * E2E runs against the PRODUCTION build, never the dev server: the build picks
 * the IndexedDB persistence port, so a spec can create real local state without
 * the dev middleware rewriting src/blueprint-editor/data/blueprint-data.json.
 *
 * Every artifact lands inside this repo (never the runner's tmp):
 * - test output, traces, videos: ./test-results (outputDir)
 * - HTML report: ./playwright-report
 * - visual baselines (toMatchSnapshot, committed): ./tests/e2e/__snapshots__
 * - manual captures (page.screenshot, git-ignored): ./tests/e2e/__screenshots__
 */
export default defineConfig({
	testDir: './tests/e2e',
	outputDir: './test-results',
	snapshotDir: './tests/e2e/__snapshots__',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? [['list'], ['html', { outputFolder: './playwright-report', open: 'never' }]] : 'list',
	use: {
		baseURL: BASE_URL,
		trace: 'on-first-retry',
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${PORT} --strictPort`,
		url: BASE_URL,
		reuseExistingServer: !process.env.CI,
		timeout: 180_000,
	},
})