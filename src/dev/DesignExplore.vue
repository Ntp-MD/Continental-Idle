<script setup lang="ts">
const skins = [
  {
    id: 'a',
    name: 'A - Current, refined',
    note: 'Baseline: near-flat surfaces, thin borders, mono, small type. What the app looks like today.',
  },
  {
    id: 'b',
    name: 'B - Layered Graphite',
    note: 'Clear surface steps, soft elevation, brighter text hierarchy, larger radius. Calm and modern.',
  },
  {
    id: 'c',
    name: 'C - Neon Blueprint',
    note: 'High contrast, cyan accent, uppercase micro-labels, tight radius, subtle glow. Technical HUD.',
  },
]
</script>

<template>
  <div class="explore">
    <header class="explore__header">
      <h1>Design directions</h1>
      <p>
        Same markup, same content, three skins. Compare surface separation, type hierarchy, radius, elevation and accent
        usage - then pick one to build the real system on.
      </p>
    </header>

    <section v-for="s in skins" :key="s.id" class="explore__block">
      <div class="explore__label">
        <h2>{{ s.name }}</h2>
        <p>{{ s.note }}</p>
      </div>

      <div class="skin" :class="`skin--${s.id}`">
        <div class="demo">
          <div class="demo__tabs">
            <button class="demo__tab is-active">Canvas</button>
            <button class="demo__tab">Interaction</button>
            <button class="demo__tab">Display</button>
          </div>

          <div class="demo__panel">
            <div class="demo__panel-head">Canvas Size</div>
            <div class="demo__grid">
              <label class="demo__field">
                <span>Width</span>
                <input type="number" value="1600" />
              </label>
              <label class="demo__field">
                <span>Height</span>
                <input type="number" value="1000" />
              </label>
              <label class="demo__field">
                <span>Tile</span>
                <input type="number" value="20" />
              </label>
            </div>
            <p class="demo__hint">Re-snaps all objects to the new grid. Max 256 x 256 tiles.</p>
          </div>

          <div class="demo__panel">
            <div class="demo__panel-head">Roles</div>
            <ul class="demo__list">
              <li class="demo__row is-active">
                <span class="demo__dot" :style="{ background: '#4c8dff' }"></span>
                <span class="demo__row-main">Guest</span>
                <span class="demo__badge">14</span>
                <button class="demo__x" aria-label="Remove">x</button>
              </li>
              <li class="demo__row">
                <span class="demo__dot" :style="{ background: '#d29922' }"></span>
                <span class="demo__row-main">Receptionist</span>
                <span class="demo__badge">2</span>
                <button class="demo__x" aria-label="Remove">x</button>
              </li>
              <li class="demo__row">
                <span class="demo__dot" :style="{ background: '#3fb950' }"></span>
                <span class="demo__row-main">Housekeeper</span>
                <span class="demo__badge">2</span>
                <button class="demo__x" aria-label="Remove">x</button>
              </li>
            </ul>
            <div class="demo__chips">
              <span class="demo__chip">portal</span>
              <span class="demo__chip">front-desk</span>
              <span class="demo__chip">dining</span>
            </div>
          </div>

          <div class="demo__actions">
            <button class="demo__btn">Cancel</button>
            <button class="demo__btn is-primary">Apply</button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.explore {
  min-height: 100vh;
  padding: var(--gap-lg);
  display: flex;
  flex-direction: column;
  gap: var(--gap-lg);
  background: #06080c;
  color: #c8cfda;
}

.explore__header h1 {
  font-size: 24px;
  margin-bottom: var(--gap-xs);
}

.explore__header p {
  color: #8b95a7;
  max-width: 720px;
}

.explore__block {
  display: grid;
  grid-template-columns: minmax(200px, 280px) minmax(0, 1fr);
  gap: var(--gap-lg);
  align-items: start;
}

.explore__label h2 {
  font-size: 15px;
  margin-bottom: var(--gap-xs);
}

.explore__label p {
  color: #8b95a7;
  line-height: 1.5;
}

/* ---- skin token sets (vars only) ---- */
.skin {
  border-radius: var(--sk-radius);
  background: var(--sk-bg);
  border: 1px solid var(--sk-border);
  padding: var(--gap-md);
  box-shadow: var(--sk-shadow);
}

.skin--a {
  --sk-bg: #0d1117;
  --sk-panel: #010409;
  --sk-raised: #161b22;
  --sk-border: #30363d;
  --sk-text: #a0a5ac;
  --sk-dim: #6e7681;
  --sk-accent: #1f6feb;
  --sk-radius: 6px;
  --sk-shadow: none;
  --sk-label: none;
  --sk-gap: 8px;
}

