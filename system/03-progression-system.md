# 03 — Progression System

> Source: Extracted from `Continetal-idle.md`

---

## Upgrade Tree (Per Theme)

| Tier | Upgrade | Cost | Effect |
|---|---|---|---|
| 1 | Renovate Lobby | 5K | +50% guest income |
| 2 | Expand Bar | 15K | +100% lounge income |
| 3 | Kitchen Expansion | 40K | +75% kitchen income, unlocks Chef |
| 4 | Secure Vault | 100K | Interest rate on stored income (2%/min) |
| 5 | Private Wing | 300K | Unlock premium guests, unlock Sommelier |
| 6 | Reinforced Armory | 800K | +50% assassin ability effectiveness, -50% Armament consumption |
| 7 | Intelligence Hub | 2M | -25% event cooldown, unlock Intelligence Officer |
| 8 | High Table Liaison | 5M | Unlock prestige for this theme |
| 9 | Continental Broadcast | 15M | +25% income to ALL themes (global) |
| 10 | Shadow Network | 50M | Assassins gain 2× loyalty decay reduction |
| 11 | Elder Suite | 200M | +1 assassin slot for this theme |
| 12 | Continental Crown | 1B | +100% all income this theme, visual crown on hotel |

### Continental Broadcast Stacking Rule

Unique per theme — purchasing in one theme grants the global +25% buff. Purchasing in a second theme does NOT stack; instead it upgrades the buff to +50% (capped at +50% from 2 themes).

---

## Prestige / Reset Mechanic

**Prestige is tracked PER THEME.** Each Continental branch has its own prestige level.

### Reset Scope

