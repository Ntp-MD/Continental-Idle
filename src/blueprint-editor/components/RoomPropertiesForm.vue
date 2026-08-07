<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { useAssetsStore } from "../blueprintStore";
import { useToast } from "@/composables/useToast";
import { useConfirm } from "@/composables/useConfirm";
import { useAsyncAction } from "../composables/useAsyncAction";
import { useFieldError } from "../composables/useFieldError";
import { useClipboardCopy } from "../composables/useClipboardCopy";
import { validateRoomAnchors } from "../assetUtils";
import { isHexColor } from "../store/state";
import type { EntrancePoint, RoomData, RoomType, AnchorPoint } from "../types";
import { normalizeInteractConfig, resolveInteractForTarget } from "../types";
import TagPicker from "./tagPicker.vue";

const props = defineProps<{ room: RoomData }>();
const store = useAssetsStore();
const { prompt } = useConfirm();
const { pending, run } = useAsyncAction();
const { errorFields, flashError } = useFieldError();
const { copyId } = useClipboardCopy();

const fields = ref({ x: 0, y: 0, w: 0, h: 0, label: "", category: "", roomType: "room" as RoomType, walkable: true, radius: 0, padding: 0, fillColor: "", rxTL: 0, rxTR: 0, rxBR: 0, rxBL: 0, interactCapacity: 0, interactDurationMin: 1, interactDurationMax: 3 });
const roomTags = ref<string[]>([]);
const entrances = ref<EntrancePoint[]>([]);
const anchors = ref<AnchorPoint[]>([]);
const invalidAnchorCount = computed(() => validateRoomAnchors(props.room, store.currentFloor.value?.objects ?? [], store.assetMap()).invalid.length);
const rxSync = ref(true);

watch(
  () => props.room,
  (room) => {
    errorFields.value = {};
    const roomAnchors = room.anchorPoints?.map((p) => ({ ...p })) ?? [{ x: room.w / 2, y: room.h / 2 }];
    const resolved = resolveInteractForTarget(room.interact, roomAnchors.length);
    fields.value = {
      x: room.x,
      y: room.y,
      w: room.w,
      h: room.h,
      label: room.label,
      category: room.category ?? "",
      roomType: room.roomType ?? "room",
      walkable: room.walkable ?? true,
      radius: room.radius ?? 0,
      padding: room.padding ?? 0,
      fillColor: room.fillColor ?? "",
      rxTL: room.rx?.tl ?? 0,
      rxTR: room.rx?.tr ?? 0,
      rxBR: room.rx?.br ?? 0,
      rxBL: room.rx?.bl ?? 0,
      interactCapacity: resolved.capacity,
      interactDurationMin: resolved.durationMinSeconds,
      interactDurationMax: resolved.durationMaxSeconds,
    };
    roomTags.value = room.tags ? [...room.tags] : [];
    entrances.value = room.entrances?.map((e) => ({ ...e })) ?? [];
    anchors.value = roomAnchors;
  },
  { immediate: true },
);

async function commitField(field: "x" | "y" | "w" | "h" | "label" | "category" | "roomType" | "walkable" | "radius" | "fillColor" | "padding") {
  if (field === "fillColor") {
    if (fields.value.fillColor && !isHexColor(fields.value.fillColor)) {
      useToast().warning("Fill color must be a hex code");
      return;
    }
    await store.updateRoomProps({ fillColor: fields.value.fillColor || undefined });
    return;
  }
  const patch: Partial<RoomData> = { [field]: fields.value[field] } as Partial<RoomData>;
  const ok = await store.updateRoomProps(patch);
  if (!ok) {
    flashError(field);
    (fields.value as unknown as Record<string, unknown>)[field] = (props.room as unknown as Record<string, unknown>)[field];
  }
}

