import type { NpcSimulationConfig } from '../types'
import { state } from './state'
import { saveLayout } from './persistence'

export { getDefaultNpcConfig } from './npc-default'

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value))
}

export async function updateNpcConfig(config: NpcSimulationConfig): Promise<void> {
  state.layout.npcConfig = deepClone(config)
  await saveLayout()
}
