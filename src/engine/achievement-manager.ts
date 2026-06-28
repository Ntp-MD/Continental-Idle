import { gameState } from './game-state'
import { eventBus } from './event-bus'
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from '@/data/achievements'
import type { AchievementDefinition } from '@/data/achievements'

class AchievementManager {
  private checkIntervalId: number | null = null

  start(): void {
    if (this.checkIntervalId !== null) return
    this.checkIntervalId = window.setInterval(() => {
      this.checkAll()
    }, 5000)
  }

  stop(): void {
    if (this.checkIntervalId !== null) {
      clearInterval(this.checkIntervalId)
      this.checkIntervalId = null
    }
  }

  getUnlocked(): string[] {
    const state = gameState.get()
    return state.achievements || []
  }

  isUnlocked(id: string): boolean {
    return this.getUnlocked().includes(id)
  }

  getUnlockedCount(): number {
    return this.getUnlocked().length
  }

  getTotalCount(): number {
    return ACHIEVEMENTS.length
  }

  getProgress(): number {
    const unlocked = this.getUnlockedCount()
    const total = this.getTotalCount()
    return total > 0 ? unlocked / total : 0
  }

  getByCategory(category: string): AchievementDefinition[] {
    return ACHIEVEMENTS.filter(a => a.category === category)
  }

  checkAll(): void {
    const state = gameState.get()
    if (!state.achievements) state.achievements = []
    const unlocked = new Set(state.achievements)

    for (const def of ACHIEVEMENTS) {
      if (unlocked.has(def.id)) continue
      try {
        if (def.condition(state)) {
          this.unlock(def.id)
        }
      } catch {
        // skip — condition may reference fields not yet present in older saves
      }
    }
  }

  private unlock(id: string): void {
    const state = gameState.get()
    if (!state.achievements) state.achievements = []
    if (state.achievements.includes(id)) return

    const def = ACHIEVEMENT_MAP[id]
    if (!def) return

    state.achievements.push(id)

    // Grant reward
    if (def.reward.type === 'tableFavor') {
      state.tableFavor += def.reward.value
    } else if (def.reward.type === 'permanentIncomeBonus') {
      state.permanentIncomeBonus = Math.min(10, state.permanentIncomeBonus + def.reward.value)
    }

    eventBus.emit('achievement:unlocked', { id, name: def.name, description: def.description, icon: def.icon, reward: def.reward })
  }
}

export const achievementManager = new AchievementManager()
