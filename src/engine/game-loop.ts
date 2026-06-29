import { gameState } from './game-state'
import { runGameTick } from './tick-engine'
import { achievementManager } from './achievement-manager'
import { sovereignManager } from './sovereign-manager'
import { eventBus } from './event-bus'

const AUTOSAVE_INTERVAL = 30 // seconds

class GameLoop {
  private intervalId: number | null = null
  private tickCount = 0
  private running = false
  private ticking = false

  start(): void {
    if (this.running) return
    this.running = true

    window.addEventListener('beforeunload', this.saveHandler)
    achievementManager.start()

    this.intervalId = window.setInterval(() => {
      if (this.ticking) return
      this.ticking = true
      try {
        this.tick()
      } finally {
        this.ticking = false
      }
    }, 1000)
  }

  private tick(): void {
    this.tickCount++

    runGameTick(this.tickCount)

    // Autosave (every 30s)
    if (this.tickCount % AUTOSAVE_INTERVAL === 0) {
      sovereignManager.checkVictory()
      if (gameState.save()) {
        eventBus.emit('save:complete')
      } else {
        eventBus.emit('save:failed')
      }
    }
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    achievementManager.stop()
    window.removeEventListener('beforeunload', this.saveHandler)
    this.running = false
  }

  isRunning(): boolean {
    return this.running
  }

  private saveHandler = (): void => {
    gameState.save()
  }
}

export const gameLoop = new GameLoop()
