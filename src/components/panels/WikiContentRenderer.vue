<script setup lang="ts">
import type { WikiContent } from '@/data/wiki'

const props = defineProps<{
  content: WikiContent
}>()

interface TextSegment {
  text: string
  bold: boolean
}

function splitBold(text: string): TextSegment[] {
  const segments: TextSegment[] = []
  const regex = /\*\*(.+?)\*\*/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index), bold: false })
    }
    segments.push({ text: match[1], bold: true })
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex), bold: false })
  }
  return segments
}
</script>

<template>
  <p v-if="content.type === 'paragraph'">
    <template v-for="(seg, i) in splitBold(content.text)" :key="i">
      <strong v-if="seg.bold">{{ seg.text }}</strong>
      <template v-else>{{ seg.text }}</template>
    </template>
  </p>
  
  <h3 v-else-if="content.type === 'heading' && content.level === 3">{{ content.text }}</h3>
  <h4 v-else-if="content.type === 'heading' && content.level === 4">{{ content.text }}</h4>
  
  <ul v-else-if="content.type === 'list' && !content.ordered">
    <li v-for="(item, idx) in content.items" :key="idx">
      <template v-for="(seg, i) in splitBold(item)" :key="i">
        <strong v-if="seg.bold">{{ seg.text }}</strong>
        <template v-else>{{ seg.text }}</template>
      </template>
    </li>
  </ul>
  
  <ol v-else-if="content.type === 'list' && content.ordered">
    <li v-for="(item, idx) in content.items" :key="idx">
      <template v-for="(seg, i) in splitBold(item)" :key="i">
        <strong v-if="seg.bold">{{ seg.text }}</strong>
        <template v-else>{{ seg.text }}</template>
      </template>
    </li>
  </ol>
  
  <table v-else-if="content.type === 'table'" class="wiki-table">
    <thead>
      <tr>
        <th v-for="(header, idx) in content.headers" :key="idx">{{ header }}</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, rowIdx) in content.rows" :key="rowIdx">
        <td v-for="(cell, cellIdx) in row" :key="cellIdx">{{ cell }}</td>
      </tr>
    </tbody>
  </table>
  
  <div v-else-if="content.type === 'info-box'" class="wiki-info">
    <h4>{{ content.title }}</h4>
    <ul>
      <li v-for="(item, idx) in content.content" :key="idx">
        <template v-for="(seg, i) in splitBold(item)" :key="i">
          <strong v-if="seg.bold">{{ seg.text }}</strong>
          <template v-else>{{ seg.text }}</template>
        </template>
      </li>
    </ul>
  </div>
  
  <div v-else-if="content.type === 'warning-box'" class="wiki-warning">
    <h4>{{ content.title }}</h4>
    <ul>
      <li v-for="(item, idx) in content.content" :key="idx">
        <template v-for="(seg, i) in splitBold(item)" :key="i">
          <strong v-if="seg.bold">{{ seg.text }}</strong>
          <template v-else>{{ seg.text }}</template>
        </template>
      </li>
    </ul>
  </div>
  
  <pre v-else-if="content.type === 'code'"><code>{{ content.code }}</code></pre>
</template>

<style scoped>
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
