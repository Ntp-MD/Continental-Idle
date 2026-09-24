// tests/_probe.tmp.ts - throwaway: render derived room ids so merges are visible
import fs from 'node:fs';
import { normalizeBlueprintDataFile } from '../src/blueprint-editor/domain/schema/dataFile';
import { buildWalkableMap } from '../src/engine/npc/layoutBuild';
import { deriveFloorRooms } from '../src/engine/npc/rooms';
import type { FloorData, TileState } from '../src/blueprint-editor/domain/types';

const raw = JSON.parse(fs.readFileSync('src/blueprint-editor/data/blueprint-data.json', 'utf8').replace(/^/, ''));
const file = normalizeBlueprintDataFile(raw)!;
const fl = file.layout.floors[0] as FloorData;
const states = fl.walkable?.tileStates as TileState[][];
const assets = new Map((file.originAssets || []).map(a => [a.id, a]));
const map = buildWalkableMap(fl, { w: 1600, h: 1000, tileSize: 20, streetTiles: 8, streetFloorId: file.layout.streetFloorId }, (t: string) => assets.get(t));
const doorCells = new Set<string>();
for (let y = 0; y < states.length; y++) for (let x = 0; x < states[y].length; x++) if (states[y][x] === 'door') doorCells.add(`${x},${y}`);
const rooms = deriveFloorRooms(map, doorCells);
const order = [...new Set(rooms.values())];
const glyph = new Map(order.map((id, i) => [id, 'abcdefghiklmnopqrstuvxyz'[i] || '?']));
for (let y = 6; y <= 42; y++) {
  let line = '';
  for (let x = 4; x <= 74; x++) {
    const k = `${x},${y}`;
    line += doorCells.has(k) ? '+' : (glyph.get(rooms.get(k)!) ?? (map.tiles.has(k) ? ' ' : '#'));
  }
  console.log(String(y).padStart(2), line);
}
console.log('legend:', order.map((id, i) => `${glyph.get(id)}=${id}(${[...rooms.values()].filter(v => v === id).length})`).join(' '));
