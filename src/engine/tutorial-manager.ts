import { gameState } from './game-state'
import { eventBus } from './event-bus'

export interface TutorialStep {
  id: string
  title: string
  hint: string
  target?: string
  action?: string
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Continental Idle',
    hint: 'You run a Continental branch. Your HQ generates 1.2x income. Build your criminal hospitality empire across 37 cities worldwide.',
  },
  {
    id: 'buy-reception',
    title: 'Buy Your First Building',
    hint: 'The Reception Desk is FREE. Click the BUY button next to it in the Buildings panel to start earning income.',
    target: 'building-reception',
    action: 'purchase:reception',
  },
  {
    id: 'buy-guest-rooms',
    title: 'Expand Your Hotel',
    hint: 'Buy Guest Rooms to increase your income. Each building generates income per second. Costs grow with each level.',
    target: 'building-guestRooms',
    action: 'purchase:guestRooms',
  },
  {
    id: 'income-flow',
    title: 'Watch Your Gold Grow',
    hint: 'The header shows your current Gold and income per second. Income is calculated every tick. Buildings compound with 1.07x growth per level.',
  },
  {
    id: 'buy-multiplier',
    title: 'Buy in Bulk',
    hint: 'Use x1, x10, x100, or MAX buttons to buy multiple building levels at once. MAX buys as many as you can afford.',
  },
  {
    id: 'hire-staff',
    title: 'Hire Staff',
    hint: 'Click the Staff button to open the staff panel. Hire a Concierge to boost your Reception Desk and Guest Rooms income.',
    target: 'btn-staff',
    action: 'open:staff',
  },
  {
    id: 'assign-staff',
    title: 'Assign Staff to Buildings',
    hint: 'In the Staff panel, use the dropdown to assign staff to buildings. Staff matched to their best building give 1.25x more bonus.',
    action: 'assign:staff',
  },
  {
    id: 'staff-levelup',
    title: 'Level Up Staff',
    hint: 'Staff gain XP while assigned to buildings. When a Level Up button appears, click it to increase their effect. Higher levels cost more.',
  },
  {
    id: 'branch-switch',
    title: 'Switch BRANCHES',
    hint: 'Click nodes on the world map to switch between unlocked Continental branches. Each branch has its own currency and buildings.',
  },
  {
    id: 'world-map',
    title: 'Explore the World Map',
    hint: 'Click nodes on the map to switch active BRANCHES. Hover over nodes to see their state, prestige requirement, and income. Use +/- to zoom.',
  },
  {
    id: 'events',
    title: 'Handle Events',
    hint: 'Events trigger periodically (every ~45s). A prompt appears with choices. Each choice has rewards, penalties, and reputation changes. Choose wisely!',
  },
  {
    id: 'heat-system',
    title: 'Manage Heat',
    hint: 'Heat builds up from events. High heat increases event frequency and danger. Heat decays passively over time. Ignoring events raises heat.',
  },
  {
    id: 'grace-period',
    title: 'Grace Periods',
    hint: 'New BRANCHES get a 30-minute grace period with no events. Use this time to build up your income before the action starts.',
  },
  {
    id: 'prestige',
    title: 'Prestige for Power',
    hint: 'When lifetime earnings are high enough, open the Prestige panel. Prestige resets buildings and currency but grants Table Favor, which permanently boosts ALL income by 2% per favor.',
    target: 'btn-prestige',
    action: 'open:prestige',
  },
  {
    id: 'branch-unlock',
    title: 'Unlock New Cities',
    hint: 'Prestiging unlocks new Continental branches worldwide. Each city requires a specific total prestige count to unlock. Build your global empire!',
  },
  {
    id: 'inactive-income',
    title: 'Inactive branch Income',
    hint: 'Unlocked BRANCHES you are not actively managing still generate 50% income. Keep all your branches running!',
  },
  {
    id: 'save-system',
    title: 'Saving Your Progress',
    hint: 'The game autosaves every 30 seconds. You can also click Save manually. Your save is protected with a checksum to prevent tampering.',
  },
  {
    id: 'complete',
    title: 'You Are Ready',
    hint: 'You now know the basics. Build your empire, manage your staff, handle events, and ascend the High Table. Good luck, Manager.',
  },
]

class TutorialManager {
  private currentStep = 0
  private active = false

  isActive(): boolean {
    return this.active
  }

  getCurrentStep(): TutorialStep | null {
    if (!this.active || this.currentStep >= TUTORIAL_STEPS.length) return null
    return TUTORIAL_STEPS[this.currentStep]
  }

  getCurrentStepIndex(): number {
    return this.currentStep
  }

  getTotalSteps(): number {
    return TUTORIAL_STEPS.length
  }

  start(): void {
    const state = gameState.get()
    if (state.tutorialCompleted) return
    this.active = true
    this.currentStep = state.tutorialStep || 0
    eventBus.emit('tutorial:step', this.getCurrentStep())
  }

  next(): void {
    if (!this.active) return
    this.currentStep++
    const state = gameState.get()
    state.tutorialStep = this.currentStep

    if (this.currentStep >= TUTORIAL_STEPS.length) {
      this.complete()
      return
    }

    eventBus.emit('tutorial:step', this.getCurrentStep())
  }

  prev(): void {
    if (!this.active || this.currentStep === 0) return
    this.currentStep--
    const state = gameState.get()
    state.tutorialStep = this.currentStep
    eventBus.emit('tutorial:step', this.getCurrentStep())
  }

  skip(): void {
    this.active = false
    const state = gameState.get()
    state.tutorialCompleted = true
    state.tutorialStep = TUTORIAL_STEPS.length
    eventBus.emit('tutorial:complete')
  }

  complete(): void {
    this.active = false
    const state = gameState.get()
    state.tutorialCompleted = true
    state.tutorialStep = TUTORIAL_STEPS.length
    eventBus.emit('tutorial:complete')
  }

  goToStep(step: number): void {
    if (!this.active) return
    this.currentStep = Math.max(0, Math.min(step, TUTORIAL_STEPS.length - 1))
    const state = gameState.get()
    state.tutorialStep = this.currentStep
    eventBus.emit('tutorial:step', this.getCurrentStep())
  }

  checkAction(action: string): void {
    if (!this.active) return
    const step = this.getCurrentStep()
    if (!step || !step.action) return
    if (step.action === action) {
      this.next()
    }
  }

  reset(): void {
    this.active = true
    this.currentStep = 0
    const state = gameState.get()
    state.tutorialCompleted = false
    state.tutorialStep = 0
    eventBus.emit('tutorial:step', this.getCurrentStep())
  }
}

export const tutorialManager = new TutorialManager()
