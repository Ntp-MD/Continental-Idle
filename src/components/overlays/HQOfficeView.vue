<script setup lang="ts">
import { ref, shallowRef, onMounted, onUnmounted, nextTick, markRaw, computed } from "vue";
import { gameState } from "@/engine/gameState";
import { getBranchDef } from "@/data/branches";
import { BUILDINGS } from "@/data/buildings";
import { STAFF_MAP } from "@/data/staff";
import { ASSASSIN_MAP } from "@/data/assassins";
import { getAIOwner } from "@/engine/aiOwnerManager";
import { getVisitors, callVisitor, royalMarkScroll, hireVisitor, dismissVisitor, canCallVisitor, canUseRoyalMarkScroll } from "@/engine/visitorManager";
import { fireStaff } from "@/engine/staffManager";
import { fireAssassin } from "@/engine/assassinManager";
import { eventBus } from "@/engine/eventBus";
import type { FloorId, VisitorEntry } from "@/types";

import HQRoomLayer from "./hqRoomLayer.vue";
import HQFalloutView from "./hqFalloutView.vue";
import HQNpcLayer from "./hqNpcLayer.vue";
import type { NpcDot } from "./hqNpcLayer.vue";
import HQVisitorCard from "./hqVisitorCard.vue";
import HQToolbar from "./hqToolbar.vue";
import HQFloorSelector from "./hqFloorSelector.vue";
import { SVG_W, SVG_H, FLOOR_IDS, FLOOR_LAYOUT, FLOOR_OBJECTS, FLOOR_ALLOWED_ROLES, FLOOR_DEFAULT_WALKABLE, SYNCED_CANVAS, getRoomsOnFloor, ROOM_ANCHORS, STAFF_COLORS, ASSASSIN_COLORS, GUEST_COLORS, isFloorUnlocked, applySyncedLayout, SYNCED_NPC_CONFIG } from "./hqLayout";
import type { SyncedLayoutData } from "./hqLayout";
import { NpcEngine, findNpcGridPath, selectBestTarget, NPC_ENGINE_TICKS_PER_SECOND, NPC_ENGINE_DEFAULT_AGENT_CLEARANCE, getRoomTags, type NpcEngineLayout, type NpcEnginePoint, type NpcEngineInteractionTarget } from "@/engine/npc";
import { resolveInteractForTarget, type NpcRole, type NpcSimulationConfig } from "@/blueprint-editor/types";
import { getGuestCount } from "@/engine/guestManager";

const props = defineProps<{ inline?: boolean }>();
const emit = defineEmits<{ close: [] }>();

const viewMode = ref<"birdseye" | "fallout">("birdseye");
const showLabels = ref(true);
const selectedFloor = ref<FloorId>("1");
const selectedNpcId = ref<string | null>(null);
const selectedVisitor = ref<VisitorEntry | null>(null);
const visitors = ref<VisitorEntry[]>([]);

const hqName = ref("");
const hqOwner = ref("");

const staffDots = shallowRef<NpcDot[]>([]);
const assassinDots = shallowRef<NpcDot[]>([]);
const guestDots = shallowRef<NpcDot[]>([]);
const visitorDots = shallowRef<NpcDot[]>([]);

let rafId: number | null = null;
let npcEngine: NpcEngine | null = null;
const runtimeTargetLastSelectedTick = new Map<string, number>();

interface AnimDot {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  pathIdx: number;
  path: [number, number][];
  pauseTimer: number;
  floor: FloorId;

  roleId?: string;

  focusRoom?: string;
}

const animStaff = ref<AnimDot[]>([]);
const animAssassins = ref<AnimDot[]>([]);
const animGuests = ref<AnimDot[]>([]);

const syncedNpcConfig = computed(() => SYNCED_NPC_CONFIG.value);

function floorIdFromLabel(label: string): FloorId | null {
  if (label === "G") return "G";
  const m = label.match(/^F(\d+)$/);
  return m ? String(Number(m[1])) : null;
}

