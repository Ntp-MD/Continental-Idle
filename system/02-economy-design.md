# 02 — Economy Design

> Source: Extracted from `Continetal-idle.md`

---

## Currencies

### Theme Currencies (Per-Theme)

Each of the 7 Continental branches has its own local currency:

| Theme | Currency |
|---|---|
| New York | Gold Coins |
| Rome | Lira Tokens |
| Casablanca | Desert Marks |
| Osaka | Sakura Credits |
| Paris | Euro Marks |
| Berlin | Iron Marks |
| Dubai | Dinar Coins |

- Earned passively from buildings
- Lost on prestige (10% converted to Table Favor as severance)
- Can be traded between themes via The Bishop (dual-currency trading)

### Meta-Currencies (Global)

| Currency | Source | Scope | Resets On |
|---|---|---|---|
| Table Favor | Prestige reset | Global (all themes) | Never (only spent) |
| Elder Favor | Super Prestige | Global | Never |
| Royal Marks | Royal Vault building | Global (Royal only) | Never |
| Royal Favor | Royal Prestige | Global (Royal only) | Never |

### Underworld Resources

| Resource | Source Building | Scope | Resets On |
|---|---|---|---|
| Armaments (🔫) | Armory | Per-theme | Prestige |
| Troopers (🛡️) | Safe House | Per-theme | Prestige |
| Contraband (📦) | Underground Services | Per-theme | Prestige |
| Intel (📋) | Intelligence Network | Per-theme | Prestige |
| Blood Coins (🩸) | Black Market Vault | Global | Never |

### Special Resources

| Resource | Source | Scope |
|---|---|---|
| Diplomatic Favor (DF) | Paris Embassy | Paris-only, persistent |
| Seasonal Currency | Seasonal events | Global, per-season (expires) |
| Markers | Marker Called In events | Per-theme (debt tracking) |

---

## Sources & Sinks

### Primary Income Source

```
incomePerSecond =
  baseRate
  × buildingLevelMultiplier
  × staffMultiplier
  × statMultiplier
  × traitMultiplier
  × assassinMultiplier
  × upgradeMultiplier
  × prestigeMultiplier
  × eventModifier
  × hqMultiplier
  × conquestMultiplier
  × royalBuffMultiplier
  × elderMultiplier
  × sovereignMultiplier
  × reputationMultiplier
  × allianceMultiplier
  × broadcastMultiplier
  × crownMultiplier
  × guestSatisfactionMultiplier
```

- **baseRate** — fixed per building type
- **statMultiplier** = `1 + (sum of assigned staff precision × 0.02)`
- **staffMultiplier** = `product of (1 + staffLevel × staffEffectPerLevel)` for each assigned staff
  - `staffEffectPerLevel` = 0.10 (Concierge), 0.10 (Bartender), 0.15 (Chef), 0.05 (Cleaner), 0.20 (Sommelier), 0.03 (Intelligence Officer), 0.05 (Adjudicator), 0.05 (Vault Keeper)
  - Match bonus: if staff is in best-match building, effect is +25% stronger (multiply `staffEffectPerLevel` by 1.25)
  - Example: Concierge Lv.6 in Guest Rooms (match) = `1 + (6 × 0.10 × 1.25) = 1.75`
- **assassinMultiplier** = `product of (1 + assassinIncomeBonus)` for each assigned assassin
  - The Hammer: `+2.0` (underground services income ×3)
  - The Don: `+3.0` (Guest Room income ×4)
  - The Prince: `+5.0` (VIP Penthouse income ×6)
  - Other assassins: `0` (no direct income bonus, only ability/synergy effects)
  - Synergy bonuses apply separately as flat multipliers (e.g., High Table Shadow: `×1.25`)
- **upgradeMultiplier** = `product of (1 + upgradeEffect)` for each purchased upgrade in this theme
  - Upgrades are **multiplicative** with each other
  - Example: Renovate Lobby (+0.50) + Expand Bar (+1.00) = `1.50 × 2.00 = 3.00`
  - Continental Broadcast and Continental Crown are global, applied via `broadcastMultiplier` and `crownMultiplier` (not here)
