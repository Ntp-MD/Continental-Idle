<script setup lang="ts">
import type { NpcRole } from '../../domain/types'

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
    <h3>Roles</h3>
    <ul v-if="roles.length" class="form__col">
      <li
        v-for="role in roles"
        :key="role.id"
        class="card__item"
        :class="{ 'flag--active': role.id === selectedId }"
        role="button"
        tabindex="0"
        :aria-pressed="role.id === selectedId"
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
          title="Set as default role"
          aria-label="Set as default role"
          @click.stop="emit('set-default', role)"
        >
          Default
        </button>
        <button
          type="button"
          class="flag--danger"
          aria-label="Delete role"
          @click.stop="emit('remove', role)"
        >
          x
        </button>
      </li>
    </ul>
    <div v-else class="empty">No roles yet - click "+ Add Role"</div>
    <button type="button" class="flag--active size--fill" :disabled="pending" @click="emit('add')">+ Add Role</button>
  </aside>
</template>

<style>
.npc__sidebar {
  min-width: 0;
  padding: var(--gap-md);
  border-right: 1px solid var(--border-dim);
}

.npc__sidebar .card__item:hover {
  border-color: var(--accent-primary);
}

.npc__text {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  overflow: hidden;
}

.npc__sub {
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: var(--gap-xs);
  overflow: hidden;
  white-space: nowrap;
}
</style>