function findRoomsByTags(tags: string[], floorLabels?: string[]): { floorId: FloorId; roomId: string }[] {
  if (tags.length === 0) return [];
  const targetFloors = floorLabels && floorLabels.length > 0 ? floorLabels.map(floorIdFromLabel).filter((f): f is FloorId => f !== null) : FLOOR_IDS.slice();
  const result: { floorId: FloorId; roomId: string }[] = [];
  for (const floorId of targetFloors) {
    for (const room of getRoomsOnFloor(floorId)) {
      const roomTags = (room as { tags?: string[] }).tags ?? [];
      if (roomTags.some((t) => tags.includes(t))) {
        result.push({ floorId, roomId: room.id });
      }
    }
  }
  return result;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function resolveSpawnTargets(rule: { floorLabels?: string[]; roomTags?: string[] } | undefined): { floorId: FloorId; roomId: string }[] {
  if (!rule) {
    const all: { floorId: FloorId; roomId: string }[] = [];
    for (const f of FLOOR_IDS) {
      for (const r of getRoomsOnFloor(f)) all.push({ floorId: f, roomId: r.id });
    }
    return all;
  }
  const tagMatches = findRoomsByTags(rule.roomTags ?? [], rule.floorLabels);
  if (tagMatches.length > 0) return tagMatches;

  const floors = (rule.floorLabels ?? []).map(floorIdFromLabel).filter((f): f is FloorId => f !== null);
  const fallback: { floorId: FloorId; roomId: string }[] = [];
  for (const f of floors.length > 0 ? floors : FLOOR_IDS) {
    for (const r of getRoomsOnFloor(f)) fallback.push({ floorId: f, roomId: r.id });
  }
  return fallback;
}

const hqBranchState = computed(() => {
  const state = gameState.get();
  return state.branches[state.hqBranch];
});

const buildingLevels = computed(() => {
  const branch = hqBranchState.value;
  if (!branch) return {} as Record<string, number>;
  const levels: Record<string, number> = {};
  BUILDINGS.forEach((b) => {
    levels[b.id] = branch.buildings[b.id]?.level || 0;
  });
  return levels;
});

const buildingsUnlocked = computed(() => {
  const branch = hqBranchState.value;
  if (!branch) return {} as Record<string, { level: number; unlocked: boolean }>;
  const result: Record<string, { level: number; unlocked: boolean }> = {};
  BUILDINGS.forEach((b) => {
    result[b.id] = branch.buildings[b.id] || { level: 0, unlocked: false };
  });
  return result;
});

const goldenCoins = computed(() => gameState.get().goldenCoins);
const royalMarks = computed(() => gameState.get().royalMarks);
const branchCurrency = computed(() => hqBranchState.value?.currency || 0);

const npcDotsByFloor = shallowRef<Record<FloorId, { x: number; y: number; color: string }[]>>({} as Record<FloorId, { x: number; y: number; color: string }[]>);
let sidebarUpdateTimer: number | null = null;

function updateSidebarDots(): void {
  const result = {} as Record<FloorId, { x: number; y: number; color: string }[]>;
  FLOOR_IDS.forEach((f) => {
    result[f] = [];
  });
  const allDots: { x: number; y: number; color: string; floor: FloorId }[] = [...staffDots.value.map((d) => ({ x: d.x, y: d.y, color: d.color, floor: (d.floor as FloorId) || "1" })), ...assassinDots.value.map((d) => ({ x: d.x, y: d.y, color: d.color, floor: (d.floor as FloorId) || "1" })), ...guestDots.value.map((d) => ({ x: d.x, y: d.y, color: d.color, floor: (d.floor as FloorId) || "1" }))];
  allDots.forEach((d) => {
    if (result[d.floor]) {
      result[d.floor].push({ x: d.x, y: d.y, color: d.color });
    }
  });
  if (selectedFloor.value === "1") {
    visitorDots.value.forEach((d) => {
      result["1"].push({ x: d.x, y: d.y, color: d.color });
    });
  }
  npcDotsByFloor.value = result;
}

function randAnchor(floor: FloorId, roomId: string): [number, number] {
  const anchors = ROOM_ANCHORS[floor]?.[roomId];
  if (anchors && anchors.length > 0) return anchors[Math.floor(Math.random() * anchors.length)];
  const room = getRoomsOnFloor(floor).find((item) => item.id === roomId);
  if (room) return [room.x + room.w / 2, room.y + room.h / 2];
  return [SVG_W / 2, SVG_H / 2];
}

function saveNpcPositions(): void {
  const state = gameState.get();
  const branch = state.branches[state.hqBranch];
  if (!branch) return;
  const positions = branch.npcPositions;
  staffDots.value.forEach((d) => {
    positions[d.id] = { x: d.x, y: d.y, floor: (d.floor as FloorId) || "1" };
  });
  assassinDots.value.forEach((d) => {
    positions[d.id] = { x: d.x, y: d.y, floor: (d.floor as FloorId) || "9" };
  });
}

function restorePosition(id: string): { x: number; y: number; floor: FloorId } | null {
  const branch = gameState.get().branches[gameState.get().hqBranch];
  if (!branch) return null;
  const saved = branch.npcPositions[id];
  if (!saved) return null;
  return { x: saved.x, y: saved.y, floor: saved.floor };
}

function findRole(roleId: string) {
  return syncedNpcConfig.value?.roles.find((r) => r.id === roleId);
}

function resolveStaffSpawn(staff: { id: string; typeId: string; assignedTo: string | null }): {
  floor: FloorId;
  roomId: string;
  speedMul: number;
} {
  const role = findRole(staff.typeId);
  const targets = resolveSpawnTargets(role?.spawnRule);
  if (staff.assignedTo) {
    const tagMatch = findRoomsByTags([staff.assignedTo]);
    if (tagMatch.length > 0) {
      const t = pick(tagMatch);
      return { floor: t.floorId, roomId: t.roomId, speedMul: role?.spawnRule?.speedMultiplier ?? 1 };
    }
  }
  if (targets.length > 0) {
    const t = pick(targets);
    return { floor: t.floorId, roomId: t.roomId, speedMul: role?.spawnRule?.speedMultiplier ?? 1 };
  }
  return { floor: "1", roomId: "reception", speedMul: 1 };
}

function initStaff(): void {
  const state = gameState.get();
  const branch = state.branches[state.hqBranch];
  if (!branch) return;

  const dots: NpcDot[] = [];
  const anims: AnimDot[] = [];

  Object.values(branch.staff).forEach((staff) => {
    const def = STAFF_MAP[staff.typeId];
    if (!def) return;

    const spawn = resolveStaffSpawn(staff);
    const saved = restorePosition(staff.id);
    const x = saved?.x ?? randAnchor(spawn.floor, spawn.roomId)[0];
    const y = saved?.y ?? randAnchor(spawn.floor, spawn.roomId)[1];
    const useFloor = saved?.floor ?? spawn.floor;

    dots.push({
      id: staff.id,
      x,
      y,
      color: STAFF_COLORS[staff.typeId] || "#aaa",
      name: def.name,
      profession: def.name,
      level: staff.level,
      rarity: staff.rarity,
      floor: useFloor,
    });
    anims.push({
      id: staff.id,
      x,
      y,
      targetX: x,
      targetY: y,
      speed: (0.2 + Math.random() * 0.3) * spawn.speedMul,
      pathIdx: 0,
      path: [],
      pauseTimer: Math.floor(Math.random() * 80),
      floor: useFloor,
      roleId: findRole(staff.typeId)?.id ?? syncedNpcConfig.value?.defaultRoleId,
      focusRoom: staff.assignedTo || undefined,
    });
  });

  anims.forEach((a) => markRaw(a));
  staffDots.value = dots;
  animStaff.value = anims;
}

function initAssassins(): void {
  const state = gameState.get();
  const branch = state.branches[state.hqBranch];
  if (!branch) return;

  const dots: NpcDot[] = [];
  const anims: AnimDot[] = [];

  Object.values(branch.assassins).forEach((assassin) => {
    const def = ASSASSIN_MAP[assassin.typeId];
    if (!def) return;

    const role = findRole(assassin.typeId);
    const targets = resolveSpawnTargets(role?.spawnRule);
    const spawn = targets.length > 0 ? pick(targets) : { floorId: "9" as FloorId, roomId: "armory" };
    const saved = restorePosition(assassin.id);
    const x = saved?.x ?? randAnchor(spawn.floorId, spawn.roomId)[0];
    const y = saved?.y ?? randAnchor(spawn.floorId, spawn.roomId)[1];
    const useFloor = saved?.floor ?? spawn.floorId;
    const speedMul = role?.spawnRule?.speedMultiplier ?? 1.2;

    dots.push({
      id: assassin.id,
      x,
      y,
      color: ASSASSIN_COLORS[assassin.typeId] || "#ff1744",
      name: def.name,
      profession: def.name,
      level: assassin.level,
      rarity: assassin.rarity,
      floor: useFloor,
    });
    anims.push({
      id: assassin.id,
      x,
      y,
      targetX: x,
      targetY: y,
      speed: (0.3 + Math.random() * 0.4) * speedMul,
      pathIdx: 0,
      path: [],
      pauseTimer: Math.floor(Math.random() * 60),
      floor: useFloor,
    });
  });

  anims.forEach((a) => markRaw(a));
  assassinDots.value = dots;
  animAssassins.value = anims;
}

function initGuests(): void {
  const dots: NpcDot[] = [];
  const anims: AnimDot[] = [];

  const PATRON_NAMES = ["Mr. Smith", "Ms. Chen", "Mr. Volkov", "Ms. Dubois", "Mr. Okafor", "Ms. Rossi", "Mr. Lindqvist", "Ms. Yamamoto", "Mr. Reyes", "Ms. Novak", "Mr. Almasi", "Ms. Park"];
  const state = gameState.get();
  const totalGuests = Math.max(8, getGuestCount(state.hqBranch));

  const allTargets: { floorId: FloorId; roomId: string }[] = [];
  for (const f of FLOOR_IDS) {
    if (!isFloorUnlocked(f, buildingsUnlocked.value)) continue;
    for (const r of getRoomsOnFloor(f)) allTargets.push({ floorId: f, roomId: r.id });
  }
  const floors = allTargets.length > 0 ? allTargets : [{ floorId: "1" as FloorId, roomId: "reception" }];

  for (let i = 0; i < totalGuests; i++) {
    const t = pick(floors);
    const floor = t.floorId;
    const [x, y] = randAnchor(floor, t.roomId);

    dots.push({
      id: "guest_" + i,
      x,
      y,
      color: GUEST_COLORS[i % GUEST_COLORS.length],
      name: i < PATRON_NAMES.length ? PATRON_NAMES[i] : "Guest",
      profession: i < PATRON_NAMES.length ? "Patron" : "Visitor",
      level: 1,
      rarity: "C",
      floor,
    });
    anims.push({
      id: "guest_" + i,
      x,
      y,
      targetX: x,
      targetY: y,
      speed: 0.15 + Math.random() * 0.35,
      pathIdx: 0,
      path: [],
      pauseTimer: Math.floor(Math.random() * 60),
      floor,
    });
  }

  initAmbientPatrons(dots, anims);

  anims.forEach((a) => markRaw(a));
  guestDots.value = dots;
  animGuests.value = anims;
}

function initAmbientPatrons(dots: NpcDot[], anims: AnimDot[]): void {
  const AMBIENT_NAMES = ["Mr. Watanabe", "Ms. Costa", "Mr. Petrov", "Ms. Adebayo", "Mr. Kowalski", "Ms. Nakamura", "Mr. Fontaine", "Ms. Eriksson"];

  const questRole = findRole("quest");
  const targets = resolveSpawnTargets(questRole?.spawnRule);
  const useTargets = targets.length > 0 ? targets.filter((t) => isFloorUnlocked(t.floorId, buildingsUnlocked.value)) : [];

  for (let i = 0; i < 8; i++) {
    if (useTargets.length === 0) break;
    const t = pick(useTargets);
    const [x, y] = randAnchor(t.floorId, t.roomId);

    dots.push({
      id: "ambient_" + i,
      x,
      y,
      color: GUEST_COLORS[(i + 2) % GUEST_COLORS.length],
      name: AMBIENT_NAMES[i % AMBIENT_NAMES.length],
      profession: "Patron",
      level: 1,
      rarity: "D",
      floor: t.floorId,
    });
    anims.push({
      id: "ambient_" + i,
      x,
      y,
      targetX: x,
      targetY: y,
      speed: 0.1 + Math.random() * 0.25,
      pathIdx: 0,
      path: [],
      pauseTimer: Math.floor(Math.random() * 100),
      floor: t.floorId,
    });
  }
}

function initVisitors(): void {
  visitors.value = getVisitors();

  const receptionMatches = findRoomsByTags(["reception"]);
  const spawn = receptionMatches.length > 0 ? receptionMatches[0] : { floorId: "1" as FloorId, roomId: "reception" };
  const anchors = ROOM_ANCHORS[spawn.floorId]?.[spawn.roomId] || [[600, 300] as [number, number]];
  const dots: NpcDot[] = visitors.value.map((v, i) => {
    const def = v.isAssassin ? ASSASSIN_MAP[v.typeId] : STAFF_MAP[v.typeId];
    const [x, y] = anchors[i % anchors.length];
    return {
      id: v.id,
      x,
      y,
      color: v.isAssassin ? ASSASSIN_COLORS[v.typeId] || "#ff1744" : STAFF_COLORS[v.typeId] || "#aaa",
      name: def?.name || v.typeId,
      profession: v.isAssassin ? "Assassin" : "Staff",
      level: 1,
      rarity: v.rarity,
      isVisitor: true,
      floor: spawn.floorId,
    };
  });
  visitorDots.value = dots;
}

function runtimePortalEndpointKey(floorId: string, itemId: string, anchorIndex: number): string {
  return `${floorId}:${itemId}:endpoint:${anchorIndex}`;
}

function findNearestWalkableCell(walkable: Set<string>, x: number, y: number, radius: number): [number, number] | null {
  for (let r = 1; r <= radius; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        const nx = x + dx,
          ny = y + dy;
        if (walkable.has(`${nx},${ny}`)) return [nx, ny];
      }
    }
  }
  return null;
}

