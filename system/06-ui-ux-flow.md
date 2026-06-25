# 06 — UI/UX Flow

> Source: Extracted from `Continetal-idle.md`

---

## Screen Map

| Screen | When Visible | Purpose |
|---|---|---|
| Main Hotel | Always | Core idle loop — buy, upgrade, earn |
| Staff & Assassin | Tap hotel view | Assign staff, hire/manage assassins |
| Prestige | Tap prestige button | Reset for Table Favor |
| High Table Tree | From prestige screen | Spend Table Favor on global buffs |
| Event Popup | Random trigger | Make event choices |
| World Map | Tap [MAP] button | Navigate, switch Continentals, view Royal/conquest status |
| Royal Hotel | Tap Royal node on map | Manage Royal Continental buildings and Royal Marks |
| Underworld Resources | Tap underworld panel | Manage illegal resources, Black Market Shop |
| Black Market Shop | Tap shop button | Spend Blood Coins on underworld upgrades |
| Currency Exchange | Endgame, The Bishop | Trade between theme currencies |
| Welcome Back | On return from offline | Collect offline earnings |
| Achievements | Menu button | Track progress, earn permanent buffs |
| Tutorial | First play only | Teach core mechanics |
| Daily Contracts | Menu button (Prestige 3+) | Complete daily objectives for rewards |
| Conquest Roadmap | [ROADMAP] button on World Map | View all theme takeover requirements at a glance |
| Assassin Network | Button in Staff & Assassin panel | Global assassin management and reassignment |
| Event History Log | [LOG] button on main screen | Review last 50 event choices and outcomes |
| Statistics Dashboard | Menu button | Manager's Ledger — lifetime stats and analytics |

---

## HUD Elements

### Always Visible (Main Hotel Screen)

- **Header**: Continental name + theme indicator (◄ ROME │ ★ NEW YORK │ CASABLANCA ►)
- **Currency bar**: Current currency + income rate (e.g., `⚙ Gold: 1.25M/s`)
- **Heat meter**: `☠ Heat: ████░░░░░░ 4/10` with countdown to next decay
- **Inactive themes ticker**: `ACTIVE: New York — 1.2M/s Gold | IDLE: Rome 225K/s Lira | Casa 90K/s Desert`
- **Underworld resource panel**: Sidebar showing Armaments, Troopers, Contraband, Intel, Blood Coins with progress bars
- **Event prompt bar**: `▸ CONTRACT OPEN: Accept bounty? [YES] [NO] 28s`
- **Active buffs display**: `[+200% Underground] [Staff XP +100%]`
- **Buy multiplier toggle**: `Buy: x1 x10 x100 [MAX]`

---

## Screen Specifications

### Screen 1: Main Hotel Screen (Primary Gameplay)

```
┌─────────────────────────────────────────────────────┐
│  CONTINENTAL — NEW YORK          ⚙ Gold: 1.25M/s   │
│  ◄ ROME │ ★ NEW YORK │ CASABLANCA ►                │
├──────────────────────┬──────────────────────────────┤
│  BUILDINGS           │  HOTEL VIEW                  │
│  ─────────────────── │                              │
│  Guest Rooms  Lv.12  │  ┌────────────────────────┐  │
│  +847/s       [BUY]  │  │   [Animated Terminal    │  │
│  Cost: 15.2K         │  │    Hotel Scene]         │  │
│  ─────────────────── │  │   Guests: 124          │  │
│  Bar/Lounge   Lv.8   │  │   Staff Active: 3/5    │  │
│  +423/s       [BUY]  │  │   Assassins: 2/3       │  │
│  Cost: 8.7K          │  │   Loyalty Avg: 78%     │  │
│  ─────────────────── │  └────────────────────────┘  │
│  Safe House   Lv.3   │  UPGRADES                    │
│  Interest: 2%  [BUY] │  [Renovate Lobby ✓]          │
│                      │  [Expand Bar     ✓]          │
│  Buy: x1 x10 x100   │  [Secure Vault   12K]        │
│       [MAX]          │  [Private Wing   LOCKED]     │
├──────────────────────┴──────────────────────────────┤
│  ▸ CONTRACT OPEN: Accept bounty? [YES] [NO]  28s   │
│  Buffs: [+200% Underground] [Staff XP +100%]       │
│  ☠ Heat: ████░░░░░░ 4/10    [REDUCE]              │
└─────────────────────────────────────────────────────┘
```

**Player Actions**:
- Tap [BUY] to purchase building levels
- Toggle buy multiplier (x1/x10/x100/MAX)
- Tap upgrades to purchase
- Swipe theme tabs (◄ ►) to switch Continental
- Tap event prompt to make choice
- Tap hotel view to open Staff/Assassin panel

