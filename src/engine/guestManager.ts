import type { BranchId } from '@/types'
import { gameState } from './gameState'
import { eventBus } from './eventBus'


const SERVICE_BUILDINGS = ['reception', 'guestRooms', 'bar', 'kitchen', 'vip']


const GUEST_BUILDINGS = ['guestRooms', 'vip']


export function getGuestCount(branchId: BranchId): number {
  const branch = gameState.get().branches[branchId]
  if (!branch) return 0
  let count = 0
  GUEST_BUILDINGS.forEach(id => {
    count += (branch.buildings[id]?.level || 0) * 2
  })
  return count
}


function getServiceCapacity(branchId: BranchId): number {
  const branch = gameState.get().branches[branchId]
  if (!branch) return 0
  let cap = 0
  Object.values(branch.staff).forEach(staff => {
    if (staff.assignedTo && SERVICE_BUILDINGS.includes(staff.assignedTo)) {
      cap += staff.level
    }
  })
  return cap
}


export function tickGuestSatisfaction(): void {
  const state = gameState.get()
  state.worldMap.unlockedBranches.forEach(branchId => {
    const branch = state.branches[branchId]
    if (!branch) return
    const guests = getGuestCount(branchId)
    if (guests === 0) {

      if (branch.guestSatisfaction > 50) branch.guestSatisfaction = Math.max(50, branch.guestSatisfaction - 0.05)
      return
    }
    const service = getServiceCapacity(branchId)
    const ratio = service / guests
    if (ratio >= 1) {
      branch.guestSatisfaction = Math.min(100, branch.guestSatisfaction + 0.05)
    } else {
      branch.guestSatisfaction = Math.max(0, branch.guestSatisfaction - 0.05 * (1 - ratio))
    }
  })
}


export function tickGuestIncome(): void {
  const state = gameState.get()
  state.worldMap.unlockedBranches.forEach(branchId => {
    const branch = state.branches[branchId]
    if (!branch) return
    const guests = getGuestCount(branchId)
    if (guests === 0) return
    const satFactor = branch.guestSatisfaction / 100
    const roomLevel = GUEST_BUILDINGS.reduce((sum, id) => sum + (branch.buildings[id]?.level || 0), 0)
    const income = guests * satFactor * (1 + roomLevel * 0.1) * 0.5
    branch.currency += income
    branch.lifetimeEarnings += income
  })
}


export function tickGuestEvents(): void {
  const state = gameState.get()
  if (state.worldMap.unlockedBranches.length === 0) return
  if (Math.random() > 0.001) return
  const candidates = state.worldMap.unlockedBranches.filter(id => {
    const b = state.branches[id]
    return b && b.guestSatisfaction >= 80
  })
  if (candidates.length === 0) return
  const branchId = candidates[Math.floor(Math.random() * candidates.length)]
  eventBus.emit('guest:vip', { branchId })
}