function runtimeFocusTags(config: NpcSimulationConfig | null, role: NpcRole | undefined): string[] {
  if (!role) return [];
  const tags = new Set<string>(role.focusTags);
  for (const taskId of role.taskIds) {
    for (const tag of config?.tasks.find((t) => t.id === taskId)?.tags ?? []) tags.add(tag);
  }
  return [...tags];
}

function buildRuntimeEngineFloors(): NpcEngineLayout["floors"] {
  const tileSize = Math.max(1, SYNCED_CANVAS.tileSize);
  const width = Math.max(1, Math.ceil(SYNCED_CANVAS.width / tileSize));
  const height = Math.max(1, Math.ceil(SYNCED_CANVAS.height / tileSize));
  return FLOOR_IDS.map((id) => {
    const rooms = FLOOR_LAYOUT[id] ?? [];
    const objects = FLOOR_OBJECTS[id] ?? [];
    const walkable: NpcEnginePoint[] = [];
    const blockedEdges: { from: NpcEnginePoint; to: NpcEnginePoint }[] = [];
    const cellIsWalkable = (x: number, y: number): boolean => {
      const px = (x + 0.5) * tileSize;
      const py = (y + 0.5) * tileSize;
      const room = rooms.find((item) => px >= item.x && px < item.x + item.w && py >= item.y && py < item.y + item.h);
      if (room?.walkable === false) return false;
      for (const object of objects) {
        if (px < object.x || px >= object.x + object.w || py < object.y || py >= object.y + object.h) continue;
        const localX = Math.max(0, Math.min(object.w - 0.001, px - object.x));
        const localY = Math.max(0, Math.min(object.h - 0.001, py - object.y));
        const rows = object.tileStates?.length ?? object.walkableGrid?.length ?? 0;
        const cols = rows > 0 ? (object.tileStates?.[0]?.length ?? object.walkableGrid?.[0]?.length ?? 0) : 0;
        if (rows > 0 && cols > 0) {
          const row = Math.min(rows - 1, Math.floor((localY * rows) / object.h));
          const col = Math.min(cols - 1, Math.floor((localX * cols) / object.w));
          if (object.tileStates?.[row]?.[col] === "entrance") continue;
          if (object.tileStates?.[row]?.[col] === "blocked" || object.walkableGrid?.[row]?.[col] === false) return false;
        }
        if (object.walkable === false) return false;
      }
      return FLOOR_DEFAULT_WALKABLE[id] ?? true;
    };
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (cellIsWalkable(x, y)) walkable.push({ x, y });
    for (const object of objects) {
      const edges = object.tileEdges ?? [];
      for (let row = 0; row < edges.length; row++)
        for (let col = 0; col < (edges[row]?.length ?? 0); col++) {
          const edge = edges[row]?.[col];
          const x = Math.floor((object.x + ((col + 0.5) * object.w) / Math.max(1, edges[row].length)) / tileSize);
          const y = Math.floor((object.y + ((row + 0.5) * object.h) / Math.max(1, edges.length)) / tileSize);
          if (edge?.right) blockedEdges.push({ from: { x, y }, to: { x: x + 1, y } });
          if (edge?.bottom) blockedEdges.push({ from: { x, y }, to: { x, y: y + 1 } });
        }
    }
    return { id, width, height, tileSize, walkable, blockedEdges, allowedRoleIds: FLOOR_ALLOWED_ROLES[id] };
  });
}

