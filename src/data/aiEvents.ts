import type { EventChoice, EventDefinition } from '@/types'

export type AIEventType = 'raid' | 'tribute' | 'sabotage' | 'spy' | 'provocation' | 'truce'

export interface AIEventTemplate {
  type: AIEventType
  nameTemplate: string
  descriptionTemplate: string
  heatModifier: number
  choices: EventChoice[]
}

export const AI_EVENT_TEMPLATES: Record<AIEventType, AIEventTemplate> = {
  raid: {
    type: 'raid',
    nameTemplate: '{ownerName}\'s Raid',
    descriptionTemplate: '{ownerName} from {ownerBranch} has sent raiders to {targetBranch}!',
    heatModifier: 8,
    choices: [
      {
        id: 'fight',
        label: 'Defend with assassins',
        requires: { assassinAssigned: true },
        rewards: [{ type: 'reputation', value: 10, scaling: 'static' }],
        penalties: [],
        reputationChange: 10,
        isBest: true,
      },
      {
        id: 'pay',
        label: 'Pay tribute (5% currency)',
        rewards: [],
        penalties: [{ type: 'loseCurrency', value: 0.05, scaling: 'currencyPercent' }],
        reputationChange: -5,
        isSafe: true,
      },
      {
        id: 'ignore',
        label: 'Ignore (income frozen 30s)',
        rewards: [],
        penalties: [{ type: 'incomeFreeze', value: 30, scaling: 'static' }],
        reputationChange: -10,
      },
    ],
  },

  tribute: {
    type: 'tribute',
    nameTemplate: '{ownerName} Demands Tribute',
    descriptionTemplate: '{ownerName} demands a tribute from your operations in {targetBranch}.',
    heatModifier: 3,
    choices: [
      {
        id: 'pay',
        label: 'Pay tribute (3% currency, +relations)',
        rewards: [],
        penalties: [{ type: 'loseCurrency', value: 0.03, scaling: 'currencyPercent' }],
        reputationChange: 0,
        isSafe: true,
      },
      {
        id: 'refuse',
        label: 'Refuse (-relations, heat +3)',
        rewards: [],
        penalties: [],
        reputationChange: 5,
        heatChange: 3,
        isBest: true,
      },
    ],
  },

  sabotage: {
    type: 'sabotage',
    nameTemplate: '{ownerName}\'s Sabotage',
    descriptionTemplate: '{ownerName} has sabotaged operations in {targetBranch}! Income reduced.',
    heatModifier: 5,
    choices: [
      {
        id: 'repair',
        label: 'Repair (lose 2% currency, restore income)',
        rewards: [],
        penalties: [{ type: 'loseCurrency', value: 0.02, scaling: 'currencyPercent' }],
        reputationChange: 0,
        isBest: true,
      },
      {
        id: 'retaliate',
        label: 'Retaliate (+10 heat, +5 reputation)',
        rewards: [{ type: 'reputation', value: 5, scaling: 'static' }],
        penalties: [],
        reputationChange: 5,
        heatChange: 10,
      },
      {
        id: 'endure',
        label: 'Endure (income -30% for 30s)',
        rewards: [],
        penalties: [{ type: 'incomeMultiplier', value: 0.7, duration: 30, scaling: 'static' }],
        reputationChange: -5,
        isSafe: true,
      },
    ],
  },

  spy: {
    type: 'spy',
    nameTemplate: '{ownerName}\'s Spy',
    descriptionTemplate: 'A spy from {ownerName} has been caught in {targetBranch}.',
    heatModifier: 2,
    choices: [
      {
        id: 'interrogate',
        label: 'Interrogate (+10 reputation, heat +2)',
        rewards: [{ type: 'reputation', value: 10, scaling: 'static' }],
        penalties: [],
        reputationChange: 10,
        heatChange: 2,
        isBest: true,
      },
      {
        id: 'release',
        label: 'Release (+relations with owner)',
        rewards: [],
        penalties: [],
        reputationChange: -5,
        isSafe: true,
      },
    ],
  },

  provocation: {
    type: 'provocation',
    nameTemplate: '{ownerName}\'s Provocation',
    descriptionTemplate: '{ownerName} is provoking your operations in {targetBranch}.',
    heatModifier: 4,
    choices: [
      {
        id: 'stand',
        label: 'Stand firm (+15 reputation, heat +5)',
        rewards: [{ type: 'reputation', value: 15, scaling: 'static' }],
        penalties: [],
        reputationChange: 15,
        heatChange: 5,
        isBest: true,
      },
      {
        id: 'back',
        label: 'Back down (heat -3)',
        rewards: [],
        penalties: [],
        reputationChange: -10,
        heatChange: -3,
        isSafe: true,
      },
    ],
  },

  truce: {
    type: 'truce',
    nameTemplate: '{ownerName} Offers Truce',
    descriptionTemplate: '{ownerName} offers a temporary truce for {targetBranch}.',
    heatModifier: -2,
    choices: [
      {
        id: 'accept',
        label: 'Accept truce (heat -5, +10% income 60s)',
        rewards: [
          { type: 'incomeMultiplier', value: 1.10, duration: 60, scaling: 'static' },
        ],
        penalties: [],
        reputationChange: 5,
        isBest: true,
        isSafe: true,
      },
      {
        id: 'reject',
        label: 'Reject (no effect)',
        rewards: [],
        penalties: [],
        reputationChange: 0,
      },
    ],
  },
}

export function getAIEventTemplate(type: AIEventType): AIEventTemplate {
  const template = AI_EVENT_TEMPLATES[type]
  if (!template) {
    throw new Error(`Unknown AI event type: ${type}`)
  }
  return template
}

export function buildAIEventDefinition(
  template: AIEventTemplate,
  ownerName: string,
  ownerBranch: string,
  targetBranch: string
): EventDefinition {
  const fill = (s: string) =>
    s.replace('{ownerName}', ownerName)
      .replace('{ownerBranch}', ownerBranch)
      .replace('{targetBranch}', targetBranch)

  return {
    id: `ai_${template.type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name: fill(template.nameTemplate),
    description: fill(template.descriptionTemplate),
    branchLock: null,
    weight: 20,
    heatModifier: template.heatModifier,
    unlockCondition: null,
    choices: template.choices.map(c => ({ ...c, rewards: [...c.rewards], penalties: [...c.penalties] })),
    autoResolveTimeout: 90,
    autoResolveAction: 'ignore',
  }
}
