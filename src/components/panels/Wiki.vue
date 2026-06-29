<script setup lang="ts">
import { wikiSections } from '@/data/wiki'
import WikiContentRenderer from '@/components/panels/WikiContentRenderer.vue'

const emit = defineEmits<{
  close: []
}>()

function scrollToSection(id: string) {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}
</script>

<template>
  <div class="wiki-overlay" @click.self="emit('close')">
    <div class="wiki-container" role="dialog" aria-modal="true" aria-labelledby="wiki-title">
      <div class="wiki-header">
        <h1 class="wiki-title" id="wiki-title">Continental Idle</h1>
        <p class="wiki-subtitle">An idle/incremental game set in the Continental Hotel universe</p>
      </div>

      <div class="toc">
        <h3>Table of Contents</h3>
        <ul>
          <li v-for="(section, index) in wikiSections" :key="section.id">
            <a @click="scrollToSection(section.id)">{{ index + 1 }}. {{ section.title }}</a>
          </li>
        </ul>
      </div>

      <div v-for="section in wikiSections" :key="section.id" class="wiki-section" :id="section.id">
        <h2>{{ section.title }}</h2>
        <div v-for="(content, idx) in section.content" :key="idx">
          <WikiContentRenderer :content="content" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.wiki-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-overlay);
  z-index: 1000;
  overflow-y: auto;
  padding: var(--gap-md);
}

.wiki-container {
  font-family: 'Courier New', monospace;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  padding: var(--gap-md);
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
}

.wiki-header {
  border: 1px solid var(--accent-gold);
  padding: var(--gap-md);
  margin-bottom: var(--gap-md);
  background-color: var(--bg-tertiary);
}

.wiki-title {
  font-size: 2.5em;
  color: var(--accent-gold);
  border-bottom: 1px solid var(--accent-gold);
  padding-bottom: var(--gap-sm);
  margin-bottom: var(--gap-sm);
}

.wiki-subtitle {
  color: var(--text-dim);
  font-size: 1.1em;
}

.wiki-section {
  border: 1px solid var(--text-primary);
  padding: var(--gap-md);
  margin-bottom: var(--gap-md);
  background-color: var(--bg-tertiary);
}

.wiki-section h2 {
  color: var(--accent-gold);
  border-bottom: 1px solid var(--accent-gold);
  padding-bottom: var(--gap-sm);
  margin-bottom: var(--gap-md);
  font-size: 1.8em;
}

.wiki-section h3 {
  color: var(--text-primary);
  margin: var(--gap-md) 0 var(--gap-sm) 0;
  font-size: 1.4em;
}

.wiki-section h4 {
  color: var(--text-dim);
  margin: var(--gap-md) 0 var(--gap-sm) 0;
  font-size: 1.2em;
}

.wiki-section p {
  margin-bottom: var(--gap-md);
}

.wiki-section ul {
  margin-left: var(--gap-md);
  margin-bottom: var(--gap-md);
}

.wiki-section li {
  margin-bottom: var(--gap-sm);
}

.wiki-section ol {
  margin-left: var(--gap-md);
  margin-bottom: var(--gap-md);
}

.wiki-table {
  width: 100%;
  border-collapse: collapse;
  margin: var(--gap-md) 0;
}

.wiki-table th,
.wiki-table td {
  border: 1px solid var(--text-primary);
  padding: var(--gap-sm);
  text-align: left;
}

.wiki-table th {
  background-color: var(--bg-card);
  color: var(--accent-gold);
}

.wiki-table tr:hover {
  background-color: var(--bg-card);
}

.wiki-box {
  border: 1px solid var(--accent-green);
  padding: var(--gap-md);
  margin: var(--gap-md) 0;
  background-color: var(--wiki-green-bg);
}

.wiki-box h4 {
  color: var(--accent-green);
  margin-bottom: var(--gap-sm);
}

.wiki-warning {
  border: 1px solid var(--wiki-red);
  padding: var(--gap-md);
  margin: var(--gap-md) 0;
  background-color: var(--wiki-red-bg);
}