- Resets a single theme's **buildings and currency**
- **Keeps**: Staff (with XP), assassins (with loyalty), upgrades, theme-unique building (#13)
- Grants **Table Favor** (global meta-currency)

### Prestige Reset Rules

- Buildings reset to level 0 but **remain unlocked** if their upgrade prerequisite was already purchased
- Player starts with all unlocked buildings at Lv.0 and must re-purchase levels
- Building mastery perk: previously maxed buildings start at Lv.5 instead of Lv.0

### Reputation on Prestige

- Reputation is **halved** (rounded down) on prestige
- **Adjudicator staff** reduces penalty from 50% loss to 30% loss per level (max 20% loss at Lv.10)

### Prestige Preview Calculator

Shows live preview of favor gain at current vs next scaleConstant tier. Helps players decide prestige timing strategically.

### Theme Unlock (Based on TOTAL Prestige)

| Total Prestige (Sum of All Non-HQ Themes) | Unlock |
|---|---|
| 1 | First non-HQ theme (lowest tier) |
| 5 | Second non-HQ theme |
| 12 | Third non-HQ theme |
| 22 | Fourth non-HQ theme |
| 35 | Fifth non-HQ theme |
| 55 | Sixth non-HQ theme (final) |
| 80 | High Table Endgame |

**Unlock order**: Rome → Casablanca → Osaka → Paris → Berlin → Dubai. If HQ is one of these, it is skipped.

---

## High Table Skill Tree

| Branch | Node Examples | Effect |
|---|---|---|
| Commerce | Global Income I–X | +5% income per rank, all themes |
| Personnel | Staff Mastery | Faster XP, more staff slots |
| Shadow | Assassin Network | +1 assassin slot, loyalty decay -50% |
| Diplomacy | Marker Forgiveness | Reduce/clear marker debts |
| Ascension | Deeper Prestige | Better favor formula, auto-prestige |
| Ascension | Extended Absence I–III | +4h / +8h / +12h offline cap (total 4h → 24h max) |

#### Skill Tree Node Layout & Prerequisites

Nodes within each branch are **strictly sequential** — each node requires the previous node in the same branch to be unlocked first. Cross-branch dependencies do NOT exist (branches are independent).

```
COMMERCE:     Income I → Income II → Income III → Income IV → Income V
              (3)         (8)         (19)         (47)        (117)

PERSONNEL:    Staff I → Staff II → Staff III → Mastery → Auto-Assign
              (3)        (8)        (19)         (47)       (117)

SHADOW:       Network I → Network II → Network III → Assassin+ → No Defect
              (3)          (8)           (19)          (47)       (117)

DIPLOMACY:    Forgive I → Forgive II → Clear All
              (3)          (8)           (19)

ASCENSION:    Deeper I → Deeper II → Auto-Prestige
              (3)         (8)           (19)
```

**Prerequisite Rules:**
- Each node requires the **immediately preceding node** in the same branch to be at max level (1/1)
- The first node in each branch has **no prerequisite** — available immediately
- Branches are **fully independent** — unlocking Commerce does not require Personnel, etc.
- **No cross-branch dependencies** at any point
- "Maxing a branch" = all nodes in that branch unlocked → triggers branch max bonus
- Node costs follow `nodeCost(rank) = 3 × (2.5 ^ rank)` where rank = position in branch (0-indexed)

### Auto-Prestige Trigger

Unlocked via Ascension skill tree node "Auto-Prestige":

```
autoPrestigeThreshold = favorGainThreshold × 1.5
```
- Triggers when potential favor gain ≥ `autoPrestigeThreshold` (1.5× the last manual prestige's favor)
- Only applies to themes where the player has enabled auto-prestige (toggle per theme)
- **Opt-out**: Player can disable auto-prestige per theme at any time
- **Confirmation**: First auto-prestige requires a one-time confirmation dialog; subsequent ones are automatic
- **Minimum prestige level**: Auto-prestige only activates after Prestige 3+ (prevents accidental early resets)
- **Excommunicado guard**: Will not trigger during an active excommunicado
- **Notification**: Toast notification appears when auto-prestige triggers

### Branch Max Bonuses

- Commerce max: +25% global income
- Personnel max: Staff auto-assign to optimal buildings
- Shadow max: Assassins never defect
- Diplomacy max: All marker debts cleared permanently
- Ascension max: Unlocks "Super Prestige"

### Skill Tree Node Cost Progression

```
nodeCost(rank) = baseNodeCost × (2.5 ^ rank)
baseNodeCost = 3 Table Favor
```

| Node Rank | Cost (Table Favor) |
|---|---|
| I | 3 |
| II | 8 |
| III | 19 |
| IV | 47 |
| V (Max) | 117 |

Total to max one branch: ~194 Favor. Total to max ALL branches: ~970 Favor.

---

## Royal Skill Tree Branch

Unlocked when first Royal Continental is established:

| Node | Cost | Effect |
|---|---|---|
| Royal Income I–V | 5/12/30/75/186 Royal Favor | +20% Royal Continental income per rank |
| Royal Efficiency I–III | 10/25/62 Royal Favor | Royal buildings cost -10% per rank |
| Royal Loyalty I–III | 10/25/62 Royal Favor | Assassin loyalty decay -20% in Royal Continentals |
| Royal Ascension | 100 Royal Favor | Unlock "Royal Takeover" |
| Royal Sovereign | 200 Royal Favor | All Royal global buffs doubled |

---

## Super Prestige (New Game+)

After completing "The Continental Summit" contract, you can perform a **Super Prestige**:

### Resets
- ALL standard themes (building levels and currency return to zero)

### Keeps
- Conquered status (permanent)
- Building mastery perk (previously maxed buildings restart at Lv.5)
- High Table Skill Tree progress
- All assassins hired
- Achievements
- 50% of Table Favor
- Royal Continentals (not reset)
- Royal Marks currency
- Elder Favor currency

### Royal Prestige Reset Scope

Royal Prestige resets **only the Royal layer** of a single Royal Continental:

| Resets | Keeps |
|---|---|
| Royal building levels (R1–R6) | Royal staff (with XP) |
| Royal currency (Royal Marks spent, not total) | Royal assassins |
| Royal lifetime earnings (for favor calc) | Standard Continental (frozen, untouched) |
| Royal reputation (halved, same as standard) | Royal Marks global balance |

- Royal Prestige grants **Royal Favor** (not Table Favor)
- Royal buildings restart at Lv.0 (mastery perk applies: maxed Royal buildings start at Lv.3)
- Royal staff persist with XP and levels intact
- Standard Continental beneath remains frozen and unaffected

### Grants
- **Elder Favor** — new meta-currency

### Elder Upgrades

| Upgrade | Cost (Elder Favor) | Effect |
|---|---|---|
| Global Income Boost I | 10 | +100% global income (stacking) |
| Global Income Boost II | 25 | +100% global income (stacking) |
| Global Income Boost III | 50 | +100% global income (stacking) |
| Additional Theme Slot | 75 | +1 theme slot (beyond 7, enables Custom Theme) |
| Custom Theme Creator | 100 | Create your own Continental branch |
| Time Dilation | 50 | Offline progress runs at 2× speed |
| Eternal Loyalty | 75 | All assassins start at 100% loyalty after any prestige/reset |
| Elder's Insight | 60 | See all event probabilities AND outcomes before choosing |

#### Custom Theme System

**Unlock**: Purchase "Custom Theme Creator" Elder Upgrade (100 Elder Favor) OR conquer Dubai (Dubai conquest bonus grants 1 free custom theme). After the first, additional custom themes cost 200 Elder Favor each (max 3 total).

**Creation Process:**
1. **Name**: Player enters a Continental name (max 20 chars, text input)
2. **Currency Name**: Player names the theme currency (max 12 chars, e.g., "Shadow Coins")
3. **City Selection**: Player picks a city from the world map pool (same pool as AI Continental allies — Shanghai, Moscow, Istanbul, etc.)
4. **Special Mechanic**: Player selects 1 of 7 pre-built mechanic kits (mirrors existing themes):

| Kit | Based On | Mechanic Summary |
|---|---|---|
| Bounty | New York | Rotating bounty contracts (3 active, 15-min refresh) |
| Auction | Rome | Art appreciation + auction events |
| Trade | Casablanca | 3 trade routes with risk/multiplier |
| Dojo | Osaka | Passive assassin/staff XP training |
| Diplomacy | Paris | Diplomatic favor meter + actions |
| Arena | Berlin | Fight club with win-chance formula |
| Luxury | Dubai | VIP guest rotation with high payouts |

5. **Building Roster**: Standard 12 buildings + 1 theme-unique building (matching selected kit). Same base costs and growth rates as canonical themes.
6. **Accent Color**: Player picks from 8 preset border colors (or random)

**Rules:**
- Custom themes do NOT count toward the 7 canonical Continental Takeover requirements
- Custom themes DO count toward total prestige (for unlock thresholds and favor scaling)
- Custom themes CAN be prestiged and conquered (conquest gives a cosmetic title only, no takeover progress)
- Custom themes follow the same income formula, staff system, assassin slots, and event engine as canonical themes
- Custom theme events use the generic event pool (no theme-locked events unless the mechanic kit triggers them)
- **Save schema**: Custom themes stored in `themes.custom[]` array, same structure as canonical themes plus `customName`, `customCurrencyName`, `customCity`, `mechanicKit` fields
- **World map**: Custom theme node appears at selected city coordinates with a unique icon (◆)

**Staff & Assassin Pools:**
- **Staff pool**: All 8 standard staff types available (Concierge through Vault Keeper)
- **Royal staff**: NOT available (Custom Themes cannot become Royal)
- **Assassin pool**: All 7 global assassins available (The Ghost through The Adjudicator's Hand)
- **Theme-exclusive assassins**: NOT available (tied to canonical themes only)
- **Assassin slots**: Base 3, expandable to 6 via upgrades and skill tree (same as standard themes)
- **Synergy**: Global assassin synergies work normally; no theme-exclusive synergies available
- **Alliances & trading**: Custom themes CAN participate in alliances, trading, and seasonal events
- **Prestige & conquest**: Custom themes CAN be prestiged and conquered (conquest gives a cosmetic title only, no takeover progress)

---

## High Table Contracts (Endgame Missions)

After Prestige 20, the High Table offers special contracts:

| Contract | Requirement | Reward |
|---|---|---|
| The Continental Summit | All 7 canonical themes at building Lv.25+ (all 12 standard buildings) | Unlock "Super Prestige" |
| The Assassin's Ball | Hire all SS-rank assassins | +1 permanent assassin slot per theme |
| The Marker Crisis | Clear 100 marker debts | Unlock "Marker Bank" (store markers as currency) |
| The Blood Oath | Survive 50 excommunicados | Permanent -50% excommunicado duration |
| The Final Table | All 7 Continentals conquered + 1e30 total lifetime earnings (all themes combined) | Endgame choice |

### The Final Table — Endgame Choice

Upon completing "The Final Table" contract, the player is presented with a **one-time choice** (cannot be undone):

| Option | Effect |
|---|---|
| **Accept the Seat** | Triggers Super Prestige immediately. Grants +50 Elder Favor bonus. Unlocks the Super Prestige system. Story: You join the High Table. |
| **Refuse the Seat** | Grants permanent "The Outcast" title. +100% global income permanently (no Super Prestige). Unlocks a unique hidden achievement "Above the Law". Story: You reject the High Table and operate outside their authority. |

- If the player refuses, the **+50 Elder Favor bonus is forfeited permanently**. Super Prestige remains accessible via The Continental Summit contract (already unlocked before The Final Table). The Ascension skill tree max unlock provides an **alternative Super Prestige trigger** that does NOT require The Continental Summit — it resets all standard themes identically but grants only 25 Elder Favor (half the normal 50). This is the fallback path for players who refused The Seat and want to continue the Elder Favor grind.
- If the player accepts, the +100% income bonus is NOT granted (they get Elder Favor instead)
- **Both paths (Summit and Ascension) produce the same Super Prestige reset** — the difference is the Elder Favor payout and whether The Final Table story choice is consumed

---

## Continental Takeover System

Takeover has **two systems** that resolve simultaneously — System A defines the hard requirements; System B visualizes completion progress. Reaching 100% on System B is only possible when every System A condition is individually satisfied, so they trigger together.

**System A is a hard gate**: each condition must be met independently. Meeting 5 of 6 conditions does not unlock the CONQUER button — all must be green simultaneously.

**System B is a tracker**: each condition contributes its fixed % to the progress bar only when that specific condition is met. Since all conditions together sum to 100%, the bar reaches 100% exactly when all System A conditions are satisfied.

### System A — Takeover Checklist (ALL required)

| Theme | Min Prestige | Min Earnings | Reputation | Special Requirement |
|---|---|---|---|---|
| New York | Prestige 5 | 1e15 | Sovereign (1000) | Survive 50 excommunicados |
| Rome | Prestige 10 | 1e18 | Sovereign (1000) | Win 10 auction nights |
| Casablanca | Prestige 15 | 1e21 | Sovereign (1000) | Complete 20 smuggling runs |
| Osaka | Prestige 20 | 1e24 | Sovereign (1000) | Train 10 assassins to max level |
| Paris | Prestige 25 | 1e27 | Sovereign (1000) | Clear 50 marker debts |
| Berlin | Prestige 30 | 1e30 | Sovereign (1000) | Win 50 blood oath wagers |
| Dubai | Prestige 35 | 1e33 | Sovereign (1000) | Host 100 premium guests |

### System B — Takeover Progress Bar

| Action | Progress |
|---|---|
| Meet prestige requirement | +15% |
| Meet earnings requirement | +15% |
| Reach Sovereign reputation | +20% |
| Complete special requirement | +25% |
| Max all buildings in theme | +10% |
| Hire all assassins for theme | +15% |

When progress reaches 100% → [CONQUER] button appears. **Takeover is PERMANENT.**

### Conquest Bonuses

| Conquered Theme | Bonus |
|---|---|
| New York | +50% global income |
| Rome | +25% staff XP gain |
| Casablanca | +1 assassin slot per theme |
| Osaka | Assassins never defect |
| Paris | -50% event penalties |
| Berlin | +100% prestige favor gain |
| Dubai | Unlocks "Custom Theme" creation |

---

## Royal Continental System

### Unlock Requirements (ALL required)

| Requirement | Threshold |
|---|---|
| Standard Continental Prestige | 15+ in that country |
| Standard Continental Reputation | Sovereign (1000) |
| All 12 buildings | Max level in that country |
| All theme-exclusive assassins | Hired |
| Country Conquest | Standard Continental conquered |

### Royal Ascension

- **Freezes** the standard Continental (conquered state preserved permanently)
- Adds a new **Royal layer** on top
- Unlocks **Royal Buildings** (6 premium buildings, max level 25)
- Introduces **Royal Marks** — premium shared currency
- Grants a **permanent global buff**

### Royal Readiness Meter

```
royalReadiness = sum of (buildingLevel / 50) for all 12 buildings
```
Royal Ascension available when `royalReadiness >= 12.0`. Progress persists across prestiges.

### Royal Continental Global Buffs

| Royal Continental | Global Buff |
|---|---|
| Royal New York | +100% bounty/contract rewards globally |
| Royal Rome | +50% artifact drop rate globally |
| Royal Casablanca | +100% trade route income globally |
| Royal Osaka | +100% assassin XP globally |
| Royal Paris | +50% reputation gain globally |
| Royal Berlin | +100% prestige favor gain globally |
| Royal Dubai | +200% VIP/premium guest income globally |

---

## Royal Takeover (Ultimate Endgame)

| Requirement | Threshold |
|---|---|
| All 7 standard Continentals | Conquered |
| All 7 Royal Continentals | Established |
| Royal Prestige (total across all Royal) | 50+ |
| Royal Sovereign skill | Purchased |
| Elder Favor | 500+ |

**Reward**: Become the **High Table Sovereign** — all buffs doubled, issue Royal Decrees, infinite Royal Prestige loops.

### Royal Decrees

After completing Royal Takeover, the player can issue one **Royal Decree** per day (real-time 24h cooldown). The system presents **3 random decree options**; the player picks one. The decree buff lasts 24 hours.

#### Decree Pool

| Decree | Effect | Duration |
|---|---|---|
| Golden Age | +100% all income globally | 24h |
| Shadow Protocol | All assassins at 100% loyalty, no decay | 24h |
| Iron Wall | No negative events in any theme | 24h |
| Open Market | All trade fees removed, rates +20% favorable | 24h |
| Blood Economy | All underworld resources generate 3× | 24h |
| Prestige Rush | Prestige favor gain +200% | 24h |
| Veteran's Call | All staff gain 500 XP instantly + +50% XP for 24h | 24h |
| Continental Summit | All alliance contract rewards doubled | 24h |
| The Sovereign's Tax | All theme currencies generate +50% passively | 24h |
| Elder's Blessing | Elder Favor gain +300% | 24h |
| Grand Gala | +50% reputation gain to all themes | 24h |
| Royal Treasury | +10 Table Favor instantly + 1 favor/hour for 24h | 24h |
| Assassin's Blessing | All assassins gain +200% XP | 24h |
| The Sovereign's Will | All buffs from all sources +50% (stacks with Sovereign permanent 2×) | 24h |
| Artifact Hunt | Artifact drop rate ×5 | 24h |

#### Decree Rules

- **Selection**: 3 decrees drawn randomly from the pool (no duplicates within a single draw)
- **Reroll**: One free reroll per day (stored as `rerollUsed` in save). Additional rerolls cost 10 Table Favor each (max 3 additional)
- **Override**: Issuing a new decree while one is active replaces it (does not stack)
- **Cooldown**: `lastDecreeAt + 24h` before next decree can be issued
- **Sovereign doubling**: Royal Takeover reward "all buffs doubled" applies to decree effects — values above are shown at base; Sovereign status doubles them at activation
- **Sandbox+**: After Royal Prestige loops, each loop grants +1 simultaneous decree slot (max 3 simultaneous decrees). Multiple active decrees stack their effects additively.
- **Save fields**: `royalDecrees.activeDecrees` (array of decree IDs, max 1 base / 3 with Sandbox+), `royalDecrees.decreeExpiresAt` (timestamp of earliest expiry), `royalDecrees.lastDecreeAt` (timestamp), `royalDecrees.rerollUsed` (boolean, resets on new decree issuance)

### Sandbox+ Mode

After Royal Takeover, the game enters Sandbox+ — infinite Royal Prestige loops with escalating rewards:

```
sandboxRewardMultiplier = 1 + (royalPrestigeCount × 0.1)
```

- Each Royal Prestige loop increases all rewards by 10% (Royal Marks generation, Elder Favor generation, contract rewards)
- No cap — scales infinitely
- Each loop grants +1 Royal Decree slot (max 3 simultaneous decrees, stacking additively)
- Royal Prestige in Sandbox+ follows the same reset rules as standard Royal Prestige (Royal buildings reset, Royal staff kept)
- **Save fields**: `sandbox.royalPrestigeCount` (integer, increments each loop), `sandbox.rewardMultiplier` (derived, not stored — calculated from count)

### Post-Endgame Contracts

After Royal Takeover, the player can issue contracts to AI-controlled Continentals for passive income. These are **separate from alliance contracts** — they are one-way tribute arrangements:

| Contract | Cost (Royal Marks) | Duration | Reward |
|---|---|---|---|
| Tribute Collection | 5 | 24h | +50 Royal Marks/day |
| Shadow Network | 10 | 48h | +100 Blood Coins/day |
| Intelligence Sharing | 15 | 72h | +5 Table Favor/day |
| Resource Pipeline | 20 | 24h | +500 Armaments, +50 Troopers, +500 Contraband, +100 Intel per day |
| Golden Route | 30 | 48h | +1000 Royal Marks over duration |

- Max 3 active contracts simultaneously
- Contracts auto-complete at end of duration — rewards deposited to global inventory
- Contracts can be cancelled early (no refund of cost)
- **Sandbox+ scaling**: Contract rewards multiplied by `sandboxRewardMultiplier`
- **Save fields**: `postEndgameContracts.active` (array of `{contractId, startedAt, durationMs, costPaid}`), `postEndgameContracts.completedCount` (integer, lifetime total)

---

## Building Max Level & Mastery

| Building Type | Max Level |
|---|---|
| Standard buildings (1–12) | 50 |
| Theme-unique building (#13) | 15 |
| Royal buildings (R1–R6) | 25 |

### Mastery Perk

Reaching max level grants a **permanent mastery perk**: building starts at Lv.5 instead of Lv.0 after each prestige.

### Max Level Alert

- Toast notification: "BUILDING MASTERED"
- Building icon gains gold border
- First-time mastery per theme grants +1 Table Favor bonus

---

## Custom Theme System

> See **Custom Theme System** under Elder Upgrades above for full specification.

- Max 3 custom themes per player
- Full 12+1 building roster (same as canonical themes)
- Unlock via Elder Upgrade (100 Elder Favor) OR Dubai conquest bonus
- Does NOT count toward 7-theme conquest requirement

---

## Daily Contract Board & Login Streaks

### Daily Contracts (Unlocks at Prestige 3)

| Contract | Objective | Reward |
|---|---|---|
| Income Goal | Earn 100× current income/sec in 10 min | +5 Table Favor |
| Event Master | Resolve 5 events without penalties | +50 Blood Coins |
| Staff Trainer | Level up any staff 3 times | +1 Artifact drop chance |
| Theme Hopper | Switch themes 3 times in 1 session | +10 Royal Marks or +15 Table Favor |
| Loyalty Keeper | Keep all assassins above 80% loyalty for 1 hour | +20 Table Favor |
| Building Boom | Purchase 20 building levels in one session | +100 Blood Coins |
| Prestige Sprint | Reach 2× current theme lifetime earnings | +10 Table Favor |

### Login Streak Rewards

| Consecutive Days | Bonus |
|---|---|
| 1 | Normal daily contracts |
| 3 | +25% contract rewards |
| 7 | +50% contract rewards + 1 free Boost Token |
| 14 | +100% contract rewards + 1 random Artifact (Epic) |
| 30 | +100% contract rewards + "Loyal Manager" title + 1 random Artifact (Legendary) |

---

## Boost Tokens

| Token | Effect | Duration | Source |
|---|---|---|---|
| Gold Marker | 3× income on one theme | 5 min | Login streak day 7 |
| Blood Marker | 5× income on one theme | 3 min | Seasonal currency shop (200) |
| Elder Marker | 10× income on all themes | 1 min | Login streak day 30 |

- Not stackable (one active at a time)
- Paused during excommunicado
- Does not persist offline

---

## Power Curve

### Progression Curve & Pacing

| Phase | Real Time | Player Goal | Currency Range |
|---|---|---|---|
| Onboarding | 0–10 min | Select HQ country, first 5 buildings, first staff | 0 → 10K |
| Early | 10–60 min | Fill HQ building roster, hire 1 assassin | 10K → 1M |
| Mid | 1–5 hrs | First prestige, unlock second theme | 1M → 1B |
| Late | 5–20 hrs | 3+ themes active, assassin synergies | 1B → 1T |
| Endgame | 20 hrs+ | High Table meta-grind, dual-currency | 1T → ∞ |

### Pacing Rules

- **First prestige** intentionally reachable in ~1 hour to teach the reset loop
- **Soft wall** every theme — last 2 buildings cost steeply to push toward prestige
- **Offline cap** scales with progression: 4h base → 24h max
- **Excommunicado grace period**: No excommunicados in first 30 minutes of new save or after prestige

### Buy Multipliers

- Buy x1 / x10 / x100 / **Max** (spend all affordable)
- "Buy Max" computes via geometric series:
```
affordableLevels = floor( log( (currency × (g-1) / (baseCost × g^n)) + 1 ) / log(g) )

// Variables:
// g        = costGrowth (1.15 for standard buildings, 1.25/#11, 1.35/#12, 1.5/Royal, 1.18/theme-unique)
// n        = current building level (purchases start from level n)
// baseCost = the building's base cost at level 0 (from building roster table)
// currency = player's current theme currency
```
