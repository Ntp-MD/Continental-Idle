# 04 — Content Design

> Source: Extracted from `Continetal-idle.md`

---

## Units / Characters

### Staff System

| Staff | Hire Cost | Unlock Condition | Effect | Max Level |
|---|---|---|---|---|
| Concierge | 1K | Start | +10% guest income per level | 20 |
| Bartender | 3K | Bar/Lounge built | +10% lounge income per level | 20 |
| Chef | 8K | Kitchen built | +15% kitchen income per level | 15 |
| Cleaner (Disposal) | 15K | Underground built | -5% event penalty per level, -3% Trooper casualty rate per level | 15 |
| Sommelier | 50K | Private Wing upgrade | Unlocks premium guest tiers, +20% VIP income per level | 10 |
| Intelligence Officer | 100K | Intelligence Network built | -3% event cooldown per level, reveals Heat meter, +0.5× Intel generation per level | 10 |
| Adjudicator | 250K | Prestige 3 | +5% prestige favor per level | 10 |
| Vault Keeper | 500K | Continental Vault built | +0.5% interest rate per level, +5% Blood Coin generation per level | 10 |

### Staff Max-Level Special Abilities

| Staff | Max Lv | Special Ability |
|---|---|---|
| Concierge | 20 | Auto-collect guest tips (+5% passive income) |
| Bartender | 20 | Bar income continues during excommunicado (Bar/Lounge only) |
| Chef | 15 | Kitchen boosts ALL building income by +10% |
| Cleaner | 15 | All negative event penalties negated + Trooper casualty rate 0% |
| Sommelier | 10 | VIP guests arrive 50% more frequently |
| Intelligence Officer | 10 | All event outcomes revealed before choosing (no Intel cost) |
| Adjudicator | 10 | Prestige keeps 80% reputation instead of 50% |
| Vault Keeper | 10 | Safe House interest doubles to 4%/min + Vault favor generation ×2 |

### Staff XP Formula

```
xpPerSecond = 0.5 × (1 + staffLevel × 0.05) × (1 + speed × 0.01) × (1 + traitXpMultiplier)
xpToNextLevel = 100 × (1.3 ^ staffLevel)
levelUpCost = hireCost × 0.1 × (1.3 ^ newLevel)
```

- Level-up is **pending** — player must pay `levelUpCost` to confirm
- Unconfirmed XP caps at 200% of threshold

### Staff Hire Cost & Level-Up Cost Table

| Staff | Hire Cost | Max Lv | Lv.2 Cost | Lv.5 Cost | Lv.10 Cost | Lv.15 Cost | Lv.20 Cost |
|---|---|---|---|---|---|---|---|
| Concierge | 1,000 | 20 | 130 | 371 | 1,379 | 5,120 | — |
| Bartender | 3,000 | 20 | 390 | 1,113 | 4,136 | 15,359 | — |
| Chef | 8,000 | 15 | 1,040 | 2,968 | 11,029 | 40,958 | — |
| Cleaner (Disposal) | 15,000 | 15 | 1,950 | 5,565 | 20,680 | 76,797 | — |
| Sommelier | 50,000 | 10 | 6,500 | 18,551 | 68,930 | — | — |
| Intelligence Officer | 100,000 | 10 | 13,000 | 37,102 | 137,858 | — | — |
| Adjudicator | 250,000 | 10 | 32,500 | 92,755 | 344,640 | — | — |
| Vault Keeper | 500,000 | 10 | 65,000 | 185,510 | 689,280 | — | — |

**Formula breakdown:**
```
levelUpCost(L) = hireCost × 0.1 × (1.3 ^ L)
```
- L = the new level being upgraded to (e.g., upgrading from Lv.3 → Lv.4 uses L=4)
- Reroll cost during hire: `hireCost × 0.05 × (rerollCount + 1)` (max 10 rerolls)
- Re-hire after retirement: `hireCost × 0.5`

### Staff Assignment System

| Building | Slots | Best Staff Match |
|---|---|---|
| Reception Desk | 1 | Concierge |
| Guest Rooms | 2 | Concierge, Sommelier |
| Bar/Lounge | 2 | Bartender, Sommelier |
| Kitchen | 1 | Chef |
| Laundry Service | 1 | Any (no bonus) |
| Underground Services | 2 | Cleaner, Intelligence Officer |
| Safe House | 1 | Vault Keeper |
| Armory | 1 | Any (no bonus) |
| Intelligence Network | 1 | Intelligence Officer |
| VIP Penthouse | 2 | Sommelier, Concierge |
| Black Market Vault | 1 | Vault Keeper |
| Continental Vault | 1 | Vault Keeper |

- **Match bonus**: Staff assigned to best match gain +50% XP and effect is +25% stronger
- **Unassigned staff**: 0 XP, no bonus

### Royal Staff (4 New Types)

| Royal Staff | Hire Cost | Unlock | Effect | Max Level |
|---|---|---|---|---|
| Royal Concierge | 10M | Royal Ascension | +15% Royal Reception income per level | 15 |
| Royal Sommelier | 50M | Grand Suite Lv.3 | +30% Grand Suite income per level | 10 |
| Royal Guard | 100M | Royal Armory Lv.1 | -10% event penalty, +5% assassin loyalty per level | 10 |
| Royal Advisor | 250M | Royal Intelligence Lv.1 | +5% Royal Marks generation per level | 10 |

