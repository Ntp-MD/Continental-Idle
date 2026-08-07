import { gameState } from './gameState'
import { runGameTick } from './tickEngine'
import { achievementManager } from './achievementManager'
import { sovereignManager } from './sovereignManager'
import { eventBus } from './eventBus'

const AUTOSAVE_INTERVAL = 30

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
    gameState.withLock(() => gameState.save())
  }
}

export const gameLoop = new GameLoop()
