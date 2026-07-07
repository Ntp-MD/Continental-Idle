import type { EventDefinition } from '@/types'

export const EVENTS: EventDefinition[] = [
  {
    id: 'contractOpen',
    name: 'Contract Open',
    description: 'A bounty has been posted. Accept to double your income for 90 seconds — but heat rises. Requires a Cleaner assigned.',
    branchLock: null,
    weight: 25,
    heatModifier: 5,
    unlockCondition: { type: 'buildingLevel', buildingId: 'underground', minLevel: 1 },
    choices: [
      {
        id: 'accept',
        label: 'Accept Contract',
        requires: { staffType: 'cleaner', minLevel: 1 },
        rewards: [{ type: 'incomeMultiplier', value: 2.0, duration: 90, scaling: 'static' }],
        penalties: [],
        reputationChange: 5,
        isBest: true
      },
      {
        id: 'decline',
        label: 'Decline',
        rewards: [],
        penalties: [],
        reputationChange: 0
      }
    ],
    autoResolveTimeout: 60,
    autoResolveAction: 'best'
  },
  {
    id: 'excommunicado',
    name: 'Excommunicado',
    description: 'The High Table has declared you excommunicado. All income will be frozen for 60 seconds.',
    branchLock: null,
    weight: 15,
    heatModifier: 10,
    unlockCondition: null,
    choices: [
      {
        id: 'wait',
        label: 'Wait it out (income paused 60s)',
        rewards: [{ type: 'reputation', value: 10, scaling: 'static' }],
        penalties: [{ type: 'incomeFreeze', value: 60, scaling: 'static' }],
        reputationChange: 10
      },
      {
        id: 'pay',
        label: 'Pay tribute',
        rewards: [],
        penalties: [{ type: 'loseCurrency', value: 0.05, scaling: 'currencyPercent' }],
        reputationChange: -5,
        isBest: true,
        isSafe: true
      }
    ],
    autoResolveTimeout: 60,
    autoResolveAction: 'ignore'
  },
  {
    id: 'markerCalledIn',
    name: 'Marker Called In',
    description: 'Someone is calling in a marker debt. Complete the objective or refuse and face the consequences.',
    branchLock: null,
    weight: 10,
    heatModifier: 3,
    unlockCondition: null,
    choices: [
      {
        id: 'complete',
        label: 'Complete objective (+5% income)',
        rewards: [{ type: 'permanentIncomeBonus', value: 0.05, scaling: 'static' }],
        penalties: [],
        reputationChange: 5,
        isBest: true,
        isSafe: true
      },
      {
        id: 'refuse',
        label: 'Refuse (marker debt accrues)',
        rewards: [],
        penalties: [{ type: 'markerDebt', value: 10000, scaling: 'prestigeScaled' }],
        reputationChange: -15
      }
    ],
    autoResolveTimeout: 60,
    autoResolveAction: 'ignore'
  },
  {
    id: 'assassinRaid',
    name: 'Assassin Raid',
    description: 'Enemy assassins are raiding your Continental branch! Choose how to respond.',
    branchLock: null,
    weight: 12,
    heatModifier: 8,
    unlockCondition: { type: 'prestige', minPrestige: 3 },
    choices: [
      {
        id: 'fight',
        label: 'Defend with your assassins',
        requires: { assassinAssigned: true },
        rewards: [],
        penalties: [],
        reputationChange: 0,
      },
      {
        id: 'payTribute',
        label: 'Pay them off',
        rewards: [],
        penalties: [{ type: 'loseCurrency', value: 0.05, scaling: 'currencyPercent' }],
        reputationChange: -5,
        isSafe: true,
      },
      {
        id: 'barricade',
        label: 'Barricade (income frozen 30s)',
        rewards: [],
        penalties: [{ type: 'incomeFreeze', value: 30, scaling: 'static' }],
        reputationChange: -5,
      },
    ],
    autoResolveTimeout: 60,
    autoResolveAction: 'safe',
  },
  {
    id: 'vipArrival',
    name: 'VIP Guest Arrival',
    description: 'A high-profile VIP has arrived at your Continental branch. Welcome them for a reputation boost.',
    branchLock: null,
    weight: 20,
    heatModifier: 2,
    unlockCondition: { type: 'buildingLevel', buildingId: 'vip', minLevel: 1 },
    choices: [
      {
        id: 'welcome',
        label: 'Roll out the red carpet (+15% income for 60s)',
        rewards: [{ type: 'incomeMultiplier', value: 1.15, duration: 60, scaling: 'static' }],
        penalties: [],
        reputationChange: 15,
        isBest: true,
      },
      {
        id: 'polite',
        label: 'Polite welcome (+5 reputation)',
        rewards: [{ type: 'reputation', value: 5, scaling: 'static' }],
        penalties: [],
        reputationChange: 5,
        isSafe: true,
      },
    ],
    autoResolveTimeout: 60,
    autoResolveAction: 'best',
  },
  {
    id: 'staffRecruitment',
    name: 'Staff Recruitment Drive',
    description: 'A talented recruit is available. Hire them for a permanent income boost.',
    branchLock: null,
    weight: 15,
    heatModifier: 1,
    unlockCondition: null,
    choices: [
      {
        id: 'hire',
        label: 'Recruit now (+3% permanent income)',
        rewards: [{ type: 'permanentIncomeBonus', value: 0.03, scaling: 'static' }],
        penalties: [{ type: 'loseCurrency', value: 5000, scaling: 'static' }],
        reputationChange: 5,
        isBest: true,
      },
      {
        id: 'decline',
        label: 'Not interested',
        rewards: [],
        penalties: [],
        reputationChange: 0,
      },
    ],
    autoResolveTimeout: 60,
    autoResolveAction: 'ignore',
  },
  {
    id: 'undergroundAuction',
    name: 'Underground Auction',
    description: 'An underground auction is happening. Bid for a chance at a massive permanent income boost.',
    branchLock: null,
    weight: 8,
    heatModifier: 5,
    unlockCondition: { type: 'buildingLevel', buildingId: 'underground', minLevel: 3 },
    choices: [
      {
        id: 'bid',
        label: 'Place a bid (+8% permanent income, lose 3% currency)',
        rewards: [{ type: 'permanentIncomeBonus', value: 0.08, scaling: 'static' }],
        penalties: [{ type: 'loseCurrency', value: 0.03, scaling: 'currencyPercent' }],
        reputationChange: 10,
        isBest: true,
      },
      {
        id: 'observe',
        label: 'Just observe (+3 reputation)',
        rewards: [{ type: 'reputation', value: 3, scaling: 'static' }],
        penalties: [],
        reputationChange: 3,
        isSafe: true,
      },
    ],
    autoResolveTimeout: 60,
    autoResolveAction: 'safe',
  },
  {
    id: 'continentalSummit',
    name: 'Continental Summit',
    description: 'A Continental summit is being held. Attend for a significant reputation boost.',
    branchLock: null,
    weight: 10,
    heatModifier: 0,
    unlockCondition: { type: 'prestige', minPrestige: 2 },
    choices: [
      {
        id: 'attend',
        label: 'Attend the summit (+30 reputation, +10% income 45s)',
        rewards: [
          { type: 'reputation', value: 30, scaling: 'static' },
          { type: 'incomeMultiplier', value: 1.10, duration: 45, scaling: 'static' },
        ],
        penalties: [],
        reputationChange: 30,
        isBest: true,
      },
      {
        id: 'skip',
        label: 'Skip it',
        rewards: [],
        penalties: [],
        reputationChange: 0,
      },
    ],
    autoResolveTimeout: 60,
    autoResolveAction: 'best',
  },
  {
    id: 'heatWave',
    name: 'Heat Wave',
    description: 'Attention is building on your operations. Cool things down or push your luck.',
    branchLock: null,
    weight: 14,
    heatModifier: 6,
    unlockCondition: null,
    choices: [
      {
        id: 'layLow',
        label: 'Lay low (income -20% for 30s, heat -5)',
        rewards: [],
        penalties: [{ type: 'incomeMultiplier', value: 0.8, duration: 30, scaling: 'static' }],
        reputationChange: 0,
        heatChange: -5,
        isSafe: true,
      },
      {
        id: 'pushLuck',
        label: 'Push your luck (+25% income 45s, +10 heat)',
        rewards: [{ type: 'incomeMultiplier', value: 1.25, duration: 45, scaling: 'static' }],
        penalties: [],
        reputationChange: -5,
        isBest: true,
      },
    ],
    autoResolveTimeout: 60,
    autoResolveAction: 'best',
  },
  {
    id: 'markerForgiveness',
    name: 'Marker Forgiveness',
    description: 'A powerful figure offers to forgive one of your marker debts. Accept their terms or decline.',
    branchLock: null,
    weight: 8,
    heatModifier: 2,
    unlockCondition: null,
    choices: [
      {
        id: 'accept',
        label: 'Accept forgiveness (clear cheapest debt, -10 reputation)',
        rewards: [],
        penalties: [],
        reputationChange: -10,
        isSafe: true,
      },
      {
        id: 'decline',
        label: 'Decline (keep your debts, +5 reputation)',
        rewards: [{ type: 'reputation', value: 5, scaling: 'static' }],
        penalties: [],
        reputationChange: 5,
      },
    ],
    autoResolveTimeout: 60,
    autoResolveAction: 'safe',
  },
]

export const EVENT_COOLDOWN = 45
