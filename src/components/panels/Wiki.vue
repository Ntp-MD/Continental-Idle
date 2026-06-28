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
    <div class="wiki-container">
      <div class="wiki-header">
        <h1 class="wiki-title">Continental Idle</h1>
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
  padding: 20px;
}

.wiki-container {
  font-family: 'Courier New', monospace;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.wiki-header {
  border: 1px solid var(--accent-gold);
  padding: 20px;
  margin-bottom: 20px;
  background-color: var(--bg-tertiary);
}

.wiki-title {
  font-size: 2.5em;
  color: var(--accent-gold);
  border-bottom: 1px solid var(--accent-gold);
  padding-bottom: 10px;
  margin-bottom: 10px;
}

.wiki-subtitle {
  color: var(--text-dim);
  font-size: 1.1em;
}

.wiki-section {
  border: 1px solid var(--text-primary);
  padding: 20px;
  margin-bottom: 20px;
  background-color: var(--bg-tertiary);
}

.wiki-section h2 {
  color: var(--accent-gold);
  border-bottom: 1px solid var(--accent-gold);
  padding-bottom: 10px;
  margin-bottom: 15px;
  font-size: 1.8em;
}

.wiki-section h3 {
  color: var(--text-primary);
  margin: 20px 0 10px 0;
  font-size: 1.4em;
}

.wiki-section h4 {
  color: var(--text-dim);
  margin: 15px 0 8px 0;
  font-size: 1.2em;
}

.wiki-section p {
  margin-bottom: 15px;
}

.wiki-section ul {
  margin-left: 20px;
  margin-bottom: 15px;
}

.wiki-section li {
  margin-bottom: 8px;
}

.wiki-section ol {
  margin-left: 20px;
  margin-bottom: 15px;
}

.wiki-table {
  width: 100%;
  border-collapse: collapse;
  margin: 15px 0;
}

.wiki-table th,
.wiki-table td {
  border: 1px solid var(--text-primary);
  padding: 10px;
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
  padding: 15px;
  margin: 15px 0;
  background-color: var(--wiki-green-bg);
}

.wiki-box h4 {
  color: var(--accent-green);
  margin-bottom: 10px;
}

.wiki-warning {
  border: 1px solid var(--wiki-red);
  padding: 15px;
  margin: 15px 0;
  background-color: var(--wiki-red-bg);
}

.wiki-warning h4 {
  color: var(--wiki-red);
  margin-bottom: 10px;
}

.wiki-info {
  border: 1px solid var(--wiki-blue);
  padding: 15px;
  margin: 15px 0;
  background-color: var(--wiki-blue-bg);
}

.wiki-info h4 {
  color: var(--wiki-blue);
  margin-bottom: 10px;
}

.toc {
  border: 1px solid var(--text-primary);
  padding: 15px;
  margin-bottom: 20px;
  background-color: var(--bg-tertiary);
}

.toc h3 {
  color: var(--accent-gold);
  margin-bottom: 10px;
}

.toc ul {
  list-style: none;
}

.toc li {
  padding: 5px 0;
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
  padding: 3px 8px;
  margin: 2px;
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
  padding: 10px 15px;
  margin: 5px;
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
  padding: 2px 6px;
  border: 1px solid var(--text-primary);
  font-family: 'Courier New', monospace;
}

pre {
  background-color: var(--bg-card);
  border: 1px solid var(--text-primary);
  padding: 15px;
  overflow-x: auto;
  margin: 15px 0;
}

pre code {
  border: none;
  padding: 0;
}

@media (max-width: 768px) {
  .wiki-overlay {
    padding: 10px;
  }

  .wiki-container {
    padding: 12px;
  }

  .wiki-title {
    font-size: 1.6em;
  }

  .wiki-subtitle {
    font-size: 0.95em;
  }

  .wiki-section {
    padding: 14px;
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
    padding: 14px;
  }
}

@media (max-width: 480px) {
  .wiki-container {
    padding: 8px;
  }

  .wiki-title {
    font-size: 1.3em;
    letter-spacing: 1px;
  }

  .wiki-section {
    padding: 10px;
  }

  .wiki-section h2 {
    font-size: 1.2em;
  }

  .wiki-header {
    padding: 10px;
  }
}
</style>