- **traitMultiplier** = `product of trait income effects` — Golden Touch (+10%), Perfectionist (+15%), Clumsy (-10%), Superstitious (-15%), etc.
- **buildingLevelMultiplier** = `1.07 ^ buildingLevel` (7% growth per level)
- **prestigeMultiplier** = `1 + (tableFavor × 0.02)`
- **eventModifier** — `1.0` normally, `2.0` during Contract Open (`3.0` with Bounty Board), `0.0` during Excommunicado
- **hqMultiplier** = `1.2` if this theme is the player's HQ, `1.0` otherwise
- **conquestMultiplier** = `1 + sum of conquered theme bonuses`
- **royalBuffMultiplier** = `1 + sum of Royal global buffs`
- **elderMultiplier** = `1 + (elderIncomeBoosts × 1.0)`
- **sovereignMultiplier** = `2.0` if Royal Takeover completed, `1.0` otherwise. Applies to **all** theme income (standard + Royal). Standard themes are re-playable via Super Prestige resets, so the 2.0× remains relevant post-Royal Takeover as an incentive to re-grind standard themes with doubled income
- **reputationMultiplier** = `1 + tier bonus` (0.0 Unknown, 0.10 Respected, 0.10 Feared, 0.25 Legendary, 0.25 Continental Elite, 0.25 Sovereign)
- **allianceMultiplier** = `1 + (0.05 × activeAlliances)` (max +0.15)
- **broadcastMultiplier** = `1.0` base, `1.25` with Continental Broadcast, `1.50` with Broadcast + Crown
- **crownMultiplier** = `2.0` if Continental Crown purchased, `1.0` otherwise
- **guestSatisfactionMultiplier** = `0.5 + (guestSatisfaction / 100)` — range 0.5× (score 0) to 1.5× (score 100). Default score 50 = `1.0×` (neutral, no effect)

### Inactive Theme Income

