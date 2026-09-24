// tests/_build-lobby.tmp.mjs - temporary lobby-floor author for blueprint-data.json; deleted same session.
// Only assets that still exist in the registry are placed. Each room carries exactly one
// room-typing tag family, because resolveRoomType picks the LOWEST priority number and ties
// resolve by iteration order.
// Host fact honoured here: on the street floor the engine forces the 8-tile ring walkable
// (layoutBuild.isTileWalkable returns true for street tiles before it consults tileStates),
// so the building envelope must be a real blocked wall line and doors are punched last.
import fs from 'node:fs';

const DATA = 'src/blueprint-editor/data/blueprint-data.json';
const ROWS = 50, COLS = 80, TILE = 20;
const ENV = { r0: 8, c0: 8, r1: 41, c1: 71 };

const g = Array.from({ length: ROWS }, () => Array.from({ length: COLS }, () => 'blocked'));
const box = (r0, c0, r1, c1, s = 'walkable') => {
  for (let r = Math.max(0, r0); r <= Math.min(ROWS - 1, r1); r++)
    for (let c = Math.max(0, c0); c <= Math.min(COLS - 1, c1); c++) g[r][c] = s;
};
const wallRect = (r0, c0, r1, c1) => {
  box(r0, c0, r0, c1, 'blocked'); box(r1, c0, r1, c1, 'blocked');
  box(r0, c0, r1, c0, 'blocked'); box(r0, c1, r1, c1, 'blocked');
};

// ---- interior floors first, then all wall lines, then the door punches (order matters) ----
box(ENV.r0 + 1, ENV.c0 + 1, ENV.r1 - 1, ENV.c1 - 1);          // whole envelope interior

const openings = [];
const doorH = (row, c0, c1) => openings.push({ row, a: c0, b: c1 });
const doorV = (col, r0, r1) => openings.push({ col, a: r0, b: r1 });

// --- north band holds only the vestibule; everything else on that row line is structure
box(ENV.r0 + 1, ENV.c0 + 1, 13, ENV.c1 - 1, 'blocked');
box(9, 33, 13, 40);                       // vestibule floor
wallRect(8, 32, 14, 41);                  // vestibule enclosure; row 14 is shared with the hall
doorH(14, 35, 38);                        // inner door set of the airlock

// --- main hall band
box(15, 21, 26, 52);                      // lobby hall (open hall: cheapest circulation + the reveal)
box(28, 21, 39, 52);                      // lift hall
box(27, 21, 27, 52, 'blocked');           // lobby/lift-hall divide
doorH(27, 25, 26);                        // two connections, no single choke
doorH(27, 47, 48);

// --- west band
wallRect(14, 8, 40, 20);
box(15, 9, 21, 19);                       // lounge
box(22, 9, 31, 19);                       // kitchen
box(32, 9, 39, 19);                       // staff room
box(21, 9, 21, 19, 'blocked');            // lounge/kitchen divide
box(31, 9, 31, 19, 'blocked');            // kitchen/staff divide
doorV(20, 17, 18);                        // lobby -> lounge
doorV(20, 24, 25);                        // lobby -> kitchen
doorV(20, 35, 36);                        // lift hall -> staff room

// --- east band
wallRect(14, 52, 40, 70);
box(15, 53, 21, 70);                      // bar
box(22, 53, 27, 70);                      // restrooms
box(28, 53, 39, 70);                      // gym
box(21, 53, 21, 70, 'blocked');
box(27, 53, 27, 70, 'blocked');
doorV(52, 17, 18);                        // lobby -> bar
doorV(52, 24, 25);                        // lobby -> restrooms
doorV(52, 33, 34);                        // lift hall -> gym

// --- envelope wall (the real boundary; the ring outside is walkable street)
wallRect(ENV.r0, ENV.c0, ENV.r1, ENV.c1);
doorH(ENV.r0, 36, 37);                    // arrival door to the street
doorV(ENV.c0, 26, 27);                    // service door to grade

// --- lift bank: two clusters of two cars on the south wall
const lifts = [[28, 38], [30, 38], [43, 38], [45, 38]];
for (const [c, r] of lifts) box(r, c, r + 1, c + 1, 'blocked');

for (const o of openings) {
  if (o.row !== undefined) for (let c = o.a; c <= o.b; c++) g[o.row][c] = 'door';
  else for (let r = o.a; r <= o.b; r++) g[r][o.col] = 'door';
}