.skin--b {
  --sk-bg: #0b0e14;
  --sk-panel: #141922;
  --sk-raised: #1b212c;
  --sk-border: #262d3a;
  --sk-text: #e6eaf2;
  --sk-dim: #8b95a7;
  --sk-accent: #4c8dff;
  --sk-radius: 12px;
  --sk-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  --sk-label: none;
  --sk-gap: 12px;
}

.skin--c {
  --sk-bg: #05070d;
  --sk-panel: #0a0f1a;
  --sk-raised: #0f1524;
  --sk-border: #1b2740;
  --sk-text: #dbe7ff;
  --sk-dim: #7d90b8;
  --sk-accent: #35e0ff;
  --sk-radius: 4px;
  --sk-shadow: 0 0 0 1px rgba(53, 224, 255, 0.08), 0 0 28px rgba(53, 224, 255, 0.12);
  --sk-label: uppercase;
  --sk-gap: 10px;
}

.demo {
  display: flex;
  flex-direction: column;
  gap: var(--sk-gap);
  font-size: 12px;
}

.demo__tabs {
  display: flex;
  gap: var(--gap-xs);
  border-bottom: 1px solid var(--sk-border);
  padding-bottom: var(--gap-sm);
}

.demo__tab {
  background: transparent;
  border: 1px solid transparent;
  color: var(--sk-dim);
  padding: 6px 12px;
  border-radius: var(--sk-radius);
  min-height: 0;
  font-size: 12px;
}

.demo__tab.is-active {
  color: var(--sk-accent);
  border-color: var(--sk-accent);
  background: color-mix(in srgb, var(--sk-accent) 10%, transparent);
}

.demo__panel {
  background: var(--sk-panel);
  border: 1px solid var(--sk-border);
  border-radius: var(--sk-radius);
  padding: var(--gap-md);
  display: flex;
  flex-direction: column;
  gap: var(--sk-gap);
}

.demo__panel-head {
  color: var(--sk-text);
  font-weight: 600;
  letter-spacing: 0.4px;
  text-transform: var(--sk-label);
  font-size: 12px;
}

.demo__grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--sk-gap);
}

.demo__field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1 1 120px;
  min-width: 0;
}

.demo__field span {
  color: var(--sk-dim);
  font-size: 10px;
  letter-spacing: 0.5px;
  text-transform: var(--sk-label);
}

.demo__field input {
  width: 100%;
  background: var(--sk-raised);
  border: 1px solid var(--sk-border);
  color: var(--sk-text);
  border-radius: var(--sk-radius);
  padding: 8px 10px;
  font-family: inherit;
  font-size: 12px;
}

.demo__hint {
  color: var(--sk-dim);
  font-size: 11px;
  line-height: 1.4;
}

.demo__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.demo__row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--sk-border);
  border-radius: var(--sk-radius);
  background: var(--sk-raised);
  color: var(--sk-text);
}

.demo__row.is-active {
  border-color: var(--sk-accent);
  background: color-mix(in srgb, var(--sk-accent) 12%, var(--sk-raised));
}

.demo__dot {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  flex-shrink: 0;
}

.demo__row-main {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.demo__badge {
  color: var(--sk-dim);
  border: 1px solid var(--sk-border);
  border-radius: 999px;
  padding: 1px 8px;
  font-size: 11px;
}

.demo__x {
  background: transparent;
  border: 1px solid var(--sk-border);
  color: var(--sk-dim);
  border-radius: var(--sk-radius);
  padding: 0 6px;
  min-height: 0;
  font-size: 11px;
}

.demo__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.demo__chip {
  border: 1px solid var(--sk-border);
  border-radius: 999px;
  padding: 3px 10px;
  color: var(--sk-text);
  background: var(--sk-raised);
  font-size: 11px;
}

.demo__actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--gap-sm);
  border-top: 1px solid var(--sk-border);
  padding-top: var(--gap-sm);
}

.demo__btn {
  background: var(--sk-raised);
  border: 1px solid var(--sk-border);
  color: var(--sk-text);
  border-radius: var(--sk-radius);
  padding: 8px 16px;
  min-height: 0;
  font-size: 12px;
}

.demo__btn.is-primary {
  background: var(--sk-accent);
  border-color: var(--sk-accent);
  color: #05070d;
  font-weight: 600;
}

@media (max-width: 900px) {
  .explore__block {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
