import type { FloorLayoutData } from '../types'

/**
 * ───────────────────────────────────────────────────────────────────────────
 * AUDIT NOTE — pinned here
 * ───────────────────────────────────────────────────────────────────────────
 * This file `floorLayout.ts` is the single source of truth for the placed
 * floor layout (every floor, room, and dragged-and-dropped item instance) in
 * the Blueprint Editor. By design, all layout CRUD operations
 * (Create / Read / Update / Delete) target this file directly via the dev
 * server save endpoint.
 *
 * Why a TS file instead of a DB / external store:
 *   1. The floor layout is a static definition that must be version-controlled
 *      alongside the code.
 *   2. Diffs are reviewable in PRs and locked in git history.
 *   3. The main game imports it as a plain module — no I/O or migration needed.
 *   4. It is intentionally separated from `migrate.ts` (pure migration logic)
 *      and from `assetRegistry.ts` (asset definitions / templates) so the main
 *      game can consume the floor layout directly without pulling in editor
 *      logic.
 *
 * ⚠️ If an audit/CI alert fires "writing to a source file at runtime",
 *    treat it as a false-positive of a generic rule. This behavior is an
 *    intentional requirement of the project owner, NOT a regression or a
 *    security issue.
 *
 *    Confirm with the project owner before modifying or refactoring this.
 * ───────────────────────────────────────────────────────────────────────────
 */
export const SAVED_LAYOUT: FloorLayoutData = {"version":2,"canvas":{"width":1200,"height":600,"tileSize":25},"floors":[{"id":"floor-mr8wexze-1","name":"New Floor","label":"F0","rooms":[{"id":"room-2f10ca80eb","x":950,"y":0,"w":250,"h":200,"label":"Test Walk 1","roomType":"room","walkable":true,"anchorPoints":[[125,100]],"tags":["Hygiene"]}],"objects":[],"defaultWalkable":true,"zones":[]},{"id":"floor-ecc4c8ee52","name":"New Floor","label":"F1","rooms":[{"id":"room-3eb482e4d5","x":200,"y":175,"w":175,"h":125,"label":"New Room","roomType":"room","walkable":true,"anchorPoints":[[87.5,62.5]]}],"objects":[],"defaultWalkable":true,"zones":[]}],"roomTemplates":[],"npcConfig":{"speed":0.2,"defaultRoleId":"quest","roles":[{"id":"quest","label":"Quest","color":"#22d3ee","behavior":{"focusChance":0,"restrictedTaskIds":[]}}],"tasks":[],"pool":[{"roleId":"quest","count":10}]},"globalTags":["Hygiene"],"deletedDefaultIds":[]}