// ---- objects (existing assets only) ----
let seq = 0;
const obj = (type, col, row, rotation = 0) => ({
  id: `lob-o${String(++seq).padStart(2, '0')}`, type, x: col * TILE, y: row * TILE, rotation,
});
const objects = [
  // lobby: one signal only (front-desk). benches are tagless so they cannot retype the room.
  obj('reception-desk', 23, 19),
  obj('bench', 34, 16), obj('bench', 34, 25), obj('bench', 46, 21),
  // lounge
  obj('sofa-1', 9, 16, 90), obj('sofa-1', 19, 16, 90), obj('single-sofa-1', 17, 15),
  obj('table-1', 11, 17), obj('custom-table-set', 15, 16), obj('vending-machine', 14, 15),
  // bar: bar-counter + tagless benches only (no lounge fixtures or the room retypes)
  obj('bar-counter', 56, 16), obj('bench', 56, 17), obj('bench', 61, 19), obj('bench', 66, 16),
  // kitchen: cooking only
  obj('kitchen-table-1', 10, 23), obj('table-stove', 13, 23), obj('kitchen-sink', 10, 30, 180),
  // restrooms: hygiene only
  obj('toilet', 55, 22), obj('toilet', 57, 22), obj('washbasin', 60, 22), obj('washbasin', 62, 22), obj('shower', 68, 26, 180),
  // gym: fitness only
  obj('treadmill-1', 56, 29), obj('treadmill-1', 58, 29), obj('bench', 62, 33),
  // staff room: back-of-house only
  obj('office-chair', 12, 33), obj('office-chair', 14, 33), obj('washer-1', 18, 38),
];

const zones = [
  // Street convention (assets/validation.ts:320-343): a pooled guest role needs a zone whose
  // rect contains at least one street-ring cell CENTER, plus a door spanning street + interior.
  { id: 'lob-z-street', label: 'Street arrival', x: 33 * TILE, y: 5 * TILE, w: 8 * TILE, h: 3 * TILE, roleIds: ['role-guest'] },
  { id: 'lob-z-guest', label: 'Arrival lobby', x: 34 * TILE, y: 20 * TILE, w: 5 * TILE, h: 4 * TILE, roleIds: ['role-guest'] },
  { id: 'lob-z-reception', label: 'Reception desk', x: 23 * TILE, y: 20 * TILE, w: 8 * TILE, h: 3 * TILE, roleIds: ['role-receptionist'] },
  { id: 'lob-z-security', label: 'Lobby post', x: 30 * TILE, y: 15 * TILE, w: 3 * TILE, h: 3 * TILE, roleIds: ['role-security'] },
  { id: 'lob-z-bartender', label: 'Bar', x: 56 * TILE, y: 17 * TILE, w: 4 * TILE, h: 3 * TILE, roleIds: ['role-bartender'] },
  { id: 'lob-z-server', label: 'Lounge', x: 12 * TILE, y: 16 * TILE, w: 6 * TILE, h: 4 * TILE, roleIds: ['role-server'] },
  { id: 'lob-z-chef', label: 'Kitchen', x: 10 * TILE, y: 24 * TILE, w: 6 * TILE, h: 6 * TILE, roleIds: ['role-chef'] },
  { id: 'lob-z-housekeeper', label: 'Service band', x: 12 * TILE, y: 33 * TILE, w: 6 * TILE, h: 6 * TILE, roleIds: ['role-housekeeper', 'role-attendant'] },
];

const raw = JSON.parse(fs.readFileSync(DATA, 'utf8').replace(/^/, ''));
const floor = raw.layout.floors[0];
floor.walkable = { tileStates: g, walkableGrid: g.map(row => row.map(v => v === 'walkable' || v === 'door')) };
floor.objects = objects;
floor.spawnZones = zones;
fs.writeFileSync(DATA, JSON.stringify(raw, null, 2));

const tally = g.flat().reduce((a, v) => (a[v] = (a[v] || 0) + 1, a), {});
console.log(`lobby floor written: objects=${objects.length} zones=${zones.length} lifts=${lifts.length} openings=${openings.length}`);
console.log(`tiles: ${JSON.stringify(tally)} sum=${Object.values(tally).reduce((a, b) => a + b, 0)}/${ROWS * COLS}`);