### Screen 2: Staff & Assassin Panel (Overlay)

```
┌─────────────────────────────────────────────────────┐
│  STAFF & ASSASSINS — NEW YORK              [CLOSE]  │
├─────────────────────────┬───────────────────────────┤
│  STAFF                  │  ASSASSINS                │
│  ───────────────────    │  ──────────────────────── │
│  Concierge    Lv.4     │  Slot 1: The Ghost  (A)   │
│  → Guest Rooms +35%    │  Loyalty: ████████░░ 82%  │
│  XP: ████████░░        │  Ability: Auto-resolve    │
│  ───────────────────    │  [PAY BONUS] [RETIRE]     │
│  Bartender    Lv.2     │  ──────────────────────── │
│  → Bar/Lounge +20%     │  Slot 2: The Hammer (A)   │
│  XP: ███░░░░░░░        │  Loyalty: █████░░░░░ 54%  │
│  ───────────────────    │  [PAY BONUS] [RETIRE]     │
│  Cleaner      Lv.1     │  ──────────────────────── │
│  → Events -15%         │  Slot 3: [HIRE]           │
│  XP: █░░░░░░░░░        │  Available:               │
│  ───────────────────    │  The Whisper (S) 5M       │
│  Sommelier    LOCKED   │  The Wolf    (S) 8M       │
│  Unlock: Private Wing  │  The Shade   (S) 15M      │
│  ───────────────────    │  [LEND TO OTHER THEME]    │
├─────────────────────────┴───────────────────────────┤
│  Synergy: Ghost + Hammer = +50% event rewards       │
└─────────────────────────────────────────────────────┘
```

### Screen 3: Prestige Screen (Modal)

```
┌─────────────────────────────────────────────────────┐
│  HIGH TABLE ASCENSION — NEW YORK           [CLOSE]  │
├─────────────────────────────────────────────────────┤
│  Current Prestige: Level 4                          │
│  Lifetime Earnings: 2.45B                           │
│  ┌───────────────────────────────────────────────┐  │
│  │  RESET NEW YORK?                              │  │
│  │  You will lose:                               │  │
│  │  - All building levels                        │  │
│  │  - All currency                               │  │
│  │  You will gain:                               │  │
│  │  + 12 Table Favor                             │  │
│  │  + Prestige Level 5                           │  │
│  │  + Unlock: Osaka theme                        │  │
│  │  You keep:                                    │  │
│  │  - Staff (with XP)                            │  │
│  │  - Assassins (with loyalty)                   │  │
│  │  - Upgrades purchased                         │  │
│  │  [ASCEND]                    [CANCEL]         │  │
│  └───────────────────────────────────────────────┘  │
│  TAKEOVER PROGRESS: ████████░░░░░░░░░░░░ 40%       │
│  Requirement: Prestige 5 ✓  |  1e15 earnings ░     │
│  Special: Survive 50 excommunicados (32/50) ░       │
└─────────────────────────────────────────────────────┘
```

### Screen 4: High Table Skill Tree (Modal)

```
┌─────────────────────────────────────────────────────┐
│  HIGH TABLE SKILL TREE          Favor: 47  [CLOSE]  │
├─────────────────────────────────────────────────────┤
│         COMMERCE ─── PERSONNEL ─── SHADOW           │
│            │             │            │             │
│       [Income I ✓]  [Staff I ✓]  [Network I]       │
│            │             │            │             │
│       [Income II ✓] [Staff II]   [Network II]      │
│            │             │            │             │
│       [Income III]  [Staff III]  [Network III]      │
│            │             │            │             │
│       [Income IV]   [Mastery]    [Assassin+]        │
│            │             │            │             │
│       [Income V]    [Auto-Assign] [No Defect]       │
│                                                     │
│         DIPLOMACY ─────────── ASCENSION             │
│            │                      │                 │
│       [Forgive I ✓]          [Deeper I ✓]           │
│            │                      │                 │
│       [Forgive II]           [Deeper II]            │
│            │                      │                 │
│       [Clear All]            [Auto-Prestige]        │
│                                                     │
│  Selected: Income III                               │
│  Cost: 8 Favor                                      │
│  Effect: +5% income, all themes                     │
│  [UNLOCK]                                           │
└─────────────────────────────────────────────────────┘
```

### Screen 5: Event Popup (Overlay)

