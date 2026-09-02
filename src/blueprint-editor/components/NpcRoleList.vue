<script setup lang="ts">
import type { NpcRole } from '../types'

defineProps<{
  roles: NpcRole[]
  defaultRoleId: string
  selectedId: string
  pending: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'set-default', role: NpcRole): void
  (e: 'remove', role: NpcRole): void
  (e: 'add'): void
}>()

function roleSummary(role: NpcRole): string {
  return `${role.focusTags.length} focus - ${role.taskIds.length} tasks`
}
</script>

<template>
  <aside class="form__col npc__sidebar">
    <h3 class="form__title">Roles</h3>
    <div
      v-for="role in roles"
      :key="role.id"
      class="npc__row"
      role="button"
      tabindex="0"
      @click="emit('select', role.id)"
      @keydown.self.enter.prevent="emit('select', role.id)"
      @keydown.self.space.prevent="emit('select', role.id)"
    >
      <span class="swatch" :style="{ background: role.color }" />
      <span class="npc__text"
        ><strong class="truncate">{{ role.label }}</strong
        ><small class="npc__sub"
          ><span v-if="role.id === defaultRoleId" class="badge flag--success">Default</span
          >{{ roleSummary(role) }}</small
        ></span
      >
      <button
        v-if="role.id !== defaultRoleId"
        type="button"
        class="flag--ghost"
        title="Set as default role"
        aria-label="Set as default role"
        @click.stop="emit('set-default', role)"
      >
        Default
      </button>
      <button
        v-if="role.id !== defaultRoleId"
        type="button"
        class="flag--danger"
        aria-label="Delete role"
        @click.stop="emit('remove', role)"
      >
        x
      </button>
    </div>
    <div v-if="!roles.length" class="empty">No roles yet - click "+ Add Role"</div>
    <button type="button" class="flag--active size--fill" :disabled="pending" @click="emit('add')">+ Add Role</button>
  </aside>
</template>

<style scoped>
.npc__sidebar {
  min-width: 0;
  padding: var(--gap-md);
  border-right: 1px solid var(--border-dim);
}

.npc__row {
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  padding: var(--gap-xs) var(--gap-sm);
  cursor: pointer;
  border: 1px solid var(--border-dim);
  border-radius: var(--radius-sm);
}

.npc__row:hover {
  background: var(--bg-primary);
}

.npc__text {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
}

.npc__sub {
  color: var(--text-dim);
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  overflow: hidden;
  white-space: nowrap;
}
</style>
