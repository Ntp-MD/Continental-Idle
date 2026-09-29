import { describe, it, expect } from 'vitest'
import { resolveNpcMood, type NpcMoodKind } from '@/blueprint-editor/composables/useNpcOverlayDraw'
import { NPC_ENGINE_WAIT_REASONS } from '@/engine/npc'
import type { NpcSimDot } from '@/blueprint-editor/domain/types'

type Status = NpcSimDot['status']

const waitingCases: [string | undefined, NpcMoodKind][] = [
  ['queued', 'patient'],
  ['no-path', 'stuck'],
  ['repath-failed', 'stuck'],
  ['no-target', 'bored'],
  ['no-wander', 'bored'],
  ['no-floor', 'lost'],
  ['wrong-floor', 'lost'],
  ['portal-busy', 'waiting'],
  ['spot-busy', 'waiting'],
  ['reserve-raced', 'waiting'],
  ['queue-left', null],
  ['impatient', 'frustrated'],
  ['repath-blocked', 'detouring'],
  ['yielded', null],
  [undefined, null],
]

describe('resolveNpcMood', () => {
  it('covers every engine wait reason, so a new one cannot fall silently into unknown', () => {
    const covered = new Set(waitingCases.map(([reason]) => reason))
    for (const reason of NPC_ENGINE_WAIT_REASONS) {
      expect(covered.has(reason), `wait reason "${reason}" has no mood mapping in the table`).toBe(true)
    }
  })

  it('maps every engine wait reason for waiting dots', () => {
    for (const [reason, expected] of waitingCases) {
      expect(resolveNpcMood('waiting', reason)).toBe(expected)
    }
  })

  it('falls back to dim for unknown future reasons', () => {
    expect(resolveNpcMood('waiting', 'renamed-reason')).toBe('unknown')
  })

  it('marks queued dots patient regardless of reason', () => {
    const statuses: Status[] = ['queued']
    const reasons = [undefined, 'no-path', 'spot-busy', 'queued']
    for (const status of statuses) {
      for (const reason of reasons) {
        expect(resolveNpcMood(status, reason)).toBe('patient')
      }
    }
  })

  it('shows no mood for busy statuses', () => {
    const statuses: Status[] = ['walking', 'interacting', 'chatting', 'idle']
    const reasons = ['no-path', 'spot-busy', 'no-floor', 'queued', undefined]
    for (const status of statuses) {
      for (const reason of reasons) {
        expect(resolveNpcMood(status, reason)).toBe(null)
      }
    }
  })
})
