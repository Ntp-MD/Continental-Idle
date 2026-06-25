# 07 — Technical Spec

> Source: Extracted from `Continetal-idle.md`

---

## Architecture

### Game Loop

- **Tick rate**: 1 second (income calculation, XP accrual, loyalty decay)
- **Event check**: Every tick, weighted random event probability check with cooldown enforcement
- **Autosave**: Every 30 seconds to LocalStorage
- **Offline calculation**: On load, compute `incomePerSecond × min(secondsAway, offlineCap) × offlineEfficiency`
- **Anti-cheat**: Clamp negative time deltas to 0; checksum hash on save file

### State Management

- **Per-theme state**: Each Continental branch has independent state (currency, buildings, staff, assassins, prestige, reputation, heat, etc.)
- **Global state**: Meta-currencies (Table Favor, Elder Favor, Royal Marks), skill tree, world map, alliances, artifacts, settings
- **State**: Single `GameState` singleton class in `src/types/` — modules access state directly, event bus notifies on changes


### System Interface Architecture

Modules communicate via a **central event bus** (pub/sub pattern). No module calls another module directly — all cross-module communication goes through the bus.

```
┌──────────────────────────────────────────────────────────┐
│                     Event Bus (pub/sub)                   │
│  topics: 'income:tick', 'event:trigger', 'save:auto',    │
│  'prestige:reset', 'theme:switch', 'staff:assign', etc.  │
└──────┬──────┬──────┬──────┬──────┬──────┬──────┬─────────┘
       │      │      │      │      │      │      │
  ┌────▼┐ ┌──▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐ ┌─▼──┐
  │Income│ │Event│ │Save│ │Prest│ │World│ │Staff│ │Trade│
  │Engine│ │Engine│ │ Mgr│ │ Mgr│ │ Map│ │ Mgr│ │ Mgr│
  └─────┘ └─────┘ └────┘ └────┘ └────┘ └────┘ └────┘
```

| Module | Publishes | Subscribes |
|---|---|---|
| IncomeEngine | `income:tick`, `income:update` | `event:resolved`, `prestige:reset`, `theme:switch` |
| EventEngine | `event:trigger`, `event:resolved`, `event:ignored` | `income:tick` |
| SaveManager | `save:complete`, `save:failed` | `save:auto` (timer), `state:changed` |
| PrestigeManager | `prestige:reset`, `prestige:preview` | `prestige:request` |
| WorldMap | `theme:switch`, `map:render` | `theme:unlock`, `conquest:update` |
| StaffManager | `staff:assign`, `staff:levelup`, `staff:hired` | `income:tick`, `prestige:reset` |
| TradeManager | `trade:execute`, `trade:rate:update` | `income:tick` (rate refresh) |

- **Event bus implementation**: Native `EventTarget` API (zero dependencies)
- **State store**: `GameState` singleton — single source of truth, accessed by engine modules
- **No circular dependencies**: Modules only publish and subscribe, never import each other

### Project Structure

```
src/
├── main.ts              — entry point, game loop init, module wiring
├── types/               — TypeScript interfaces (GameState, Staff, Assassin, Building, etc.)
├── data/                — game data (buildings, staff, traits, events, contracts)
├── engine/              — game logic (income, prestige, events, heat, stats/traits)
├── ui/                  — UI rendering (panels, sidebar, map, tooltips, toasts)
└── styles/              — CSS files (base, layout, components, panels, map)
```

| Folder | Responsibility |
|---|---|
| `src/types/` | TypeScript interfaces and `GameState` singleton class |
| `src/data/` | Static game data: building definitions, staff types, traits, event definitions, contract templates |
| `src/engine/` | Game logic modules: `IncomeEngine`, `EventEngine`, `PrestigeManager`, `StaffManager`, `TradeManager`, `HeatSystem` |
| `src/ui/` | DOM rendering: panel management, sidebar, world map (D3), tooltips, toast notifications |
| `src/styles/` | CSS files using BEM naming (hyphen-only): `base.css`, `layout.css`, `components.css`, `panels.css`, `map.css` |

