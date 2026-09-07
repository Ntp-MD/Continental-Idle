import { describe, it, expect } from 'vitest'
import { resolveNpcMood, type NpcMoodKind } from '@/blueprint-editor/composables/useNpcOverlayDraw'
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
  ['repath-blocked', 'detouring'],
  ['yielded', null],
  [undefined, null],
]

describe('resolveNpcMood', () => {
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
