// Loader shim template - deploy (copy) to <target>/.opencode/plugins/harness-gate.js.
// opencode only scans .opencode/plugins/, but the plugin's single source lives in
// harness/agents/opencode/ so this shim just re-exports it. Edit logic in the
// source file only; never edit a deployed shim.
export { createHarnessGate, HarnessGate } from '../../harness/agents/opencode/harness-gate.js'