async function commitRx() {
  const { rxTL, rxTR, rxBR, rxBL } = fields.value;
  if (rxTL === 0 && rxTR === 0 && rxBR === 0 && rxBL === 0) {
    await store.updateRoomProps({ rx: undefined });
  } else {
    await store.updateRoomProps({ rx: { tl: rxTL, tr: rxTR, br: rxBR, bl: rxBL } });
  }
}

async function onRxInput(corner: "rxTL" | "rxTR" | "rxBR" | "rxBL") {
  if (rxSync.value) {
    const val = fields.value[corner];
    fields.value.rxTL = val;
    fields.value.rxTR = val;
    fields.value.rxBR = val;
    fields.value.rxBL = val;
  }
  await commitRx();
}

async function onRoomTypeChange() {
  await store.updateRoomProps({ roomType: fields.value.roomType });
  fields.value.walkable = fields.value.roomType !== "wall";
}

async function onWalkableToggle() {
  await store.updateRoomProps({ walkable: fields.value.walkable });
}

async function saveRoomTags(tags: string[]) {
  roomTags.value = tags;
  await store.updateRoomProps({ tags });
}

async function updateEntrances() {
  await store.updateRoomProps({ entrances: entrances.value.length > 0 ? entrances.value.map((e) => ({ ...e })) : undefined });
}

async function addEntrance() {
  entrances.value.push({ side: "top", offset: Math.max(0, fields.value.w / 2 - 12.5), width: 25 });
  await updateEntrances();
}

async function removeEntrance(index: number) {
  entrances.value.splice(index, 1);
  await updateEntrances();
}

async function updateAnchors() {
  await store.updateRoomProps({ anchorPoints: anchors.value.map((p) => ({ ...p })) });
}

async function updateInteract() {
  const normalized = normalizeInteractConfig({
    capacity: fields.value.interactCapacity,
    durationMin: fields.value.interactDurationMin,
    durationMax: fields.value.interactDurationMax,
  });
  fields.value.interactDurationMin = normalized?.durationMin ?? 1;
  fields.value.interactDurationMax = normalized?.durationMax ?? 3;
  await store.updateRoomProps({ interact: normalized });
}

async function addAnchor() {
  anchors.value.push({ x: fields.value.w / 2, y: fields.value.h / 2 });
  await updateAnchors();
}

async function removeAnchor(index: number) {
  anchors.value.splice(index, 1);
  await updateAnchors();
}

async function clearFillColor() {
  fields.value.fillColor = "";
  await store.updateRoomProps({ fillColor: undefined });
}

async function saveAsTemplate() {
  const name = await prompt({
    title: "Save room template",
    message: "Template name:",
    confirmLabel: "Save",
    cancelLabel: "Cancel",
    prompt: props.room.label || "Room Template",
    promptPlaceholder: "Template name",
  });
  if (!name) return;
  await store.addRoomTemplate(props.room, name);
  useToast().success("Room template saved");
}

async function saveRoomWithObjects() {
  const name = await prompt({
    title: "Save room + objects template",
    message: "Template name (room + objects):",
    confirmLabel: "Save",
    cancelLabel: "Cancel",
    prompt: props.room.label || "Room Template",
    promptPlaceholder: "Template name",
  });
  if (!name) return;
  await store.addRoomTemplate(props.room, name);
  useToast().success("Room + objects template saved");
}

async function onSave() {
  await run(() => store.saveLayout());
  useToast().success("Properties saved");
}

async function remove() {
  await run(() => store.deleteSelected());
}
</script>