**Royal Staff Level-Up Formula:**
```
royalLevelUpCost(L) = royalHireCost × 0.1 × (1.3 ^ L)
```
- Same formula as standard staff — uses Royal staff's `hireCost` as base
- Example: Royal Advisor Lv.2 = `250M × 0.1 × 1.3 = 32.5M`
- Royal staff use the same XP formula as standard staff (`xpPerSecond`, `xpToNextLevel`)
- Royal staff do NOT gain Veteran status (they don't survive standard prestige resets — Royal Prestige is a separate system)
- Royal staff reroll: `royalHireCost × 0.05 × (rerollCount + 1)` (same as standard)

---

## Character Traits & Stats System

### Stats (4 Core Stats, 20-point budget, range 2–10 per stat)

| Stat | Abbrev | Effect (per point) |
|---|---|---|
| Precision | PRE | +2% ability effectiveness |
| Speed | SPD | +1% XP gain rate |
| Charisma | CHA | +1% loyalty retention / -1% loyalty decay |
| Luck | LCK | +0.5% event reward bonus |

- Stats are fixed at hire, do NOT grow with level
- Can be rerolled once per character for a cost
- **Starting level**: All staff/assassins start at **Lv.1** when hired (Lv.0 is the un-hired state)

### Positive Traits (60% chance each, roll up to 2)

| Trait | Effect |
|---|---|
| Workaholic | +25% XP gain, loyalty decays 50% faster (assassins only) |
| Night Owl | +50% effectiveness during excommunicado events |
| Silver Tongue | +20% loyalty restoration per payment (assassins only) |
| Lucky Charm | +5% artifact drop chance while assigned |
| Perfectionist | +15% ability effectiveness, -10% XP gain |
| Natural Leader | Other staff in same building gain +10% XP (2+ slots) |
| Shadow Touched | +30% synergy bonus effectiveness |
| Bloodhound | +50% event detection (events trigger 10% more frequently) |
| Old Guard | Starts at Lv.3 instead of Lv.1, hire cost +50% |
| Efficient | -20% rehire cost on prestige |

### Negative Traits (30% chance for 1)

| Trait | Effect |
|---|---|
| Lazy | -20% XP gain |
| Hot-Headed | Loyalty decays 2× faster (assassins only) |
| Clumsy | -10% ability effectiveness |
| Superstitious | -15% effectiveness during seasonal events |
| Greedy | +50% rehire cost on prestige |

### Rare Traits (10% chance, replaces one positive)

| Trait | Effect |
|---|---|
| Legendary | All stats +3 (can exceed 10, max 13) |
| Untouchable | Immune to loyalty decay (assassins only) |
| Mentor | All other staff in same theme gain +15% XP |
| Shadow Bond | Can form synergy with ANY assassin |
| Golden Touch | +10% income for the entire theme while assigned |

### Hire Reroll System

- First roll: Free (included in hire cost)
- Staff reroll: `hireCost × 0.05` per reroll (limit 10)
- Assassin reroll: `hireCost × 0.02` per reroll
- Theme-exclusive assassin reroll: `hireCost × 0.05` per reroll

### Special Staff Roles (Theme-Unique Buildings)

Certain theme-unique buildings require specific staff roles. These are **not new staff types** — they are assignments for existing staff:

| Building | Required Role | Qualifying Staff | Effect |
|---|---|---|---|
| Art Gallery (Rome) | Curator | Intelligence Officer or Sommelier | +20% art appreciation rate, reveals AI budget during auctions |
| Trade Post (Casablanca) | Caravan Master | Cleaner or Intelligence Officer | -10% raid risk on all trade routes, +0.1× staff bonus |
| Training Dojo (Osaka) | Sensei | Any staff at Lv.5+ | +50% dojo XP bonus, enables Master's Meditation training |
| Embassy (Paris) | Envoy | Intelligence Officer or Adjudicator | +1 DF generation per minute, -20% DF action costs |
| Fight Arena (Berlin) | Promoter | Bartender or Cleaner | +25% fight win chance, +0.2 passive prestige/hour |
| Royal Suite (Dubai) | Steward | Sommelier or Concierge | VIP guests arrive 20% more frequently, +10% VIP payout |
| Bounty Board (NY) | Handler | Intelligence Officer or Cleaner | Reveals bounty requirements before accepting, +10% bounty rewards |

- Only 1 special role slot per theme-unique building
- Staff assigned to special roles still gain XP at match-bonus rates
- Staff can only hold one role at a time (special role OR standard building assignment)

---

## Veteran Staff System

Staff that survive **3 prestige cycles** gain **Veteran** status:

- Veteran badge (★) on staff card
- Choose 1 of 3 random Veteran Perks:
  - **stat_boost**: +2 to one stat (player chooses)
  - **extra_trait**: Roll a new positive trait
  - **prestige_immunity**: Keeps 10% of level across prestige (starts at Lv.2)
  - **xp_master**: +50% permanent XP gain
  - **loyalty_guard**: Immune to all negative trait effects
- Veteran status is **permanent**
- If player doesn't choose immediately, prompt appears on next prestige

---

## Assassins

### Global Assassins (Available in All Themes)

| Assassin | Rank | Hire Cost | Ability |
|---|---|---|---|
| The Ghost | A | 500K | Auto-resolve 1 event per hour |
| The Hammer | A | 750K | +200% underground services income |
| The Whisper | S | 5M | Reveals upcoming events 30s early |
| The Wolf | S | 8M | +100% staff XP gain for all staff |
| The Shade | S | 15M | Halves excommunicado penalty duration |
| The Bishop | SS | 100M | Unlocks dual-currency trading between themes |
| The Adjudicator's Hand | SS | 500M | +50% Table Favor on prestige reset |

### Assassin Ability Effectiveness Formula

```
abilityEffectiveness = baseAbility × (1 + assassinLevel × 0.10) × (1 + precision × 0.02) × (1 + traitMultiplier)
```
- `baseAbility` = the stated effect (e.g., "+200% underground income" = 3.0 multiplier)
- `assassinLevel` = 1–10, each level adds +10% (multiplicative)
- `precision` = the assassin's Precision stat (0–10), each point adds +2%
- `traitMultiplier` = sum of relevant trait bonuses (e.g., `shadowTouched` = +0.15)

**Auto-Resolve Logic (The Ghost):**
- The Ghost auto-resolves 1 event per hour using a priority cascade:
  1. Maximize immediate income (if an income-positive choice exists)
  2. Minimize reputation loss (if no income option)
  3. Minimize staff/assassin loss (if no income or rep option)
  4. Minimize currency loss (last resort)
- **Awakened Ghost**: Auto-resolves ALL events using the same priority, plus evaluates long-term value (picks choice with highest expected value over 1 hour)
- **Events with no clear optimal** (e.g., Blood Oath wager): Auto-resolve always picks the safe option (skip/decline), never gambles
- **Intelligence Hub upgrade**: Enables manual auto-resolve toggle (player sets priority order)
- Auto-resolve does NOT use the assassin's Precision stat for choice selection — Precision only affects ability magnitude

### Theme-Exclusive Assassins

| Assassin | Theme | Rank | Hire Cost | Ability |
|---|---|---|---|---|
| The Don | New York | S | 10M | +300% Guest Room income |
| The Sculptor | Rome | S | 10M | Auction Night always wins |
| The Serpent | Casablanca | S | 10M | Smuggling runs never fail |
| The Ronin | Osaka | SS | 50M | All staff gain 2× XP in this theme |
| The Diplomat | Paris | SS | 50M | Marker debts reduced by 50% |
| The Butcher | Berlin | SS | 50M | Blood Oath wagers always win |
| The Prince | Dubai | SSS | 250M | +500% VIP Penthouse income |

### Seasonal Assassin: The Reaper

| Stat | Value |
|---|---|
| Rank | SSS |
| Hire Cost | 250M (same as The Prince) |
| Ability | +500% Underground Services income (same stat block as The Prince, different target building) |
| Availability | Blood Moon event only (October, 2 weeks) |
| Cosmetic | Unique seasonal skin (undead/ghost visual) |
| After event (if hired) | Remains permanently, loses seasonal skin, reverts to standard SSS appearance |
| After event (if not hired) | Unavailable until next Blood Moon |
| Power level | Same as The Prince — cosmetic variant only, NOT more powerful |
| Awakening | Can be awakened like other assassins; awakened ability: Underground income also generates Blood Coins |
| Synergy | Functions as SSS-rank for synergy purposes (High Table Shadow, Elder Shadow) |

### Assassin Mechanics

- **Base slots**: 3 per theme (expandable to 6)
- **Loyalty**: 0–100%, decays 1%/min
- **Disloyal** (<30%): May defect and trigger sabotage/theft event
- **Retirement**: Dismiss to recover 30% of hire cost
- **Re-hire**: Previously retired assassins cost 50% of original price
- **Theme-exclusive assassins persist across prestige**
- **XP on prestige**: Theme-exclusive assassin XP is **kept** (not reset). Global assassin XP is also kept.
- **Loyalty on prestige**: All assassins reset to 100% loyalty on prestige (fresh start)
- **Awakening progress**: Synergy trigger count is kept across prestige

### Assassin XP & Leveling

```
assassinXpPerSecond = 0.2 × (1 + assassinLevel × 0.03)
assassinXpToNextLevel = 500 × (1.5 ^ assassinLevel)
```
- Levels 1–10 (max level 10)
- Each level: +10% ability effectiveness (multiplicative)
- Max Level bonus: Eligibility for **Awakening** (requires 10 synergy triggers AND max level)

### Synergy Table

| Pair | Bonus |
|---|---|
| Ghost + Whisper | Events auto-resolved AND predicted — +50% event rewards |
| Hammer + Shade | Underground income immune to excommunicado |
| Wolf + Adjudicator's Hand | Staff XP also generates Table Favor |
| Bishop + any theme-exclusive | Trading rates +15% for that theme |
| Whisper + any Intelligence Officer staff | Intel generation +100% for that theme |
| Shade + any Cleaner staff | Excommunicado duration -25% (stacks with Cleaner) |
| Ghost (solo, no other assassin) | +50% staff XP if no other assassin assigned |
| Any 2 SS-rank | "High Table Shadow" — +25% all income |
| Any 3 S-rank or higher | "Elder Shadow" — +50% all income (replaces High Table Shadow) |

### Assassin Lending

- **Duration**: 10 minutes (real time)
- **Loyalty Impact**: -15% immediately, plus -1% per minute while away
- **Restriction**: Cannot lend below 30% loyalty, cannot lend last active assassin
- **If receiving theme prestiges**: Auto-recalled (loyalty -5%)
- **Lent assassins gain XP** at 50% rate
- **Lent assassins do NOT contribute to synergy** in receiving theme

### Assassin Awakening

After 10 synergy triggers + max level:

| Awakened Assassin | New Rank | Secondary Ability |
|---|---|---|
| Awakened Ghost | S | Auto-resolve picks best choice |
| Awakened Hammer | S | Underground income also generates Table Favor |
| Awakened Whisper | SS | Predicted events can be cancelled for free |
| Awakened Wolf | SS | Staff at max level gain "Prestige XP" → Table Favor |
| Awakened Shade | SS | Excommunicado grants +50% income instead of 0 |
| Awakened Bishop | SSS | Trading fee 0%, all rates +10% favorable |
| Awakened Adjudicator's Hand | SSS | Prestige auto-triggers at optimal moment |

- If BOTH assassins in a synergy pair are awakened, synergy bonus is **doubled**
- "Awakened Trio": Any 3 awakened SS-rank → "Elder Shadow" — +50% all income

---

## Locations / Chapters

### Continental Branches (7 Themes)

| Theme | City | Currency | Special Mechanic |
|---|---|---|---|
| New York | NYC, USA | Gold Coins | Excommunicado events — bounty contracts |
| Rome | Rome, Italy | Lira Tokens | Underground art market — auction minigame |
| Casablanca | Casablanca, Morocco | Desert Marks | Smuggling routes — trade route multiplier |
| Osaka | Osaka, Japan | Sakura Credits | Assassin dojo — train staff for bonuses |
| Paris | Paris, France | Euro Marks | High Table diplomacy — political favor |
| Berlin | Berlin, Germany | Iron Marks | Underground fight club — combat prestige |
| Dubai | Dubai, UAE | Dinar Coins | Luxury clientele — premium guest tiers |

### Building Roster (12 Standard + 1 Theme-Unique)

| # | Building | Base Rate | Base Cost | Unlock |
|---|---|---|---|---|
| 1 | Reception Desk | 1/s | 0 (free) | Start |
| 2 | Guest Rooms | 5/s | 50 | 50 coins |
| 3 | Bar/Lounge | 15/s | 500 | 500 coins |
| 4 | Kitchen | 40/s | 2,000 | 2K |
| 5 | Laundry Service | 100/s | 8,000 | 8K |
| 6 | Underground Services | 300/s | 25,000 | 25K |
| 7 | Safe House | 800/s | 75,000 | 75K |
| 8 | Armory | 2K/s | 200,000 | 200K |
| 9 | Intelligence Network | 5K/s | 600,000 | 600K |
| 10 | VIP Penthouse | 15K/s | 2,000,000 | 2M |
| 11 | Black Market Vault | 50K/s | 10,000,000 | 10M |
| 12 | Continental Vault | 200K/s | 100,000,000 | 100M |
| 13 | Theme-Unique Building | 500K/s | 500,000,000 | 500M (theme currency) |

**Cost Formula:**
```
cost(n) = baseCost × costGrowth[buildingIndex] ^ n    (where n = current building level)
```
- `costGrowth` is per-building-index: #1–#10 = 1.15, #11 = 1.25, #12 = 1.35, #13 = 1.18
- Buying multiple levels at once sums each level's cost: `totalCost = Σ baseCost × costGrowth[buildingIndex]^(level+i)` for i in 0..count-1
- `BUILDING_GROWTH = 1.07` (income growth per level, same for all buildings)

### Theme-Unique Buildings

| Theme | Building | Special Mechanic |
|---|---|---|
| New York | Bounty Board | Rotating bounty contracts (3 active) |
| Rome | Art Gallery | Art appreciation + auction events |
| Casablanca | Trade Post | 3 trade routes with multipliers |
| Osaka | Training Dojo | Passive assassin/staff XP generation |
| Paris | Embassy | Diplomatic favor meter |
| Berlin | Fight Arena | Passive prestige from fight events |
| Dubai | Royal Suite | VIP guest rotation with high payouts |

### Royal Buildings (6 Premium)

| # | Building | Base Rate | Base Cost | Cost Growth | Unlock | Special |
|---|---|---|---|---|---|---|
| R1 | Royal Reception | 10K/s | 1B | 1.5 | Royal Ascension | 10× standard Reception income |
| R2 | Grand Suite | 50K/s | 5B | 1.5 | R1 Lv.5 | Premium guests with guaranteed high payouts |
| R3 | Royal Vault | 200K/s | 10B | 1.5 | R2 Lv.5 | Generates Royal Marks + Table Favor |
| R4 | Royal Armory | 1M/s | 25B | 1.5 | R3 Lv.5 | Boosts all assassins globally by +50% |
| R5 | Royal Intelligence | 5M/s | 50B | 1.5 | R4 Lv.5 | Reveals all event outcomes before choosing |
| R6 | The Throne Room | 20M/s | 100B | 1.5 | R5 Lv.5 | Generates Elder Favor passively |

**Royal Building Cost Formula:**
```
royalCost(n) = royalBaseCost × 1.5^n    (where n = current building level)
```
- Escalating base costs per building create natural progression
- Growth rate 1.5 (vs standard 1.15) — steeper but not punishing like 2.0
- R1 Lv.25 ≈ 25.2T, R6 Lv.25 ≈ 2.52Qa — achievable at Royal endgame income levels

### World Map Node Coordinates

| Continental | Lat | Lon |
|---|---|---|
| New York | 40.7128 | -74.0060 |
| Rome | 41.9028 | 12.4964 |
| Casablanca | 33.5731 | -7.5898 |
| Osaka | 34.6937 | 135.5023 |
| Paris | 48.8566 | 2.3522 |
| Berlin | 52.5200 | 13.4050 |
| Dubai | 25.2048 | 55.2708 |

---

## Events

### Full Event Roster

| Event | Trigger | Choice / Resolution | Reward | Penalty |
|---|---|---|---|---|
| Contract Open | Underground services active | Accept / Decline | 2× income for 90s (3× with Bounty Board) | Lose 1 staff if no Cleaner |
| Excommunicado | Random, scales with income | Wait or pay tribute | — | Income 0 for 60s |

**Excommunicado Tribute Cost:**
```
tribute = max(currentIncomePerSec × 60, themeCurrency × 0.05)
```
- Scales with both income rate (60s of income) and current cash (5% of currency)
- `max()` ensures tribute is always meaningful — never trivially cheap
- Early game: ~60s of income (painful but survivable)
- Late game: 5% of currency ensures it can't be gamed by keeping cash low
- Paying tribute: Excommunicado ends immediately, -5 Reputation
- Waiting: Income = 0 for full duration (reducible via staff/assassins), +10 Reputation on survival
| High Table Summons | Every 3rd prestige | Pay tribute or refuse | Keep prestige bonus | Lose 25% Table Favor |
| Marker Called In | Random favor debt | Mini-objective | Permanent +5% income | Marker debt accrues |
| Sommelier Visit | Premium wing unlocked | Staff Sommelier in time | Income burst | Missed opportunity |
| Gold Coin Rush | Rare, NY only | Tap-collect minigame | Bonus coins | — |
| Blood Oath | Berlin fight club | Wager currency | 2× wager | Lose wager |
| Auction Night | Rome art market | Bid against AI | Rare permanent boost | Overpay risk |
| Smuggling Run | Casablanca routes | Choose route risk | Route multiplier | Confiscation |
| Dojo Challenge | Osaka | Train or skip | +50% staff XP for 5 min | Lose 10% assassin loyalty |
| Diplomatic Incident | Paris | Negotiate or fight | +2 Table Favor | Lose 1 staff for 10 min |
| Royal Guest Arrival | Dubai | Host or reject | 10× VIP income for 2 min | -20% VIP income for 1 hr |

### Event Mechanic Details

#### Sommelier Visit

- **Trigger**: Private Wing upgrade purchased, Sommelier staff hired
- **Time window**: 30 seconds to assign Sommelier to VIP Penthouse
- **Income burst formula**: `burstAmount = currentIncomePerSec × 60 × (1 + sommelierLevel × 0.2)`
  - Example: 1K/s income, Sommelier Lv.5 → `1000 × 60 × 2.0 = 120K` burst
- **If missed**: No penalty, but no reward. Next Sommelier Visit in 30–60 min.
- **Cooldown**: 30–60 min random

#### Gold Coin Rush

- **Trigger**: Rare (5% base weight), New York only
- **Mechanic**: 10-second tap-collect minigame — gold coins appear at random positions on screen, player taps to collect
- **Spawn rate**: 1 coin per 0.5s (max 20 coins in 10s)
- **Coin value**: `baseValue = currentIncomePerSec × 5` per coin
- **Total possible**: `20 × currentIncomePerSec × 5 = 100× income/sec`
- **Auto-collect**: If The Ghost is assigned, auto-collects 50% of coins automatically
- **If ignored**: Coins disappear after 10s, no penalty

#### Auction Night

- **Trigger**: Rome only, Art Gallery built (10% base weight)
- **AI bidding logic**:
  - AI has a **budget** = `artItemBaseCost × random(0.8, 1.5)`
  - AI **bid increment** = `currentBid × random(0.05, 0.15)`
  - AI **max bids** = `random(3, 7)` rounds before dropping out
  - AI **bluff chance**: 20% to bid above budget (then forced to drop next round)
- **Player actions**: Bid (match + increment) or Pass
- **Starting price**: `artItemBaseCost × 0.5`
- **Win**: Player gets the art item (added to Art Gallery inventory for appreciation)
- **Overpay risk**: If final bid > `artItemBaseCost × 1.3`, player overpays (item still acquired but at a loss vs. appreciation value)
- **The Sculptor**: If hired, Auction Night always wins at `artItemBaseCost × 0.8` (AI never outbids)

#### Marker Called In

- **Trigger**: Random favor debt (10% base weight, +3 per Heat level)
- **Mini-objective types** (randomly selected):

| Objective | Requirement | Time Limit |
|---|---|---|
| Income Target | Earn 50× current income/sec | 60s |
| Building Purchase | Buy 5 building levels | 90s |
| Staff Assignment | Assign 2 staff to buildings | 30s |
| Event Resolution | Resolve 1 event successfully | Next event |
| Loyalty Check | Raise any assassin loyalty by 10% | 120s |

- **Success**: Permanent +5% income for this theme (stacks per resolved marker)
- **Failure/Ignore**: Marker debt accrues (`baseDebt = 10K × (1 + prestigeLevel × 0.1)`)
- **The Diplomat**: If assigned, auto-resolves markers at 50% effectiveness (+2.5% income, no debt)

#### High Table Summons

- **Trigger**: Every 3rd prestige (global, not per-theme)
- **Tribute formula**: `tributeAmount = totalTableFavor × 0.25 × (1 + totalPrestige × 0.02)`
  - Example: 50 Favor, 12 total prestige → `50 × 0.25 × 1.24 = 15.5 → 16 Table Favor`
- **Pay tribute**: Lose the calculated amount, keep prestige bonus (+20 reputation)
- **Refuse**: Lose 25% of total Table Favor, gain +50 reputation (defiance)
- **Choice is strategic**: Paying is cheaper at low favor; refusing is cheaper at high favor

#### Assassin Defection Event

When an assassin's loyalty drops below 30% (`defectionThreshold`), there is a chance of defection:

```
defectionChancePerMinute = (30 - currentLoyalty) × 0.02
```
- At 29% loyalty: 0.02/min (2%)
- At 15% loyalty: 0.30/min (30%)
- At 0% loyalty: 0.60/min (60%)

**If defection triggers**, one of two random events occurs:

| Event | Probability | Effect |
|---|---|---|
| Sabotage | 60% | One random building loses 5 levels. Income drops until rebuilt. -25 Reputation. |
| Theft | 40% | Lose 10% of current theme currency. -25 Reputation. Assassin is gone (must re-hire at 50% cost). |

- **Prevention**: Pay loyalty bonus before threshold, or have Shadow max skill (assassins never defect)
- **The Shade**: Immune to defection (loyalty never drops below 30%)
- **Untouchable trait**: Immune to loyalty decay entirely

### Underworld Events

| Event | Trigger | Choice | Reward | Penalty |
|---|---|---|---|---|
| Arms Deal | Armory Lv.5+ | Buy / Sell / Refuse | Armaments at 50% discount | Heat +2 if refused |
| Trooper Recruitment | Safe House Lv.3+ | Hire / Decline | +5–10 Troopers | -50 Blood Coins if hired |
| Contraband Shipment | Underground Lv.5+ | Accept / Refuse | +200 Contraband | Heat +3 if accepted |
| Intel Leak | Intelligence Lv.5+ | Act / Ignore | Preview next 3 events | -10 Intel if ignored |
| Underworld Auction | Black Market Lv.3+ | Bid / Pass | Rare artifact or resource bundle | Lose bid amount if overpay |
| Raid Warning | Random, Heat 5+ | Defend / Flee | Keep all resources if defended | Lose 20% resources if flee |
| Blood Coin Laundering | Black Market Lv.5+ | Launder / Skip | Convert 500 theme currency → 50 Blood Coins | Heat +1 if laundered |

### Event Engine Rules

- **Weighted random** — each event has a weight; theme-locked events only fire in their theme
- **Cooldown** — global event cooldown prevents spam (min 45s between events)
- **Escalation** — ignoring events raises a "Heat" meter
- **Auto-resolve** — assassins/upgrades can auto-pick optimal choice

### Event Probability Weights

| Event | Base Weight | Heat Modifier | Theme Lock |
|---|---|---|---|
| Contract Open | 25 | +5 per Heat level | None (global) |
| Excommunicado | 15 | +10 per Heat level | None (global) |
| High Table Summons | 5 | +0 | None (global) |
| Marker Called In | 10 | +3 per Heat level | None (global) |
| Sommelier Visit | 8 | -2 per Heat level | None (global) |
| Gold Coin Rush | 5 | +0 | New York only |
| Blood Oath | 10 | +5 per Heat level | Berlin only |
| Auction Night | 10 | +0 | Rome only |
| Smuggling Run | 10 | +0 | Casablanca only |
| Dojo Challenge | 8 | +0 | Osaka only |
| Diplomatic Incident | 8 | +3 per Heat level | Paris only |
| Royal Guest Arrival | 5 | -2 per Heat level | Dubai only |

```
eventProbability = eventWeight / totalWeightSum
heatLevel = min(10, floor(ignoredEvents / 5))
heatDecay = -1 Heat per resolved event
heatPassiveDecay = -1 Heat per 10 minutes
```

---

## Theme-Specific Persistent Mechanics

### New York — Bounty Board System

- 3 rotating bounty slots, refresh every 15 minutes

| Bounty | Requirement | Reward |
|---|---|---|
| Quick Hit | Reach X income in 60s | +50% income for 5 min |
| Clean Sweep | Resolve 2 events without penalty | +10 Table Favor |
| Ghost Hunt | Assassin at 90%+ loyalty for 5 min | +1 Artifact drop chance |
| Blood Work | Survive 1 excommunicado | +25 Reputation |
| The Long Game | Earn 10× current income/sec in 5 min | +100% assassin XP for 10 min |

### Rome — Art Gallery / Auction System

| Art Item | Base Cost | Appreciation Rate | Max Holding | Sell Multiplier |
|---|---|---|---|---|
| Renaissance Painting | 10M | +2%/hr | 72h | 1.5× |
| Marble Sculpture | 25M | +1.5%/hr | 96h | 1.8× |
| Antique Coin Collection | 5M | +3%/hr | 48h | 1.3× |
| Rare Manuscript | 50M | +1%/hr | 120h | 2.0× |
| Stolen Masterpiece | 100M | +5%/hr | 24h | 2.5× (15% confiscation risk) |

**Art Gallery Implementation Details:**

- **Inventory Cap**: 5 art items max (expandable to 10 via Curator staff level — +1 slot per 2 levels)
- **Sell Artwork UI**: Each art item in inventory shows a [SELL] button with live current value preview. Selling instantly converts to theme currency at `currentValue × sellMultiplier` (if at max holding time) or proportional fraction thereof
- **Appreciation Formula**:
  ```
  currentValue = baseCost × (1 + appreciationRate × hoursHeld) × (1 + galleryLevel × 0.05)
  ```
- **Max Holding Time behavior**: Art does NOT expire or disappear. After `maxHolding` hours, appreciation **stops growing** — the item holds its peak value indefinitely until sold
- **Stolen Masterpiece risk**: 15% chance per hour of confiscation (item lost, -10 Reputation). Risk checked every hour while in inventory
- **Auction Events**: Every 30 minutes, a random auction offer appears — buy below market or sell above market. AI bidding budget scales with theme prestige
- **Curator staff bonus**: Assigning a staff member as Curator boosts appreciation by +0.5%/hr per level and reveals AI budget during auctions
- **Art Gallery passive**: Even without active items, generates 0.5% of gallery level as bonus guest income

### Casablanca — Trade Post System

| Route | Duration | Base Multiplier | Risk | Staff Bonus |
|---|---|---|---|---|
| Mediterranean Circuit | 30 min | ×1.5 income | Low (5% raid) | +0.1× per staff level |
| Trans-Saharan Trail | 60 min | ×2.5 income | Medium (15% raid) | +0.2× per staff level |
| Silk Road Express | 120 min | ×4.0 income | High (25% raid) | +0.3× per staff level |

### Osaka — Training Dojo System

| Training Type | Duration | XP Bonus | Requirements |
|---|---|---|---|
| Basic Drill | 15 min | +50% XP | None |
| Advanced Technique | 30 min | +100% XP | Dojo Lv.3+ |
| Master's Meditation | 60 min | +200% XP | Dojo Lv.5+ + S-rank+ assassin |

### Paris — Diplomatic Favor System

**DF Generation:**
```
dfPerMinute = 0.5 × (1 + embassyLevel × 0.1) × (1 + envoyAssigned × 1.0)
```
- Base: 0.5 DF/min (3/hour) with Embassy at Lv.1 and no Envoy assigned
- Embassy Lv.10, no Envoy: `0.5 × 2.0 = 1.0 DF/min` (60/hour)
- Embassy Lv.10, Envoy assigned: `0.5 × 2.0 × 2.0 = 2.0 DF/min` (120/hour)
- DF does NOT generate during excommunicado
- DF is per-theme (Paris only), not global
- DF cap: 200 (scales with Embassy level: `100 + embassyLevel × 10`)

| Action | DF Cost | Effect |
|---|---|---|
| Forgive Marker Debt | 5 | Clear 1 marker debt in any theme |
| Temporary Ceasefire | 10 | No negative events for 5 minutes |
| Reputation Boost | 15 | +50 Reputation to any theme |
| Favor Trade | 20 | Convert 10 DF into 1 Table Favor |
| Diplomatic Immunity | 30 | Next excommunicado auto-resolved |

### Berlin — Fight Arena System

```
winChance = 0.3 + (assassinLevel × 0.03) + (assassinRankBonus) + (loyalty × 0.001)

// assassinRankBonus by rank:
// A:   +0.05
// S:   +0.10
// SS:  +0.15
// SSS: +0.20
//
// Example: Lv.7 S-rank, 80% loyalty:
// 0.3 + (7 × 0.03) + 0.10 + (80 × 0.001) = 0.3 + 0.21 + 0.10 + 0.08 = 0.69 (69% win chance)
```
- Win: +0.5 prestige points (fractional)
- Loss: -10% assassin loyalty, -5 Reputation
- Passive: 0.1 prestige points per hour

### Dubai — Royal Suite System

| VIP Tier | Arrival Interval | Base Payout | Duration |
|---|---|---|---|
| Business VIP | Every 15 min | 50× income/sec | 2 min |
| Diplomat VIP | Every 45 min | 200× income/sec | 3 min |
| Royal VIP | Every 2 hr | 1000× income/sec | 5 min |
| Continental VIP | Every 6 hr | 5000× income/sec | 10 min |

---

## Unlockables

### Achievements & Meta-Goals

| Category | Example | Reward |
|---|---|---|
| Income | Reach 1M in NY | +2% global income |
| Prestige | First Ascension | Unlock auto-buy |
| Assassins | Hire all SS-rank | Cosmetic badge |
| Events | Survive 100 excommunicados | Permanent penalty -10% |
| Collection | Unlock all 7 themes | "High Table Member" title |
| Hidden | Defect an assassin then re-hire | Lore unlock |
| Traits | Hire a character with Legendary trait | "Eye for Talent" title |
| Traits | Hire 5 characters with rare traits | +1 stat budget (21 instead of 20) |
| Veteran | Earn 3 Veteran staff across any themes | "Old Guard" title + +5% staff XP global |
| Stats | Max a single stat to 10 on any character | "Perfectionist" title |

### Artifact System

Artifacts are **global** — equipped to the player account, not to a specific theme. Effects flagged "this theme" apply only to the currently active theme.

#### Artifact Slots

Start with 1 slot unlocked. Additional slots unlock at total prestige milestones:

| Slot # | Unlock Condition |
|---|---|
| 1 | Default (no requirement) |
| 2 | Total Prestige 5 |
| 3 | Total Prestige 15 |
| 4 | Total Prestige 30 |
| 5 | Total Prestige 50 |
| 6 | Total Prestige 80 |

#### Drop Chance Mechanics

Artifacts use a two-step roll on every event resolution:

**Step 1 — Does an artifact drop?**
```
dropChance = baseDropRate × eventRarityMultiplier × reputationMultiplier
baseDropRate = 0.5%
eventRarityMultiplier = 1.0 (normal events), 2.0 (theme-locked events), 3.0 (seasonal events)
reputationMultiplier = 1 + (reputation / 1000)   // up to 2× at Sovereign
```

**Step 2 — What rarity drops? (if Step 1 triggers)**
```
Common:    60% weight
Uncommon:  28% weight
Epic:      10% weight
Legendary:  1.8% weight
Mythic:     0.2% weight
```

**"Staff Trainer" daily contract** reward "+1 Artifact drop chance" = `baseDropRate +1%` for the **next single event** resolved by any theme. The bonus is consumed on the next event resolution regardless of outcome.

#### Rarity Tier Effects

| Rarity | Forging Input | Forging Output | Typical Effect Magnitude |
|---|---|---|---|
| Common | 3× Common | 1× Uncommon | Small single-theme bonus |
| Uncommon | 3× Uncommon | 1× Epic | Moderate global or multi-theme bonus |
| Epic | 3× Epic | 1× Legendary | Strong global permanent bonus |
| Legendary | 3× Legendary | 1× Mythic | Major systemic bonus |
| Mythic | Cannot forge further | — | Transformative permanent effect |

#### Forging Costs

| Upgrade | Table Favor Cost | Theme Currency Cost |
|---|---|---|
| 3× Common → 1× Uncommon | 10 | 100M |
| 3× Uncommon → 1× Epic | 50 | 500M |
| 3× Epic → 1× Legendary | 100 | 1B |
| 3× Legendary → 1× Mythic | 200 | 10B |

- Forging always produces the **next rarity tier** of the same artifact type
- Cross-artifact forging is NOT supported — 3 duplicates of the same artifact only
- Forged artifact effects do **not** stack with the original — the original is consumed

#### Artifact Inventory Cap & Overflow

- **Total inventory cap**: 30 artifacts (equipped + unequipped combined)
- When a drop would exceed the cap:
  - **Common / Uncommon**: Auto-converted to Blood Coins (Common = 100 BC, Uncommon = 250 BC). Toast notification shown.
  - **Epic**: Player must manually clear space within 60 seconds or it converts to 1,000 BC.
  - **Legendary / Mythic**: Drop is banked in a "Pending Artifacts" queue — player must manage inventory before claiming. Queue max: 3.
- **UI**: Artifact screen shows inventory count and remaining slots. Sort options: by rarity, by source, by equipped status.

#### Full Artifact Table

**Common Artifacts** (drop from any event, 60% of drops)

| Artifact | Effect |
|---|---|
| The Brass Token | +2% income this theme |
| The Service Bell | +5% staff XP this theme |
| The Keycard | -5% building costs this theme |
| The Black Phone | +3% event reward bonus globally |
| The Red Ledger | +1% reputation gain this theme |

**Uncommon Artifacts** (28% of drops)

| Artifact | Effect |
|---|---|
| The Gold Revolver | +10% income globally |
| The Iron Safe | +15% offline earnings |
| The Shadow Cloak | -15% event penalties globally |
| The Brass Crown | +20% prestige favor gain |
| The Wax Seal | +10% Blood Coin generation globally |

**Epic Artifacts** (10% of drops; guaranteed Epic from Seasonal Currency Shop or login Day 14)

| Artifact | Drop Source | Effect |
|---|---|---|
| The Gold Coin | Gold Coin Rush event (NY) | +1% global income per prestige level |
| The Blood Marker | Marker Called In (any) | Marker debts generate Blood Coins |
| The Manager's Watch | Any event, Prestige 10+ | -15% event cooldown globally |
| The Continental Badge | Complete 5 daily contracts | +1 staff slot (this theme, permanent) |

**Legendary Artifacts** (1.8% of drops; guaranteed Legendary from login Day 30)

| Artifact | Drop Source | Effect |
|---|---|---|
| The Crimson Ledger | Achievement: 50 total prestige | See all event probabilities in real-time |
| The Continental Key | Takeover any theme | +25% takeover progress speed |
| The High Table Invite | Form 3 alliances | All alliance contract rewards +50% |

**Mythic Artifacts** (0.2% of drops; fixed sources only)

| Artifact | Drop Source | Effect |
|---|---|---|
| The Elder Seal | Super Prestige | Elder Favor earned 3× faster |
| Baba Yaga's Pencil | Hidden achievement (hire + re-hire same assassin) | +1000% income for 1 random building (re-rolls on prestige) |

### Seasonal Events

| Season | Duration | Theme | Exclusive Content |
|---|---|---|---|
| Blood Moon | 2 weeks, Oct | All themes | Halloween — undead assassins, 2× excommunicado, "The Reaper" SSS assassin |
| Continental Gala | 2 weeks, Dec | All themes | Holiday — gift exchange, cosmetics, bonus Table Favor |
| Shadow War | 1 month, Mar | All themes | Solo challenge — fastest takeover speed records |
| The Reckoning | 2 weeks, Jun | Endgame only | Elder-tier challenge — escalating events for 24 hrs |

#### Seasonal Event Mechanics

**Blood Moon (October, 2 weeks):**
- Excommunicado event frequency doubled (cooldown halved from 45s to 22.5s)
- Excommunicado duration doubled (60s → 120s)
- Special "Undead Hunt" events replace standard events — higher risk, higher reward
- "The Reaper" SSS assassin available for hire at 250M (same stats as The Prince, cosmetic skin)
- Seasonal currency: "Blood Tokens" — earned 5–20 per resolved seasonal event
- All themes affected simultaneously

**Continental Gala (December, 2 weeks):**
- "Gift Exchange" event: Each theme sends a gift to a random other theme — both receive +10% income for 1 hour
- Bonus Table Favor: All prestige during event grants +50% favor
- Daily login bonus doubled during event
- Seasonal currency: "Gala Coins" — earned 5–20 per gift exchange participated in
- Exclusive cosmetics: Holiday theme skins for all 7 Continentals

**Shadow War (March, 1 month):**
- Solo speedrun challenge: Takeover timer tracked, personal best recorded per theme
- "Shadow Surge" events: Time-limited income bursts (×5 for 30s) trigger every 5 minutes
- Personal best tracking only (single-player, no leaderboard)
- Seasonal currency: "War Medals" — earned 5–20 per Shadow Surge collected
- Title "Shadow War Champion" awarded for beating your own personal best by 20%+

**The Reckoning (June, 2 weeks, Endgame only):**
- Requires: At least 1 conquered theme (Prestige 80+)
- 24-hour survival challenge: Events escalate every hour (weight increases 10% per hour)
- Heat meter starts at 5 and cannot drop below 3 during challenge
- Surviving 24 hours grants exclusive "Elder Assassin" (SSS rank, unique ability: +1000% income for 1 random building)
- Seasonal currency: "Elder Sigils" — earned 10–20 per hour survived

#### Seasonal Currency Shop

| Purchase | Cost (Seasonal Currency) | Type |
|---|---|---|
| Theme Skin: Holiday | 500 | Cosmetic (all themes) |
| Assassin Skin: The Reaper | 1000 | Cosmetic (seasonal assassin skin) |
| Boost Token: Gold Marker | 200 | Consumable (3× income one theme, 5 min) |
| 10 Table Favor | 300 | Currency exchange |
| Title: "Blood Moon Survivor" | 800 | Cosmetic title |
| Title: "Shadow War Champion" | 800 | Cosmetic title (requires top 10% record) |
| 50 Blood Coins | 150 | Currency exchange |
| Seasonal Lore Entry | 100 | Collectible (Manager's Ledger) |
| Random Artifact (Epic) | 2000 | Rare drop (guaranteed Epic) |

- Seasonal currency does **not** carry over between seasons — spend it before the event ends
- Shop is accessible during the active season only

### Continental Alliance System (Single-Player AI)

The alliance system is entirely single-player — all allies are AI-controlled Continentals:

- Form alliances with AI-controlled Continentals
- Max 3 active alliances
- Formation cost: 25 Table Favor per alliance
- Maintenance: 2 Table Favor per day per alliance

#### AI Continental Generation

Each AI ally is procedurally generated with a manager name, city location, and trait:

**Name format**: `"[FirstName] [LastName] — [City] Continental"` (e.g., "Victor Cross — Shanghai Continental")

**First Name Pool**: Victor, Marcus, Elena, Nikolai, Akira, Sofia, Rashid, Chen, Isabella, Dmitri, Amara, Hiro, Lena, Omar, Yuki, Sven, Maya, Khalid, Nadia, Pietro

**Last Name Pool**: Cross, Volkov, Tanaka, Moreau, Castellano, Petrov, Nakamura, Dubois, Romano, Eriksson, Khan, Chen, Silva, Mueller, Kowalski, Costa, Al-Rashid, Fontaine, Bergstrom, Iwasaki

**City Pool**: Shanghai, Moscow, Istanbul, Mumbai, Sao Paulo, Cairo, Bangkok, Seoul, Lagos, Buenos Aires, Sydney, Toronto, Mexico City, Jakarta, Tehran, Singapore, Stockholm, Amsterdam, Vienna, Prague, Nairobi, Lima, Hanoi, Athens, Warsaw

**Reroll**: Player can reroll an AI Continental's name and trait once per alliance for 5 Table Favor

#### AI Continental State Properties

Each AI Continental has the following state object:

```json
{
  "id": "ally_001",
  "managerName": "Victor Cross",
  "city": "Shanghai",
  "trait": "Mercantile",
  "formedAt": 1234567890,
  "status": "active",
  "contractsCompleted": [],
  "contractCooldowns": {},
  "suspended": false
}
```

| Property | Type | Description |
|---|---|---|
| `id` | string | Unique ally ID (auto-incremented) |
| `managerName` | string | Generated first + last name |
| `city` | string | Random city from pool |
| `trait` | enum | Mercantile / Militant / Scholarly / Diplomatic / Neutral |
| `formedAt` | timestamp | When alliance was formed |
| `status` | enum | `active` / `suspended` / `broken` |
| `contractsCompleted` | array | One-time contracts already done (Knowledge Exchange, Trade Route) |
| `contractCooldowns` | object | Map of contract ID → cooldown end timestamp |
| `suspended` | boolean | True when maintenance favor insufficient |

#### Alliance Contracts

| Mission | Requirement | Reward | Cooldown |
|---|---|---|---|
| Supply Run | Both themes at building Lv.10+ | +20% income to both for 1 hour | 6h |
| Joint Defense | Survive 3 excommunicados | +50% event reward for 2 hours | 12h |
| Knowledge Exchange | Both themes at Prestige 7+ | +25% staff XP permanently | One-time |
| Trade Route | Both themes have Safe House | Direct currency transfer (no fee) | One-time |

#### Alliance Contract Progress Tracking

- **Per-alliance tracking**: Each alliance tracks its own contract progress independently
- **Joint Defense**: Excommunicado survivals count toward the alliance whose contract is active. If 3 alliances all have active Joint Defense contracts, a single excommunicado survival counts toward **all 3** simultaneously (parallel progress)
- **Supply Run**: Checked at activation — both themes must meet building Lv.10+ requirement at that moment. No progress tracking needed (instant activation)
- **Knowledge Exchange / Trade Route**: One-time, checked at activation. No progress tracking
- **Progress storage**: Stored in `alliances.contractProgress[allyId][contractId]` as a counter
- **Theme scope**: Excommunicado survivals in **any** of the player's themes count toward Joint Defense (not limited to allied themes)

#### AI Continental Traits

| Trait | Effect |
|---|---|
| Mercantile | Supply Run rewards +50% |
| Militant | Joint Defense rewards +50% |
| Scholarly | Knowledge Exchange rewards +50% |
| Diplomatic | Trade Route fee reduction +5% |
| Neutral | All contract rewards +10% |

---

## Reputation System

### Reputation Tiers

| Tier | Rep Range | Bonus |
|---|---|---|
| Unknown | 0–99 | No bonus |
| Respected | 100–299 | +10% income this theme |
| Feared | 300–499 | Events less frequent (-20% weight) |
| Legendary | 500–749 | +1 staff slot, +1 assassin slot |
| Continental Elite | 750–999 | All positive events 2× rewards |
| Sovereign | 1000 | Required for theme takeover |

### Reputation Changes

| Action | Rep Change |
|---|---|
| Successfully resolve event | +5 |
| Prestige this theme | +20 |
| Survive excommunicado without paying | +10 |
| Pay tribute to end excommunicado | -5 |
| Assassin defects | -25 |
| Fail event (bad choice) | -10 |
| Ignore event | -15 |
| Theme-specific event success | +2 |
| Underworld event success | +1 |
| Alliance contract completed | +5 |
| Assassin reaches max level | +10 |
| Artifact drop received | +3 |

### Theme-Specific Event Reputation Outcomes

| Event | Outcome | Reputation Change |
|---|---|---|
| Auction Night (Rome) | Win auction | +8 |
| Auction Night (Rome) | Overpay (bid > 1.3× base) | -3 |
| Auction Night (Rome) | Pass / no bid | 0 |
| Smuggling Run (Casablanca) | Successful route completion | +5 |
| Smuggling Run (Casablanca) | Confiscation (raid failed) | -10 |
| Blood Oath (Berlin) | Win wager | +12 |
| Blood Oath (Berlin) | Lose wager | -8 |
| Dojo Challenge (Osaka) | Complete training | +5 |
| Dojo Challenge (Osaka) | Skip / fail | -5 (assassin loyalty -10%) |
| Diplomatic Incident (Paris) | Negotiate successfully | +6 |
| Diplomatic Incident (Paris) | Fight (lose staff) | -8 |
| Royal Guest Arrival (Dubai) | Host successfully | +10 |
| Royal Guest Arrival (Dubai) | Reject guest | -5 |
| Gold Coin Rush (New York) | Collect any coins | +2 |
| Gold Coin Rush (New York) | Ignore (coins expire) | 0 |
| Bounty Board (New York) | Complete bounty objective | +5 |
| Bounty Board (New York) | Fail bounty objective | -3 |

### Reputation Decay

```
repDecayPerHour = max(1, floor(currentRep × 0.02))
```
- Only applies when theme is **not active**
- Feared tier: Decay reduced by 50%
- Sovereign: No decay (permanent)