```
┌─────────────────────────────────────────────────────┐
│  ⚠ EVENT — EXCOMMUNICADO                            │
├─────────────────────────────────────────────────────┤
│  The High Table has declared you EXCOMMUNICADO.     │
│  All income will be frozen for 60 seconds.          │
│  Timer: ██████████████░░░░░░ 42s remaining          │
│  Options:                                           │
│  [PAY TRIBUTE: 50K] — End excommunicado immediately │
│  [WAIT IT OUT]      — Income paused, no cost        │
│  Cleaner Effect: Duration reduced to 45s            │
│  The Shade Effect: Duration halved to 30s           │
└─────────────────────────────────────────────────────┘
```

### Screen 6: World Map

```
┌─────────────────────────────────────────────────────┐
│  WORLD MAP — CONTINENTAL NETWORK           [CLOSE]  │
├─────────────────────────────────────────────────────┤
│     ┌──────────────────────────────────────────┐     │
│     │   ★ NY(12)   ◄ PARIS   ▒ BERLIN          │     │
│     │     ●           ●          ●              │     │
│     │   1.2M/s      P.22       P.35             │     │
│     │   ◄ CASABLANCA                             │     │
│     │      ●  P.5  180K/s                        │     │
│     │                    ▒ OSAKA  Need P.12      │     │
│     │            ▒ DUBAI  Need P.55              │     │
│     └──────────────────────────────────────────┘     │
│  ★ = HQ    ◄ = Active    ▒ = Locked    ♛ = Royal    │
│  Nodes: 2/7 Active | Conquered: 0/7 | Royal: 0/7   │
│  [TAP NODE TO SWITCH]                              │
└─────────────────────────────────────────────────────┘
```

### Screen 7: Dual-Currency Trading

```
┌─────────────────────────────────────────────────────┐
│  CURRENCY EXCHANGE — THE BISHOP           [CLOSE]   │
├─────────────────────────────────────────────────────┤
│  SELL: [Gold Coins ▼]    BUY: [Lira Tokens ▼]      │
│  Rate: 1 Gold = 0.87 Lira   (▲ +3% today)          │
│  Rate History: ░▒▓█▓▒░▒▓██▓▒░▒▓█▓▒░                │
│  Amount: [___100K___]                               │
│  You receive: 87K Lira Tokens                       │
│  [TRADE]                                            │
│  ── MARKET RATES ──                                 │
│  Gold → Lira     0.87  ▲                            │
│  Gold → Desert   1.23  ▼                            │
│  Gold → Sakura   0.45  ▲                            │
│  Gold → Euro     0.92  ─                            │
│  Gold → Iron     1.10  ▼                            │
│  Gold → Dinar    0.33  ▲                            │
└─────────────────────────────────────────────────────┘
```

### Screen 8: Welcome Back (Offline Progress)

```
┌─────────────────────────────────────────────────────┐
│  WELCOME BACK, MANAGER                              │
├─────────────────────────────────────────────────────┤
│  You were away for 6h 23m                           │
│  ── EARNINGS REPORT ──                              │
│  NEW YORK:    +2.4M Gold Coins                      │
│  ROME:        +890K Lira Tokens                     │
│  CASABLANCA:  (locked)                              │
│  Offline Efficiency: 75%                            │
│  ── EVENTS MISSED ──                                │
│  2 Contracts expired (auto-declined)                │
│  1 Excommunicado survived (Cleaner mitigated)       │
│  ── STAFF PROGRESS ──                               │
│  Concierge: Lv.4 → Lv.5 ★                          │
│  Bartender: +340 XP                                 │
│  ── NOTIFICATIONS ──                                │
│  ⚠ The Ghost loyalty at 28% — defection risk!       │
│  ⚠ Heat at 8/10 in NY                               │
│  ✓ Concierge reached Lv.20 — tips unlocked          │
│  ℹ Alliance 'Supply Run' completed while away       │
│  [WATCH AD: 2× EARNINGS]         [COLLECT]          │
└─────────────────────────────────────────────────────┘
```

### Screen 9: Achievements

```
┌─────────────────────────────────────────────────────┐
│  ACHIEVEMENTS                    42/120    [CLOSE]  │
├─────────────────────────────────────────────────────┤
│  ── INCOME ──                                       │
│  [✓] First Blood         Earn 1K         +1% income │
│  [✓] Big Spender         Earn 1M         +2% income │
│  [░] Continental Fortune  Earn 1B         +5% income │
│  ── PRESTIGE ──                                     │
│  [✓] First Ascension     Prestige 1x     Auto-buy   │
│  [░] High Roller          Prestige 10x    +10% favor │
│  ── ASSASSINS ──                                    │
│  [✓] First Hire           Hire 1 assassin  Badge     │
│  [░] Shadow Army           Hire all SS      Badge     │
│  ── CONQUEST ──                                     │
│  [░] NY Taken              Conquer NY      +50% inc  │
│  [░] World Conqueror       Conquer all 7   Title     │
│  ── HIDDEN ──                                       │
│  [?] ???                   ???             ???       │
└─────────────────────────────────────────────────────┘
```

