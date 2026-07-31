<script setup lang="ts">
import { wikiSections } from '@/data/wiki'
import WikiContentRenderer from '@/components/panels/wikiContentRenderer.vue'

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
  <div class="wiki__overlay" @click.self="emit('close')">
    <div class="wiki__container" role="dialog" aria-modal="true" aria-labelledby="wiki__title">
      <div class="wiki__header">
        <h1 class="wiki__title" id="wiki__title">Continental Idle</h1>
        <p class="wiki__subtitle">An idle/incremental game set in the Continental Hotel universe</p>
      </div>

      <div class="toc">
        <h3>Table of Contents</h3>
        <ul>
          <li v-for="(section, index) in wikiSections" :key="section.id">
            <a @click="scrollToSection(section.id)">{{ index + 1 }}. {{ section.title }}</a>
          </li>
        </ul>
      </div>

      <div v-for="section in wikiSections" :key="section.id" class="wiki__section" :id="section.id">
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

.wiki__overlay {
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

.wiki__container {
  font-family: 'Courier New', monospace;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  line-height: 1.6;
  padding: var(--gap-md);
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
}

.wiki__header {
  border: 1px solid var(--accent-gold);
  padding: var(--gap-md);
  margin-bottom: var(--gap-md);
  background-color: var(--bg-tertiary);
}

.wiki__title {
  font-size: var(--font-xl);
  color: var(--accent-gold);
  border-bottom: 1px solid var(--accent-gold);
  padding-bottom: var(--gap-sm);
  margin-bottom: var(--gap-sm);
}

.wiki__subtitle {
  color: var(--text-dim);
  font-size: var(--font-md);
}

.wiki__section {
  border: 1px solid var(--text-primary);
  padding: var(--gap-md);
  margin-bottom: var(--gap-md);
  background-color: var(--bg-tertiary);
}

.wiki__section h2 {
  color: var(--accent-gold);
  border-bottom: 1px solid var(--accent-gold);
  padding-bottom: var(--gap-sm);
  margin-bottom: var(--gap-md);
  font-size: var(--font-xl);
}

.wiki__section h3 {
  color: var(--text-primary);
  margin: var(--gap-md) 0 var(--gap-sm) 0;
  font-size: var(--font-lg);
}

.wiki__section h4 {
  color: var(--text-dim);
  margin: var(--gap-md) 0 var(--gap-sm) 0;
  font-size: var(--font-lg);
}

.wiki__section p {
  margin-bottom: var(--gap-md);
}

.wiki__section ul {
  margin-left: var(--gap-md);
  margin-bottom: var(--gap-md);
}

.wiki__section li {
  margin-bottom: var(--gap-sm);
}

.wiki__section ol {
  margin-left: var(--gap-md);
  margin-bottom: var(--gap-md);
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

a {
  color: var(--accent-green);
  text-decoration: none;
  cursor: pointer;
}

a:hover {
  text-decoration: underline;
}

</style>
