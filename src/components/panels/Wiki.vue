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
  background-color: rgba(0, 0, 0, 0.9);
  z-index: 1000;
  overflow-y: auto;
  padding: 20px;
}

.wiki-container {
  font-family: 'Courier New', monospace;
  background-color: #0a0a0a;
  color: #e0e0e0;
  line-height: 1.6;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.wiki-header {
  border: 1px solid #ffd700;
  padding: 20px;
  margin-bottom: 20px;
  background-color: #111;
}

.wiki-title {
  font-size: 2.5em;
  color: #ffd700;
  border-bottom: 1px solid #ffd700;
  padding-bottom: 10px;
  margin-bottom: 10px;
}

.wiki-subtitle {
  color: #888;
  font-size: 1.1em;
}

.wiki-section {
  border: 1px solid #e0e0e0;
  padding: 20px;
  margin-bottom: 20px;
  background-color: #111;
}

.wiki-section h2 {
  color: #ffd700;
  border-bottom: 1px solid #ffd700;
  padding-bottom: 10px;
  margin-bottom: 15px;
  font-size: 1.8em;
}

.wiki-section h3 {
  color: #e0e0e0;
  margin: 20px 0 10px 0;
  font-size: 1.4em;
}

.wiki-section h4 {
  color: #888;
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
  border: 1px solid #e0e0e0;
  padding: 10px;
  text-align: left;
}

.wiki-table th {
  background-color: #1a1a1a;
  color: #ffd700;
}

.wiki-table tr:hover {
  background-color: #1a1a1a;
}

.wiki-box {
  border: 1px solid #4caf50;
  padding: 15px;
  margin: 15px 0;
  background-color: #0f1a0f;
}

.wiki-box h4 {
  color: #4caf50;
  margin-bottom: 10px;
}

.wiki-warning {
  border: 1px solid #d32f2f;
  padding: 15px;
  margin: 15px 0;
  background-color: #1a0f0f;
}

.wiki-warning h4 {
  color: #d32f2f;
  margin-bottom: 10px;
}

.wiki-info {
  border: 1px solid #2196f3;
  padding: 15px;
  margin: 15px 0;
  background-color: #0f101a;
}

.wiki-info h4 {
  color: #2196f3;
  margin-bottom: 10px;
}

.toc {
  border: 1px solid #e0e0e0;
  padding: 15px;
  margin-bottom: 20px;
  background-color: #111;
}

.toc h3 {
  color: #ffd700;
  margin-bottom: 10px;
}

.toc ul {
  list-style: none;
}

.toc li {
  padding: 5px 0;
}

.toc a {
  color: #e0e0e0;
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
  border: 1px solid #e0e0e0;
  font-size: 0.9em;
}

.branch-badge.new-york { border-color: #cccccc; color: #cccccc; }
.branch-badge.rome { border-color: #d4a574; color: #d4a574; }
.branch-badge.casablanca { border-color: #74d4a5; color: #74d4a5; }
.branch-badge.osaka { border-color: #d474a5; color: #d474a5; }
.branch-badge.paris { border-color: #a574d4; color: #a574d4; }
.branch-badge.berlin { border-color: #d47474; color: #d47474; }
.branch-badge.dubai { border-color: #74c2d4; color: #74c2d4; }

.stat-box {
  display: inline-block;
  border: 1px solid #ffd700;
  padding: 10px 15px;
  margin: 5px;
  text-align: center;
}

.stat-box .label {
  font-size: 0.8em;
  color: #888;
}

.stat-box .value {
  font-size: 1.2em;
  color: #ffd700;
}

a {
  color: #4caf50;
  text-decoration: none;
  cursor: pointer;
}

a:hover {
  text-decoration: underline;
}

code {
  background-color: #1a1a1a;
  padding: 2px 6px;
  border: 1px solid #e0e0e0;
  font-family: 'Courier New', monospace;
}

pre {
  background-color: #1a1a1a;
  border: 1px solid #e0e0e0;
  padding: 15px;
  overflow-x: auto;
  margin: 15px 0;
}

pre code {
  border: none;
  padding: 0;
}
</style>