function rebuildNpcEngine(): void {
  const focusRooms = new Map<string, string>();
  const allAnims = [...animStaff.value, ...animAssassins.value, ...animGuests.value];
  const floors = buildRuntimeEngineFloors();
  const tileSize = Math.max(1, SYNCED_CANVAS.tileSize);
  const roomTargets = FLOOR_IDS.flatMap((floorId) =>
    (FLOOR_LAYOUT[floorId] ?? []).flatMap((room) => {
      const anchors = ROOM_ANCHORS[floorId]?.[room.id] ?? [[room.x + room.w / 2, room.y + room.h / 2]];
      const resolved = resolveInteractForTarget(room.interact, anchors.length);
      return anchors.map(([x, y], index) => ({
        floorId,
        itemId: `room:${room.id}`,
        anchorId: `anchor-${index}`,
        x: x / tileSize,
        y: y / tileSize,
        tags: getRoomTags(room.roomType, room.tags),
        capacity: resolved.capacity,
        durationMinSeconds: resolved.durationMinSeconds,
        durationMaxSeconds: resolved.durationMaxSeconds,
      }));
    }),
  );

  const objectTargets = FLOOR_IDS.flatMap((floorId) =>
    (FLOOR_OBJECTS[floorId] ?? []).flatMap((object) => {
      if (object.tags?.includes("portal")) return [];
      const anchors = object.anchorPoints ?? [];
      const resolved = resolveInteractForTarget(object.interact, anchors.length);
      return anchors.map((anchor, index) => ({
        floorId,
        itemId: `object:${object.id}`,
        anchorId: `anchor-${index}`,
        x: (object.x + anchor.x) / tileSize,
        y: (object.y + anchor.y) / tileSize,
        tags: object.tags ?? [],
        capacity: resolved.capacity,
        durationMinSeconds: resolved.durationMinSeconds,
        durationMaxSeconds: resolved.durationMaxSeconds,
      }));
    }),
  );

  const walkableSetByFloor = new Map<string, Set<string>>();
  for (const floor of floors) {
    const set = new Set<string>();
    for (const p of floor.walkable) set.add(`${p.x},${p.y}`);
    walkableSetByFloor.set(floor.id, set);
  }
  const portalsByFloor = new Map<string, (typeof FLOOR_OBJECTS)[FloorId]>();
  for (const floorId of FLOOR_IDS) {
    const portals = (FLOOR_OBJECTS[floorId] ?? []).filter((o) => o.tags?.includes("portal"));
    if (portals.length) portalsByFloor.set(floorId, portals);
  }
  const portalFloorIds = new Set(portalsByFloor.keys());
  const portalTargets: NpcEngineInteractionTarget[] = [];
  for (const [floorId, portals] of portalsByFloor) {
    const walkable = walkableSetByFloor.get(floorId);
    if (!walkable) continue;
    const otherPortalFloors = [...portalFloorIds].filter((id) => id !== floorId);
    for (const object of portals) {
      const anchors = object.anchorPoints ?? [];
      if (!anchors.length) continue;
      anchors.forEach((anchor, anchorIdx) => {
        const rawX = Math.floor((object.x + anchor.x) / tileSize);
        const rawY = Math.floor((object.y + anchor.y) / tileSize);
        const snapped = walkable.has(`${rawX},${rawY}`) ? ([rawX, rawY] as [number, number]) : findNearestWalkableCell(walkable, rawX, rawY, 5);
        if (!snapped) return;
        const [cellX, cellY] = snapped;
        const endpointKey = runtimePortalEndpointKey(floorId, `portal:${object.id}`, anchorIdx);
        for (const destFloorId of otherPortalFloors) {
          const destPortal = portalsByFloor.get(destFloorId)?.[0];
          if (!destPortal) continue;
          const destEndpointKey = runtimePortalEndpointKey(destFloorId, `portal:${destPortal.id}`, anchorIdx);
          portalTargets.push({
            floorId,
            itemId: `portal:${object.id}`,
            anchorId: `portal:${anchorIdx}→${destFloorId}`,
            x: cellX + 0.5,
            y: cellY + 0.5,
            tags: ["portal", `portal:${destFloorId}`],
            capacity: 1,
            durationMinSeconds: 0,
            durationMaxSeconds: 0,
            transitionToFloorId: destFloorId,
            destinationPortalKey: destEndpointKey,
            portalEndpointKey: endpointKey,
          });
        }
      });
    }
  }
  const interactionTargets = [...roomTargets, ...objectTargets, ...portalTargets];
  const layout: NpcEngineLayout = { floors, interactionTargets };
  const config = syncedNpcConfig.value;
  npcEngine = new NpcEngine(layout, {
    ticksPerSecond: NPC_ENGINE_TICKS_PER_SECOND,
    agentClearance: NPC_ENGINE_DEFAULT_AGENT_CLEARANCE * (6 / tileSize),
    pathfinder: (floor, from, to, blockedCells) => findNpcGridPath(floor, from, to, blockedCells),
    targetSelector: (agent, targets) => {
      const focusRoom = focusRooms.get(agent.id);
      const preferred = focusRoom ? targets.filter((target) => target.itemId === `room:${focusRoom}`) : targets;
      const candidates = preferred.length > 0 ? preferred : targets;
      if (candidates.length === 0) return null;
      const selected = selectBestTarget({ agent, targets: candidates, currentTick: npcEngine!.tickNumber, targetLastSelectedTick: runtimeTargetLastSelectedTick });
      if (selected) runtimeTargetLastSelectedTick.set(`${selected.floorId}:${selected.itemId}:${selected.anchorId}`, npcEngine!.tickNumber);
      return selected;
    },
    crossFloorSelector: (agent, candidates, floorList) => {
      const role = config?.roles.find((r) => r.id === agent.roleId) ?? config?.roles.find((r) => r.id === config.defaultRoleId) ?? config?.roles[0];
      const tags = runtimeFocusTags(config, role);
      if (!tags.length) return null;
      const matching = candidates.filter((t) => (t.tags as readonly string[]).some((tag) => tags.includes(tag)));
      if (!matching.length) return null;

      const floorIds = floorList.map((f) => f.id);
      const currentIdx = floorIds.indexOf(agent.floorId);
      return matching.reduce((best, t) => {
        const dist = Math.abs(floorIds.indexOf(t.floorId) - currentIdx);
        const bestDist = Math.abs(floorIds.indexOf(best.floorId) - currentIdx);
        return dist < bestDist ? t : best;
      });
    },
  });
  for (const anim of allAnims) {
    if (anim.focusRoom) focusRooms.set(anim.id, anim.focusRoom);
    npcEngine.addAgent({
      id: anim.id,
      roleId: anim.roleId,
      floorId: anim.floor,
      x: anim.x / tileSize,
      y: anim.y / tileSize,
      targetX: anim.targetX / tileSize,
      targetY: anim.targetY / tileSize,
      speed: Math.max(0.01, (anim.speed * 60) / tileSize),
    });
  }
}