### Screen 10: Tutorial / Onboarding

| Step | Action | Duration | Teaches |
|---|---|---|---|
| 0 | Select headquarters country on world map | 10s | World map, starting choice |
| 1 | Build Reception Desk (free) | 5s | Building mechanic |
| 2 | Buy Guest Rooms | 10s | Currency spending |
| 3 | Hire Concierge, assign to Guest Rooms | 15s | Staff system |
| 4 | Wait for first event, make choice | 30s | Event system |
| 5 | Buy Bar/Lounge + Bartender | 15s | Multi-building strategy |
| 6 | Show income/sec counter, explain idle | 10s | Idle concept |

After tutorial (steps 0–6), player is ~2.5 minutes in with HQ selected, 3 buildings, and 2 staff. Steps 7–11 are **deferred contextual tips** — they appear as non-blocking toast dialogs triggered by specific in-game milestones, NOT part of the locked onboarding flow.

#### Tutorial Implementation Details

**Spotlight/Highlight Mechanic:**
- A semi-transparent dark overlay (z-index 9000) covers the entire screen except the target element
- Target element receives a glowing gold border (`2px solid #ffd700`) and `box-shadow: 0 0 20px #ffd700`
- A speech bubble tooltip appears adjacent to the highlighted element pointing toward it
- Tooltip contains: step number, dialogue text, and a "Next" button
- If target is offscreen, the sidebar/panel auto-scrolls to bring it into view

**Lock Rules During Tutorial:**
- All nav buttons except the current step's target are `pointer-events: none` and `opacity: 0.3`
- Buy multipliers locked to x1 (x10/x100/MAX disabled)
- Prestige button hidden until core tutorial (steps 0–6) is complete
- World map countries locked except HQ selection during step 0
- Events are suppressed until step 4 (forced event triggered at step 4)
- "Skip Tutorial" button available at top-right of tooltip — sets `tutorialCompleted = true` and closes panel
- Skipping grants no rewards but unlocks all features immediately

**Core Tutorial Dialogue (Steps 0–6, locked onboarding):**

| Step | Dialogue Text |
|---|---|
| 0 | "Welcome, Manager. The Continental needs a new home. Select your headquarters on the map — this will be your starting branch." |
| 1 | "Every Continental needs a Reception Desk. It's free — tap [BUY] to build it. This is where guests check in." |
| 2 | "Guest Rooms generate your first income. Tap [BUY] next to Guest Rooms. Watch your gold counter increase!" |
| 3 | "Staff make buildings better. Open the Staff panel and hire a Concierge. Then assign them to Guest Rooms using the dropdown." |
| 4 | "Events happen randomly. An event prompt will appear — read it carefully and choose. Your choice affects income, heat, and reputation." |
| 5 | "Diversify! Buy a Bar/Lounge and hire a Bartender. Different buildings + matching staff = more income." |
| 6 | "See the income/sec counter? That's your passive income. It keeps flowing even when you're not tapping. Welcome to idle!" |

**Deferred Contextual Tips (Steps 7–11, non-blocking toasts triggered by milestones):**

| Step | Trigger | Dialogue Text |
|---|---|---|
| 7 | First assassin slot unlocked | "Open the Assassin Network. Assassins provide powerful global bonuses — but watch their loyalty." |
| 8 | High Table Liaison upgrade purchased | "Prestige resets buildings but grants Table Favor for permanent upgrades. It's the key to unlocking new Continental branches." |
| 9 | First staff reaches Prestige 3 (Veteran eligible) | "Staff who survive 3 prestiges become Veterans with boosted stats. Keep your best staff across resets!" |
| 10 | First prestige completed | "Each prestige unlocks new Continental branches — Rome, Casablanca, Osaka, and more. Each has unique mechanics." |
| 11 | First theme conquered | "Conquer all 7 Continentals to reach the endgame. The High Table awaits. Good luck, Manager." |

### Screen 11: Royal Hotel Screen

