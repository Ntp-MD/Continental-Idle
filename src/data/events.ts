import type { EventDefinition } from '../types'

export const EVENTS: EventDefinition[] = [
  {
    id: 'contractOpen',
    name: 'Contract Open',
    description: 'A bounty has been posted. Accept to double your income for 90 seconds — but heat rises.',
    themeLock: null,
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
    autoResolveAction: 'ignore'
  },
  {
    id: 'excommunicado',
    name: 'Excommunicado',
    description: 'The High Table has declared you excommunicado. All income will be frozen for 60 seconds.',
    themeLock: null,
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
    themeLock: null,
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
  }
]

export const EVENT_COOLDOWN = 45
