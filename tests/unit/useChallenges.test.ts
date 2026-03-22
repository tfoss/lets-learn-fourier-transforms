/**
 * Tests for the useChallenges composable.
 *
 * Verifies challenge lifecycle (start/submit/skip),
 * scoring logic, and localStorage persistence.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useChallenges } from '../../src/composables/useChallenges'

// ── Web Audio API mocks ────────────────────────────────────────────

function createMockAudioParam(initialValue = 0) {
  return {
    value: initialValue,
    setValueAtTime: vi.fn(function (this: { value: number }, v: number) {
      this.value = v
      return this
    }),
    linearRampToValueAtTime: vi.fn(function (this: { value: number }, v: number) {
      this.value = v
      return this
    }),
    exponentialRampToValueAtTime: vi.fn(function (this: { value: number }, v: number) {
      this.value = v
      return this
    }),
    cancelScheduledValues: vi.fn(),
  }
}

function createMockGainNode() {
  return {
    gain: createMockAudioParam(1),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }
}

function createMockAnalyserNode() {
  return {
    fftSize: 2048,
    frequencyBinCount: 1024,
    connect: vi.fn(),
    disconnect: vi.fn(),
    getFloatFrequencyData: vi.fn(),
    getFloatTimeDomainData: vi.fn(),
  }
}

function installMockAudioContext(): void {
  class MockAudioContext {
    state: AudioContextState = 'running'
    currentTime = 0
    sampleRate = 44100
    destination = {}
    resume = vi.fn().mockResolvedValue(undefined)
    close = vi.fn().mockResolvedValue(undefined)
    createOscillator = vi.fn(() => ({
      type: 'sine',
      frequency: createMockAudioParam(440),
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
    }))
    createGain = vi.fn(() => createMockGainNode())
    createAnalyser = vi.fn(() => createMockAnalyserNode())
  }

  vi.stubGlobal('AudioContext', MockAudioContext)
}

// ── localStorage mock ──────────────────────────────────────────────

function installMockLocalStorage(): { store: Record<string, string> } {
  const store: Record<string, string> = {}
  const mockStorage = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      for (const key of Object.keys(store)) {
        delete store[key]
      }
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  }
  vi.stubGlobal('localStorage', mockStorage)
  return { store }
}

// ── Tests ──────────────────────────────────────────────────────────

describe('useChallenges', () => {
  let mockStore: { store: Record<string, string> }

  beforeEach(async () => {
    installMockAudioContext()
    mockStore = installMockLocalStorage()

    // Reset singleton state
    const challenges = useChallenges()
    challenges.resetAllResults()
    challenges.endChallenge()

    // Also clean up audio engine
    const { useAudioEngine } = await import('../../src/composables/useAudioEngine')
    const engine = useAudioEngine()
    await engine.cleanup()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('startChallenge', () => {
    it('starts a valid challenge and sets active state', () => {
      const { startChallenge, currentChallenge, isChallengeActive } = useChallenges()
      const result = startChallenge('match-440')
      expect(result).toBe(true)
      expect(currentChallenge.value).toBeDefined()
      expect(currentChallenge.value!.id).toBe('match-440')
      expect(isChallengeActive.value).toBe(true)
    })

    it('returns false for non-existent challenge', () => {
      const { startChallenge, currentChallenge, isChallengeActive } = useChallenges()
      const result = startChallenge('nonexistent')
      expect(result).toBe(false)
      expect(currentChallenge.value).toBeNull()
      expect(isChallengeActive.value).toBe(false)
    })

    it('resets attempts when starting a new challenge', () => {
      const { startChallenge, attempts } = useChallenges()
      startChallenge('match-440')
      expect(attempts.value).toBe(0)
    })

    it('sets up audio engine tracks', async () => {
      const { startChallenge } = useChallenges()
      const { useAudioEngine } = await import('../../src/composables/useAudioEngine')
      const engine = useAudioEngine()

      startChallenge('match-440')
      expect(engine.tracks.value.length).toBe(1)
      expect(engine.tracks.value[0].frequency).toBe(440)
    })

    it('clears previous tracks before setting up new ones', async () => {
      const { startChallenge } = useChallenges()
      const { useAudioEngine } = await import('../../src/composables/useAudioEngine')
      const engine = useAudioEngine()

      startChallenge('match-440')
      expect(engine.tracks.value.length).toBe(1)

      startChallenge('find-two-freqs')
      expect(engine.tracks.value.length).toBe(2)
    })
  })

  describe('submitAnswer', () => {
    it('returns result for correct frequency answer', () => {
      const { startChallenge, submitAnswer } = useChallenges()
      startChallenge('match-440')
      const result = submitAnswer(440)
      expect(result).toBeDefined()
      expect(result!.completed).toBe(true)
      expect(result!.score).toBe(100)
      expect(result!.attempts).toBe(1)
    })

    it('returns result for frequency within tolerance', () => {
      const { startChallenge, submitAnswer } = useChallenges()
      startChallenge('match-440')
      const result = submitAnswer(445) // tolerance is 10
      expect(result).toBeDefined()
      expect(result!.completed).toBe(true)
    })

    it('returns null for incorrect answer', () => {
      const { startChallenge, submitAnswer } = useChallenges()
      startChallenge('match-440')
      const result = submitAnswer(300)
      expect(result).toBeNull()
    })

    it('increments attempts on each submission', () => {
      const { startChallenge, submitAnswer, attempts } = useChallenges()
      startChallenge('match-440')
      submitAnswer(300)
      expect(attempts.value).toBe(1)
      submitAnswer(300)
      expect(attempts.value).toBe(2)
    })

    it('reduces score for multiple attempts', () => {
      const { startChallenge, submitAnswer } = useChallenges()
      startChallenge('match-440')
      submitAnswer(300) // wrong
      submitAnswer(300) // wrong
      const result = submitAnswer(440) // correct on 3rd try
      expect(result).toBeDefined()
      expect(result!.score).toBe(50) // 100 - 2*25
      expect(result!.attempts).toBe(3)
    })

    it('sets lastSubmitCorrect to true on correct answer', () => {
      const { startChallenge, submitAnswer, lastSubmitCorrect } = useChallenges()
      startChallenge('match-440')
      submitAnswer(440)
      expect(lastSubmitCorrect.value).toBe(true)
    })

    it('sets lastSubmitCorrect to false on wrong answer', () => {
      const { startChallenge, submitAnswer, lastSubmitCorrect } = useChallenges()
      startChallenge('match-440')
      submitAnswer(300)
      expect(lastSubmitCorrect.value).toBe(false)
    })

    it('shows hint after first wrong attempt', () => {
      const { startChallenge, submitAnswer, showHint } = useChallenges()
      startChallenge('match-440')
      submitAnswer(300)
      expect(showHint.value).toBe(true)
    })

    it('handles name-that-note correct answer', () => {
      const { startChallenge, submitAnswer } = useChallenges()
      startChallenge('name-a4')
      const result = submitAnswer('A4')
      expect(result).toBeDefined()
      expect(result!.completed).toBe(true)
    })

    it('handles name-that-note wrong answer', () => {
      const { startChallenge, submitAnswer } = useChallenges()
      startChallenge('name-a4')
      const result = submitAnswer('C4')
      expect(result).toBeNull()
    })

    it('handles name-that-note with multiple correct notes', () => {
      const { startChallenge, submitAnswer } = useChallenges()
      startChallenge('name-two-notes')
      const result = submitAnswer(['C4', 'E4'])
      expect(result).toBeDefined()
      expect(result!.completed).toBe(true)
    })

    it('handles find-hidden-frequency answer', () => {
      const { startChallenge, submitAnswer } = useChallenges()
      startChallenge('find-two-freqs')
      const result = submitAnswer([300, 500])
      expect(result).toBeDefined()
      expect(result!.completed).toBe(true)
    })

    it('returns null if no challenge is active', () => {
      const { submitAnswer } = useChallenges()
      const result = submitAnswer(440)
      expect(result).toBeNull()
    })

    it('persists result to localStorage', () => {
      const { startChallenge, submitAnswer } = useChallenges()
      startChallenge('match-440')
      submitAnswer(440)
      expect(localStorage.setItem).toHaveBeenCalled()
    })

    it('keeps the better score when replaying a challenge', () => {
      const { startChallenge, submitAnswer, getResult } = useChallenges()

      // First play: 100 points (1st attempt)
      startChallenge('match-440')
      submitAnswer(440)
      expect(getResult('match-440')?.score).toBe(100)

      // Second play: 75 points (2nd attempt)
      startChallenge('match-440')
      submitAnswer(300) // wrong
      submitAnswer(440) // correct
      // Should still be 100
      expect(getResult('match-440')?.score).toBe(100)
    })
  })

  describe('skipChallenge', () => {
    it('records a zero-score result', () => {
      const { startChallenge, skipChallenge, getResult } = useChallenges()
      startChallenge('match-440')
      skipChallenge()
      const result = getResult('match-440')
      expect(result).toBeDefined()
      expect(result!.completed).toBe(false)
      expect(result!.score).toBe(0)
    })

    it('deactivates the challenge', () => {
      const { startChallenge, skipChallenge, isChallengeActive, currentChallenge } = useChallenges()
      startChallenge('match-440')
      skipChallenge()
      expect(isChallengeActive.value).toBe(false)
      expect(currentChallenge.value).toBeNull()
    })
  })

  describe('computed properties', () => {
    it('totalScore sums all completed challenge scores', () => {
      const { startChallenge, submitAnswer, totalScore } = useChallenges()

      startChallenge('match-440')
      submitAnswer(440)

      startChallenge('match-middle-c')
      submitAnswer(261.63)

      expect(totalScore.value).toBe(200)
    })

    it('completedCount tracks successful completions', () => {
      const { startChallenge, submitAnswer, skipChallenge, completedCount } = useChallenges()

      startChallenge('match-440')
      submitAnswer(440)

      startChallenge('match-middle-c')
      skipChallenge()

      expect(completedCount.value).toBe(1)
    })

    it('totalChallenges returns the total number of challenges', () => {
      const { totalChallenges } = useChallenges()
      expect(totalChallenges.value).toBeGreaterThanOrEqual(12)
    })
  })

  describe('endChallenge', () => {
    it('clears challenge state without recording a skip', () => {
      const { startChallenge, endChallenge, isChallengeActive, currentChallenge, getResult } = useChallenges()
      startChallenge('match-440')
      endChallenge()
      expect(isChallengeActive.value).toBe(false)
      expect(currentChallenge.value).toBeNull()
      // endChallenge does NOT record a result
      expect(getResult('match-440')).toBeUndefined()
    })
  })

  describe('resetAllResults', () => {
    it('clears all results and localStorage', () => {
      const { startChallenge, submitAnswer, resetAllResults, totalScore, completedCount } = useChallenges()

      startChallenge('match-440')
      submitAnswer(440)
      expect(totalScore.value).toBe(100)

      resetAllResults()
      expect(totalScore.value).toBe(0)
      expect(completedCount.value).toBe(0)
    })
  })
})
