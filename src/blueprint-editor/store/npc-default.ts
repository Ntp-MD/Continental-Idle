import type { NpcSimulationConfig } from '../types'

export function getDefaultNpcConfig(): NpcSimulationConfig {
  return {
    speed: 1 / 30,
    defaultRoleId: 'quest',
    roles: [
      { id: 'quest', label: 'Quest', color: '#22d3ee', behavior: { focusChance: 0, restrictedTaskIds: [] } },
    ],
    tasks: [],
    pool: [
      { roleId: 'quest', count: 10 },
    ],
  }
}
