import { BRANCHES } from '@/data/branches'
import { BUILDINGS } from '@/data/buildings'
import { STAFF_TYPES } from '@/data/staff'
import { ASSASSIN_TYPES } from '@/data/assassins'
import { SKILL_NODES } from '@/data/skills'
import { EVENTS } from '@/data/events'

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
        text: '**Continental Idle** is an idle/incremental game set in the Continental Hotel universe from the John Wick series. Players take on the role of a Continental Manager, tasked with running themed hotel branches across 37 global locations.'
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
        text: 'As the Continental Manager, you select your headquarters country on a world map. Each location offers unique bonuses and is a visually and mechanically distinct branch with its own currency, staff, upgrades, and storyline events. Progress through the game by unlocking new countries, conquering Continentals, and ascending to Royal Continental status.'
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
        headers: ['#', 'Building', 'Base Rate', 'Base Cost'],
        rows: BUILDINGS.map((b, i) => [
          String(i + 1),
          b.name,
          String(b.baseRate),
          String(b.baseCost)
        ])
      },
      {
        type: 'info-box',
        title: 'Cost Growth',
        content: [
          'Buildings #1–#10: costGrowth = 1.15',
          'Building #11: costGrowth = 1.25 (10% steeper)',
          'Building #12: costGrowth = 1.35 (20% steeper)'
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
        headers: ['Staff', 'Hire Cost', 'Max Level', 'Best Match', 'Max Ability'],
        rows: STAFF_TYPES.map(s => [
          s.name,
          String(s.hireCost),
          String(s.maxLevel),
          s.bestMatch.join(', '),
          s.maxAbility
        ])
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
          '**Combat** — Damage scales with level and stats (Precision x0.5 + Speed x0.3); raid power scales with level x5 + Precision x2 + Speed x1'
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
      }
    ]
  },
  {
    id: 'prestige',
    title: 'Prestige System',
    content: [
      {
        type: 'paragraph',
        text: 'Prestige resets a branch\'s buildings and currency but grants **Table Favor** — a meta-currency for permanent upgrades.'
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
          '**Commerce** — Income multipliers and offline efficiency',
          '**Personnel** — Staff XP gains and extra staff slots',
          '**Shadow** — Debt reduction, heat reduction, buff duration',
          '**Diplomacy** — Reputation multipliers and passive heat decay',
          '**Ascension** — Prestige favor multipliers and offline efficiency'
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
        text: 'The true endgame is to seize control of every Continental Hotel across all regions. This is intentionally designed to be extremely difficult — a multi-hundred-hour grind.'
      },
      {
        type: 'info-box',
        title: 'Requirements',
        content: [
          'Prestige 35+ on all BRANCHES (~500+ hours)',
          '1e33 lifetime earnings per branch',
          'branch-specific mastery requirements'
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'Royal Continental System'
      },
      {
        type: 'paragraph',
        text: 'After conquering a branch, establish a Royal Continental for endgame progression:'
      },
      {
        type: 'list',
        items: [
          'Royal Buildings — Special endgame structures',
          'Royal Marks — Endgame currency',
          'Royal Prestige — Royal-specific resets',
          'Royal Skill Tree — Endgame upgrades'
        ]
      },
      {
        type: 'heading',
        level: 3,
        text: 'Royal Takeover'
      },
      {
        type: 'paragraph',
        text: 'After all 37 Royal Continentals are established, attempt the Royal Takeover — seizing control of the High Table itself.'
      },
      {
        type: 'info-box',
        title: 'Royal Takeover Reward',
        content: [
          '**Title:** "The Sovereign of the High Table"',
          '**Permanent Effect:** All buffs from all sources doubled',
          '**Royal Decrees:** Daily choose 1 of 3 random global buffs',
          '**Sandbox+:** Infinite Royal Prestige loops with increasing rewards'
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
          'No server/cloud — single-player only'
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
          'Offline progress calculation (8-hour cap)'
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
          'Save file size: <2MB'
        ]
      }
    ]
  },
  {
    id: 'roadmap',
    title: 'Roadmap',
    content: [
      {
        type: 'table',
        headers: ['Phase', 'Features'],
        rows: [
          ['MVP', 'Starting country selection, world map, HQ + 1 unlock, basic idle loop, 3 events, prestige'],
          ['Phase 2', 'All 37 BRANCHES, full event roster, staff XP, world map node states'],
          ['Phase 3', 'Offline progress, save export/import, achievements, takeover system'],
          ['Phase 4', 'Royal Continental system, Royal Marks, Royal skill tree, seasonal events'],
          ['Phase 5', 'Royal Takeover endgame, custom BRANCHES, sandbox+ mode']
        ]
      }
    ]
  }
]
