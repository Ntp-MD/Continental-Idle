// Loader shim - opencode only loads plugins from .opencode/plugins/, but the
// single source of this plugin lives in harness/agents/opencode/ so adopt.mjs
// can deploy it to new projects. Logic lives in harness - edit it there only.
export { createHarnessGate, HarnessGate } from '../../harness/agents/opencode/harness-gate.js'