function syncEngineDots(): void {
  if (!npcEngine) return;
  const agents = new Map(npcEngine.getAgents().map((agent) => [agent.id, agent]));
  for (const [anims, dots] of [
    [animStaff.value, staffDots.value],
    [animAssassins.value, assassinDots.value],
    [animGuests.value, guestDots.value],
  ] as [AnimDot[], NpcDot[]][]) {
    for (let i = 0; i < anims.length; i++) {
      const agent = agents.get(anims[i].id);
      if (!agent) continue;
      anims[i].x = agent.x * SYNCED_CANVAS.tileSize;
      anims[i].y = agent.y * SYNCED_CANVAS.tileSize;
      anims[i].targetX = agent.targetX * SYNCED_CANVAS.tileSize;
      anims[i].targetY = agent.targetY * SYNCED_CANVAS.tileSize;
      if (dots[i]) {
        dots[i].x = agent.x;
        dots[i].y = agent.y;
        if (anims[i].focusRoom) dots[i].focused = agent.status === "interacting";
      }
    }
  }
}

function animate(): void {
  npcEngine?.tick(1);
  syncEngineDots();
  if (sidebarUpdateTimer === null) {
    sidebarUpdateTimer = window.setTimeout(() => {
      updateSidebarDots();
      sidebarUpdateTimer = null;
    }, 200);
  }
  rafId = requestAnimationFrame(animate);
}

