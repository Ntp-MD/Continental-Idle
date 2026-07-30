// Central Event Bus using native EventTarget (zero dependencies)

class GameEventBus extends EventTarget {
  emit(topic: string, detail?: unknown): void {
    this.dispatchEvent(new CustomEvent(topic, { detail }))
  }

  on(topic: string, handler: (e: CustomEvent) => void): void {
    this.addEventListener(topic, handler as EventListener)
  }

  off(topic: string, handler: (e: CustomEvent) => void): void {
    this.removeEventListener(topic, handler as EventListener)
  }
}

export const eventBus = new GameEventBus()
