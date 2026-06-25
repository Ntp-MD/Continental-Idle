# 05 — Balance Sheet

> Source: Extracted from `Continetal-idle.md`

---

## Number Tuning

### Balancing Levers (Tuning Constants)

| Constant | Default | Purpose |
|---|---|---|
| `costGrowth` | 1.15 | Building inflation (standard buildings #1–#10) |
| `costGrowthVault` | 1.25 | Building #11 (Black Market Vault) inflation — soft wall |
| `costGrowthContinental` | 1.35 | Building #12 (Continental Vault) inflation — final soft wall |
| `themeBuildingCostGrowth` | 1.18 | Theme-unique building (#13) inflation |
| `royalCostGrowth` | 1.5 | Royal building inflation (per-building base costs) |
| `buildingGrowth` | 1.07 | Income per level |
| `prestigeFavorScale` | 1e9 | Favor formula divisor |
| `eventCooldown` | 45s | Min time between events |
| `offlineCapBase` | 4h | Starting offline limit |
| `offlineEfficiency` | 0.5 | Starting offline earning % |
| `loyaltyDecay` | 1%/min | Assassin loyalty drain |
| `staffXpBase` | 0.5/s | Base staff XP per second |
| `staffXpGrowth` | 1.3 | XP-to-next-level multiplier |
| `assassinXpBase` | 0.2/s | Base assassin XP per second |
| `assassinXpGrowth` | 1.5 | Assassin XP-to-next-level multiplier |
| `buildingMaxLevel` | 50 | Max level for standard buildings |
| `themeBuildingMaxLevel` | 15 | Max level for theme-unique building #13 |
| `royalBuildingMaxLevel` | 25 | Max level for Royal buildings R1–R6 |
| `tradeFee` | 5% | Currency exchange fee |
| `driftPeriod` | 300s | Exchange rate cycle |
| `driftVolatility` | 0.15 | Exchange rate swing |
| `heatPerIgnored` | 5 | Ignored events per Heat level |
| `heatMaxLevel` | 10 | Maximum Heat level |
| `heatPassiveDecay` | 1 per 10 min | Passive Heat decay |
| `excommunicadoGracePeriod` | 30 min | No excommunicados at start or after prestige |
| `defectionThreshold` | 30% | Loyalty % that triggers defection risk |
| `armamentBaseRate` | 2/s | Armory generation per level |
| `trooperBaseRate` | 1/s | Safe House generation per level |
| `contrabandBaseRate` | 3/s | Underground Services generation per level |
| `intelBaseRate` | 1/s | Intelligence Network generation per level |
| `bloodCoinBaseRate` | 0.5/s | Black Market Vault generation per level |
| `armamentConsumption` | 5/hr per assassin | Armament drain per assassin |
| `trooperCasualtyChance` | 5% | Chance per negative event |
| `trooperDefenseMax` | 20 | Trooper count for max -40% penalty reduction |
| `intelHeatReduction` | 0.1/hr per Intel | Heat reduction from Intel |
| `raidFleeLossPercent` | 20% | Resource loss on raid flee |
| `excommunicadoBaseDuration` | 60s | Base excommunicado duration |
| `excommunicadoStacking` | Multiplicative | See Excommunicado Stacking Rules |
| `contrabandSellRate` | 100 × (1 + vaultLevel × 0.05) | Contraband→currency conversion |
| `armamentSellRate` | 50 × (1 + vaultLevel × 0.03) | Armament→currency conversion |
| `royalResourceMultiplier` | 2.0 | Royal Continental underworld resource multiplier |
| `royalDecreeChoices` | 3 | Number of decree options per day (drawn from pool of 15) |
| `royalDecreeDuration` | 24h | Duration of each Royal Decree buff |
| `dailyContractRefresh` | 24h | Daily contract board refresh interval |
| `dailyContractCount` | 3 | Contracts available per refresh |
| `loginStreakReset` | 1 day | Time without login before streak resets |
| `inactiveThemeIncomeRate` | 0.5 | Income multiplier for non-active themes |
| `statBudget` | 20 | Total stat points distributed on hire |
| `statMin` | 2 | Minimum points per stat |
| `statMax` | 10 | Maximum points per stat (13 with Legendary trait) |
| `statPrecisionEffect` | 0.02 | Ability effectiveness per Precision point |
| `statSpeedEffect` | 0.01 | XP gain per Speed point |
| `statCharismaEffect` | 0.01 | Loyalty decay reduction per Charisma point |
| `statLuckEffect` | 0.005 | Event reward bonus per Luck point |
| `traitPositiveChance` | 0.60 | Chance per positive trait roll |
| `traitNegativeChance` | 0.30 | Chance for 1 negative trait |
| `traitRareChance` | 0.10 | Chance for rare trait (replaces positive) |
| `traitMaxPositive` | 2 | Max positive traits per character |
| `veteranPrestigeRequired` | 3 | Prestige cycles to earn Veteran status |
| `hireRerollCostMultiplier` | 0.05 | Reroll cost as fraction of hire cost (staff) |
| `hireRerollCostMultiplierAssassin` | 0.02 | Reroll cost as fraction of hire cost (assassin) |
| `hireRerollLimit` | 10 | Max rerolls per hire attempt |

These live in a single config file for easy iteration / live balancing.

---

## Time-to-X

### Progression Curve & Pacing

| Phase | Real Time | Player Goal | Currency Range |
|---|---|---|---|
| Onboarding | 0–10 min | Select HQ country, first 5 buildings, first staff | 0 → 10K |
| Early | 10–60 min | Fill HQ building roster, hire 1 assassin | 10K → 1M |
| Mid | 1–5 hrs | First prestige, unlock second theme | 1M → 1B |
| Late | 5–20 hrs | 3+ themes active, assassin synergies | 1B → 1T |
| Endgame | 20 hrs+ | High Table meta-grind, dual-currency | 1T → ∞ |

### Key Milestone Timings

| Milestone | Estimated Time |
|---|---|
| First prestige | ~1 hour |
| First theme unlock (Prestige 1) | ~1 hour |
| All 7 themes unlocked (Prestige 55) | ~50–100 hours |
| High Table endgame (Prestige 80) | ~100+ hours |
| First Continental conquest (NY, Prestige 5) | ~5–10 hours |
| All 7 Continentals conquered (Prestige 35+) | ~500+ hours |
| Royal Takeover | Multi-hundred-hour grind |

### Pacing Rules

- **First prestige** intentionally reachable in ~1 hour to teach the reset loop
- **Soft wall** every theme — last 2 buildings (Black Market Vault #11, Continental Vault #12) cost steeply to push toward prestige:
  - Buildings #1–#10: standard `costGrowth = 1.15`
  - Building #11 (Black Market Vault): `costGrowth = 1.25` (10% steeper)
  - Building #12 (Continental Vault): `costGrowth = 1.35` (20% steeper)
  - This creates a natural income-to-cost gap that makes prestige more attractive than continuing to grind
- **Offline cap** scales with progression: 4h base → 24h max via Extended Absence skill tree nodes
- **Excommunicado grace period**: No excommunicados in first 30 minutes of new save or after prestige

---

## Difficulty Curve

### Early Game (0–60 min)

- Only HQ theme active
- 3 basic events (Contract Open, Excommunicado, Marker Called In)
- No excommunicado for first 30 minutes (grace period)
- Tutorial guides through 7 steps in ~2.5 minutes
- First prestige reachable in ~1 hour

### Mid Game (1–5 hrs)

- 2–3 themes active
- Staff XP system active, assassin synergies forming
- Heat meter becomes relevant
- Underworld resources start generating
- Dual-currency trading potentially unlocked (The Bishop at 100M)

### Late Game (5–20 hrs)

- 3+ themes active, inactive income at 50%
- Assassin lending, veteran staff, awakened assassins
- Takeover progress begins
- High Table Skill Tree investment
- Blood Coin shop active

### Endgame (20 hrs+)

- All 7 themes unlocked
- High Table Contracts (Prestige 20+)
- Super Prestige available
- Royal Continental system
- Continental Takeover grind
- Royal Takeover (ultimate endgame)

### Dynamic Difficulty System

| Player Type | Detection | Adjustment |
|---|---|---|
| Active player (checking every few minutes) | High interaction frequency | More events, faster Heat, higher rewards |
| Idle player (checking once per day) | Low interaction frequency | Fewer events, slower Heat, bigger offline bonuses |
| Grinder (buying constantly) | Rapid purchases | Burnout — diminishing returns after 100+ purchases/min |
| Min-maxer (always optimal choice) | Perfect event resolution rate | Harder event variants with no clear "best" choice |

### Dynamic Difficulty Detection Thresholds

| Player Type | Metric | Threshold |
|---|---|---|
| Active | Interactions per hour | >20 (taps, purchases, assignments) |
| Idle | Interactions per hour | <2 |
| Normal | Interactions per hour | 2–20 |
| Grinder | Purchases per minute | >100 (triggers Burnout) |
| Min-maxer | Event resolution success rate | >90% over last 20 events |

- Detection window: Rolling 1-hour window for interaction frequency
- Min-maxer detection: Rolling 20-event window for success rate
- Adjustments apply gradually (not instant) — difficulty shifts over 5 minutes

### Harder Event Variants (Min-maxer)

When min-maxer is detected, the following event variants replace standard versions (30% chance per event):

| Event | Standard | Harder Variant |
|---|---|---|
| Contract Open | Accept = 2× income 90s | Accept = 2× income 90s BUT -10% loyalty to all assassins |
| Excommunicado | Wait or pay tribute | Wait = 2× duration; Pay = tribute cost doubled |
| Marker Called In | Mini-objective | Objective difficulty +50% (e.g., 75× income instead of 50×) |
| Auction Night | Bid against AI | AI budget +50%, AI bluff chance 40% |
| Smuggling Run | Choose route risk | All route raid chances +15% |
| Blood Oath | Wager currency | Win = 1.5× wager (instead of 2×); Lose = lose wager + -5% loyalty |

- No event has a clear "best" choice in harder variants — trade-offs are designed to be roughly equal
- Harder variants give +50% reputation on successful resolution (risk/reward balance)
- Detection resets if success rate drops below 70% over next 20 events

### Burnout Formula

```
if purchasesPerMinute > 100:
    burnoutMultiplier = 100 / purchasesPerMinute
    effectivePurchasePower = purchaseAmount × burnoutMultiplier
```
- At 100 purchases/min: 100% efficiency
- At 200 purchases/min: 50% efficiency
- At 500 purchases/min: 20% efficiency
- Recovery: 10 seconds of no purchases
- Only triggers with auto-buy or rapid manual tapping

---

## Excommunicado Duration Stacking

Multiple sources stack **multiplicatively**:

```
finalDuration = baseDuration
              × (1 - cleanerReduction)      // Cleaner staff: -25% at Lv.5
              × (1 - shadeReduction)         // The Shade assassin: -50%
              × (1 - trooperReduction)       // Troopers: -1s each (as fraction of base)
              × (1 - bloodOathReduction)     // Blood Oath contract: -50%
              × (1 - bountyBoardReduction)   // Bounty Board passive: -10%
```

**Example**: Base 60s, Cleaner Lv.5 (-25%), The Shade (-50%), 10 Troopers (-16.7%), Blood Oath (-50%):
```
60 × 0.75 × 0.50 × 0.833 × 0.50 = 9.4s (minimum 5s floor)
```

- **Minimum duration**: 5 seconds
- **Royal Guard**: Eliminates excommunicado entirely (sets to minimum 5s)
- **Excommunicado Bribe**: Cancels next excommunicado completely (0s)

---

## Heat ↔ Reputation Link

- **High Heat (Level 5+)**: Reputation decay rate doubles (2%/hr → 4%/hr)
- **Low Heat (Level 0)**: +1 rep per hour when Heat is 0 and theme is active
- **Resolving events at high Heat**: +50% reputation gain from event resolution

---

## Artifact Drop Rates

**Step 1 — Does an artifact drop?**
```
artifactDropChance = baseDropRate × eventRarityMultiplier × reputationMultiplier
baseDropRate = 0.5% (per event resolution)
eventRarityMultiplier = 1.0 (normal), 2.0 (theme-locked), 3.0 (seasonal)
reputationMultiplier = 1 + (reputation / 1000)   // up to 2× at Sovereign
```

**Step 2 — What rarity? (weighted roll on drop)**

| Rarity | Weight | Approx % |
|---|---|---|
| Common | 600 | 60% |
| Uncommon | 280 | 28% |
| Epic | 100 | 10% |
| Legendary | 18 | 1.8% |
| Mythic | 2 | 0.2% |

- Rolls are independent — rarity weight does not shift based on recent drops (no pity system)
- "Staff Trainer" daily contract adds `+1%` to `baseDropRate` for the next single event only

---

## Anti-Cheat & Integrity

| Threat | Mitigation |
|---|---|
| Clock tampering (set time forward) | Clamp time delta to `offlineCapBase`, flag anomalies |
| Memory editing | Local validation checks on save load, flag anomalies |
| Save file editing | Checksum hash on save file, invalidate on mismatch |
| Auto-clicker | Diminishing returns on rapid-fire purchases ("Burnout") |
| Save tampering | Checksum hash validation, reject modified saves |

---

## Income Projection Table

Expected income/sec at key milestones (single theme, HQ bonus included, no events):

| Prestige | Avg Building Lv | Income/sec | Notes |
|---|---|---|---|
| 0 | 5 | ~100 | Early game, 3 buildings |
| 0 | 10 | ~2K | Mid early, 6 buildings |
| 0 | 15 | ~50K | Pre-prestige, 10 buildings |
| 1 | 10 | ~5K | Post-first prestige, favor multiplier ×1.02 |
| 3 | 15 | ~150K | 3 themes, favor ×1.06 |
| 5 | 20 | ~2M | Takeover eligible, favor ×1.10 |
| 10 | 25 | ~50M | 3 themes, favor ×1.20 |
| 15 | 30 | ~1B | Royal eligible, favor ×1.30 |
| 20 | 35 | ~20B | High Table contracts, favor ×1.40 |
| 30 | 40 | ~500B | Late endgame, favor ×1.60 |
| 35 | 45 | ~10T | Final conquest tier, favor ×1.70 |
| 50 | 50 | ~500T | Post-conquest, all maxed, favor ×2.00 |

- Values are approximate — actual income varies with staff, assassins, upgrades, traits
- Used to validate that time-to-X milestones are achievable
- If actual playtest income deviates >2× from projection, tuning constants need adjustment

---

## Cost-to-Income Ratio Targets

| Phase | Target: Time to Afford Next Building | Rationale |
|---|---|---|
| Onboarding (0–10 min) | 5–15 seconds | Fast dopamine, teach the loop |
| Early (10–60 min) | 15–60 seconds | Gradual slowdown |
| Mid (1–5 hrs) | 1–5 minutes | Prestige becomes attractive |
| Late (5–20 hrs) | 5–15 minutes | Multi-theme management |
| Endgame (20 hrs+) | 15–60 minutes | Long-term grind |
| Soft wall (#11, #12) | 10–30 minutes | Push toward prestige reset |

- These targets guide `costGrowth` and `baseRate` tuning
- If time-to-afford exceeds target by 2×, player will feel stuck → adjust `costGrowth` down or `baseRate` up
- If time-to-afford is below target by 50%, progression is too fast → adjust up
