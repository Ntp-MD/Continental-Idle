import { BRANCHES } from '@/data/branches'
import { BUILDINGS } from '@/data/buildings'
import { STAFF_TYPES } from '@/data/staff'
import { ASSASSIN_TYPES } from '@/data/assassins'
import { SKILL_NODES } from '@/data/skills'
import { EVENTS } from '@/data/events'
import { SUPPLY_ROUTE_TYPES } from '@/data/supply-routes'
import { AI_TEMPERAMENTS } from '@/data/ai-owners'
import { TRAIT_EFFECTS } from '@/data/traits'
import { UPGRADES } from '@/engine/upgrade-manager'
import { ACHIEVEMENTS } from '@/data/achievements'
import { ROYAL_BUILDINGS } from '@/data/royal-buildings'
import { ROYAL_SKILL_NODES } from '@/data/royal-skills'
import { DECREE_POOL } from '@/data/royal-decrees'

export interface WikiSection {
  id: string
  title: string
  content: WikiContent[]
}

export type WikiContent =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: 3 | 4; text: string }
  | { type: 'list'; items: string[]; ordered?: boolean }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'info-box'; title: string; content: string[] }
  | { type: 'warning-box'; title: string; content: string[] }
  | { type: 'code'; code: string }

export const wikiSections: WikiSection[] = [
  {
    id: 'overview',
    title: 'Overview',
    content: [
      {
        type: 'paragraph',
        text: '**Continental Idle** is an idle/incremental game set in the Continental Hotel universe from the John Wick series. You are the heir of a Continental branch boss whose father has been assassinated in the power struggle for the High Table. Rebuild your father\'s empire across 37 global locations, conquer rival AI controllers, and claim your seat at the High Table.'
      },
      {
        type: 'info-box',
        title: 'Game Info',
        content: [
          'Platform: Browser',
          'BRANCHES: 37',
          'Genre: Idle/Incremental',
          'Style: Terminal-Noir'
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'Core Concept'
      },
      {
        type: 'paragraph',
        text: 'As the heir of a Continental branch boss, you select your headquarters country on a world map. Your father has been assassinated by a rival AI controller in the struggle for the High Table. Each location offers unique bonuses and is a visually and mechanically distinct branch with its own currency, staff, upgrades, and storyline events. Progress through the game by unlocking new countries, conquering rival AI controllers, establishing supply routes, and ascending to Royal Continental status.'
      },
      {
        type: 'heading',
        level: 3,
        text: 'Art Style'
      },
      {
        type: 'paragraph',
        text: 'The game features a **terminal-noir** aesthetic — a terminal/hacker branch as the primary UI with noir-luxury flavor through typography and event storytelling. Each branch swaps the terminal\'s accent color to evoke its region.'
      }
    ]
  },
  {
    id: 'gameplay',
    title: 'Gameplay Loop',
    content: [
      {
        type: 'list',
        ordered: true,
        items: [
          '**Build** — Purchase and upgrade buildings (12 standard per branch)',
          '**Hire** — Recruit staff and assassins with unique stats/traits',
          '**Earn** — Idle income generates automatically; active play boosts via events',
          '**Prestige** — Reset a branch for Table Favor (meta-currency); keep staff, assassins, upgrades',
          '**Expand** — Unlock new BRANCHES via total prestige; conquer Continentals',
          '**Supply Routes** — Establish underworld supply routes between branches for passive income',
          '**Power Balance** — Compete against AI controllers who generate events and fight for control',
          '**Repeat** — Multi-branch management with inactive income at 50%'
        ]
      }
    ]
  },
  {
    id: 'BRANCHES',
    title: 'Continental BRANCHES',
    content: [
      {
        type: 'paragraph',
        text: `There are ${BRANCHES.length} Continental branches across 6 continents, each with unique currencies and mechanics:`
      },
      {
        type: 'heading',
        level: 3,
        text: 'Starter HQs (Prestige 0)'
      },
      {
        type: 'table',
        headers: ['branch', 'City', 'Currency', 'Accent'],
        rows: BRANCHES.filter(t => t.unlockPrestige === 0).map(t => [
          t.name,
          t.city,
          t.currency,
          t.accentColor
        ])
      },
      {
        type: 'heading',
        level: 3,
        text: 'Continental Branches'
      },
      {
        type: 'table',
        headers: ['branch', 'City', 'Currency', 'Unlock Prestige'],
        rows: BRANCHES.filter(t => t.unlockPrestige > 0 && t.unlockPrestige <= 55).map(t => [
          t.name,
          t.city,
          t.currency,
          String(t.unlockPrestige)
        ])
      },
      {
        type: 'paragraph',
        text: `${BRANCHES.length - BRANCHES.filter(t => t.unlockPrestige <= 55).length} additional BRANCHES across North America, South America, Europe, Asia, Africa, and Oceania with unlock requirements ranging from Prestige 2 to 55+.`
      }
    ]
  },
  {
    id: 'buildings',
    title: 'Buildings',
    content: [
      {
        type: 'paragraph',
        text: `Each branch has ${BUILDINGS.length} standard buildings that generate income:`
      },
      {
        type: 'table',
        headers: ['#', 'Building', 'Base Rate', 'Base Cost', 'Max Level', 'Unlock Condition'],
        rows: BUILDINGS.map((b, i) => {
          let unlock = 'Start'
          if (b.unlock.startsWith('building:')) {
            const parts = b.unlock.split(':')
            const bName = BUILDINGS.find(x => x.id === parts[1])?.name || parts[1]
            unlock = `${bName} Lv.${parts[2] || 1}`
          } else if (b.unlock.startsWith('upgrade:')) {
            unlock = 'Upgrade: ' + b.unlock.split(':')[1]
          } else if (b.unlock.startsWith('prestige:')) {
            unlock = 'Prestige ' + b.unlock.split(':')[1]
          }
          return [
            String(i + 1),
            b.name,
            String(b.baseRate),
            String(b.baseCost),
            String(b.maxLevel),
            unlock
          ]
        })
      },
      {
        type: 'info-box',
        title: 'Cost Growth',
        content: [
          'Buildings #1–#10: costGrowth = 1.15',
          'Building #11 (Black Market Vault): costGrowth = 1.25',
          'Building #12 (Continental Vault): costGrowth = 1.35',
          'Income growth per level: 1.07x (BUILDING_INCOME_GROWTH)',
          'Max level: 50 for all buildings'
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'Building Unlock Chain'
      },
      {
        type: 'list',
        items: [
          '**Reception Desk** — Free, available from start',
          '**Guest Rooms** — Available from start',
          '**Bar/Lounge** — Available from start',
          '**Kitchen** — Available from start',
          '**Laundry Service** — Requires Bar/Lounge Lv.5',
          '**Underground Services** — Requires Kitchen Lv.5',
          '**Safe House** — Requires Underground Services Lv.1',
          '**Armory** — Requires Safe House Lv.5',
          '**Intelligence Network** — Requires Armory Lv.3',
          '**VIP Penthouse** — Requires Intelligence Network Lv.1',
          '**Black Market Vault** — Requires VIP Penthouse Lv.5',
          '**Continental Vault** — Requires Black Market Vault Lv.5'
        ]
      },
      {
        type: 'info-box',
        title: 'Safe House Interest',
        content: [
          'Safe House generates interest on your branch currency every 60 seconds.',
          'Base interest rate: 2% per minute',
          'Vault Keeper max ability: doubles to 4% per minute',
          'Gold Standard upgrade: +50% interest (3% base, 6% with Vault Keeper)'
        ]
      }
    ]
  },
  {
    id: 'staff',
    title: 'Staff System',
    content: [
      {
        type: 'paragraph',
        text: `Hire staff to boost building income. There are ${STAFF_TYPES.length} staff types, each with unique abilities and best-match buildings:`
      },
      {
        type: 'table',
        headers: ['Staff', 'Hire Cost', 'Unlock', 'Max Level', 'Best Match', 'Max Ability'],
        rows: STAFF_TYPES.map(s => {
          let unlock = 'Start'
          if (s.unlock.startsWith('building:')) unlock = BUILDINGS.find(b => b.id === s.unlock)?.name || s.unlock
          else if (s.unlock.startsWith('upgrade:')) unlock = 'Upgrade: ' + s.unlock.split(':')[1]
          else if (s.unlock.startsWith('prestige:')) unlock = 'Prestige ' + s.unlock.split(':')[1]
          return [
            s.name,
            String(s.hireCost),
            unlock,
            String(s.maxLevel),
            s.bestMatch.join(', '),
            s.maxAbility
          ]
        })
      },
      {
        type: 'heading',
        level: 3,
        text: 'Staff Mechanics'
      },
      {
        type: 'list',
        items: [
          '**Level** — Increases income bonus via effectPerLevel (best-match buildings get 1.25x bonus)',
          '**XP** — Earned over time while assigned to a building; inactive BRANCHES earn at 50% rate',
          '**Assignment** — Assign to a building to boost its income',
          '**Traits** — Random positive/negative traits affect income, XP, cost, and event protection'
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'Veteran Staff'
      },
      {
        type: 'paragraph',
        text: 'Staff who survive 3 prestiges (or have the OldGuard trait) become Veterans with a prestige survival perk.'
      },
      {
        type: 'heading',
        level: 3,
        text: 'Staff Max Abilities'
      },
      {
        type: 'list',
        items: [
          '**Concierge** (max Lv.20) — Auto-collect guest tips (+5% passive income)',
          '**Bartender** (max Lv.20) — Bar income continues during excommunicado freeze',
          '**Chef** (max Lv.15) — Kitchen boosts ALL building income by +10%',
          '**Cleaner** (max Lv.15) — All negative event penalties negated',
          '**Sommelier** (max Lv.10) — VIP guests arrive 50% more frequently',
          '**Intelligence Officer** (max Lv.10) — All event outcomes revealed before choosing',
          '**Adjudicator** (max Lv.10) — Prestige keeps 80% reputation instead of 50%',
          '**Vault Keeper** (max Lv.10) — Safe House interest doubles to 4%/min'
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'Traits'
      },
      {
        type: 'paragraph',
        text: 'Staff and assassins can have positive, negative, or rare traits that affect gameplay:'
      },
      {
        type: 'table',
        headers: ['Trait', 'Type', 'Effect'],
        rows: Object.entries(TRAIT_EFFECTS).map(([id, effect]) => {
          const isRare = ['legendary', 'untouchable', 'mentor', 'shadowBond', 'goldenTouch'].includes(id)
          const isNegative = ['lazy', 'hotHeaded', 'clumsy', 'superstitious', 'greedy'].includes(id)
          const type = isRare ? 'Rare' : isNegative ? 'Negative' : 'Positive'
          const parts: string[] = []
          if (effect.incomeMult) parts.push(`Income x${effect.incomeMult}`)
          if (effect.xpMult) parts.push(`XP x${effect.xpMult}`)
          if (effect.costMult) parts.push(`Cost x${effect.costMult}`)
          if (effect.negativeEventProtection) parts.push('Negative event protection')
          if (parts.length === 0) parts.push('Special (see description)')
          return [id, type, parts.join(', ')]
        })
      }
    ]
  },
  {
    id: 'assassins',
    title: 'Assassin Network',
    content: [
      {
        type: 'paragraph',
        text: `Hire assassins for powerful global bonuses. There are ${ASSASSIN_TYPES.length} assassin types, unlocked at Prestige 3+:`
      },
      {
        type: 'table',
        headers: ['Assassin', 'Rank', 'Hire Cost', 'Max Level', 'Ability'],
        rows: ASSASSIN_TYPES.map(a => [
          a.name,
          a.rank,
          String(a.hireCost),
          String(a.maxLevel),
          a.ability
        ])
      },
      {
        type: 'heading',
        level: 3,
        text: 'Assassin Mechanics'
      },
      {
        type: 'list',
        items: [
          '**Stats** — Precision, Speed, Charisma, Luck (budget of 24, spread across 4 stats)',
          '**Traits** — Random positive or rare traits; rare traits have powerful income/XP multipliers',
          '**Loyalty** — Decays when assigned away from home branch; must be 30+ to defend against raids',
          '**Lending** — Lend assassins to other BRANCHES for 5 minutes; loyalty drops 5 on return',
          '**Synergy** — Count of buildings with matched staff+assassin assignments',
          '**Combat** — Damage scales with level and stats (Precision x0.5 + Speed x0.3); raid power scales with level x5 + Precision x2 + Speed x1',
          '**Takeover Attacks** — Assign assassins to attack a target branch\'s HQ; damage dealt every 5s tick; loyalty drains 0.2 per tick; XP gained from damage dealt'
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'Awakening'
      },
      {
        type: 'paragraph',
        text: 'Assassins awaken when loyalty reaches 100 and synergy count reaches 3+. Awakened assassins have doubled combat damage and raid power.'
      },
      {
        type: 'heading',
        level: 3,
        text: 'Assassin Abilities'
      },
      {
        type: 'list',
        items: [
          '**Street Samurai** (D) — Reduces heat by 2 when assigned',
          '**Enforcer** (C) — Protects branch from income freeze events',
          '**Shadow Blade** (B) — Doubles reputation gain from events',
          '**Royal Guard** (A) — Halves marker debt accrual rate',
          '**High Table Enforcer** (S) — Prevents excommunicado events entirely'
        ]
      }
    ]
  },
  {
    id: 'takeover',
    title: 'Takeover System',
    content: [
      {
        type: 'paragraph',
        text: 'Conquer rival Continental branches by sending your assassins to attack their HQ. Once the HQ health reaches zero, the branch is yours and the AI controller is defeated.'
      },
      {
        type: 'heading',
        level: 3,
        text: 'How It Works'
      },
      {
        type: 'list',
        ordered: true,
        items: [
          '**Meet Requirements** — Total prestige must reach the branch\'s unlock prestige',
          '**Pay the Cost** — Takeover cost = 50M x 1.15^(unlockPrestige), paid from your active branch currency',
          '**Assign Assassins** — Send assassins from any unlocked branch to attack the target',
          '**Deal Damage** — Every 5s tick, each assigned assassin deals combat damage to the target HQ',
          '**Conquer** — When HQ health reaches 0, the branch is unlocked and added to your empire',
          '**Defeat AI** — The AI controller of that branch is permanently defeated'
        ]
      },
      {
        type: 'info-box',
        title: 'HQ Health',
        content: [
          'Base health: 1,000',
          'Additional: 500 per unlock prestige level',
          'Formula: 1000 + unlockPrestige x 500',
          'Example: Rome (P1) = 1,500 HP, Tokyo (P14) = 8,000 HP'
        ]
      },
      {
        type: 'warning-box',
        title: 'Assassin Requirements',
        content: [
          'Assassins must have loyalty >= 10 to attack',
          'Each tick: loyalty drains 0.2, assassin gains XP from damage dealt',
          'On conquest: attacking assassins gain +10 loyalty and are unassigned',
          'Conquered branches get a 30-minute grace period (no events)'
        ]
      }
    ]
  },
  {
    id: 'debt',
    title: 'Marker Debt System',
    content: [
      {
        type: 'paragraph',
        text: 'Marker debts are obligations that accrue over time. They generate interest and are automatically collected from your branch currency.'
      },
      {
        type: 'heading',
        level: 3,
        text: 'Debt Mechanics'
      },
      {
        type: 'list',
        items: [
          '**Collection Rate** — 5% of each debt is automatically collected per tick from branch currency',
          '**Interest Rate** — 1% per tick, compounded',
          '**Interest Cap** — Debts are capped at 10x their original amount',
          '**Royal Guard** — Halves the interest accrual rate',
          '**Shadow Skill Tree** — Reduces interest rate via debt reduction nodes',
          '**Reputation** — Repaying a debt grants +5 reputation; repaying all grants +10'
        ]
      },
      {
        type: 'info-box',
        title: 'Debt Sources',
        content: [
          'Events can create marker debts as penalties',
          'Debts persist until fully repaid or collected',
          'Prestige clears all marker debts for the prestiged branch',
          'Marker Forgiveness event can clear the cheapest debt'
        ]
      }
    ]
  },
  {
    id: 'upgrades',
    title: 'Permanent Upgrades',
    content: [
      {
        type: 'paragraph',
        text: 'Purchase permanent upgrades for your active branch using currency. These provide powerful permanent bonuses:'
      },
      {
        type: 'table',
        headers: ['Upgrade', 'Description', 'Cost'],
        rows: UPGRADES.map(u => [
          u.name,
          u.description,
          String(u.cost)
        ])
      },
      {
        type: 'info-box',
        title: 'Upgrade Details',
        content: [
          'Private Wing — Unlocks Sommelier staff hire',
          'Armory Expansion — Increases assassin cap from 3 to 4',
          'Continental Charter — Inactive branch income 50% to 60%',
          'Gold Standard — Safe House interest +50%',
          'Diplomatic Channels — New branches start with 100 reputation',
          'Training Grounds — Staff XP gain +20%'
        ]
      }
    ]
  },
  {
    id: 'income-formula',
    title: 'Income Formula',
    content: [
      {
        type: 'paragraph',
        text: 'Branch income is calculated every second using multiple multipliers stacked together:'
      },
      {
        type: 'heading',
        level: 3,
        text: 'Income Calculation'
      },
      {
        type: 'code',
        code: 'income = sum(buildingIncome) x prestigeMult x hqMult x satMult x repMult x buffMult x permBonus x conciergeBonus x skillIncomeMult\n\nbuildingIncome = baseRate x 1.07^level x staffMult x traitIncomeMult\nprestigeMult = 1 + (tableFavor x 0.02)\nhqMult = 1.2 (if HQ branch) or 1.0\nsatMult = 0.5 + (guestSatisfaction / 100)\nrepMult = based on reputation tiers (see below)\npermBonus = 1 + permanentIncomeBonus (from events)'
      },
      {
        type: 'heading',
        level: 3,
        text: 'Reputation Tiers'
      },
      {
        type: 'table',
        headers: ['Reputation', 'Multiplier'],
        rows: [
          ['0-99', '1.0x'],
          ['100-299', '1.10x'],
          ['300-499', '1.20x'],
          ['500-749', '1.45x'],
          ['750-999', '1.70x'],
          ['1000+', '1.95x']
        ]
      },
      {
        type: 'info-box',
        title: 'Inactive Branch Income',
        content: [
          'Inactive branches earn 50% of their calculated income',
          'With Continental Charter upgrade: 60%',
          'Staff XP also earned at 50% rate on inactive branches'
        ]
      },
      {
        type: 'warning-box',
        title: 'Excommunicado Freeze',
        content: [
          'When excommunicado is active, all income is frozen for 60 seconds',
          'High Table Enforcer assassin: full immunity to freeze',
          'Bartender max ability: Bar income continues during freeze',
          'Enforcer assassin: protects from income freeze events'
        ]
      }
    ]
  },
  {
    id: 'events',
    title: 'Event System',
    content: [
      {
        type: 'paragraph',
        text: `Random events trigger periodically (2% base chance per 3-second tick), requiring player decisions. There are ${EVENTS.length} event types:`
      },
      {
        type: 'table',
        headers: ['Event', 'Description', 'Timeout', 'Auto-Resolve'],
        rows: EVENTS.map(e => [
          e.name,
          e.description.slice(0, 60) + (e.description.length > 60 ? '...' : ''),
          e.autoResolveTimeout + 's',
          e.autoResolveAction
        ])
      },
      {
        type: 'heading',
        level: 3,
        text: 'Event Mechanics'
      },
      {
        type: 'list',
        items: [
          '**Weight** — Base probability of triggering',
          '**Heat Modifier** — Increased probability at higher heat levels',
          '**Choices** — 2-3 options with rewards/penalties',
          '**Auto-resolve** — If player doesn\'t respond within timeout, the preferred choice is taken automatically',
          '**Cooldown** — 45 seconds between events per branch; raids have a separate cooldown',
          '**Grace Period** — 30-minute event immunity for newly unlocked or prestiged BRANCHES'
        ]
      },
      {
        type: 'warning-box',
        title: 'Excommunicado',
        content: [
          'Declares your branch excommunicado — all income frozen for 60 seconds.',
          'Can be prevented by hiring a High Table Enforcer assassin.',
          'Bartender max ability keeps Bar income flowing during freeze.',
          'Enforcer assassin grants full immunity to income freeze events.'
        ]
      },
      {
        type: 'info-box',
        title: 'Assassin Raids',
        content: [
          'Unlocked at Prestige 3+. Enemy assassins attack your branch.',
          'Fight: requires assassins with 30+ loyalty assigned to the branch.',
          'Win: earn spoils (attacker power x 1000), +15 reputation, +5 satisfaction.',
          'Lose: lose 10% currency, -10 reputation, -5 satisfaction, 30s income freeze.',
          'Lent assassins from other BRANCHES also defend if loyalty is 30+.'
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'AI-Generated Events'
      },
      {
        type: 'paragraph',
        text: 'In addition to the standard event pool, AI controllers generate dynamic events based on their temperament and power level. These events are targeted at your active branch and scale with the AI owner\'s aggression.'
      },
      {
        type: 'info-box',
        title: 'AI Event Triggering',
        content: [
          'Trigger chance: 1.5% x aggression per 3-second tick',
          'Subject to same 45s cooldown as standard events',
          'Event type determined by AI temperament (aggressive/diplomatic/shadow/defensive)',
          'Higher threat level AI owners act more frequently',
          'See AI Controllers section for event type details'
        ]
      }
    ]
  },
  {
    id: 'story',
    title: 'Story & Background',
    content: [
      {
        type: 'paragraph',
        text: 'You are the child of a Continental branch boss — the head of your family\'s criminal empire in your chosen headquarters city. Your father, a powerful figure in the underworld, has been assassinated in the power struggle for the **High Table** — the supreme council that governs the Continental network across all 37 cities.'
      },
      {
        type: 'heading',
        level: 3,
        text: 'The High Table'
      },
      {
        type: 'paragraph',
        text: 'The High Table is the ruling body of the Continental network. With your father dead, his seat is empty and rival AI controllers are moving to seize control. Each of the 37 cities has its own AI boss with unique temperament and ambitions.'
      },
      {
        type: 'heading',
        level: 3,
        text: 'Your Mission'
      },
      {
        type: 'list',
        items: [
          '**Rebuild** — Restore your father\'s empire from your HQ city',
          '**Conquer** — Seize control of rival Continental branches via takeover',
          '**Supply Routes** — Establish illegal underworld supply lines for passive income',
          '**Defeat AI Controllers** — Each city has an AI boss that generates events and must be defeated',
          '**Claim the High Table** — Conquer all 37 cities to become the Sovereign of the High Table'
        ]
      },
      {
        type: 'info-box',
        title: 'The Assassination',
        content: [
          'Each HQ has a unique father figure with a name and title.',
          'The killer is the AI controller of a rival city.',
          'The story intro changes based on your selected headquarters.',
          'Defeating the killer\'s city is a personal vendetta mission.'
        ]
      }
    ]
  },
  {
    id: 'supply-routes',
    title: 'Underworld Supply Routes',
    content: [
      {
        type: 'paragraph',
        text: 'Establish illegal supply routes between your branches to generate passive income. Routes have stability that decays over time — if stability reaches zero, the route collapses.'
      },
      {
        type: 'heading',
        level: 3,
        text: 'Route Types'
      },
      {
        type: 'table',
        headers: ['Type', 'Icon', 'Base Income/tick', 'Base Stability', 'Decay/tick', 'Establish Cost'],
        rows: SUPPLY_ROUTE_TYPES.map(r => [
          r.name,
          r.icon,
          String(r.baseIncome),
          String(r.baseStability),
          String(r.stabilityDecayPerTick),
          String(r.establishCost)
        ])
      },
      {
        type: 'heading',
        level: 3,
        text: 'Supply Route Mechanics'
      },
      {
        type: 'list',
        items: [
          '**Max Routes** — 3 routes per branch',
          '**Income Split** — 60% to source branch, 40% to destination',
          '**Stability Decay** — Every 5 seconds, stability decreases by the route type\'s decay rate',
          '**Stabilize** — Pay 10% of establish cost to restore +20 stability',
          '**Collapse** — If stability reaches 0, the route is destroyed',
          '**Dismantle** — Voluntarily remove a route (no refund)'
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'Hijacking'
      },
      {
        type: 'paragraph',
        text: 'Routes established by AI controllers can be hijacked using your idle assassins. Hijacking requires an assassin with loyalty >= 20.'
      },
      {
        type: 'info-box',
        title: 'Hijack Mechanics',
        content: [
          'Base success chance: 40%',
          '+5% per assassin level (max 90%)',
          'Success: route transferred to you at 50% stability and 80% income',
          'Success cost: 20 loyalty + 50 XP gained',
          'Failure: 10 loyalty lost',
          'Requires an idle assassin (not assigned to attack or defense)'
        ]
      }
    ]
  },
  {
    id: 'ai-controllers',
    title: 'AI Controllers & Power Balance',
    content: [
      {
        type: 'paragraph',
        text: 'Every city in the Continental network has an **AI Controller** — a rival boss with unique temperament, power, and ambitions. These AI owners generate events from a dynamic event pool, creating an ongoing power struggle between you and the AI.'
      },
      {
        type: 'heading',
        level: 3,
        text: 'AI Temperaments'
      },
      {
        type: 'table',
        headers: ['Temperament', 'Name', 'Icon', 'Playstyle', 'Base Power', 'Aggression'],
        rows: Object.values(AI_TEMPERAMENTS).map(t => [
          t.id.charAt(0).toUpperCase() + t.id.slice(1),
          t.name,
          t.icon,
          t.description,
          String(t.basePower),
          String(t.baseAggression)
        ])
      },
      {
        type: 'heading',
        level: 3,
        text: 'AI Event Types'
      },
      {
        type: 'list',
        items: [
          '**Raid** — AI sends raiders to attack your branch (fight / pay tribute / endure)',
          '**Tribute** — AI demands payment (pay for relations / refuse for heat)',
          '**Sabotage** — AI damages operations (repair / retaliate / endure)',
          '**Spy** — AI spy caught in your branch (interrogate / release)',
          '**Provocation** — AI provokes you (stand firm / back down)',
          '**Truce** — AI offers temporary peace (accept for buff / reject)'
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'Power Balance Mechanics'
      },
      {
        type: 'list',
        items: [
          '**AI Power** — Grows over time, capped by maxPower based on branch unlock prestige',
          '**Player Power** — Calculated from income, assassins, staff, and prestige across all branches',
          '**Threat Levels** — Low / Medium / High / Critical based on AI power vs player power',
          '**Relations** — Drift toward 0 over time; actions can improve or worsen them',
          '**Defeat** — AI controllers are defeated when you conquer their branch via takeover',
          '**Aggression** — Higher aggression AI owners act more frequently'
        ]
      },
      {
        type: 'info-box',
        title: 'Power Balance Status',
        content: [
          'Supreme — Player power > 3x AI total power',
          'Dominant — Player power 1.5x-3x AI total power',
          'Strong — Player power 1x-1.5x AI total power',
          'Contested — Player power 0.8x-1x AI total power',
          'Vulnerable — Player power 0.4x-0.8x AI total power',
          'Overwhelmed — Player power < 0.4x AI total power'
        ]
      },
      {
        type: 'warning-box',
        title: 'AI Names',
        content: [
          'Each city has a unique AI boss name (e.g. Don Caravale, Cardinal Vex, The Neon Dragon).',
          'Temperament is determined by continent and branch unlock prestige.',
          'The AI boss of your father\'s killer is your primary nemesis.'
        ]
      }
    ]
  },
  {
    id: 'prestige',
    title: 'Prestige System',
    content: [
      {
        type: 'paragraph',
        text: 'Prestige resets a branch\'s buildings and currency but grants **Table Favor** — a meta-currency for permanent upgrades. Favor is calculated from lifetime earnings:'
      },
      {
        type: 'code',
        code: 'favor = floor(sqrt(lifetimeEarnings / scaleConstant) x prestigeFavorMult)\n\nscaleConstant:\n  1e9 (default, prestige 0-9)\n  1e8 (prestige 10-24)\n  1e7 (prestige 25-49)\n  1e6 (prestige 50+)'
      },
      {
        type: 'heading',
        level: 3,
        text: 'What You Keep'
      },
      {
        type: 'list',
        items: [
          'All staff (with XP, levels reset to 1)',
          'All assassins (with loyalty, awakening)',
          'All upgrades',
          'Skill tree progress and Table Favor'
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'What You Reset'
      },
      {
        type: 'list',
        items: [
          'branch currency',
          'Building levels (all reset to 0)',
          'Reputation (50% kept, or 80% with maxed Adjudicator)',
          'Heat level',
          'Guest satisfaction (resets to 50)',
          'Marker debts (cleared)',
          'Active buffs for this branch (cleared)'
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'Table Favor Uses'
      },
      {
        type: 'list',
        items: [
          'Unlock new Continental BRANCHES',
          'Purchase permanent income bonuses',
          'Unlock assassin slots',
          'Upgrade skill tree nodes'
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'Royal Continental'
      },
      {
        type: 'paragraph',
        text: 'When total prestige reaches 10+ above a branch\'s unlock threshold, the branch becomes a Royal Continental with enhanced features:'
      },
      {
        type: 'list',
        items: [
          'Royal Buildings — Special endgame structures',
          'Royal Marks — Endgame currency',
          'Royal Prestige — Royal-specific resets',
          'Royal Skill Tree — Endgame upgrades'
        ]
      }
    ]
  },
  {
    id: 'skill-tree',
    title: 'Skill Tree',
    content: [
      {
        type: 'paragraph',
        text: `Invest Table Favor into 5 skill trees, each with 5 levels (${SKILL_NODES.length} total nodes):`
      },
      {
        type: 'table',
        headers: ['Branch', 'Level', 'Name', 'Effect', 'Cost'],
        rows: SKILL_NODES.map(n => [
          n.branch.charAt(0).toUpperCase() + n.branch.slice(1),
          String(n.level),
          n.name,
          n.description,
          String(n.favorCost)
        ])
      },
      {
        type: 'info-box',
        title: 'Skill Tree Branches',
        content: [
          '**Commerce** — Income multipliers',
          '**Personnel** — Staff XP gains and extra staff slots',
          '**Shadow** — Debt reduction, heat reduction, buff duration',
          '**Diplomacy** — Reputation multipliers and passive heat decay',
          '**Ascension** — Prestige favor multipliers'
        ]
      }
    ]
  },
  {
    id: 'endgame',
    title: 'Endgame',
    content: [
      {
        type: 'heading',
        level: 3,
        text: 'Primary Endgame: Conquer All 37 Continentals'
      },
      {
        type: 'paragraph',
        text: 'The true endgame is to seize control of every Continental Hotel across all regions, defeating all 37 AI controllers and claiming the High Table. This is intentionally designed to be extremely difficult — a multi-hundred-hour grind.'
      },
      {
        type: 'info-box',
        title: 'Requirements',
        content: [
          'Prestige 35+ on all BRANCHES (~500+ hours)',
          '1e33 lifetime earnings per branch',
          'Defeat all 37 AI controllers via takeover',
          'Establish Royal Continental on all 37 branches'
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'Royal Continental System'
      },
      {
        type: 'paragraph',
        text: 'After conquering a branch and reaching +10 prestige above its unlock threshold, establish a Royal Continental for endgame progression:'
      },
      {
        type: 'list',
        items: [
          'Royal Buildings — 5 special endgame structures (see Royal Buildings section)',
          'Royal Marks — Endgame currency earned passively and via Royal Prestige',
          'Royal Prestige — Royal-specific resets granting Royal Marks',
          'Royal Skill Tree — 25 endgame upgrades across 5 branches (see Royal Skill Tree section)'
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'Royal Takeover'
      },
      {
        type: 'paragraph',
        text: 'After all 37 Royal Continentals are established and all AI controllers defeated, attempt the Royal Takeover — seizing control of the High Table itself.'
      },
      {
        type: 'info-box',
        title: 'Royal Takeover Reward',
        content: [
          '**Title:** "The Sovereign of the High Table"',
          '**Permanent Effect:** All buffs from all sources doubled',
          '**Royal Decrees:** Every 24h, choose 1 of 3 random global buffs (see Sovereign section)',
          '**Sandbox+:** Infinite loops with +10% rewards per loop'
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'Post-Endgame'
      },
      {
        type: 'paragraph',
        text: 'The game continues with no more progression — you rule the network. Infinite Royal Prestige loops with increasing rewards (10% per loop).'
      }
    ]
  },
  {
    id: 'technical',
    title: 'Technical Information',
    content: [
      {
        type: 'heading',
        level: 3,
        text: 'Platform'
      },
      {
        type: 'list',
        items: [
          'Built with Vue 3, TypeScript, Vite',
          'D3.js for world map rendering',
          'LocalStorage for save data',
          'No server/cloud — single-player only',
          'Autoplay bot for automated gameplay'
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'Save System'
      },
      {
        type: 'list',
        items: [
          'Autosave every 30 seconds',
          'Manual export/import as JSON',
          'FNV-1a checksum for integrity',
          'Schema migration for older saves',
          'Supply routes and AI owners included in save data'
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'Performance'
      },
      {
        type: 'list',
        items: [
          'Target: 60fps desktop, 30fps mobile',
          'Bundle size: <500KB gzipped',
          'Save file size: <2MB',
          'Game loop: 1s tick with periodic sub-ticks (5s/10s/30s/60s)'
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'Game Loop Tick Schedule'
      },
      {
        type: 'table',
        headers: ['Interval', 'Systems'],
        rows: [
          ['1s', 'Income, buff cleanup, building unlocks, XP gains'],
          ['5s', 'Takeover progress, supply route ticking, AI owner ticking'],
          ['10s', 'Debt collection'],
          ['30s', 'Assassin loyalty, autosave'],
          ['60s', 'Safe House interest, debt interest'],
          ['120s', 'Heat decay, guest satisfaction drift toward 50']
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'Autoplay Bot'
      },
      {
        type: 'list',
        items: [
          'Automated gameplay AI that manages all branches',
          'Auto-buys buildings, hires staff, assigns staff',
          'Auto-resolves events with best/safe choices',
          'Auto-manages supply routes (establish, stabilize, dismantle)',
          'Auto-switches active branch for optimal income',
          'Auto-initiates takeovers when ready',
          'Toggle via AI Play button'
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'Tutorial System'
      },
      {
        type: 'list',
        items: [
          'Interactive tutorial for new players',
          'Covers: buying buildings, income flow, bulk buying, staff hiring, prestige',
          'Can be skipped or replayed from settings'
        ]
      }
    ]
  },
  {
    id: 'achievements',
    title: 'Achievements',
    content: [
      {
        type: 'paragraph',
        text: `Track your progress with ${ACHIEVEMENTS.length} achievements across 7 categories. Each achievement grants Table Favor or permanent income bonuses when unlocked.`
      },
      {
        type: 'table',
        headers: ['Name', 'Category', 'Description', 'Reward'],
        rows: ACHIEVEMENTS.map(a => [
          a.name,
          a.category,
          a.description,
          a.reward.type === 'tableFavor' ? `+${a.reward.value} Favor` : `+${(a.reward.value * 100).toFixed(0)}% Income`
        ])
      },
      {
        type: 'info-box',
        title: 'Achievement Categories',
        content: [
          '**Income** — Currency and lifetime earnings milestones',
          '**Prestige** — Prestige level achievements',
          '**Combat** — Assassin and takeover achievements',
          '**Expansion** — Branch unlock milestones',
          '**Staff** — Hiring and veteran achievements',
          '**Events** — Event resolution and supply route milestones',
          '**Special** — Playtime, royal, and skill tree achievements'
        ]
      }
    ]
  },
  {
    id: 'royal-buildings',
    title: 'Royal Buildings',
    content: [
      {
        type: 'paragraph',
        text: 'When a branch achieves Royal Continental status (total prestige 10+ above unlock threshold), Royal Buildings become available. These powerful endgame structures generate massive income.'
      },
      {
        type: 'table',
        headers: ['Name', 'Base Rate', 'Base Cost', 'Cost Growth', 'Max Level', 'Description'],
        rows: ROYAL_BUILDINGS.map(b => [
          b.name,
          String(b.baseRate),
          String(b.baseCost),
          String(b.costGrowth),
          String(b.maxLevel),
          b.description
        ])
      },
      {
        type: 'info-box',
        title: 'Royal Building Notes',
        content: [
          'Royal Buildings use a 1.08x income growth per level',
          'Purchased with standard currency (not Royal Marks)',
          'Only available on Royal Continental branches',
          'Reset during Royal Prestige (but Royal Skill Tree is kept)'
        ]
      }
    ]
  },
  {
    id: 'royal-skill-tree',
    title: 'Royal Skill Tree',
    content: [
      {
        type: 'paragraph',
        text: `Invest Royal Marks into 5 royal skill branches, each with 5 levels (${ROYAL_SKILL_NODES.length} total nodes). Royal Marks are earned passively from Royal Building income and through Royal Prestige.`
      },
      {
        type: 'table',
        headers: ['Branch', 'Level', 'Name', 'Effect', 'Cost'],
        rows: ROYAL_SKILL_NODES.map(n => [
          n.branch.replace('royal', ''),
          String(n.level),
          n.name,
          n.description,
          String(n.royalMarkCost) + ' Marks'
        ])
      },
      {
        type: 'info-box',
        title: 'Royal Skill Branches',
        content: [
          '**Income** — Income multipliers (up to +100%)',
          '**Loyalty** — Assassin loyalty decay reduction (up to -80%)',
          '**Power** — Assassin power multipliers (up to +100%)',
          '**Favor** — Prestige favor multipliers (up to +100%)',
          '**Ascension** — Royal prestige multipliers (up to +100%)',
          'Level 5 in any branch also grants +50% buff duration'
        ]
      }
    ]
  },
  {
    id: 'sovereign',
    title: 'Sovereign & Royal Takeover',
    content: [
      {
        type: 'heading',
        level: 3,
        text: 'Becoming the Sovereign'
      },
      {
        type: 'paragraph',
        text: 'After all 37 branches are conquered, all 37 are Royal Continental, and all AI controllers are defeated, you achieve the title of Sovereign of the High Table.'
      },
      {
        type: 'info-box',
        title: 'Sovereign Benefits',
        content: [
          '**All buffs doubled** — Every multiplier from every source is doubled',
          '**Royal Decrees** — Choose 1 of 3 random global buffs every 24 hours',
          '**Sandbox+ Mode** — Infinite reset loops with +10% rewards per loop'
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'Royal Decrees'
      },
      {
        type: 'paragraph',
        text: `Every 24 hours, the Sovereign may issue 1 of ${DECREE_POOL.length} possible decrees. Three are randomly offered each day:`
      },
      {
        type: 'table',
        headers: ['Name', 'Description'],
        rows: DECREE_POOL.map(d => [d.name, d.description])
      },
      {
        type: 'heading',
        level: 3,
        text: 'Sandbox+ Mode'
      },
      {
        type: 'paragraph',
        text: 'After becoming Sovereign, execute Sandbox+ Loops for increasing rewards. Each loop grants Royal Marks and Table Favor, with a 10% multiplier increase per loop. The game continues infinitely with no cap.'
      }
    ]
  },
  {
    id: 'roadmap',
    title: 'Roadmap',
    content: [
      {
        type: 'table',
        headers: ['Phase', 'Status', 'Features'],
        rows: [
          ['MVP', 'Done', 'Starting country selection, world map, HQ + 1 unlock, basic idle loop, 3 events, prestige'],
          ['Phase 2', 'Done', 'All 37 branches, full event roster, staff XP, world map node states'],
          ['Phase 3', 'Done', 'Save export/import, achievements, takeover system, debt system, upgrades'],
          ['Phase 4', 'Done', 'Supply routes, AI controllers, power balance, story background, autoplay bot, tutorial'],
          ['Phase 5', 'Done', 'Royal Continental system, Royal Marks, Royal skill tree, Royal Takeover endgame, sandbox+ mode, achievements'],
          ['Phase 6', 'Planned', 'Seasonal events']
        ]
      }
    ]
  },
  {
    id: 'hq-renovation',
    title: 'HQ Renovation',
    content: [
      {
        type: 'paragraph',
        text: 'The HQ view has been renovated into an 11-floor hotel with two toggleable views: Bird\'s Eye (top-down architectural floor plan) and Fallout Shelter (side-view cross-section).'
      },
      {
        type: 'heading',
        level: 3,
        text: 'Floor Layout'
      },
      {
        type: 'table',
        headers: ['Floor', 'Buildings', 'Description'],
        rows: [
          ['G', 'blackMarket, vault, underground', 'Basement — hidden trading, secure vault'],
          ['1', 'reception (lobby)', 'Main floor — entrance, reception, visitor spawns'],
          ['2', 'kitchen, bar', 'Restaurant & bar'],
          ['3', 'laundry, guestRooms (Standard), Staff Room', 'Standard rooms (level 1-12) + staff room'],
          ['4', 'guestRooms (Deluxe)', 'Deluxe rooms (level 13-25)'],
          ['5', 'guestRooms (Executive)', 'Executive rooms (level 26-38)'],
          ['6', 'guestRooms (Presidential)', 'Presidential suites (level 39-50)'],
          ['7', 'vip (VIP Suites)', 'VIP guest suites'],
          ['8', 'vip (Penthouse)', 'Presidential penthouse'],
          ['9', 'armory, safeHouse', 'Security — assassins reside here'],
          ['10', 'intelNetwork, Manager\'s Office', 'Intel + manager (visual only)'],
          ['11', 'Rooftop', 'Helipad (visual only)'],
        ]
      },
      {
        type: 'info-box',
        title: 'Views',
        content: [
          'Bird\'s Eye: Top-down 2D floor plan with floor selector thumbnails',
          'Fallout: Side-view cross-section with 8 compressed bands',
          'Toggle via the toolbar at the top of the HQ view',
        ]
      },
    ]
  },
  {
    id: 'rarity-system',
    title: 'Rarity System',
    content: [
      {
        type: 'paragraph',
        text: 'All staff and assassins have a rarity tier from D to S. Rarity affects stat budgets, trait probabilities, and hire/level-up costs.'
      },
      {
        type: 'table',
        headers: ['Rarity', 'Stat Budget', 'Stat Range', 'Cost Mult', 'Color'],
        rows: [
          ['D', '12', '1-5', '0.5x', 'Grey'],
          ['C', '16', '2-7', '1.0x', 'Green'],
          ['B', '20', '3-9', '1.5x', 'Blue'],
          ['A', '26', '4-12', '2.5x', 'Purple'],
          ['S', '32', '5-15', '4.0x', 'Gold'],
        ]
      },
      {
        type: 'info-box',
        title: 'Rarity Effects',
        content: [
          'Higher rarity = more stat points to distribute',
          'Higher rarity = better trait rolls (more rare/positive traits, fewer negative)',
          'Higher rarity = higher hire and level-up costs',
          'Max level for all staff and assassins is 10',
          'Existing saves default to C rarity on migration',
        ]
      },
    ]
  },
  {
    id: 'currencies',
    title: 'Currencies',
    content: [
      {
        type: 'paragraph',
        text: 'The game has 3 currencies with different uses and sources.'
      },
      {
        type: 'table',
        headers: ['Currency', 'Scope', 'Use', 'Source'],
        rows: [
          ['Branch Currency', 'Per-branch', 'Buildings, staff hire/level, upgrades', 'Income per tick'],
          ['Golden Coin', 'Global', 'Call Visitor (5 random visitors)', '1% of income per tick + events + 10 per prestige'],
          ['Royal Mark', 'Global', 'Scroll: roll 1 character rarity B+', 'Royal/sovereign system'],
        ]
      },
      {
        type: 'info-box',
        title: 'Golden Coins',
        content: [
          'Accumulate passively at 1% of total income across all branches',
          'Also earned from event rewards and prestige (10 per prestige)',
          'Used to Call Visitors: costs 10 Golden Coins for 5 random visitors',
        ]
      },
      {
        type: 'warning-box',
        title: 'Royal Mark Scroll',
        content: [
          'Costs 1 Royal Mark per use',
          'Spawns 1 visitor with rarity B or higher (B=70%, A=25%, S=5%)',
          'Only available when sovereign',
        ]
      },
    ]
  },
  {
    id: 'visitor-system',
    title: 'Visitor System',
    content: [
      {
        type: 'paragraph',
        text: 'Visitors are potential recruits who arrive at the HQ reception desk. You can view their stats and hire them.'
      },
      {
        type: 'heading',
        level: 3,
        text: 'Visitor Sources'
      },
      {
        type: 'list',
        items: [
          'Random spawn: 2% chance per tick, spawns 1 visitor',
          'Call Visitor: 10 Golden Coins, spawns 5 visitors simultaneously',
          'Royal Mark Scroll: 1 Royal Mark, spawns 1 visitor (B+ rarity only)',
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'RNG Rates'
      },
      {
        type: 'table',
        headers: ['Source', 'D', 'C', 'B', 'A', 'S', 'Staff/Assassin'],
        rows: [
          ['Call Visitor', '35%', '35%', '20%', '8%', '2%', '70/30'],
          ['Royal Mark', '-', '-', '70%', '25%', '5%', '70/30'],
          ['Random Spawn', '40%', '30%', '20%', '8%', '2%', '70/30'],
        ]
      },
      {
        type: 'info-box',
        title: 'Hiring & Assignment',
        content: [
          'Click a visitor to view their stats card',
          'Hire cost = base hireCost × rarity cost multiplier (uses branch currency)',
          'Hired staff auto-assign to their role\'s best match building',
          'Hired assassins go to floor 9 (armory)',
          'Visitors leave after 2 hours if not hired',
        ]
      },
      {
        type: 'warning-box',
        title: 'Firing',
        content: [
          'Staff and assassins can be fired from the Staff Panel or HQ stats panel',
          'Firing removes the character permanently — no refund',
        ]
      },
    ]
  }
]
