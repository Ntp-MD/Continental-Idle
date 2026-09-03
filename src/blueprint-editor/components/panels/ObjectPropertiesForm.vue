<script setup lang="ts">
import { computed } from 'vue'
import { useAssetsStore } from '../../blueprintStore'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useClipboardCopy } from '../../composables/useClipboardCopy'
import { CANVAS_WALL_OBJECT_TYPE } from '../../domain/types'
import type { ObjectData, AssetDef } from '../../domain/types'

const props = defineProps<{ object: ObjectData }>()
const store = useAssetsStore()
const { confirm } = useConfirm()
const { copyId } = useClipboardCopy()

const assetDef = computed<AssetDef | undefined>(() => store.assetMap().get(props.object.type))
const isCanvasWall = computed(() => props.object.isWall && props.object.type === CANVAS_WALL_OBJECT_TYPE)

async function rotate() {
  await store.rotateSelected()
}

async function remove() {
  const confirmed = await confirm({
    title: 'Delete object',
    message: `Delete object "${props.object.id}"? This action cannot be undone.`,
    confirmLabel: 'Delete',
    cancelLabel: 'Cancel',
    danger: true,
  })
  if (!confirmed) return
  await store.deleteSelected()
}

async function doUnlink() {
  await store.unlinkObject(props.object.id)
  useToast().info('Object unlinked')
}

function deselect() {
  store.select(null)
  store.selectAsset(null)
}
</script>

<template>
  <div class="form__col">
    <div class="form__col">
      <h3>Object</h3>
      <div class="form__row">
        <label>ID</label>
        <div class="form__row size--stretch">
          <input class="size--fill" type="text" :value="object.id" disabled title="Object ID" />
          <button @click="copyId(object.id)">Copy</button>
        </div>
      </div>
      <div class="form__row">
        <label>X</label>
        <span>{{ object.x }}</span>
      </div>
      <div class="form__row">
        <label>Y</label>
        <span>{{ object.y }}</span>
      </div>
      <div v-if="isCanvasWall" class="form__row">
        <label>Wall Segment</label>
        <span>{{ object.x1 }},{{ object.y1 }} -> {{ object.x2 }},{{ object.y2 }}</span>
      </div>
      <div v-else class="form__row">
        <label>Rotation</label>
        <div class="form__col">
          <span>{{ object.rotation }}deg</span>
          <button title="Rotate 90deg (R)" @click="rotate">Rotate</button>
        </div>
      </div>
    </div>

    <div class="form__col">
      <h3>Origin Asset</h3>
      <div class="form__row">
        <label>Name</label>
        <span>{{ assetDef?.name ?? object.type }}</span>
      </div>
      <div class="form__row">
        <label>Placed Label</label>
        <span>{{ assetDef?.defaultLabel ?? assetDef?.name ?? '-' }}</span>
      </div>
      <div class="form__row">
        <label>Size</label>
        <span>{{ object.w }}x{{ object.h }}</span>
      </div>
      <div class="form__row">
        <label>Fill Color</label>
        <span>{{ object.fillColor ?? assetDef?.defaultFillColor ?? '-' }}</span>
      </div>
      <div class="form__row">
        <label>Stroke Color</label>
        <span>{{ object.strokeColor ?? assetDef?.defaultStrokeColor ?? '-' }}</span>
      </div>
      <div class="form__row">
        <label>Label Color</label>
        <span>set in Canvas Settings</span>
      </div>
      <div class="form__row">
        <label>Passable</label>
        <span>{{ (assetDef?.walkable ?? false) ? 'ON' : 'OFF' }}</span>
      </div>
      <div class="form__row">
        <label>Door</label>
        <span>{{ assetDef?.doorRequired ?? false }}</span>
      </div>
      <div>Edit these in the Asset Properties panel.</div>
    </div>

    <div class="form__row">
      <button v-if="object.linkGroupId" @click="doUnlink">Unlink</button>
    </div>
    <div class="form__row">
      <button @click="deselect">Deselect</button>
      <button class="flag--danger" @click="remove">Delete</button>
    </div>
  </div>
</template>