```
baseIncome × 0.5 × prestigeMultiplier × hqMultiplier × conquestMultiplier × royalBuffMultiplier × broadcastMultiplier × crownMultiplier × guestSatisfactionMultiplier
```
- **NO eventModifier** (events don't trigger in inactive themes)
- **guestSatisfactionMultiplier** still applies — satisfaction decays on inactive themes when no staff is assigned, so inactive themes slowly degrade toward Unhappy tier if neglected
- **NO incomeMultiplier** (no active Contract Open buffs)
- Staff bonuses still apply
- Assassin bonuses still apply

### Sinks

| Sink | Currency | Purpose |
|---|---|---|
| Building purchases | Theme currency | Core progression |
| Building upgrades | Theme currency | Multiplier boosts |
| Staff hire | Theme currency | Staff bonuses |
| Staff level-up | Theme currency | Pending level-up confirmation |
| Assassin hire | Theme currency | Assassin abilities |
| Assassin loyalty bonus | Theme currency | Loyalty restoration |
| Upgrades (12 tiers) | Theme currency | Permanent per-theme boosts |
| Theme-unique building | Theme currency (500M) | Special mechanic |
| High Table Skill Tree | Table Favor | Global upgrades |
| Elder Upgrades | Elder Favor | Post-Super Prestige upgrades |
| Royal Marks Shop | Royal Marks | Royal buffs/slots/shields |
| Blood Coin Shop | Blood Coins | Underworld upgrades/bundles |
| Alliance formation | Table Favor (25 each) | Alliance contracts |
| Alliance maintenance | Table Favor (2/day each) | Sustain alliance |
| Assassin reroll | Theme currency | Stats/traits reroll |
| Decree reroll | Table Favor (10) | Royal Decree reroll |
| Artifact forging | Table Favor + theme currency | Upgrade artifact rarity |

---

## Inflation Control

### Building Cost Curve

```
cost(n) = baseCost × costGrowth ^ n
costGrowth = 1.15   // standard incremental ratio (buildings #1–#10)
```

**Per-building exceptions** (create a soft wall pushing toward prestige):

| Building | costGrowth | Rationale |
|---|---|---|
| #1–#10 (standard) | 1.15 | Normal incremental ratio |
| #11 (Black Market Vault) | 1.25 | 10% steeper — creates income-to-cost gap |
| #12 (Continental Vault) | 1.35 | 20% steeper — final soft wall before prestige |
| #13 (Theme-Unique) | 1.18 | Slightly steeper than standard (premium building) |

- The steeper growth on #11 and #12 makes prestige more attractive than grinding the last two buildings
- This is a **per-building-index** override, not a global constant — the formula uses `costGrowth[buildingIndex]` instead of a flat `costGrowth`

### Royal Building Cost Curve

```
royalCost(n) = royalBaseCost × 1.5 ^ n
```
- Each Royal building has its own `royalBaseCost` (see 04-content-design.md):
  - R1: 1B, R2: 5B, R3: 10B, R4: 25B, R5: 50B, R6: 100B
- Growth rate 1.5 (vs standard 1.15) — steeper but achievable at Royal income levels

### Theme-Unique Building Cost

```
cost = 500M × (1.18^level)
```

### Prestige Favor Formula

```
favor = floor( (lifetimeEarnings / scaleConstant) ^ 0.5 )
```

`scaleConstant` decreases as **total prestige** (sum of all themes) increases:
- `1e9` when totalPrestige < 10
- `1e8` when totalPrestige 10–24
- `1e7` when totalPrestige 25–49
- `1e6` when totalPrestige 50+

### Royal Prestige Favor

```
royalFavor = max(1, floor( (royalLifetimeEarnings / 1e12) ^ 0.5 ) )
```

### Elder Favor Formula

```
elderFavor = floor( (totalTableFavorSpent ^ 0.5) × prestigeMultiplier )
prestigeMultiplier = 1 + (totalPrestigeAcrossAllThemes × 0.01)
```

### Severance Package (Pre-Prestige)

```
severanceFavor = floor( (currency × 0.1 / scaleConstant) ^ 0.5 )
```
- Intentionally worse than prestige favor — a consolation, not a strategy
- With Diplomacy skill "Marker Forgiveness": improves to 20% conversion

### Burnout (Anti-Auto-Clicker)

```
if purchasesPerMinute > 100:
    burnoutMultiplier = 100 / purchasesPerMinute
    effectivePurchasePower = purchaseAmount × burnoutMultiplier
```
- Recovery: 10 seconds of no purchases
- Only triggers with auto-buy or rapid manual tapping

---

## Offline Earnings

```
offlineEarnings = incomePerSecond × min(secondsAway, offlineCap) × offlineEfficiency
```

- `offlineEfficiency` starts at 50%, upgradeable to 100% via skill tree
- `offlineCap` starts at 4h, upgradeable to 24h via Extended Absence skill tree nodes
- Anti-cheat: clamp negative time deltas to 0

### Offline Simulation Rules

- **Events do NOT trigger during offline** — events only fire during active play
- **Excommunicado**: If active when player left, resolves automatically (timer expires)
- **Contract/Marker expiry**: Auto-decline after 5 minutes of offline time
- **Heat meter**: Decays by 1 per hour offline
- **Reputation**: Continues to decay normally
- **Staff XP**: Continues to accumulate
- **Assassin XP**: Continues to accumulate
- **Assassin loyalty**: Continues to decay
- **Inactive theme income**: NOT generated during offline — only last active theme earns
- **Welcome Back screen**: Shows earnings report, missed events (flavor only), staff progress, notifications
- **Optional**: Watch ad for 2× offline earnings

---

## Number Scaling

### Currency Tiers

| Tier | Notation | Value |
|---|---|---|
| 1 | K | 10³ |
| 2 | M | 10⁶ |
| 3 | B | 10⁹ |
| 4 | T | 10¹² |
| 5 | aa | 10¹⁵ |
| 6 | ab | 10¹⁸ |
| 7 | ac | 10²¹ |
| 8 | ad | 10²⁴ |
| ... | continues az | 10⁹⁰ |
| 26+ | ba, bb... | 10⁹³+ |
| fallback | scientific | 10³⁰⁰+ |

### Number Formatting Rules

| Range | Format | Example |
|---|---|---|
| < 1,000 | Integer | `847` |
| < 1,000,000 | K with 1 decimal | `12.3K` |
| < 1,000,000,000 | M with 2 decimals | `1.25M` |
| < 1e12 | B with 2 decimals | `3.40B` |
| < 1e15 | T with 2 decimals | `2.45T` |
| < 1e18 | aa with 2 decimals | `1.23aa` |
| < 1e21 | ab with 2 decimals | `4.56ab` |
| < 1e24 | ac with 2 decimals | `7.89ac` |
| ... | continues ad, ae... | |
| ≥ 1e93 | Scientific notation, 2 decimals | `1.23e96` |

- Settings option: "Always scientific notation" for advanced players
- Income rates show `/s` suffix: `12.3K/s`
- Costs show full formatted value with currency name: `45.2M Gold Coins`

---

## Dual-Currency Trading

Unlocked by hiring The Bishop (100M) or reaching Prestige 15 total.

### Exchange Rate Algorithm

```
baseRate = themePower(sell) / themePower(buy)
themePower = lifetimeEarnings ^ 0.1

drift = sin(gameTime / driftPeriod) × volatility
driftPeriod = 300s (5 min cycle)
volatility = 0.15 (±15% swing)

tradeImpact = -tradeAmount / (themeLiquidity × 10)
liquidity recovers at 1% per second

finalRate = baseRate × (1 + drift + tradeImpact)
```

- **themeLiquidity** = `max(10, floor(lifetimeEarnings ^ 0.05))`
  - Represents how much trade volume a theme can absorb before rates shift
  - Higher lifetime earnings = more liquid = less price impact per trade
  - Example: 1B earnings → liquidity ~12; 1T earnings → liquidity ~19; 1e15 → liquidity ~31
  - Liquidity recovers at 1% per second (full recovery in ~100s)

- **Trade fee**: 5% (reducible to 1% via Diplomacy skill tree)
- **Rate refresh**: Updates every 10 seconds
- **History**: Stores last 30 rate points for sparkline chart

---

## Secure Vault Interest

Enabled by the **Tier 4 upgrade** "Secure Vault". Generates bonus currency every minute based on current income rate:

```
vaultBalance     = min(currentIncomePerSec × 300, themeCurrency × 0.10)
interestPerMin   = vaultBalance × interestRate
interestRate     = 0.02   // base (Secure Vault upgrade)
                   0.04   // Vault Keeper at max level (Lv.10) doubles it
```

- `currentIncomePerSec × 300` = 5 minutes of income — the "active vault balance"
- `themeCurrency × 0.10` = 10% of current cash — alternative cap
- **The lower of the two** is used as `vaultBalance` — prevents runaway compound growth at high cash
- Interest is deposited into theme currency every 60 seconds
- Interest does **not** apply during excommunicado (income = 0, so balance = 0)
- Safe House building level does **not** affect interest rate — only the upgrade and Vault Keeper staff do

**Examples:**
- 1K/s income, 500K cash → `min(300K, 50K) = 50K` balance → `50K × 0.02 = 1,000/min`
- 1M/s income, 10B cash → `min(300M, 1B) = 300M` balance → `300M × 0.02 = 6M/min`

---

## Continental Vault Passive Favor

The Continental Vault (building #12) generates Table Favor passively once purchased:

```
passiveFavorPerMinute = vaultLevel × 0.01 × (1 + prestigeLevel × 0.05)
```

- Vault Lv.1, Prestige 0: `0.01 favor/min` (~0.6/hour)
- Vault Lv.10, Prestige 5: `0.01 × 10 × 1.25 = 0.125 favor/min` (~7.5/hour)
- Vault Lv.25, Prestige 20: `0.01 × 25 × 2.0 = 0.5 favor/min` (~30/hour)
- Vault Keeper staff at max level doubles this rate
- Stored in `passiveFavorAccumulated` in save data, claimed on next prestige or manually

---

## Guest Satisfaction System

Each theme has a **Guest Satisfaction** score (0–100, default 50) that modifies income:

```
guestSatisfactionMultiplier = 0.5 + (satisfaction / 100)   // range: 0.5× to 1.5×
```

### Satisfaction Changes

| Action | Change |
|---|---|
| Staff assigned to Guest Rooms | +1/min per assigned staff |
| Staff assigned to VIP Penthouse | +2/min per assigned staff |
| Event resolved successfully | +5 |
| Event failed/ignored | -10 |
| Excommunicado survived | -5 |
| No staff in Guest Rooms for 5+ min | -2/min |
| Sommelier assigned (premium guests) | +3/min |
| Building purchased (Guest Rooms, VIP) | +2 |
| Prestige reset | Reset to 50 |

### Satisfaction Tiers

The multiplier is **continuous** via the formula `0.5 + (satisfaction / 100)`. Tiers are display labels with threshold-based VIP bonuses:

| Tier | Range | Multiplier Range | VIP Guest Bonus |
|---|---|---|---|
| Furious | 0–19 | ×0.50 – ×0.69 | None |
| Unhappy | 20–39 | ×0.70 – ×0.89 | None |
| Neutral | 40–59 | ×0.90 – ×1.09 | None (default) |
| Happy | 60–79 | ×1.10 – ×1.29 | VIP guests arrive 10% more often |
| Delighted | 80–100 | ×1.30 – ×1.50 | VIP guests arrive 25% more often |

- Satisfaction decays by 1/min when no staff is assigned to Guest Rooms
- Satisfaction is visible in the HUD as a small indicator next to currency

---

## Underworld Resource Economy

### Resource Generation Formula

```
resourcePerSecond = baseRate × buildingLevel × staffMultiplier × upgradeMultiplier × eventModifier × royalMultiplier
```

- **staffMultiplier**: 1.0 base, +0.5 if matching staff assigned
- **royalMultiplier**: 2.0 if Royal Continental is established
- **eventModifier**: 0.0 during excommunicado, 1.5 during Contract Open

### Resource Caps

| Resource | Cap |
|---|---|
| Armaments | 500 + 100/prestige |
| Troopers | 100 + 20/prestige |
| Contraband | 1000 + 200/prestige |
| Intel | 200 + 50/prestige |
| Blood Coins | ∞ (global) |

### Blood Coin Shop

| Purchase | Cost (Blood Coins) | Effect |
|---|---|---|
| Black Market Arms | 50 | +500 Armaments instantly |
| Mercenary Squad | 100 | +20 Troopers instantly |
| Smuggler's Cache | 75 | +300 Contraband instantly |
| Information Broker | 60 | +100 Intel instantly |
| Underworld Contact | 200 | Triggers random underworld event with 2× rewards |
| Blood Oath Token | 150 | Next Blood Oath wager auto-wins |
| Excommunicado Bribe | 300 | Cancel next excommunicado for free |
| Heat Reduction | 80 | Reduce Heat by 3 levels instantly |
| Shadow Armory | 500 | Permanent +50% Armament generation (this theme) |
| Shadow Barracks | 500 | Permanent +50% Trooper generation (this theme) |
| Shadow Pipeline | 500 | Permanent +50% Contraband generation (this theme) |
| Shadow Intelligence | 500 | Permanent +50% Intel generation (this theme) |
| Underworld Empire | 2000 | All underworld resources +25% generation (all themes) |

---

## Royal Marks Economy

### Generation

```
royalMarksPerMinute = royalVaultLevel × 0.1 × (1 + royalContinentalCount × 0.5)
```

### Shop

| Purchase | Cost (Royal Marks) | Effect |
|---|---|---|
| Royal Income Boost | 10 | +50% income to all Royal Continentals (permanent, stacking) |
| Royal Staff Slot | 25 | +1 staff slot in all Royal Continentals |
| Royal Assassin Slot | 40 | +1 assassin slot in all Royal Continentals |
| Royal Event Shield | 20 | No negative events in Royal Continentals for 1 hour |
| Royal Time Warp | 50 | Instant 8 hours of offline progress (all Continentals) |
| Royal Favor Exchange | 30 | Convert 10 Royal Marks → 50 Table Favor |

---

## Marker Debt System

- **Debt accrual**: Each ignored/failed Marker event adds `debtAmount = baseDebt × (1 + prestigeLevel × 0.1)` where `baseDebt = 10K`
- **Debt effect**: While unpaid, theme suffers -5% income per active debt (max -25%)
- **Payment**: Player can pay off using theme currency at any time
- **Debt expiry**: Unpaid debts expire after 24 hours real time (-15 Reputation per expired debt)
- **The Diplomat**: Reduces all marker debts by 50% on hire, prevents new debts while assigned
- **Marker Bank**: Allows storing markers as tradeable currency