```
┌─────────────────────────────────────────────────────┐
│  ROYAL CONTINENTAL — NEW YORK        ♛ Marks: 42   │
│  ◄ ROYAL ROME │ ★ ROYAL NY │ ROYAL CASA ►          │
├──────────────────────┬──────────────────────────────┤
│  ROYAL BUILDINGS     │  ROVAL VIEW                  │
│  ─────────────────── │                              │
│  Royal Reception R5  │  ┌────────────────────────┐  │
│  +50K/s       [BUY]  │  │   Royal Throne Room    │  │
│  Cost: 2B            │  │   Royal Guests: 8      │  │
│  Grand Suite   R3    │  │   Royal Staff: 2/4     │  │
│  +150K/s      [BUY]  │  │   Royal Marks: +0.5/min │  │
│  Cost: 8B            │  └────────────────────────┘  │
│  ─────────────────── │  ROYAL MARKS SHOP            │
│  Royal Vault   R1    │  [Income Boost  10 RM]       │
│  +200K/s      [BUY]  │  [Staff Slot   25 RM]        │
│  Cost: 4B            │  [Event Shield 20 RM]        │
│                      │  [Time Warp   50 RM]         │
│  Buy: x1 x10 x100   │  [Favor Trade  30 RM]        │
│       [MAX]          │                              │
├──────────────────────┴──────────────────────────────┤
│  Royal Prestige: Level 2  |  Favor: 18              │
│  Global Buff: +100% bounty rewards (Royal NY)       │
│  [ROYAL PRESTIGE]                                   │
└─────────────────────────────────────────────────────┘
```

### Screen 12: Underworld Resources Screen

```
┌─────────────────────────────────────────────────────┐
│  UNDERWORLD RESOURCES — NEW YORK          [CLOSE]   │
├─────────────────────────────────────────────────────┤
│  ── RESOURCES (THIS THEME) ──                       │
│  🔫 Armaments   ████████░░░░  350 / 600  (+2/s)    │
│  🛡️ Troopers    ██████░░░░░░  60 / 120   (+1/s)    │
│  📦 Contraband  ██████████░░  800 / 1200 (+3/s)    │
│  📋 Intel       ████░░░░░░░░  80 / 250   (+1/s)    │
│                                                     │
│  ── GLOBAL ──                                       │
│  🩸 Blood Coins: 1,250  (Global, never resets)      │
│                                                     │
│  ── RESOURCE USAGE ──                               │
│  Armament Consumption: -10/hr (2 assassins)         │
│  Trooper Defense: -20% penalty reduction (20 max)   │
│  Intel Heat Reduction: -8/hr (80 Intel)             │
│                                                     │
│  ── ACTIONS ──                                      │
│  [SELL CONTRABAND: 800 → 80K Gold]                  │
│  [SELL ARMAMENTS: 350 → 17.5K Gold]                 │
│  [BLACK MARKET SHOP]                                │
└─────────────────────────────────────────────────────┘
```

### Screen 13: Black Market Shop Screen

```
┌─────────────────────────────────────────────────────┐
│  BLACK MARKET SHOP — BLOOD COINS         [CLOSE]    │
├─────────────────────────────────────────────────────┤
│  Balance: 1,250 🩸 Blood Coins                      │
│  ─────────────────────────────────────────────────  │
│  Black Market Arms        50 🩸    [BUY]            │
│   +500 Armaments instantly                         │
│  Mercenary Squad         100 🩸    [BUY]            │
│   +20 Troopers instantly                           │
│  Smuggler's Cache         75 🩸    [BUY]            │
│   +300 Contraband instantly                        │
│  Information Broker       60 🩸    [BUY]            │
│   +100 Intel instantly                             │
│  Underworld Contact      200 🩸    [BUY]            │
│   Trigger random underworld event (2× rewards)     │
│  Blood Oath Token        150 🩸    [BUY]            │
│   Next Blood Oath auto-wins                         │
│  Excommunicado Bribe     300 🩸    [BUY]            │
│   Cancel next excommunicado for free               │
│  Heat Reduction           80 🩸    [BUY]            │
│   Reduce Heat by 3 levels                          │
│  ── PERMANENT UPGRADES ──                           │
│  Shadow Armory          500 🩸    [BUY]            │
│   +50% Armament generation (this theme)            │
│  Shadow Barracks        500 🩸    [BUY]            │
│   +50% Trooper generation (this theme)             │
│  Shadow Pipeline        500 🩸    [BUY]            │
│   +50% Contraband generation (this theme)          │
│  Shadow Intelligence    500 🩸    [BUY]            │
│   +50% Intel generation (this theme)               │
│  Underworld Empire     2000 🩸    [BUY]            │
│   +25% all underworld resources (all themes)       │
└─────────────────────────────────────────────────────┘
```

### Screen 14: Daily Contracts Screen