function onNpcClick(dot: NpcDot): void {
  selectedNpcId.value = dot.id;
  if (dot.isVisitor) {
    const v = visitors.value.find((vis) => vis.id === dot.id);
    if (v) selectedVisitor.value = v;
  }
}

function onHireVisitor(visitorId: string): void {
  const state = gameState.get();
  if (hireVisitor(visitorId, state.hqBranch)) {
    initStaff();
    initAssassins();
    initVisitors();
    rebuildNpcEngine();
    selectedVisitor.value = null;
    selectedNpcId.value = null;
  }
}

function onDismissVisitor(visitorId: string): void {
  dismissVisitor(visitorId);
  initVisitors();
  selectedVisitor.value = null;
  selectedNpcId.value = null;
}

function onCallVisitor(): void {
  if (callVisitor()) initVisitors();
}
function onRoyalMarkScroll(): void {
  if (royalMarkScroll()) initVisitors();
}

function onFireStaff(staffId: string): void {
  const state = gameState.get();
  if (fireStaff(staffId, state.hqBranch)) {
    initStaff();
    rebuildNpcEngine();
    selectedNpcId.value = null;
  }
}

function onFireAssassin(assassinId: string): void {
  const state = gameState.get();
  if (fireAssassin(assassinId, state.hqBranch)) {
    initAssassins();
    rebuildNpcEngine();
    selectedNpcId.value = null;
  }
}