<template>
  <div class="properties__content">
    <div class="properties__section">
      <div class="properties__title">Room</div>
      <div class="properties__row">
        <label>ID</label>
        <div class="properties__idrow">
          <input type="text" :value="room.id" disabled class="input input__readonly" title="Room ID" />
          <button class="btn__sm" @click="copyId(room.id)">Copy</button>
        </div>
      </div>
      <div class="properties__row">
        <label>X</label>
        <input class="input" type="number" v-model.number="fields.x" :class="{ input__error: errorFields.x }" @change="commitField('x')" />
      </div>
      <div class="properties__row">
        <label>Y</label>
        <input class="input" type="number" v-model.number="fields.y" :class="{ input__error: errorFields.y }" @change="commitField('y')" />
      </div>
      <div class="properties__row">
        <label>Width</label>
        <input class="input" type="number" v-model.number="fields.w" :class="{ input__error: errorFields.w }" @change="commitField('w')" />
      </div>
      <div class="properties__row">
        <label>Height</label>
        <input class="input" type="number" v-model.number="fields.h" :class="{ input__error: errorFields.h }" @change="commitField('h')" />
      </div>
      <div class="properties__row">
        <label>Label</label>
        <input class="input" type="text" v-model="fields.label" @change="commitField('label')" />
      </div>
      <div class="properties__row">
        <label>Category</label>
        <select class="input" v-model="fields.category" @change="commitField('category')">
          <option value="">— Select —</option>
          <option value="public">Public</option>
          <option value="service">Service</option>
          <option value="back">Back</option>
          <option value="security">Security</option>
          <option value="utility">Utility</option>
          <option value="open">Open</option>
        </select>
      </div>
      <div class="properties__row">
        <label>Room Type</label>
        <select class="input" v-model="fields.roomType" @change="onRoomTypeChange">
          <option value="room">Room</option>
          <option value="hallway">Hallway</option>
          <option value="elevator">Elevator</option>
          <option value="entrance">Entrance</option>
          <option value="wall">Wall</option>
          <optgroup label="Public">
            <option value="reception">Reception</option>
            <option value="lounge">Lounge</option>
            <option value="concierge">Concierge</option>
            <option value="bar">Bar</option>
            <option value="guestRoom">Guest Room</option>
          </optgroup>
          <optgroup label="Service">
            <option value="kitchen">Kitchen</option>
            <option value="laundry">Laundry</option>
            <option value="staffRoom">Staff Room</option>
            <option value="loadingBay">Loading Bay</option>
          </optgroup>
          <optgroup label="Security">
            <option value="armory">Armory</option>
            <option value="safeHouse">Safe House</option>
            <option value="controlCenter">Control Center</option>
            <option value="datacenter">Datacenter</option>
            <option value="vault">Vault</option>
            <option value="blackMarket">Black Market</option>
          </optgroup>
          <optgroup label="Special">
            <option value="rooftop">Rooftop</option>
          </optgroup>
        </select>
      </div>
      <div class="properties__row">
        <label>NPC Tags</label>
        <TagPicker :model-value="roomTags" @update:model-value="saveRoomTags" placeholder="rest, service, target" />
      </div>
      <div class="properties__row">
        <label>Walkable</label>
        <label class="properties__rxsync"> <input type="checkbox" v-model="fields.walkable" @change="onWalkableToggle" /> NPC can walk here </label>
      </div>
      <div class="properties__section">
        <div class="properties__title">NPC Navigation</div>
        <div class="properties__row">
          <label>Anchors</label>
          <button class="btn__sm" @click="addAnchor">+ Add</button>
        </div>
        <div v-if="invalidAnchorCount > 0" class="properties__warning">{{ invalidAnchorCount }} anchor(s) are blocked or outside the room.</div>
        <div v-for="(anchor, index) in anchors" :key="`anchor-${index}`" class="properties__row">
          <label>#{{ index + 1 }}</label>
          <div class="properties__idrow">
            <input class="input" type="number" min="0" :max="fields.w" v-model.number="anchor.x" @change="updateAnchors" />
            <input class="input" type="number" min="0" :max="fields.h" v-model.number="anchor.y" @change="updateAnchors" />
            <button class="btn__sm" @click="removeAnchor(index)">×</button>
          </div>
        </div>
        <div class="properties__row">
          <label>Interact Capacity</label>
          <input class="input" type="number" min="0" v-model.number="fields.interactCapacity" @change="updateInteract" />
        </div>
        <div class="properties__row">
          <label>Interact Duration (sec)</label>
          <div class="properties__idrow">
            <input class="input" type="number" min="0" step="0.1" v-model.number="fields.interactDurationMin" @change="updateInteract" />
            <input class="input" type="number" min="0" step="0.1" v-model.number="fields.interactDurationMax" @change="updateInteract" />
          </div>
        </div>
        <div class="properties__hint">Capacity 0 uses the number of anchors. Duration is random in seconds.</div>
        <div class="properties__row">
          <label>Entrances</label>
          <button class="btn__sm" @click="addEntrance">+ Add</button>
        </div>
        <div v-for="(entrance, index) in entrances" :key="`entrance-${index}`" class="properties__row">
          <label>#{{ index + 1 }}</label>
          <div class="properties__idrow">
            <select class="input" v-model="entrance.side" @change="updateEntrances">
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
            <input class="input" type="number" min="0" v-model.number="entrance.offset" @change="updateEntrances" />
            <input class="input" type="number" min="1" v-model.number="entrance.width" @change="updateEntrances" />
            <button class="btn__sm" @click="removeEntrance(index)">×</button>
          </div>
        </div>
      </div>
      <div class="properties__row">
        <label>Radius</label>
        <input class="input" type="number" min="0" v-model.number="fields.radius" @change="commitField('radius')" />
      </div>
      <div class="properties__row">
        <label>Padding</label>
        <input class="input" type="number" min="0" v-model.number="fields.padding" @change="commitField('padding')" />
      </div>
      <div class="properties__row">
        <label>Corner Radius</label>
        <div class="properties__rxgrid">
          <div class="properties__rxcorner">
            <span class="properties__rxlabel">↖ TL</span>
            <input type="number" min="0" v-model.number="fields.rxTL" @input="onRxInput('rxTL')" class="input input__compact" />
          </div>
          <div class="properties__rxcorner">
            <span class="properties__rxlabel">TR ↗</span>
            <input type="number" min="0" v-model.number="fields.rxTR" @input="onRxInput('rxTR')" class="input input__compact" />
          </div>
          <div class="properties__rxcorner">
            <span class="properties__rxlabel">↙ BL</span>
            <input type="number" min="0" v-model.number="fields.rxBL" @input="onRxInput('rxBL')" class="input input__compact" />
          </div>
          <div class="properties__rxcorner">
            <span class="properties__rxlabel">BR ↘</span>
            <input type="number" min="0" v-model.number="fields.rxBR" @input="onRxInput('rxBR')" class="input input__compact" />
          </div>
        </div>
      </div>
      <div class="properties__row">
        <label></label>
        <button type="button" class="properties__rxsync" :class="{ properties__rxsync__active: rxSync }" :aria-pressed="rxSync" :title="rxSync ? 'Sync all corners — ON' : 'Sync all corners — OFF'" @click="rxSync = !rxSync">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </button>
      </div>
      <div class="properties__row">
        <label>Fill Color</label>
        <div class="properties__colorrow">
          <input class="input" v-model="fields.fillColor" placeholder="#RRGGBB" aria-label="Room fill color hex value" @change="commitField('fillColor')" />
          <button class="btn__sm" @click="clearFillColor">Reset</button>
        </div>
      </div>
      <div class="properties__btngroup">
        <button @click="saveAsTemplate">Save as Template</button>
        <button @click="saveRoomWithObjects">Save Room + Objects</button>
      </div>
      <div class="properties__actions">
        <button class="btn__success" :disabled="pending" @click="onSave">Save</button>
        <button
          :disabled="pending"
          @click="
            store.select(null);
            store.selectAsset(null);
          "
        >
          Deselect
        </button>
        <button class="btn__danger" :disabled="pending" @click="remove">Delete</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.properties__warning {
  font-size: var(--font-xs);
  color: var(--accent-red);
  padding: var(--gap-xs) var(--gap-sm);
  background: color-mix(in srgb, var(--accent-red) 8%, transparent);
  border-radius: var(--radius-sm);
}
</style>
