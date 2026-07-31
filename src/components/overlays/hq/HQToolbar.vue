<script setup lang="ts">
const props = defineProps<{
  viewMode: 'birdseye' | 'fallout'
  showLabels: boolean
  goldenCoins: number
  royalMarks: number
  canCallVisitor: boolean
  canUseRoyalMark: boolean
  visitorCount: number
}>()

const emit = defineEmits<{
  toggleView: []
  toggleLabels: []
  callVisitor: []
  royalMarkScroll: []
}>()
</script>

<template>
  <div class="hqtoolbar">
    <div class="hqtoolbar__left">
      <button class="hqtoolbar__btn" :class="{ 'is__active': props.viewMode === 'birdseye' }" @click="props.viewMode !== 'birdseye' && emit('toggleView')">Bird's Eye</button>
      <button class="hqtoolbar__btn" :class="{ 'is__active': props.viewMode === 'fallout' }" @click="props.viewMode !== 'fallout' && emit('toggleView')">Fallout</button>
      <button class="hqtoolbar__btn" :class="{ 'is__active': props.showLabels }" @click="emit('toggleLabels')">Labels</button>
    </div>
    <div class="hqtoolbar__right">
      <span class="hqtoolbar__currency" title="Golden Coins">🪙 {{ Math.floor(props.goldenCoins) }}</span>
      <span v-if="props.royalMarks > 0" class="hqtoolbar__currency" title="Royal Marks">👑 {{ Math.floor(props.royalMarks) }}</span>
      <button
        class="hqtoolbar__btn hqtoolbar__call"
        :disabled="!props.canCallVisitor || props.visitorCount > 0"
        @click="emit('callVisitor')"
      >Call Visitors (🪙10)</button>
      <button
        v-if="props.royalMarks > 0"
        class="hqtoolbar__btn hqtoolbar__scroll"
        :disabled="!props.canUseRoyalMark || props.visitorCount > 0"
        @click="emit('royalMarkScroll')"
      >Royal Scroll (👑1)</button>
    </div>
  </div>
</template>

<style scoped>
.hqtoolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 12px;
  background: #0d0d0d;
  border-bottom: 1px solid #333;
  gap: 8px;
  flex-wrap: wrap;
}
.hqtoolbar__left, .hqtoolbar__right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.hqtoolbar__btn {
  background: #1a1a1a;
  color: #888;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  font-family: Georgia, serif;
  transition: all 0.15s;
}
.hqtoolbar__btn:hover {
  border-color: #c9a84c;
  color: #c9a84c;
}
.hqtoolbar__btn.is__active {
  background: #c9a84c;
  color: #1a1a1a;
  border-color: #c9a84c;
}
.hqtoolbar__btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.hqtoolbar__currency {
  font-size: 12px;
  color: #c9a84c;
  font-family: Georgia, serif;
}
.hqtoolbar__call {
  background: #2a2a1a;
  border-color: #c9a84c;
  color: #c9a84c;
}
.hqtoolbar__scroll {
  background: #2a1a2a;
  border-color: #9c27b0;
  color: #ce93d8;
}
</style>