const selectedNpc = computed(() => {
  if (!selectedNpcId.value) return null;
  const sDot = staffDots.value.find((d) => d.id === selectedNpcId.value);
  if (sDot) {
    const staff = hqBranchState.value?.staff[selectedNpcId.value];
    return staff ? { type: "staff" as const, dot: sDot, data: staff } : null;
  }
  const aDot = assassinDots.value.find((d) => d.id === selectedNpcId.value);
  if (aDot) {
    const assassin = hqBranchState.value?.assassins[selectedNpcId.value];
    return assassin ? { type: "assassin" as const, dot: aDot, data: assassin } : null;
  }
  return null;
});

const currentFloorDots = computed(() => {
  const floor = selectedFloor.value;
  return [...staffDots.value.filter((d) => (d.floor as FloorId) === floor), ...assassinDots.value.filter((d) => (d.floor as FloorId) === floor), ...guestDots.value.filter((d) => (d.floor as FloorId) === floor), ...visitorDots.value.filter((d) => (d.floor as FloorId) === floor)];
});

const visitorFloor = computed<FloorId>(() => {
  const m = findRoomsByTags(["reception"]);
  return m.length > 0 ? m[0].floorId : "1";
});

const floorUnlocked = computed(() => isFloorUnlocked(selectedFloor.value, buildingsUnlocked.value));

function refreshVisitors(): void {
  initVisitors();
}

function handleBlueprintSync(event: Event): void {
  const detail = event instanceof CustomEvent ? (event.detail as SyncedLayoutData) : undefined;
  applySyncedLayout(detail);
  initStaff();
  initAssassins();
  initGuests();
  initVisitors();
  rebuildNpcEngine();
  updateSidebarDots();
}

function handleVisibilityChange(): void {
  if (document.visibilityState === "hidden") {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  } else if (rafId === null) {
    rafId = requestAnimationFrame(animate);
  }
}

onMounted(() => {
  const state = gameState.get();
  const def = getBranchDef(state.hqBranch);
  hqName.value = def?.name || "HQ";
  const owner = getAIOwner(state.hqBranch);
  hqOwner.value = owner ? owner.name : "Unknown";
  initStaff();
  initAssassins();
  initGuests();
  initVisitors();
  updateSidebarDots();
  eventBus.on("visitor:arrived", refreshVisitors);
  eventBus.on("visitor:left", refreshVisitors);
  eventBus.on("visitor:hired", refreshVisitors);
  eventBus.on("visitor:dismissed", refreshVisitors);
  window.addEventListener("blueprint:sync", handleBlueprintSync);
  document.addEventListener("visibilitychange", handleVisibilityChange);
  nextTick(() => {
    rafId = requestAnimationFrame(animate);
  });
});

onUnmounted(() => {
  if (rafId !== null) cancelAnimationFrame(rafId);
  if (sidebarUpdateTimer !== null) {
    clearTimeout(sidebarUpdateTimer);
    sidebarUpdateTimer = null;
  }
  saveNpcPositions();
  eventBus.off("visitor:arrived", refreshVisitors);
  eventBus.off("visitor:left", refreshVisitors);
  eventBus.off("visitor:hired", refreshVisitors);
  eventBus.off("visitor:dismissed", refreshVisitors);
  window.removeEventListener("blueprint:sync", handleBlueprintSync);
  document.removeEventListener("visibilitychange", handleVisibilityChange);
});
</script>

<template>
  <div :class="props.inline ? 'hqoffice hqoffice__inline' : 'hqoffice hqoffice__overlay'" @click.self="!props.inline && emit('close')">
    <HQToolbar
      :view-mode="viewMode"
      :show-labels="showLabels"
      :golden-coins="goldenCoins"
      :royal-marks="royalMarks"
      :can-call-visitor="canCallVisitor()"
      :can-use-royal-mark="canUseRoyalMarkScroll()"
      :visitor-count="visitors.length"
      @toggle-view="viewMode = viewMode === 'birdseye' ? 'fallout' : 'birdseye'"
      @toggle-labels="showLabels = !showLabels"
      @call-visitor="onCallVisitor"
      @royal-mark-scroll="onRoyalMarkScroll"
    />
    <div class="hqoffice__content">
      <template v-if="viewMode === 'birdseye'">
        <div class="hqoffice__main">
          <svg :viewBox="`0 0 ${SVG_W} ${SVG_H}`" class="hqoffice__svg" preserveAspectRatio="xMidYMid meet">
            <HQRoomLayer :floor="selectedFloor" :unlocked="floorUnlocked" :building-levels="buildingLevels" />
            <HQNpcLayer v-if="floorUnlocked" :dots="currentFloorDots" :show-labels="showLabels" :selected-npc-id="selectedNpcId" @click="onNpcClick" />
          </svg>
        </div>
        <div class="hqoffice__sidebar">
          <HQFloorSelector :selected-floor="selectedFloor" :buildings="buildingsUnlocked" :npc-dots="npcDotsByFloor" @select="selectedFloor = $event" />
        </div>
      </template>
      <template v-else>
        <div class="hqoffice__fallout">
          <HQFalloutView
            :buildings="buildingsUnlocked"
            :npc-dots="npcDotsByFloor"
            :show-labels="showLabels"
            @select-floor="
              selectedFloor = $event;
              viewMode = 'birdseye';
            "
          />
        </div>
      </template>
    </div>
    <div v-if="visitors.length > 0 && selectedFloor === visitorFloor" class="hqoffice__visitors">
      <HQVisitorCard v-for="v in visitors" :key="v.id" :visitor="v" :branch-currency="branchCurrency" @hire="onHireVisitor" @dismiss="onDismissVisitor" />
    </div>
    <div v-if="selectedNpc && !selectedVisitor" class="hqoffice__npcpanel">
      <div class="hqoffice__statshead">
        <span>{{ selectedNpc.dot.name }} Lv.{{ selectedNpc.dot.level }}</span>
        <span class="hqoffice__rarity">{{ selectedNpc.dot.rarity }}</span>
        <button class="hqoffice__close" @click="selectedNpcId = null">×</button>
      </div>
      <div class="hqoffice__statsbody">
        <div class="hqoffice__statsrow">
          <span>PREC</span><b>{{ selectedNpc.data.stats.precision }}</b> <span>SPD</span><b>{{ selectedNpc.data.stats.speed }}</b>
        </div>
        <div class="hqoffice__statsrow">
          <span>CHA</span><b>{{ selectedNpc.data.stats.charisma }}</b> <span>LCK</span><b>{{ selectedNpc.data.stats.luck }}</b>
        </div>
        <div class="hqoffice__traits">Traits: {{ selectedNpc.data.traits.join(", ") || "—" }}</div>
        <button v-if="selectedNpc.type === 'staff'" class="hqoffice__firebtn" @click="onFireStaff(selectedNpc.data.id)">Fire Staff</button>
        <button v-else class="hqoffice__firebtn" @click="onFireAssassin(selectedNpc.data.id)">Fire Assassin</button>
      </div>
    </div>
    <div v-if="selectedVisitor" class="hqoffice__visitor">
      <HQVisitorCard :visitor="selectedVisitor" :branch-currency="branchCurrency" @hire="onHireVisitor" @dismiss="onDismissVisitor" />
      <button
        class="hqoffice__close"
        @click="
          selectedVisitor = null;
          selectedNpcId = null;
        "
      >
        ×
      </button>
    </div>
    <div v-if="props.inline" class="hqoffice__info">
      <span>{{ hqName }} — {{ hqOwner }}</span>
    </div>
  </div>
