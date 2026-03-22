/**
 * Tests for the ChallengeButton component.
 *
 * Verifies that the button renders correctly and shows
 * a score badge when the user has earned points.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ChallengeButton from '../../src/components/ChallengeButton.vue'

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

function installMockLocalStorage(): void {
  const store: Record<string, string> = {}
  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  })
}

// ── Tests ──────────────────────────────────────────────────────────

describe('ChallengeButton', () => {
  beforeEach(async () => {
    installMockAudioContext()
    installMockLocalStorage()

    const { useChallenges } = await import('../../src/composables/useChallenges')
    const challenges = useChallenges()
    challenges.resetAllResults()
    challenges.endChallenge()

    const { useAudioEngine } = await import('../../src/composables/useAudioEngine')
    const engine = useAudioEngine()
    await engine.cleanup()
  })

  it('renders the challenge button', () => {
    const wrapper = mount(ChallengeButton)
    const btn = wrapper.find('[data-testid="challenge-btn"]')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('Challenges')
  })

  it('does not show score badge when score is 0', () => {
    const wrapper = mount(ChallengeButton)
    expect(wrapper.find('[data-testid="score-badge"]').exists()).toBe(false)
  })

  it('shows score badge when score is greater than 0', async () => {
    // Earn some points first
    const { useChallenges } = await import('../../src/composables/useChallenges')
    const challenges = useChallenges()
    challenges.startChallenge('match-440')
    challenges.submitAnswer(440)

    const wrapper = mount(ChallengeButton)
    const badge = wrapper.find('[data-testid="score-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('100')
  })
})
