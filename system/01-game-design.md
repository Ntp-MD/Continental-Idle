# 01 — GDD: Game Design Document

> Source: Extracted from `Continetal-idle.md`

---

## Concept & Vision

**Elevator Pitch**: An idle/incremental game set in the Continental Hotel universe of the John Wick series, where the player manages themed continental branches worldwide.

**Target Audience**: Idle/incremental game enthusiasts who enjoy deep progression systems, collection mechanics, and long-term strategic grinding.

**Platform**: Browser (desktop + mobile), built with web technologies.

---

## Core Concept

You are the **Continental Manager**, tasked with running Continental Hotels across the globe. The game begins by selecting your headquarters country on a **world map** — each location offers unique bonuses. Each country is a "theme" — a visually and mechanically distinct branch with its own currency, staff, upgrades, and storyline events. As you progress, you unlock new countries, conquer Continentals, and eventually ascend to **Royal Continental** status. The game plays itself (idle) while you make strategic decisions about resource allocation, staff assignments, and territory expansion.

---

## Core Loop

1. **Build** — Purchase and upgrade buildings (12 standard + 1 theme-unique per Continental)
2. **Hire** — Recruit staff (with unique stats/traits) and assassins (with loyalty/synergy mechanics)
3. **Earn** — Idle income generates automatically; active play boosts via events and assignments
4. **Prestige** — Reset a theme for Table Favor (meta-currency); keep staff, assassins, upgrades
5. **Expand** — Unlock new themes via total prestige; conquer Continentals; ascend to Royal
6. **Repeat** — Multi-theme management with inactive income at 50%; deeper progression layers

---

## Theme & Narrative

### Setting

The Continental Hotel universe from the John Wick series — a network of assassin-friendly luxury hotels governed by the High Table.

### Tone

Terminal-noir — a terminal/hacker aesthetic as the primary UI, with noir-luxury flavor through typography and event storytelling.

### Lore Layer

- **Onboarding story** — you inherit a Continental from a retiring manager
- **Per-theme vignettes** — short text scenes unlocked at building/prestige milestones

| Theme | Vignette | Unlock Trigger |
|---|---|---|
| New York | "The Manager's First Day" | Build Guest Rooms (Lv.1) |
| New York | "The Gold Coin Code" | Reach Prestige 1 |
| Rome | "The Art of Discretion" | Build Art Gallery (Lv.1) |
| Rome | "A Renaissance Deal" | Win first Auction Night |
| Casablanca | "Desert Routes" | Build Trade Post (Lv.1) |
| Casablanca | "The Serpent's Whisper" | Complete first Smuggling Run |
| Osaka | "The Dojo Pact" | Build Training Dojo (Lv.1) |
| Osaka | "Blade and Blossom" | Train first assassin to max level |
| Paris | "Diplomatic Immunity" | Build Embassy (Lv.1) |
| Paris | "The Marker Forgiveness" | Clear first marker debt |
| Berlin | "Blood on the Canvas" | Build Fight Arena (Lv.1) |
| Berlin | "The Oath Keeper" | Win first Blood Oath wager |
| Dubai | "The Royal Guest" | Build Royal Suite (Lv.1) |
| Dubai | "The Prince's Table" | Host first Continental VIP |

- **The Manager's Ledger** — collectible lore entries (rules of the Continental, High Table history)

| # | Entry | Unlock Condition |
|---|---|---|
| 1 | Rule 1: No Business on Continental Grounds | Tutorial completion |
| 2 | Rule 2: No Blood on Continental Grounds | First excommunicado survived |
| 3 | The High Table: Origins | Prestige 1 (any theme) |
| 4 | The Marker System | First marker debt incurred |
| 5 | The Adjudicator's Role | Hire The Adjudicator's Hand |
| 6 | The Elder's Tale | First Super Prestige |
| 7 | The Continental Charter | Unlock all 7 themes |
| 8 | The Blood Oath Tradition | Win 10 Blood Oath wagers (Berlin) |
| 9 | The Art of the Auction | Win 10 Auction Nights (Rome) |
| 10 | The Desert Code | Complete 10 Smuggling Runs (Casablanca) |
| 11 | The Way of the Blade | Train 5 assassins to max level (Osaka) |
| 12 | Diplomatic Favors | Accumulate 100 Diplomatic Favor (Paris) |
| 13 | The VIP Protocol | Host 50 VIP guests (Dubai) |
| 14 | The Bounty Hunter's Creed | Complete 20 bounties (New York) |
| 15 | The Sovereign's Burden | Complete Royal Takeover |
| 16 | Baba Yaga's Legend | Unlock hidden achievement |
| 17 | The Continental Network | Form 3 alliances |
| 18 | The Season of Blood | Participate in Blood Moon event |
| 19 | The Manager's Farewell | Reach total Prestige 100 |
| 20 | The Final Rule | Conquer all 7 Continentals |