</template>

<style scoped>
.hqoffice {
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
  border: 1px solid var(--border-dim);
  border-radius: 6px;
  overflow: hidden;
}
.hqoffice__inline {
  min-height: 400px;
}
.hqoffice__overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: color-mix(in srgb, var(--bg-primary) 85%, transparent);
}
.hqoffice__content {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.hqoffice__main {
  flex: 1;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.hqoffice__svg {
  max-height: 600px;
}
.hqoffice__sidebar {
  width: 200px;
  flex-shrink: 0;
  overflow-y: auto;
  border-left: 1px solid var(--border-dim);
  padding: var(--gap-xs);
}
.hqoffice__fallout {
  flex: 1;
  overflow: auto;
  padding: var(--gap-sm);
}
.hqoffice__visitors {
  display: flex;
  gap: var(--gap-sm);
  padding: var(--gap-sm);
  flex-wrap: wrap;
  border-top: 1px solid var(--border-dim);
}
.hqoffice__npcpanel {
  position: absolute;
  right: 220px;
  top: 60px;
  background: var(--bg-secondary);
  border: 1px solid var(--accent-gold);
  border-radius: 6px;
  padding: 10px;
  min-width: 220px;
  z-index: 10;
}
.hqoffice__inline .hqoffice__npcpanel {
  position: relative;
  right: auto;
  top: auto;
  margin: var(--gap-xs);
}
.hqoffice__statshead {
  display: flex;
  align-items: center;
  gap: var(--gap-sm);
  border-bottom: 1px solid var(--border-dim);
  padding-bottom: 6px;
  margin-bottom: var(--gap-sm);
  font-family: Georgia, serif;
  color: var(--accent-gold);
  font-size: 13px;
}
.hqoffice__rarity {
  font-weight: bold;
  font-size: 14px;
}
.hqoffice__close {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
}
.hqoffice__statsbody {
  font-size: var(--font-sm);
  color: var(--text-secondary);
}
.hqoffice__statsrow {
  display: grid;
  grid-template-columns: auto auto auto auto;
  gap: 6px;
  margin-bottom: var(--gap-xs);
  align-items: center;
}
.hqoffice__statsrow span {
  color: var(--text-dim);
  font-size: 9px;
}
.hqoffice__statsrow b {
  color: var(--accent-gold);
}
.hqoffice__traits {
  font-size: var(--font-xs);
  color: var(--text-dim);
  margin: 6px 0;
}
.hqoffice__firebtn {
  width: 100%;
  background: color-mix(in srgb, var(--accent-red) 20%, var(--bg-primary));
  color: var(--accent-red);
  border: 1px solid color-mix(in srgb, var(--accent-red) 35%, var(--bg-primary));
  border-radius: var(--radius-sm);
  padding: 6px;
  font-size: var(--font-sm);
  cursor: pointer;
  margin-top: 6px;
}
.hqoffice__firebtn:hover {
  background: color-mix(in srgb, var(--accent-red) 35%, var(--bg-primary));
}
.hqoffice__visitor {
  position: relative;
  display: inline-block;
}
.hqoffice__info {
  padding: var(--gap-xs) 12px;
  font-size: var(--font-sm);
  color: var(--text-dim);
  font-family: Georgia, serif;
  border-top: 1px solid var(--border-dim);
}
</style>
