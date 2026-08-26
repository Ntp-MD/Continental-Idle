/**
 * build-hotel.mjs - regenerates the four blueprint data modules from code.
 *
 * Idempotent: safe to run repeatedly. Asset appends skip existing ids and
 * tag injections overwrite the same values. Floors, placements, spawn zones,
 * role restrictions and the NPC config are rebuilt deterministically.
 *
 * Run: npm run build:hotel
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "src", "blueprint-editor", "data");
const writeModule = (file, exportName, value) =>
  fs.writeFileSync(path.join(dataDir, file), `export const ${exportName} = ${JSON.stringify(value, null, 2)}\n`, "utf-8");
const readModule = (file, exportName) => {
  const source = fs.readFileSync(path.join(dataDir, file), "utf-8");
  const prefix = `export const ${exportName} =`;
  return JSON.parse(source.trimStart().slice(prefix.length).trim().replace(/;\s*$/, ""));
};

// ---------- 1. origin assets ----------
const assets = readModule("originAssets.data.ts", "originAssetsData");
const TAG_MAP = {
  "custom-reception-desk": ["front-desk"],
  "custom-vending-machine": ["lounge"],
  "custom-sofa-1": ["lounge"],
  "custom-single-sofa-1": ["lounge"],
  "custom-bench": ["lounge"],
  "custom-table-1": ["lounge"],
  "custom-chair": ["lounge"],
  "custom-table-set": ["lounge", "dining"],
  "custom-kitchen-table-1": ["dining"],
  "custom-kitchen-sink": ["dining"],
  "custom-washer-1": ["housekeeping"],
  "custom-treadmill-1": ["gym"],
  "custom-office-chair": ["lounge"],
  "custom-double-bed-1": ["guest-room"],
  "custom-bathtub": ["wellness"],
  "custom-shower": ["wellness"],
  "custom-toilet": ["wellness"],
  "custom-washbasin": ["wellness"],
};
for (const a of assets) {
  if (TAG_MAP[a.id]) a.tags = TAG_MAP[a.id];
}

const NEW_ASSETS = [
  {
    id: "custom-bar-counter",
    name: "Bar Counter",
    w: 4, h: 1,
    origin: "svg-import",
    category: "Special",
    walkable: false,
    defaultFillColor: "#ffffff",
    svg: '<rect x="2" y="9" width="96" height="14" rx="2" fill="var(--obj-fill,#ffffff)" stroke="var(--obj-stroke,#ffffff)" stroke-width="1"/><rect x="2" y="4" width="96" height="5" rx="1.5" fill="var(--obj-fill,#ffffff)" stroke="var(--obj-stroke,#ffffff)" stroke-width="0.8"/><path d="M 20 13 V 21 M 50 13 V 21 M 80 13 V 21" fill="none" stroke="var(--asset-outline)" stroke-width="0.6"/>',
    svgViewBox: { w: 100, h: 25 },
    walkableGrid: [[false, false, false, false]],
    tileStates: [["blocked", "blocked", "blocked", "blocked"]],
    interactSpots: [{ x: 25, y: 31 }, { x: 50, y: 31 }, { x: 75, y: 31 }],
    interact: { capacity: 3, durationMin: 4, durationMax: 10 },
    queue: { maxMembers: 3, admissionDepth: 4 },
    tags: ["bar"],
  },
  {
    id: "custom-potted-plant",
    name: "Potted Plant",
    w: 1, h: 1,
    origin: "svg-import",
    category: "Special",
    walkable: false,
    defaultFillColor: "#ffffff",
    svg: '<circle cx="12.5" cy="9" r="6.5" fill="none" stroke="var(--asset-outline)" stroke-width="0.8"/><circle cx="9" cy="7.5" r="3.2" fill="none" stroke="var(--asset-outline)" stroke-width="0.6"/><circle cx="16" cy="7.5" r="3.2" fill="none" stroke="var(--asset-outline)" stroke-width="0.6"/><path d="M 8 16 L 17 16 L 15.5 23 L 9.5 23 Z" fill="var(--obj-fill,#ffffff)" stroke="var(--obj-stroke,#ffffff)" stroke-width="1"/><line x1="7" y1="16" x2="18" y2="16" stroke="var(--asset-outline)" stroke-width="0.6"/>',
    svgViewBox: { w: 25, h: 25 },
    walkableGrid: [[false]],
    tileStates: [["blocked"]],
    tags: ["decor"],
  },
  {
    id: "custom-wardrobe",
    name: "Wardrobe",
    w: 1, h: 2,
    origin: "svg-import",
    category: "Special",
    walkable: false,
    defaultFillColor: "#ffffff",
    svg: '<rect x="2.5" y="2.5" width="20" height="45" rx="1" fill="var(--obj-fill,#ffffff)" stroke="var(--obj-stroke,#ffffff)" stroke-width="1"/><line x1="12.5" y1="2.5" x2="12.5" y2="47.5" stroke="var(--asset-outline)" stroke-width="0.7"/><line x1="10.8" y1="22" x2="10.8" y2="26" stroke="var(--asset-outline)" stroke-width="0.7"/><line x1="14.2" y1="22" x2="14.2" y2="26" stroke="var(--asset-outline)" stroke-width="0.7"/><line x1="5" y1="6.5" x2="20" y2="6.5" stroke="var(--asset-outline)" stroke-width="0.5"/>',
    svgViewBox: { w: 25, h: 50 },
    walkableGrid: [[false], [false]],
    tileStates: [["blocked"], ["blocked"]],
    interactSpots: [{ x: 12.5, y: 56 }],
    interact: { capacity: 1, durationMin: 3, durationMax: 8 },
    queue: { maxMembers: 3, admissionDepth: 4 },
    tags: ["guest-room"],
  },
  {
    id: "custom-massage-table",
    name: "Massage Table",
    w: 2, h: 1,
    origin: "svg-import",
    category: "Special",
    walkable: false,
    defaultFillColor: "#ffffff",
    svg: '<rect x="4" y="7" width="42" height="8" rx="3" fill="var(--obj-fill,#ffffff)" stroke="var(--obj-stroke,#ffffff)" stroke-width="1"/><path d="M 8 15 V 22 M 42 15 V 22" fill="none" stroke="var(--obj-stroke,#ffffff)" stroke-width="0.9"/><rect x="6" y="3.5" width="7" height="4" rx="1.5" fill="none" stroke="var(--asset-outline)" stroke-width="0.6"/>',
    svgViewBox: { w: 50, h: 25 },
    walkableGrid: [[false, false]],
    tileStates: [["blocked", "blocked"]],
    interactSpots: [{ x: 12, y: 31 }, { x: 38, y: 31 }],
    interact: { capacity: 2, durationMin: 20, durationMax: 40 },
    queue: { maxMembers: 2, admissionDepth: 3 },
    tags: ["spa"],
  },
  {
    id: "custom-indoor-pool",
    name: "Indoor Pool",
    w: 4, h: 2,
    origin: "svg-import",
    category: "Special",
    walkable: false,
    defaultFillColor: "#ffffff",
    svg: '<rect x="2" y="2" width="96" height="46" rx="8" fill="var(--obj-fill,#ffffff)" stroke="var(--obj-stroke,#ffffff)" stroke-width="1"/><rect x="7" y="7" width="86" height="36" rx="5" fill="none" stroke="var(--asset-outline)" stroke-width="0.9"/><path d="M 14 20 Q 19 16 24 20 T 34 20 T 44 20 T 54 20 T 64 20" fill="none" stroke="var(--asset-outline)" stroke-width="0.55"/><path d="M 20 32 Q 25 28 30 32 T 40 32 T 50 32 T 60 32 T 70 32" fill="none" stroke="var(--asset-outline)" stroke-width="0.55"/><path d="M 84 12 V 38 M 90 12 V 38 M 84 19 H 90 M 84 31 H 90" fill="none" stroke="var(--asset-outline)" stroke-width="0.7"/>',
    svgViewBox: { w: 100, h: 50 },
    walkableGrid: [[false, false, false, false], [false, false, false, false]],
    tileStates: [["blocked", "blocked", "blocked", "blocked"], ["blocked", "blocked", "blocked", "blocked"]],
    interactSpots: [{ x: 25, y: 56 }, { x: 50, y: 56 }, { x: 75, y: 56 }],
    interact: { capacity: 4, durationMin: 15, durationMax: 45 },
    queue: { maxMembers: 4, admissionDepth: 4 },
    tags: ["pool", "wellness"],
  },
  {
    id: "custom-elevator",
    name: "Elevator",
    w: 2, h: 2,
    origin: "svg-import",
    category: "Special",
    walkable: false,
    defaultFillColor: "#ffffff",
    svg: '<rect x="2" y="2" width="46" height="46" rx="2" fill="var(--obj-fill,#ffffff)" stroke="var(--obj-stroke,#ffffff)" stroke-width="1"/><rect x="6" y="6" width="38" height="30" rx="1.5" fill="none" stroke="var(--asset-outline)" stroke-width="0.8"/><path d="M 6 21 H 44 M 25 6 V 36" fill="none" stroke="var(--asset-outline)" stroke-width="0.5"/><path d="M 14 41 L 25 48 L 36 41" fill="none" stroke="var(--asset-outline)" stroke-width="0.8"/>',
    svgViewBox: { w: 50, h: 50 },
    walkableGrid: [[false, false], [false, false]],
    tileStates: [["blocked", "blocked"], ["blocked", "blocked"]],
    interactSpots: [{ x: 15, y: 56 }, { x: 35, y: 56 }],
    interact: { capacity: 2, durationMin: 0, durationMax: 0 },
    queue: { maxMembers: 4, admissionDepth: 4 },
    tags: ["portal"],
  },
];
const existingIds = new Set(assets.map(a => a.id));
for (const na of NEW_ASSETS) {
  if (!existingIds.has(na.id)) assets.push(na);
}
writeModule("originAssets.data.ts", "originAssetsData", assets);

// ---------- 2. floors ----------
const PX = 25;
const COLS = 64;
const ROWS = 40;
const SIZE = {};
for (const a of assets) SIZE[a.id] = { w: a.w * PX, h: a.h * PX };

const BOUNDS = { minX: 200, minY: 200, maxX: 1400, maxY: 800 };
let seq = 0;
const subFor = n => `sub-f${String(Math.floor(n / 100)).padStart(2, "0")}-${String(n % 100).padStart(2, "0")}`;

function makeComposer() {
  const floors = [];
  let current = null;
  return {
    floor(id, label, name, extra = {}) {
      current = { id, label, name, objects: [], _rects: [], extra };
      floors.push(current);
    },
    place(type, x, y) {
      const s = SIZE[type];
      if (!s) throw new Error(`unknown asset ${type}`);
      if (x < BOUNDS.minX || y < BOUNDS.minY || x + s.w > BOUNDS.maxX || y + s.h > BOUNDS.maxY) {
        throw new Error(`out of bounds ${type}@${x},${y}`);
      }
      const ribs = current.extra.ribs;
      if (ribs) {
        const c0 = Math.floor(x / PX);
        const c1 = Math.ceil((x + s.w) / PX) - 1;
        for (const rib of ribs) {
          if (c0 <= rib && rib <= c1) throw new Error(`${type}@${x} overlaps corridor rib column ${rib}`);
        }
      }
      for (const r of current._rects) {
        if (x < r.x + r.w && x + s.w > r.x && y < r.y + r.h && y + s.h > r.y) {
          throw new Error(`overlap ${type}@${x},${y} with ${r.type}@${r.x},${r.y}`);
        }
      }
      seq += 1;
      current.objects.push({ id: `obj-${current.label}${String(seq).padStart(3, "0")}`, type, x, y, rotation: 0, subId: subFor(seq) });
      current._rects.push({ type, x, y, w: s.w, h: s.h });
    },
    done() {
      return floors.map(f => ({
        id: f.id, name: f.name, label: f.label,
        objects: f.objects,
        defaultWalkable: true,
        ...(f.extra.allowedRoleIds ? { allowedRoleIds: f.extra.allowedRoleIds } : {}),
        ...(f.extra.spawnZones ? { spawnZones: f.extra.spawnZones } : {}),
        ...(f.extra.walkable ? { walkable: f.extra.walkable } : {}),
      }));
    },
  };
}
const c = makeComposer();

const ELEVATOR_X = 1330;
const zone = (id, label, x, y, w, h, roleIds) => ({ id, label, x, y, w, h, ...(roleIds ? { roleIds } : {}) });

// Guest-floor corridor system: horizontal hall rows 18-19, vertical ribs
// every 5 columns spanning rows 8-31, everything else blocked. Ribs touch
// both room bands so every fixture spot snaps to an open, connected cell.
function guestCorridorWalkable() {
  const ribs = [7, 12, 17, 22, 27, 32, 37, 42, 47, 52];
  const grid = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => false));
  for (let y = 18; y <= 19; y++) for (let x = 0; x < COLS; x++) grid[y][x] = true;
  for (const rx of ribs) for (let y = 8; y <= 31; y++) grid[y][rx] = true;
  const states = grid.map(row => row.map(cell => (cell ? "walkable" : "blocked")));
  return { walkableGrid: grid, tileStates: states };
}
const CORRIDOR = guestCorridorWalkable();

// G Lobby & Check-in
c.floor("floor-g-lobby", "G", "Lobby & Check-in", {
  spawnZones: [zone("zone-g-lobby", "Lobby entrance", 240, 280, 180, 60)],
});
c.place("custom-reception-desk", 240, 225);
c.place("custom-office-chair", 260, 300);
c.place("custom-office-chair", 340, 300);
c.place("custom-table-1", 500, 240);
c.place("custom-chair", 488, 290);
c.place("custom-chair", 552, 290);
c.place("custom-sofa-1", 1085, 250);
c.place("custom-single-sofa-1", 1150, 250);
c.place("custom-single-sofa-1", 1185, 250);
c.place("custom-potted-plant", 205, 205);
c.place("custom-potted-plant", 450, 205);
c.place("custom-potted-plant", 1370, 770);
c.place("custom-vending-machine", 1090, 690);
c.place("custom-bar-counter", 1200, 685);
c.place("custom-bench", 600, 500);

// 1 Grand Dining
c.floor("floor-1-dining", "1", "Grand Dining", {
  spawnZones: [zone("zone-1-dining", "Dining entrance", 1250, 220, 130, 60)],
});
for (const tx of [300, 500, 700]) {
  c.place("custom-kitchen-table-1", tx, 260);
  c.place("custom-chair", tx + 5, 310);
  c.place("custom-chair", tx + 30, 310);
}
c.place("custom-kitchen-sink", 1000, 260);
c.place("custom-bench", 400, 450);
c.place("custom-bench", 600, 450);
c.place("custom-vending-machine", 1250, 700);

// 2 Entertainment Lounge
c.floor("floor-2-lounge", "2", "Entertainment Lounge", {
  spawnZones: [zone("zone-2-lounge", "Lounge entrance", 1250, 220, 130, 60)],
});
for (const sx of [350, 420, 490]) c.place("custom-sofa-1", sx, 300);
for (const ss of [700, 735, 770]) c.place("custom-single-sofa-1", ss, 300);
c.place("custom-table-set", 900, 280);
c.place("custom-bar-counter", 1150, 680);
c.place("custom-potted-plant", 205, 205);
c.place("custom-potted-plant", 1370, 770);

// 3 Fitness Gym
c.floor("floor-3-gym", "3", "Fitness Gym", {
  spawnZones: [zone("zone-3-gym", "Gym entrance", 1250, 220, 130, 60)],
});
for (const tx of [300, 380, 460, 540]) c.place("custom-treadmill-1", tx, 260);
c.place("custom-bench", 700, 300);
c.place("custom-bench", 800, 300);
c.place("custom-office-chair", 900, 300);
c.place("custom-vending-machine", 1250, 700);

// 4 Spa & Massage
c.floor("floor-4-spa", "4", "Spa & Massage", {
  spawnZones: [zone("zone-4-spa", "Spa entrance", 1250, 220, 130, 60)],
});
for (const mx of [350, 450, 550]) c.place("custom-massage-table", mx, 300);
c.place("custom-bathtub", 800, 280);
for (const sh of [950, 990, 1030]) c.place("custom-shower", sh, 280);
c.place("custom-washbasin", 1150, 285);

// 5 Pool & Recovery
c.floor("floor-5-pool", "5", "Pool & Recovery", {
  spawnZones: [zone("zone-5-pool", "Pool entrance", 1250, 220, 130, 60)],
});
c.place("custom-indoor-pool", 350, 300);
c.place("custom-indoor-pool", 500, 300);
c.place("custom-bench", 700, 320);
c.place("custom-bench", 700, 380);
for (const sh of [900, 940, 980]) c.place("custom-shower", sh, 700);
c.place("custom-potted-plant", 205, 205);

// 6-9 Guest Rooms (staff-restricted + corridor walkable system)
const GUEST_RIBS = [7, 12, 17, 22, 27, 32, 37, 42, 47, 52];
for (let f = 6; f <= 9; f++) {
  c.floor(`floor-${f}-rooms`, String(f), `Guest Rooms ${String.fromCharCode(64 + f - 5)}`, {
    ribs: GUEST_RIBS,
    allowedRoleIds: ["role-guest", "role-housekeeper"],
    spawnZones: [zone(`zone-${f}-corridor`, "Corridor", 1180, 452, 200, 46)],
    walkable: CORRIDOR,
  });
  // Beds sit strictly between rib columns; wardrobes occupy the free column
  // beside each bed. Nothing may overlap a rib or the rib severs into orphan
  // stubs that steal interact-spot snapping.
  const rooms = [
    { bed: 350, ward: 400 },
    { bed: 475, ward: 525 },
    { bed: 725, ward: 775 },
    { bed: 850, ward: 900 },
    { bed: 1100, ward: 1150 },
    { bed: 1225, ward: 1275 },
  ];
  for (const r of rooms) {
    c.place("custom-double-bed-1", r.bed, 260);
    c.place("custom-wardrobe", r.ward, 260);
  }
  // Bathroom band between ribs 42 and 47 (columns 43-46 = exactly 100px).
  c.place("custom-bathtub", 1075, 690);
  c.place("custom-toilet", 1125, 690);
  c.place("custom-washbasin", 1150, 690);
  c.place("custom-shower", 1200, 690);
}

// 10 Staff & Laundry (housekeepers only)
c.floor("floor-10-service", "10", "Staff & Laundry", {
  allowedRoleIds: ["role-housekeeper"],
  spawnZones: [zone("zone-10-service", "Service entrance", 1250, 220, 130, 60)],
});
for (const wx of [300, 340, 380, 420]) c.place("custom-washer-1", wx, 260);
c.place("custom-kitchen-sink", 500, 260);
c.place("custom-kitchen-table-1", 600, 260);
c.place("custom-reception-desk", 800, 260);
c.place("custom-bench", 1100, 300);
c.place("custom-vending-machine", 1250, 700);

// Elevator shaft: one portal per floor, identical position
const builtFloors = c.done();
for (const f of builtFloors) {
  seq += 1;
  f.objects.push({
    id: `obj-portal-${f.label === "G" ? "g" : f.label}`,
    type: "custom-elevator",
    x: ELEVATOR_X,
    y: 205,
    rotation: 0,
    subId: subFor(seq),
  });
}

// BUILD_HOTEL_FURNITURE=0 strips every placement except the elevator
// portals, leaving the bare floor scaffold (zones, role gates, corridor
// walkable paint, portal mesh) for manual authoring in the editor.
const FURNISH = process.env.BUILD_HOTEL_FURNITURE !== "0";
const finalFloors = FURNISH
  ? builtFloors
  : builtFloors.map(f => ({ ...f, objects: f.objects.filter(o => o.type === "custom-elevator") }));

const oldLayout = readModule("floorPlan.data.ts", "floorPlanData");
writeModule("floorPlan.data.ts", "floorPlanData", {
  version: oldLayout.version,
  canvas: oldLayout.canvas,
  streetFloorId: "floor-g-lobby",
  floors: finalFloors,
});

// ---------- 3. tags + npc config ----------
writeModule("tagManager.data.ts", "tagManagerData", [
  "front-desk", "lounge", "bar", "dining", "gym", "spa", "pool",
  "guest-room", "housekeeping", "wellness", "decor",
].map(id => ({ id, label: id })));

writeModule("npcSettings.data.ts", "npcSettingsData", {
  $schema: "npc-config.v1.json",
  version: 1,
  speed: 0.2,
  defaultRoleId: "role-guest",
  roles: [
    { id: "role-guest", label: "Guest", color: "#3794ff", focusTags: ["portal", "lounge", "dining", "pool", "spa", "gym", "wellness", "guest-room"], restrictedTags: [], taskIds: ["t-checkin", "t-drink", "t-swim", "t-massage", "t-workout", "t-rest", "t-lounge"], focusChance: 70 },
    { id: "role-receptionist", label: "Receptionist", color: "#dcdcaa", focusTags: ["front-desk"], restrictedTags: [], taskIds: ["t-checkin"], focusChance: 100, spawnRule: { targetTags: ["front-desk"], count: 2 } },
    { id: "role-bartender", label: "Bartender", color: "#ce9178", focusTags: ["bar"], restrictedTags: [], taskIds: ["t-drink"], focusChance: 100, spawnRule: { targetTags: ["bar"], count: 2 } },
    { id: "role-trainer", label: "Trainer", color: "#4fc1ff", focusTags: ["gym"], restrictedTags: [], taskIds: ["t-workout"], focusChance: 100, spawnRule: { targetTags: ["gym"], count: 2 } },
    { id: "role-therapist", label: "Therapist", color: "#c586c0", focusTags: ["spa", "pool"], restrictedTags: [], taskIds: ["t-massage"], focusChance: 100, spawnRule: { targetTags: ["spa"], count: 3 } },
    { id: "role-housekeeper", label: "Housekeeper", color: "#89d185", focusTags: ["housekeeping", "guest-room"], restrictedTags: [], taskIds: ["t-clean"], focusChance: 100, spawnRule: { targetTags: ["housekeeping"], count: 4 } },
  ],
  tasks: [
    { id: "t-checkin", label: "Check-in", tags: ["front-desk"] },
    { id: "t-drink", label: "Order drink", tags: ["bar"] },
    { id: "t-swim", label: "Swim", tags: ["pool"] },
    { id: "t-massage", label: "Massage", tags: ["spa"] },
    { id: "t-workout", label: "Workout", tags: ["gym"] },
    { id: "t-rest", label: "Rest", tags: ["guest-room"] },
    { id: "t-lounge", label: "Lounge", tags: ["lounge"] },
    { id: "t-clean", label: "Clean room", tags: ["housekeeping", "guest-room"] },
  ],
  pool: [
    { roleId: "role-guest", count: 16 },
    { roleId: "role-receptionist", count: 2, floorIds: ["G"] },
    { roleId: "role-bartender", count: 2, floorIds: ["G", "2"] },
    { roleId: "role-trainer", count: 2, floorIds: ["3"] },
    { roleId: "role-therapist", count: 3, floorIds: ["4", "5"] },
    { roleId: "role-housekeeper", count: 4, floorIds: ["6", "7", "8", "9", "10"] },
  ],
});

console.log(`written: ${assets.length} assets, ${finalFloors.length} floors, ${finalFloors.reduce((n, f) => n + f.objects.length, 0)} objects${FURNISH ? "" : " (furniture stripped - scaffold only)"}`);