### Event System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  EVENT ENGINE                        │
├─────────────────────────────────────────────────────┤
│  1. EVENT QUEUE (FIFO)                               │
│     [pendingEvent, pendingEvent, ...]                │
│  2. COOLDOWN CHECK                                   │
│     if (now - lastEventTime < eventCooldown) → skip  │
│  3. WEIGHTED RANDOM SELECTION                        │
│     - Filter by theme lock                           │
│     - Filter by unlock conditions                    │
│     - Apply Heat modifiers to weights                │
│     - Apply dynamic difficulty modifiers             │
│     - Select event with highest random × weight      │
│  4. DISPATCH                                         │
│     eventBus.publish('event:trigger', eventData)     │
│  5. RESOLUTION                                       │
│     - Player choice OR auto-resolve (assassin/skill) │
│     - Apply rewards/penalties                        │
│     - Update Heat, Reputation, stats                 │
│     - eventBus.publish('event:resolved', result)     │
│  6. COOLDOWN RESET                                   │
│     lastEventTime = now                              │
└─────────────────────────────────────────────────────┘
```

- **Queue size**: Max 1 pending event (new events blocked while one is active)
- **Auto-resolve**: If player doesn't respond within 60s, auto-resolves as "ignore" (penalty applies)
- **Offline**: Event queue is cleared on load; no offline events dispatched

### World Map Technical Implementation

| Component | Library | Purpose |
|---|---|---|
| Rendering | D3.js v7 | SVG-based map rendering, zoom/pan interactions, data binding |
| Geography | TopoJSON | Efficient geographic data compression, country borders |
| Projections | d3-geo | Mercator projection with zoom-to-fit behavior |
| Tectonic Data | Custom TopoJSON layer | Tectonic plate boundaries for thematic styling |

#### Data Sources

- **Country Borders**: Natural Earth 1:50m (public domain, low-poly for performance)
- **Tectonic Plates**: USGS plate boundaries data (converted to TopoJSON)
- **City Coordinates**: Continental locations (lat/lon) for node placement

#### Map Layers (Z-index order)

1. **Base Layer** — Ocean fill (terminal-noir dark blue)
2. **Tectonic Plates** — Faint plate boundary lines (subtle red, opacity 0.15)
3. **Country Borders** — Stroke outlines (white, opacity 0.3)
4. **Country Fill** — Dynamic based on state (HQ=gold, active=green, locked=gray, conquered=purple, royal=blue)
5. **Continental Nodes** — City markers with icons (★ ◄ ▒ ♛ ⚔)
6. **Overlay UI** — Zoom controls, search, node tooltips

#### Zoom Behavior

- **Initial view**: Fit all 7 nodes with 10% padding
- **Zoom levels**: 5 preset zoom levels (World → Continent → Country → City → Detail)
- **Transitions**: Instant (no animation, terminal aesthetic)
- **Min/Max scale**: 0.5× (world view) to 8× (city detail)

#### Performance Optimizations

- TopoJSON quantization reduces file size by ~80% vs GeoJSON
- SVG path simplification for mobile performance
- Lazy loading of tectonic plate layer (load after base map)

#### Terminal-Noir Map Styling

```css
.ocean { fill: #0a0a0a; }
.land { fill: #1a1a1a; stroke: #333; stroke-width: 0.5px; }
.tectonic-plate { fill: none; stroke: #8b0000; stroke-width: 1px; opacity: 0.15; }
.node-hq { fill: #ffd700; }
.node-active { fill: #4caf50; }
.node-locked { fill: #666; }
.node-conquered { fill: #9c27b0; }
.node-royal { fill: #1e88e5; }
```

#### Map Interactions

- **Tap node** → Switch to that Continental (if active) or view unlock requirements (if locked)
- **Long-press node** → View detailed stats (income, prestige, reputation, takeover progress)
- **Swipe** → Pan the map (mobile)
- **Pinch** → Zoom in/out (mobile)
- **Scroll wheel** → Zoom in/out (desktop)
- **Double-click** → Zoom to country (desktop)

---

## Data Structures

### Save Data Schema (v2.0)

```json
{
  "version": "2.0",
  "timestamp": 0,
  "totalPlayTime": 0,
  "totalOfflineTime": 0,
  "tutorialCompleted": false,
  "tableFavor": 0,
  "passiveFavorAccumulated": 0,
  "favorPerMinute": 0,
  "elderFavor": 0,
  "royalMarks": 0,
  "royalFavor": 0,
  "totalPrestige": 0,
  "dailyContracts": {
    "contracts": [],
    "refreshAt": 0,
    "streak": 0,
    "lastCompletedAt": 0
  },
  "eventLog": [],
  "staffPresets": {},
  "boostTokens": [],
  "loginStreak": {
    "current": 0,
    "lastLogin": 0,
    "maxStreak": 0
  },
  "hqCountry": "newYork",
  "worldMap": {
    "unlockedNodes": ["newYork"],
    "conqueredNodes": [],
    "royalNodes": []
  },
  "artifacts": {
    "equipped": [],
    "inventory": [],
    "forgedCount": 0,
    "pendingArtifacts": [],
    "inventoryCap": 30
  },
  "achievements": {
    "unlocked": [],
    "progress": {}
  },
  "alliances": {
    "active": [],
    "cooldownUntil": 0,
    "contractProgress": {},
    "contractHistory": [],
    "contractCooldowns": {},
    "maintenancePaidUntil": 0
  },
  "statistics": {
    "lifetimeEarnings": 0,
    "totalEvents": 0,
    "eventsResolved": 0,
    "bestChoiceRate": 0,
    "defectionRate": 0,
    "averageLoyalty": 0,
    "tradeProfitLoss": 0,
    "highestIncomeBurst": 0,
    "longestExcommunicadoSurvived": 0,
    "mostPrestigeOneSession": 0,
    "perThemeStats": {}
  },
  "seasonal": {
    "seasonalCurrency": 0,
    "seasonalAssassinsHired": [],
    "personalRecords": {},
    "activeSeason": null
  },
  "royalDecrees": {
    "activeDecrees": [],
    "decreeExpiresAt": 0,
    "lastDecreeAt": 0,
    "rerollUsed": false
  },
  "sandbox": {
    "royalPrestigeCount": 0
  },
  "postEndgameContracts": {
    "active": [],
    "completedCount": 0
  },
  "royalTakeover": {
    "progress": 0,
    "checklist": {
      "allConquered": false,
      "allRoyal": false,
      "royalPrestigeTotal": 0,
      "sovereignSkill": false
    },
    "elderFavorRequired": 500
  },
  "trading": {
    "rateHistory": {},
    "tradeHistory": []
  },
  "markerBank": 0,
  "dynamicDifficulty": {
    "playerType": "normal",
    "interactionFrequency": 0,
    "burnoutActive": false,
    "burnoutResetAt": 0
  },
  "underworld": {
    "bloodCoins": 0,
    "eventCooldownUntil": 0,
    "lastUnderworldEvent": null,
    "raidWarningActive": false,
    "permanentUpgrades": {
      "shadowArmory": [],
      "shadowBarracks": [],
      "shadowPipeline": [],
      "shadowIntelligence": [],
      "underworldEmpire": false
    },
    "themes": {
      "newYork": { "armaments": 0, "troopers": 0, "contraband": 0, "intel": 0 },
      "rome": { "armaments": 0, "troopers": 0, "contraband": 0, "intel": 0 },
      "casablanca": { "armaments": 0, "troopers": 0, "contraband": 0, "intel": 0 },
      "osaka": { "armaments": 0, "troopers": 0, "contraband": 0, "intel": 0 },
      "paris": { "armaments": 0, "troopers": 0, "contraband": 0, "intel": 0 },
      "berlin": { "armaments": 0, "troopers": 0, "contraband": 0, "intel": 0 },
      "dubai": { "armaments": 0, "troopers": 0, "contraband": 0, "intel": 0 }
    }
  },
  "themes": {
    "newYork": {
      "currency": 0,
      "buildings": {},
      "buildingMastery": {},
      "highestVaultLevel": 0,
      "upgrades": [],
      "staff": {},
      "assassins": {},
      "prestige": 0,
      "reputation": 0,
      "markerDebts": [],
      "heatLevel": 0,
      "heatDecayAccumulator": 0,
      "excommunicadoGraceUntil": 0,
      "guestSatisfaction": 50,
      "bountyBoard": { "activeBounties": [], "refreshAt": 0 },
      "conquered": false,
      "takeoverProgress": 0,
      "royal": {
        "established": false,
        "royalBuildings": {},
        "royalPrestige": 0,
        "royalLifetimeEarnings": 0
      }
    },
    "rome": {
      "...same as newYork plus": {
        "artGallery": {
          "inventory": [
            {
              "itemId": "renaissancePainting",
              "purchasePrice": 10000000,
              "hoursHeld": 0,
              "currentValue": 10000000,
              "acquiredAt": 0,
              "confiscationCheckedAt": 0
            }
          ],
          "inventoryCap": 5,
          "galleryLevel": 0,
          "curatorAssigned": null,
          "passiveIncomeGenerated": 0,
          "nextAuctionAt": 0
        },
        "auctionHistory": [
          {
            "itemId": "marbleSculpture",
            "finalBid": 25000000,
            "wonByPlayer": true,
            "timestamp": 0
          }
        ]
      }
    },
    "casablanca": {
      "...same as newYork plus": {
        "tradeRoutes": [
          {
            "routeId": "mediterraneanCircuit",
            "status": "idle",
            "startedAt": 0,
            "durationMs": 1800000,
            "raidChecked": false,
            "staffBonus": 0,
            "caravanMasterAssigned": null
          }
        ]
      }
    },
    "osaka": {
      "...same as newYork plus": {
        "dojo": {
          "assignedAssassins": ["assassinId1", "assassinId2"],
          "activeTraining": {
            "type": "basicDrill",
            "startedAt": 0,
            "durationMs": 900000,
            "xpBonus": 0.5
          },
          "senseiAssigned": null,
          "dojoLevel": 0
        }
      }
    },
    "paris": {
      "...same as newYork plus": {
        "embassy": {
          "diplomaticFavor": 0,
          "envoyAssigned": null,
          "actionCooldowns": {
            "forgiveMarkerDebt": 0,
            "temporaryCeasefire": 0,
            "reputationBoost": 0,
            "favorTrade": 0,
            "diplomaticImmunity": 0
          }
        }
      }
    },
    "berlin": {
      "...same as newYork plus": {
        "fightArena": {
          "matchSchedule": [
            {
              "matchId": "match_001",
              "scheduledAt": 0,
              "assignedAssassinId": null,
              "wagerAmount": 0,
              "winChance": 0,
              "resolved": false,
              "outcome": null
            }
          ],
          "passivePrestige": 0,
          "promoterAssigned": null,
          "arenaLevel": 0
        }
      }
    },
    "dubai": {
      "...same as newYork plus": {
        "royalSuite": {
          "guestSchedule": [
            {
              "guestId": "guest_001",
              "vipTier": "business",
              "arrivalAt": 0,
              "durationMs": 120000,
              "basePayout": 0,
              "stewardAssigned": null,
              "resolved": false
            }
          ],
          "suiteLevel": 0
        }
      }
    },
    "custom_1": {
      "name": "",
      "currency": 0,
      "currencyName": "",
      "accentColor": "#cccccc",
      "specialMechanic": "",
      "buildings": {},
      "upgrades": [],
      "staff": {},
      "assassins": {},
      "prestige": 0,
      "reputation": 0,
      "markerDebts": [],
      "heatLevel": 0,
      "conquered": false,
      "takeoverProgress": 0,
      "royal": { "established": false, "royalBuildings": {}, "royalPrestige": 0, "royalLifetimeEarnings": 0 }
    },
    "custom_2": { "...same as custom_1" }
  },
  "skillTree": {
    "commerce": 0,
    "personnel": 0,
    "shadow": 0,
    "diplomacy": 0,
    "ascension": 0,
    "royal": {
      "royalIncome": 0,
      "royalEfficiency": 0,
      "royalLoyalty": 0,
      "royalAscension": false,
      "royalSovereign": false
    },
    "elder": {
      "elderUpgradesPurchased": []
    }
  },
  "settings": {
    "colorBlindMode": "none",
    "highContrast": false,
    "reducedMotion": false,
    "fontScale": 1.0,
    "oneHandMode": false
  },
  "checksum": "hash"
}
```

### Entry Schemas

**Staff entry schema**:
```json
{ "level": 0, "xp": 0, "pendingLevelUp": false, "assignedTo": "buildingId", "stats": { "precision": 2, "speed": 5, "charisma": 8, "luck": 5 }, "traits": ["workaholic"], "veteran": false, "veteranPerk": null, "prestigeSurvivedCount": 0 }
```

**Assassin entry schema**:
```json
{ "level": 1, "xp": 0, "loyalty": 100, "assignedTheme": "newYork", "lentTo": null, "lentUntil": 0, "stats": { "precision": 5, "speed": 7, "charisma": 3, "luck": 5 }, "traits": ["luckyCharm"], "synergyCount": 0, "awakened": false }
```

**Building mastery schema**:
```json
"buildingMastery": { "reception": { "maxedAt": 50, "masteredAt": 0 }, "guestRooms": { "maxedAt": 50, "masteredAt": 0 } }
```
`maxedAt` stores the max level achieved. On prestige, if `maxedAt >= 50`, building starts at Lv.5.

**Marker debt entry schema**:
```json
{ "amount": 10000, "createdAt": 0, "theme": "newYork" }
```

**Event object schema** (runtime, not saved — reconstructed from event definition + game state):
```json
{
  "id": "contractOpen",
  "name": "Contract Open",
  "themeLock": null,
  "weight": 25,
  "heatModifier": 5,
  "unlockCondition": { "type": "buildingLevel", "buildingId": "undergroundServices", "minLevel": 1 },
  "choices": [
    {
      "id": "accept",
      "label": "Accept Contract",
      "requires": { "staffType": "cleaner", "minLevel": 1 },
      "rewards": [
        { "type": "incomeMultiplier", "value": 2.0, "duration": 90, "scaling": "static" },
        { "type": "incomeMultiplier", "value": 3.0, "duration": 90, "scaling": "static", "condition": { "hasBuilding": "bountyBoard" } }
      ],
      "penalties": [
        { "type": "loseStaff", "staffType": "cleaner", "scaling": "static", "condition": { "noStaff": "cleaner" } }
      ],
      "reputationChange": 5
    },
    {
      "id": "decline",
      "label": "Decline",
      "rewards": [],
      "penalties": [],
      "reputationChange": 0
    }
  ],
  "autoResolveTimeout": 60,
  "autoResolveAction": "ignore"
}
```

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique event identifier |
| `name` | string | Display name |
| `themeLock` | string\|null | Theme ID if event is theme-locked, null for global |
| `weight` | number | Base probability weight |
| `heatModifier` | number | Added to weight per Heat level |
| `unlockCondition` | object | Condition object: `buildingLevel`, `prestige`, `upgrade`, `staffHired`, etc. |
| `choices` | array | Player choices (2–3 per event) |
| `choices[].requires` | object\|null | Optional requirement to show/enable this choice |
| `choices[].rewards` | array | Reward effects: `incomeMultiplier`, `currency`, `reputation`, `xp`, `bloodCoins`, `tableFavor`, etc. |
| `choices[].penalties` | array | Penalty effects: same types as rewards, plus `loseStaff`, `loseCurrency`, `heat` |
| `choices[].reputationChange` | number | Reputation delta on this choice |
| `autoResolveTimeout` | number | Seconds before event auto-resolves as `autoResolveAction` |
| `autoResolveAction` | string | Default auto-resolve: `ignore`, `best`, or `safe` |

**Reward/penalty `scaling` types:**
- `static` — Fixed value, no scaling
- `incomePercent` — Value = `currentIncomePerSec × value × duration`
- `currencyPercent` — Value = `themeCurrency × value`
- `prestigeScaled` — Value = `baseValue × (1 + prestigeLevel × multiplier)`

### Save Versioning

On load, check `version` field. If < current, run migration functions (e.g., `migrate_1_to_2(save)`) that add missing fields with defaults. Bump version after each schema change.

### Save Migration Pattern

```javascript
const MIGRATIONS = {
  '1.0_to_1.1': (save) => {
    // Add guestSatisfaction field with default
    save.themes = save.themes || {};
    for (const themeKey of Object.keys(save.themes)) {
      save.themes[themeKey].guestSatisfaction = 50;
    }
    return save;
  },
  '1.1_to_2.0': (save) => {
    // Add underworld.themes structure
    save.underworld = save.underworld || { bloodCoins: 0, themes: {} };
    save.underworld.themes = save.underworld.themes || {};
    for (const themeKey of ['newYork','rome','casablanca','osaka','paris','berlin','dubai']) {
      if (!save.underworld.themes[themeKey]) {
        save.underworld.themes[themeKey] = { armaments: 0, troopers: 0, contraband: 0, intel: 0 };
      }
    }
    // Add royalTakeover if missing
    save.royalTakeover = save.royalTakeover || { progress: 0, checklist: {} };
    return save;
  }
};

function migrateSave(save) {
  const versions = Object.keys(MIGRATIONS).sort();
  for (const migration of versions) {
    const [from, to] = migration.split('_to_');
    if (save.version === from) {
      save = MIGRATIONS[migration](save);
      save.version = to;
    }
  }
  // Fill any missing top-level keys with defaults
  save = { ...DEFAULT_SAVE, ...save };
  save.version = CURRENT_VERSION;
  return save;
}
```

- **Version field**: Always string (e.g., "2.0") for semver compatibility
- **Migration order**: Sequential — never skip versions
- **Backup**: Before migration, copy original save to `save_backup_v{oldVersion}` in LocalStorage
- **Validation**: After migration, run `validateSave(save)` to check all required fields exist

---

## Save System

- **Autosave** every 30s to LocalStorage
- **Manual export/import** as JSON string (for backup transfer between devices)
- **Checksum hash** on save file, invalidate on mismatch
- **Anti-cheat** — clamp negative time deltas to 0
- **No cloud sync** — single-player only, all data stored locally

### Checksum Algorithm

Uses **SHA-256** (via Web Crypto API) for save integrity:

```javascript
async function generateChecksum(saveData) {
  const jsonString = JSON.stringify(saveData);
  const encoder = new TextEncoder();
  const data = encoder.encode(jsonString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function validateChecksum(save) {
  const { checksum, ...dataWithoutChecksum } = save;
  const expectedChecksum = await generateChecksum(dataWithoutChecksum);
  return checksum === expectedChecksum;
}
```

- SHA-256 chosen for: native browser support (Web Crypto API), no dependencies, collision-resistant
- Checksum covers all fields except `checksum` itself
- On mismatch: reject save, attempt backup load, flag anomaly
- On export: checksum included in exported JSON

### Offline Event Simulation Rules

- Events do NOT trigger during offline
- Excommunicado: If active when player left, resolves automatically
- Contract/Marker expiry: Auto-decline after 5 minutes of offline time
- Heat meter: Decays by 1 per hour offline
- Reputation: Continues to decay normally
- Staff XP: Continues to accumulate
- Assassin XP: Continues to accumulate
- Assassin loyalty: Continues to decay
- Inactive theme income: NOT generated during offline — only last active theme earns

---

## Platform Target

- **Primary**: Browser (desktop + mobile)
- **Mobile-first**: Vertical layout, large tap targets, theme switch via swipe
- **One-hand mode**: All interactions reachable with single thumb on mobile
- **Canvas fallback**: SVG-only rendering via D3.js (no Canvas mode, no Phaser)
- **State**: `GameState` singleton class (no Pinia/Redux)
- **Storage**: LocalStorage only (single-player, no server)

### Dependency Versions

| Dependency | Version | Purpose |
|---|---|---|
| D3.js | 7.8+ | World map rendering (SVG-based) |
| TopoJSON | 3.0+ | Geographic data format |
| TypeScript | 5.0+ | Type safety |
| Vite | 5.0+ | Build tool / dev server |

- Event bus: Native `EventTarget` (zero dependencies)
- State management: `GameState` singleton class (no framework)
- UI rendering: Direct DOM manipulation (no virtual DOM, no framework)
- All dependencies are frontend-only — no backend, no server, no cloud

### Performance Budget

| Metric | Target | Measurement |
|---|---|---|
| Target FPS | 60fps (desktop), 30fps (mobile) | requestAnimationFrame loop |
| Tick processing | <5ms per tick | Performance.now() before/after |
| Save file size | <2MB (compressed) | JSON.stringify length |
| Save write time | <50ms | LocalStorage.setItem timing |
| Initial load | <3s (first paint) | Lighthouse / browser devtools |
| World map render | <500ms | D3.js render completion |
| Memory usage | <100MB | Chrome DevTools Memory panel |
| Bundle size | <500KB (gzipped) | Vite build output |

- If FPS drops below target: reduce DOM updates (batch with requestAnimationFrame)
- If save >2MB: switch to compression (LZ-string or pako)
- If bundle >500KB: code-split by route (world map, royal hotel, etc.)

### Error Handling Strategy

| Error Type | Handling |
|---|---|
| Corrupt save (checksum mismatch) | Load backup save; if backup also corrupt, start new game |
| Missing save fields (post-migration) | Fill with defaults from DEFAULT_SAVE template |
| NaN in calculations | Replace with 0, log warning, continue (never crash) |
| Division by zero | Guard with `Math.max(1, denominator)` pattern |
| LocalStorage quota exceeded | Compress save with LZ-string; if still too large, warn user to export and clear old data |
| Save export invalid (checksum mismatch) | Reject import, toast: "Save file corrupted or modified" (3s) |
| Invalid trade (negative rate) | Clamp rate to minimum 0.01, log anomaly |
| Event trigger with no valid events | Skip tick, log warning (should never happen if weights >0) |

- **Global error handler**: `window.addEventListener('error', ...)` catches uncaught errors; on error, save state to LocalStorage and show recovery modal
- **Never lose save data**: All errors are caught and handled — the game should never crash without preserving save state

### Testing Strategy

| Test Type | Scope | Tool |
|---|---|---|
| Unit tests | Formulas (income, cost, favor, XP, trade rate) | Vitest / Jest |
| Integration tests | Module interactions via event bus | Vitest + event bus mock |
| Save migration tests | Each migration function with sample saves | Vitest |
| Balance simulation | Simulate 1000 hours of gameplay, verify income projections | Custom script (Node.js) |
| UI component tests | DOM rendering, user interactions | Vitest + jsdom (DOM mock) |
| E2E tests | Full game flow: tutorial → first prestige → theme unlock | Playwright |
| Save integrity tests | Checksum validation, corrupt save recovery | Vitest |

- **Balance simulation**: Script that runs game loop without UI, simulating optimal play for 1000 hours, checking that milestone timings match projections in `05-balance-sheet.md`
- **Regression tests**: Every bug fix gets a test case to prevent recurrence
- **Coverage target**: 80% for core logic (income engine, event engine, save manager); 50% for UI components

---

## Anti-Cheat & Integrity

| Threat | Mitigation |
|---|---|
| Clock tampering (set time forward) | Clamp time delta to `offlineCapBase`, flag anomalies |
| Memory editing | Local validation checks on save load, flag anomalies |
| Save file editing | Checksum hash on save file, invalidate on mismatch |
| Auto-clicker | Diminishing returns on rapid-fire purchases ("Burnout") |
| Save tampering | Checksum hash validation, reject modified saves |