```
┌─────────────────────────────────────────────────────┐
│  DAILY CONTRACT BOARD                     [CLOSE]   │
├─────────────────────────────────────────────────────┤
│  Login Streak: 7 days 🔥 (+50% rewards today)       │
│  Refresh in: 14h 23m                                │
│  ─────────────────────────────────────────────────  │
│  Contract 1: Income Goal                            │
│  Earn 100× current income/sec in 10 min             │
│  Progress: ████████░░░░ 67%  (6m 40s left)         │
│  Reward: +5 Table Favor (+50% = +7.5)              │
│  [ABANDON]                                          │
│  ─────────────────────────────────────────────────  │
│  Contract 2: Event Master                           │
│  Resolve 5 events without penalties                 │
│  Progress: 3/5 events                               │
│  Reward: +50 Blood Coins (+50% = +75)              │
│  [ABANDON]                                          │
│  ─────────────────────────────────────────────────  │
│  Contract 3: Loyalty Keeper                         │
│  Keep all assassins above 80% loyalty for 1 hour    │
│  Progress: 23m / 60m                                │
│  Reward: +20 Table Favor (+50% = +30)              │
│  [ABANDON]                                          │
│  ─────────────────────────────────────────────────  │
│  Boost Tokens: 1 Gold Marker (3× income, 5 min)     │
│  [USE TOKEN]                                        │
└─────────────────────────────────────────────────────┘
```

---

## UX Principles

- **One-tap core loop** — buying and assigning should never be more than 1–2 taps
- **Glanceable** — color-coded affordability (green = buyable, grey = locked)
- **Terminal feedback** — color-coded affordability (green = buyable, grey = locked), toast notifications for events
- **Mobile-first** — vertical layout, large tap targets, theme switch via swipe

---

## UX Additions

### Manager's Objectives Panel

Dynamic to-do list suggesting next actions:
- "Reach Prestige 5 in NY to unlock takeover progress"
- "Hire The Bishop (100M) to enable currency trading"
- "Build Continental Vault to start generating Table Favor passively"
- Objectives update automatically, tapping navigates to relevant screen

### Theme Comparison View

| Theme | Income | Prestige | Rep | Staff | Avg Stat | Assassins | Takeover % | Underworld |
|---|---|---|---|---|---|---|---|---|
| NY | 1.2M/s | P.12 | 723 | 5/8 | 6.2 | 3/6 | 40% | Active |
| Rome | 450K/s | P.8 | 412 | 3/8 | 5.1 | 2/6 | 10% | Active |
| Casa | 180K/s | P.5 | 201 | 2/8 | 4.8 | 1/6 | 0% | Inactive |

### Bulk Staff Management

- **Auto-Assign All** (Personnel max unlock): assigns all staff to optimal building
- **Prestige Preset**: Save up to 3 staff assignment layouts per theme
- **Unassign All**: One button to unassign all staff in current theme

### Event History Log

Shows last 50 events (does not persist across sessions):

| Time | Theme | Event | Choice | Outcome |
|---|---|---|---|---|
| 2m ago | NY | Contract Open | Accept | +2× income 90s |
| 5m ago | NY | Excommunicado | Wait | Survived, +10 Rep |
| 12m ago | Rome | Auction Night | Bid 12M | Won Renaissance Painting |

### Income Breakdown Tooltip

Shows the full multiplier chain for any building on tap-hold. Only active (non-1.0) multipliers are shown — neutral values are hidden to reduce clutter:

```
Guest Rooms: 12,450/s
├─ Base: 5/s
├─ Building Lv.15: ×2.07
├─ Staff (Concierge Lv.6, match): ×1.75
├─ Stats (PRE 4): ×1.08
├─ Traits (Golden Touch): ×1.10
├─ Assassin (The Don): ×4.00
├─ Upgrades (Lobby+Bar): ×3.00
├─ Prestige (Favor ×3): ×1.06
├─ Event (Contract Open): ×2.00
├─ HQ Bonus: ×1.20
├─ Conquest (NY conquered): ×1.50
├─ Royal Buff (Royal NY): ×2.00
├─ Elder Boosts (2 purchased): ×3.00
├─ Reputation (Respected): ×1.10
├─ Alliance (2 active): ×1.10
├─ Broadcast: ×1.25
├─ Crown: ×2.00
├─ Guest Satisfaction (72): ×1.22
└─ Total: 5 × 2.07 × 1.75 × 1.08 × 1.10 × 4.00 × 3.00
         × 1.06 × 2.00 × 1.20 × 1.50 × 2.00 × 3.00
         × 1.10 × 1.10 × 1.25 × 2.00 × 1.22 = ~12,450/s
```