.wiki-warning h4 {
  color: var(--wiki-red);
  margin-bottom: var(--gap-sm);
}

.wiki-info {
  border: 1px solid var(--wiki-blue);
  padding: var(--gap-md);
  margin: var(--gap-md) 0;
  background-color: var(--wiki-blue-bg);
}

.wiki-info h4 {
  color: var(--wiki-blue);
  margin-bottom: var(--gap-sm);
}

.toc {
  border: 1px solid var(--text-primary);
  padding: var(--gap-md);
  margin-bottom: var(--gap-md);
  background-color: var(--bg-tertiary);
}

.toc h3 {
  color: var(--accent-gold);
  margin-bottom: var(--gap-sm);
}

.toc ul {
  list-style: none;
}

.toc li {
  padding: var(--gap-xs) 0;
}

.toc a {
  color: var(--text-primary);
  text-decoration: none;
  cursor: pointer;
}

.toc a:hover {
  text-decoration: underline;
}

.branch-badge {
  display: inline-block;
  padding: var(--gap-xs) var(--gap-sm);
  margin: var(--gap-xs);
  border: 1px solid var(--text-primary);
  font-size: 0.9em;
}

.branch-badge.new-york { border-color: var(--branch-new-york); color: var(--branch-new-york); }
.branch-badge.rome { border-color: var(--branch-rome); color: var(--branch-rome); }
.branch-badge.casablanca { border-color: var(--branch-casablanca); color: var(--branch-casablanca); }
.branch-badge.osaka { border-color: var(--branch-osaka); color: var(--branch-osaka); }
.branch-badge.paris { border-color: var(--branch-paris); color: var(--branch-paris); }
.branch-badge.berlin { border-color: var(--branch-berlin); color: var(--branch-berlin); }
.branch-badge.dubai { border-color: var(--branch-dubai); color: var(--branch-dubai); }

.stat-box {
  display: inline-block;
  border: 1px solid var(--accent-gold);
  padding: var(--gap-sm) var(--gap-md);
  margin: var(--gap-xs);
  text-align: center;
}

.stat-box .label {
  font-size: 0.8em;
  color: var(--text-dim);
}

.stat-box .value {
  font-size: 1.2em;
  color: var(--accent-gold);
}

a {
  color: var(--accent-green);
  text-decoration: none;
  cursor: pointer;
}

a:hover {
  text-decoration: underline;
}

code {
  background-color: var(--bg-card);
  padding: var(--gap-xs) var(--gap-xs);
  border: 1px solid var(--text-primary);
  font-family: 'Courier New', monospace;
}

pre {
  background-color: var(--bg-card);
  border: 1px solid var(--text-primary);
  padding: var(--gap-md);
  overflow-x: auto;
  margin: var(--gap-md) 0;
}

pre code {
  border: none;
  padding: 0;
}

@media (max-width: 768px) {
  .wiki-overlay {
    padding: var(--gap-sm);
  }

  .wiki-container {
    padding: var(--gap-sm);
  }

  .wiki-title {
    font-size: 1.6em;
  }

  .wiki-subtitle {
    font-size: 0.95em;
  }

  .wiki-section {
    padding: var(--gap-sm);
  }

  .wiki-section h2 {
    font-size: 1.4em;
  }

  .wiki-section h3 {
    font-size: 1.2em;
  }

  .wiki-table {
    display: block;
    overflow-x: auto;
  }

  .wiki-header {
    padding: var(--gap-sm);
  }
}

@media (max-width: 480px) {
  .wiki-container {
    padding: var(--gap-sm);
  }

  .wiki-title {
    font-size: 1.3em;
    letter-spacing: 1px;
  }

  .wiki-section {
    padding: var(--gap-sm);
  }

  .wiki-section h2 {
    font-size: 1.2em;
  }

  .wiki-header {
    padding: var(--gap-sm);
  }
}
</style>
