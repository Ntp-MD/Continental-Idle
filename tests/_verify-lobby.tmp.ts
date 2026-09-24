// tests/_verify-lobby.tmp.ts - temporary audit of the authored lobby using the project's OWN
// schema + engine functions. Deleted same session. Run: npx tsx tests/_verify-lobby.tmp.ts
import fs from 'node:fs';
import { normalizeBlueprintDataFile, validateLayoutIntegrity } from '../src/blueprint-editor/domain/schema/dataFile';
import { resolveRoomType, ROOM_TYPE_SPECS, HALL_ROOM_TYPE } from '../src/blueprint-editor/domain/schema/rooms';
import { buildNpcEngineLayout, buildRoleWalkableMap } from '../src/engine/npc/layoutBuild';
import { deriveFloorRooms } from '../src/engine/npc/rooms';
import { findNpcGridPath } from '../src/engine/npc/pathfinding';
import { tileKey } from '../src/engine/npc/keys';
import { resolveObjectDef } from '../src/blueprint-editor/domain/schema/interact';
import { collectWiringIssues } from '../src/blueprint-editor/assets/validation';
import type { FloorData, TileState } from '../src/blueprint-editor/domain/types';

const raw = JSON.parse(fs.readFileSync('src/blueprint-editor/data/blueprint-data.json', 'utf8').replace(/^/, ''));
const file = normalizeBlueprintDataFile(raw);
if (!file) { console.log('INGRESS: FAIL - normalizeBlueprintDataFile rejected the file'); process.exit(1); }
console.log('INGRESS: ok (schema version', file.version, ')');

const layout = file.layout as never as { canvas: { width: number; height: number; tileSize: number }; floors: FloorData[]; streetWidthTiles?: number; streetFloorId?: string; npcConfig?: never };
const integrity = validateLayoutIntegrity(layout as never);
console.log('validateLayoutIntegrity:', integrity.length ? integrity.join(' | ') : 'no issues');

const assets = new Map((file.originAssets || []).map(a => [a.id, a]));
const getAssetDef = (t: string) => assets.get(t);
const getAssetTags = (t: string) => assets.get(t)?.tags ?? [];
const canvas = { w: layout.canvas.width, h: layout.canvas.height, tileSize: layout.canvas.tileSize, streetTiles: layout.streetWidthTiles ?? 8, streetFloorId: layout.streetFloorId };
const built = buildNpcEngineLayout(layout.floors, canvas, getAssetDef, getAssetTags);
const floor = layout.floors[0];
const map = built.floorMaps.get(floor.id)!;

const doorCells = new Set<string>();
const states = floor.walkable?.tileStates as TileState[][];
for (let y = 0; y < states.length; y++) for (let x = 0; x < states[y].length; x++) if (states[y][x] === 'door') doorCells.add(tileKey(x, y));

const roomIdByCell = deriveFloorRooms(map, doorCells);
const rooms = new Map<string, { cells: number; tagSets: string[][]; label: string }>();
for (const [cell, roomId] of roomIdByCell) {
  const r = rooms.get(roomId) ?? { cells: 0, tagSets: [], label: roomId };
  r.cells++; rooms.set(roomId, r);
}
for (const target of built.layout.interactionTargets) {
  const roomId = target.roomId ?? roomIdByCell.get(tileKey(Math.floor(target.x), Math.floor(target.y)));
  if (!roomId) continue;
  const r = rooms.get(roomId) ?? { cells: 0, tagSets: [], label: roomId };
  r.tagSets.push(target.tags.map(t => t.replace(/^post:/, '')));
  rooms.set(roomId, r);
}

const typing = new Set(ROOM_TYPE_SPECS.flatMap(s => s.detectTags));
console.log(`\nrooms derived: ${rooms.size} (walkable tiles ${map.tiles.size}, door cells ${doorCells.size}, targets ${built.layout.interactionTargets.length})`);
const rows: string[] = [];
for (const [id, r] of [...rooms].sort((a, b) => b[1].cells - a[1].cells)) {
  const fixture = r.tagSets.filter(t => t.some(tag => typing.has(tag)));
  const type = resolveRoomType(fixture.length ? fixture : r.tagSets);
  rows.push(`${String(r.cells).padStart(5)} tiles  ${(r.cells * 0.25).toFixed(1).padStart(6)} m2  ${type.label.padEnd(14)} ${id}${type === HALL_ROOM_TYPE ? '  <- untyped/circulation' : ''}`);
}
console.log(rows.join('\n'));

// egress + reachability: can each deployed role actually walk to the things it is after?
const engineFloor = built.layout.floors.find(f => f.id === floor.id)!;
const spawn = floor.spawnZones?.[0];
const from = { x: Math.floor(spawn!.x / canvas.tileSize), y: Math.floor(spawn!.y / canvas.tileSize) };
console.log(`\nspawn start = zone "${spawn!.label}" tile ${from.x},${from.y} state=${states[from.y][from.x]}`);
const roles = ((file as unknown as { npcConfig?: { roles?: Array<{ id: string; focusTags?: string[] }> } }).npcConfig?.roles) ?? [];
const byRole = new Map<string, { focus: number; reachable: number; unreachable: string[] }>();
for (const r2 of roles) {
  const walkMap = buildRoleWalkableMap(map, floor, r2 as never, getAssetTags);
  const roleFloor = { ...engineFloor, walkable: [...walkMap.tiles].map(t => { const [x, y] = t.split(',').map(Number); return { x, y }; }) };
  let focus = 0, reachable = 0; const bad: string[] = [];
  for (const target of built.layout.interactionTargets) {
    if (!target.tags.some(t => (r2.focusTags ?? []).includes(t))) continue;
    focus++;
    const ok = findNpcGridPath(roleFloor, from, { x: Math.floor(target.x), y: Math.floor(target.y) }).length > 0;
    if (ok) reachable++; else if (bad.length < 3) bad.push(`${target.itemId}@${Math.floor(target.x)},${Math.floor(target.y)}`);
  }
  if (focus) byRole.set(r2.id, { focus, reachable, unreachable: bad });
}
console.log(`\nreachability from guest spawn ${JSON.stringify(from)} (A* over the built floor):`);
for (const [roleId, v] of byRole) console.log(`  ${roleId.padEnd(18)} targets-by-focus=${String(v.focus).padStart(3)}  reachable=${String(v.reachable).padStart(3)}  ${v.unreachable.length ? 'UNREACHABLE: ' + v.unreachable.join(' ') : ''}`);

// wiring badge: same function the toolbar uses
const npcConfig = (file as unknown as { npcConfig?: never }).npcConfig;
const wiring = collectWiringIssues(layout as never, assets as never, npcConfig as never);
const mine = wiring.filter(i => i.includes(floor.label) || i.includes('floor-g'));
console.log(`\nwiring issues: ${wiring.length} total, ${mine.length} about this floor`);
for (const i of mine) console.log('  MINE: ' + i);
for (const i of wiring.filter(x => !mine.includes(x))) console.log('  catalog: ' + i);