- Multipliers at ×1.0 (e.g., no event active, no Sovereign, no elder boosts) are **hidden** from the tooltip
- Tap any multiplier row to see a sub-breakdown (e.g., tap "Staff" to see each assigned staff's contribution)
- Tooltip updates in real-time during events (Contract Open multiplier appears/disappears)

### Conquest Roadmap Screen

```
CONTINENTAL TAKEOVER ROADMAP

NY    [CONQUERED ✓]  P.5  1e15  Sovereign  50 excom (✓)
Rome  [CONQUERED ✓]  P.10 1e18  Sovereign  10 auctions (✓)
Casa  [CONQUERED ✓]  P.15 1e21  Sovereign  20 smuggling (✓)
Osaka [ACTIVE 85%]   P.20 1e24  Sovereign  10 assassins maxed (7/10)
Paris [LOCKED 40%]   P.25 1e27  Sovereign  50 marker debts (20/50)
Berlin[LOCKED 15%]   P.30 1e30  Sovereign  50 blood oaths (5/50)
Dubai [LOCKED 0%]    P.35 1e33  Sovereign  100 VIP guests (0/100)

Total: 3/7 conquered
```

### Assassin Network Screen

```
ASSASSIN NETWORK

The Ghost (S, Awakened, Lv.10)     [NY ▼]  Loyalty: 82%
  PRE 8 | SPD 4 | CHA 5 | LCK 3   [Shadow Touched] [Workaholic]
The Hammer (A, Lv.7)               [NY ▼]  Loyalty: 65%
  PRE 5 | SPD 7 | CHA 3 | LCK 5   [Lucky Charm]
The Whisper (S, Lv.4)              [Rome ▼] Loyalty: 91%
  PRE 6 | SPD 5 | CHA 7 | LCK 2   [Silver Tongue] [Perfectionist]

[ASSIGN ALL OPTIMAL]  [RECALL ALL TO HQ]
```

### Enhanced Heat Meter

```
☠ Heat: ████░░░░░░ 4/10
   Next decay: 3m 22s
   ⚠ At Heat 6+: Excommunicado frequency doubles
```
- Color shifts: yellow (1-3), orange (4-6), red (7-10)
- Pulsing text indicator when Heat reaches 8+ (no animation, bold red text)

### Statistics Dashboard

```
┌─────────────────────────────────────────────────────┐
│  MANAGER'S LEDGER — STATISTICS             [CLOSE]  │
├─────────────────────────────────────────────────────┤
│  ── LIFETIME ──                                     │
│  Total Earnings:        4.72T across all themes     │
│  Total Prestige:        47                          │
│  Total Events:          1,247 (892 resolved)        │
│  Play Time:             142h 31m                    │
│  Offline Time:          68h 12m                     │
│  ── EFFICIENCY ──                                   │
│  Best event choice rate: 87%                        │
│  Assassin defection rate: 4%                        │
│  Average loyalty: 71%                               │
│  Trade profit/loss: +2.3M net                       │
│  ── RECORDS ──                                      │
│  Highest single income burst: 45M (Contract Open)   │
│  Longest excommunicado survived: 3m 20s             │
│  Most prestige in one session: 4                    │
└─────────────────────────────────────────────────────┘
```

---

## Visual Direction

### Terminal Theme UI (Primary Style)

- **Single border color**: All borders are 1px solid `#cccccc`
- **Monospace font**: Courier New, Consolas, or Monaco
- **Dark background**: Pure black (`#0a0a0a`) and near-black (`#0d0d0d`, `#111111`)
- **Gray scale**: Text and accents use shades of gray (`#cccccc`, `#999999`, `#666666`)
- **No gradients**: Flat colors only
- **No shadows**: Borders define depth, not drop shadows

### Theme Accent Variants

| Theme | Border Color |
|---|---|
| New York | `#cccccc` (default gray) |
| Rome | `#d4a574` (terracotta) |
| Casablanca | `#74d4a5` (emerald) |
| Osaka | `#d474a5` (cherry pink) |
| Paris | `#a574d4` (burgundy) |
| Berlin | `#d47474` (red) |
| Dubai | `#74c2d4` (champagne blue) |

### Component Style

- **Boxes**: 1px border, dark background, no rounded corners
- **Buttons**: 1px border, hover fills with dimmed border color, active inverts colors
- **Cards**: 1px border, title underlined with 1px border
- **Inputs**: 1px border, focus adds 1px inner border
- **Progress bars**: 1px border, fill uses border color
- **Tabs**: 1px border, active tab merges with content border
- **Modals**: 1px border, 90% black overlay
- **Ticker**: 1px border, scrolling text animation

### Typography

- **Uppercase labels**: All headers and buttons uppercase
- **Letter spacing**: 1–2px for terminal feel
- **Font weights**: 400 (normal), 600 (semibold), 700 (bold)

### Animation

- **Ticker**: Horizontal scroll for event feed
- **Transitions**: 0.2s ease on hover/active states only
- **No complex animations**: No screen shake, no flash, no particle effects, no glass shatter — keep it minimal, terminal-like

---

## Error & Loading States

### Error States

| Scenario | UI Response |
|---|---|
| Save corruption (checksum mismatch) | Modal: "Save data corrupted. Restore backup?" with [RESTORE BACKUP] / [START NEW GAME] |
| Save backup also corrupted | Modal: "No valid save found. Start new game?" with [NEW GAME] only |
| Insufficient currency for purchase | Button text turns red, toast: "Insufficient funds" (1s) |
| Insufficient Table Favor | Button text turns red, toast: "Not enough Table Favor" (1s) |
| Trade failed (rate changed) | Toast: "Rate changed — trade cancelled" (2s), rate refreshes |
| Building locked (prerequisite not met) | Button greyed out, tooltip on tap: "Requires [prerequisite]" |
| Assassin loyalty too low to lend | Toast: "Loyalty too low to lend (min 30%)" (1s) |
| Max alliances reached | Toast: "Max 3 alliances active" (1s) |
| Save file too large (>10MB) | Toast: "Save data too large — exporting compressed" (2s), auto-compress |

### Loading States

| Scenario | UI Response |
|---|---|
| Initial game load | Terminal boot text: "CONTINENTAL OS v2.0 — LOADING..." (1s) |
| Save load | Text: "Restoring Continental Network..." (instant) |
| Theme switch | Instant border color swap (no fade) |
| World map load | Text: "Loading map data..." (instant) |
| Prestige reset | Full-screen text: "ASCENDING..." (1s, no animation) |

### Responsive Breakpoints

| Breakpoint | Width | Layout Changes |
|---|---|---|
| Mobile portrait | <640px | Single column, stacked panels, swipe tabs, compact HUD, underworld panel as collapsible drawer |
| Mobile landscape | 640–1024px | Two-column where possible, condensed HUD, tabs remain swipe |
| Tablet | 768–1024px | Two-column layout, larger tap targets, world map larger |
| Desktop | >1024px | Full two-column, sidebar for underworld resources (always visible), world map inline |
| Wide desktop | >1440px | Three-column: buildings | hotel view | upgrades/sidebar |

### Mobile-Specific Adaptations

- **Bottom navigation bar**: Fixed bottom bar with [HOTEL] [STAFF] [MAP] [MENU] icons (replaces top tabs on mobile)
- **Collapsible sections**: Buildings list collapses to show only top 3, [SHOW ALL] expands
- **Event popups**: Full-screen overlay on mobile (vs side panel on desktop)
- **Buy multiplier**: Larger touch targets, x1/x10/x100/MAX as full-width buttons
- **Underworld panel**: Hidden by default, accessible via bottom nav [UNDERWORLD] button
- **Theme switch**: Swipe left/right on hotel view (vs tab clicks on desktop)

---

## Notification System

### Toast Notifications

| Type | Visual | Duration | Example |
|---|---|---|---|
| Success | Green border, left-aligned | 2s | "✓ Building purchased — Guest Rooms Lv.13" |
| Warning | Yellow border, left-aligned | 3s | "⚠ The Ghost loyalty at 28% — defection risk!" |
| Error | Red border, left-aligned | 2s | "✗ Insufficient Gold Coins" |
| Info | Gray border, left-aligned | 2s | "ℹ Alliance 'Supply Run' completed" |
| Achievement | Gold border, centered | 4s | "★ Achievement: Big Spender — +2% global income" |

- **Stacking**: Max 3 toasts visible simultaneously; oldest dismissed when 4th appears
- **Position**: Top-center on mobile, top-right on desktop
- **Dismissal**: Tap to dismiss, auto-dismiss after duration

---

## Accessibility

- **Color-blind modes**: Deuteranopia, Protanopia, Tritanopia filters
- **High contrast**: Option to increase border width to 2px, text to 18px minimum
- **Screen reader**: All UI elements have aria labels
- **Reduced motion**: Disable ticker scroll, instant transitions only
- **Font scaling**: 80% → 150% scale option
- **One-hand mode**: All interactions reachable with single thumb on mobile