- **Endgame twist** — a seat at the High Table is offered; accepting triggers a "New Game+" style super-prestige

### Art Style

- **Primary UI**: Terminal theme (1px borders, monospace font, dark background)
- **Noir-luxury flavor**: Expressed through color accents and event text — not through the UI framework itself
- **Each theme** swaps the terminal's accent color to evoke its region (see `06-ui-ux-flow.md` for hex implementation values):
  - New York: Steel blue + gold
  - Rome: Terracotta + cream
  - Casablanca: Sand + emerald
  - Osaka: Indigo + cherry blossom pink
  - Paris: Burgundy + ivory
  - Berlin: Gunmetal + neon red
  - Dubai: Midnight blue + champagne gold
  - (Art direction concepts above map to single border-color hex values in the UI spec)

---

## Win / End Condition

### Primary Endgame: Conquer All 7 Continentals

The true endgame is to seize control of every Continental Hotel across all regions. This is intentionally designed to be **extremely difficult** — a multi-hundred-hour grind.

- **Prestige 35+** requires ~500+ hours of play
- **1e33 lifetime earnings** is an astronomical number requiring exponential grinding
- **Theme-specific requirements** force mastery of each unique mechanic
- **No shortcuts** — every requirement must be met, no buy-to-win

### Ultimate Endgame: Royal Takeover

After all 7 Royal Continentals are established and the "Royal Ascension" skill node is purchased, the player can attempt the **Royal Takeover** — seizing control of the High Table itself.

**Reward**: The player becomes the **High Table Sovereign** — the supreme ruler of the entire Continental network.

- **Title**: "The Sovereign of the High Table"
- **Permanent Effect**: All buffs from all sources doubled (standard + Royal + Elder)
- **New Mechanic**: Issue Royal Decrees — daily choose 1 of 3 random global buffs (see `03-progression-system.md` for full decree pool and rules)

- **Sandbox+**: Infinite Royal Prestige loops with increasing rewards
  - `sandboxRewardMultiplier = 1 + (royalPrestigeCount × 0.1)` — each Royal Prestige loop increases all rewards by 10%
  - Royal Marks generation: `baseRate × sandboxRewardMultiplier`
  - Elder Favor generation: `baseRate × sandboxRewardMultiplier`
  - No cap — scales infinitely
  - Each loop also grants +1 Royal Decree slot (max 3 simultaneous decrees)

- **Post-Endgame Contracts**: Issue contracts to AI-controlled Continentals for passive income

| Contract | Cost (Royal Marks) | Duration | Reward |
|---|---|---|---|
| Tribute Collection | 5 | 24h | +50 Royal Marks/day |
| Shadow Network | 10 | 48h | +100 Blood Coins/day |
| Intelligence Sharing | 15 | 72h | +5 Table Favor/day |
| Resource Pipeline | 20 | 24h | +500 Armaments, +50 Troopers, +500 Contraband, +100 Intel per day |
| Golden Route | 30 | 48h | +1000 Royal Marks over duration |

- Max 3 active contracts simultaneously
- Contracts auto-complete at end of duration
- Rewards deposited to global inventory

- **Achievement**: "Above the Table" — the rarest achievement in the game

### Post-Endgame: Sandbox Mode

The game continues with no more progression — you rule the network. Infinite Royal Prestige loops with increasing rewards.

---

## MVP Scope

1. Starting country selection on world map (choose from 7 countries)
2. Selected HQ country — core idle loop (income, upgrades, staff)
3. Event system (3 events)
4. Prestige reset with Table Favor
5. Rome theme unlock at prestige 1 (or whichever country is next in unlock order)
6. World map navigation UI (tap nodes to switch Continentals)

---

## Roadmap

| Phase | Feature |
|---|---|
| MVP | Starting country selection, world map, HQ + 1 unlock, basic idle loop, 3 events, prestige |
| Phase 2 | All 7 themes, full event roster, staff XP, world map node states |
| Phase 3 | Offline progress, save export/import, achievements, takeover system, underworld resource system |
| Phase 4 | Royal Continental system, Royal Marks, Royal skill tree, seasonal events |
| Phase 5 | Royal Takeover endgame, custom themes, sandbox+ mode |

---

## Monetization (Optional)

- **Ad-backed**: Watch ad for "Marker" — temporary 2× income boost
  - Duration: 60 seconds
  - Cooldown: 30 minutes between ad boosts
  - Max per day: 5 ad boosts
  - Applies to currently active theme only
  - Does not stack with Boost Tokens (mutually exclusive)
  - Does not persist offline
- **Cosmetic themes**: Alternate skins for existing branches (e.g., Holiday Continental)
  - Pure visual reskin — no gameplay effect
  - Price: $0.99–$2.99 per skin
  - Seasonal skins available during events (also earnable via seasonal currency)
- **No pay-to-win**: All gameplay unlocks achievable through idle play
