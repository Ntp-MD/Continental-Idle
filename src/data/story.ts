import { getBranchDef } from './branches'
import prologueText from './prologue.txt?raw'

const BRANCH = 'bangkok' as const

export function getStoryContext() {
  const hqDef = getBranchDef(BRANCH)
  return {
    hqName: hqDef.name,
    hqCity: hqDef.city,
    playerTitle: `Heir of ${hqDef.name}`,
  }
}

export function getPrologue(): string {
  return prologueText.replaceAll('{branchTerm}', 'Continental Bangkok, Siam').trim()
}
