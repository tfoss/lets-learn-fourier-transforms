/**
 * Tests for the ChallengePanel component.
 *
 * Verifies that the panel renders challenge info, buttons,
 * input controls, and result displays correctly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ChallengePanel from '../../src/components/ChallengePanel.vue'

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

describe('ChallengePanel', () => {
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

  it('renders the challenge panel', () => {
    const wrapper = mount(ChallengePanel)
    expect(wrapper.find('[data-testid="challenge-panel"]').exists()).toBe(true)
  })

  it('displays the Challenges heading', () => {
    const wrapper = mount(ChallengePanel)
    expect(wrapper.text()).toContain('Challenges')
  })

  it('shows the progress indicator', () => {
    const wrapper = mount(ChallengePanel)
    const progress = wrapper.find('[data-testid="challenge-progress"]')
    expect(progress.exists()).toBe(true)
    expect(progress.text()).toContain('completed')
    expect(progress.text()).toContain('Score:')
  })

  it('displays the challenge list when no challenge is active', () => {
    const wrapper = mount(ChallengePanel)
    expect(wrapper.find('[data-testid="challenge-list"]').exists()).toBe(true)
  })

  it('shows challenge items in the list', () => {
    const wrapper = mount(ChallengePanel)
    const item = wrapper.find('[data-testid="challenge-item-match-440"]')
    expect(item.exists()).toBe(true)
    expect(item.text()).toContain('Match 440 Hz')
  })

  it('shows active challenge view when a challenge is selected', async () => {
    const wrapper = mount(ChallengePanel)
    const item = wrapper.find('[data-testid="challenge-item-match-440"]')
    await item.trigger('click')
    expect(wrapper.find('[data-testid="active-challenge"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="challenge-title"]').text()).toBe('Match 440 Hz')
  })

  it('shows difficulty badge for active challenge', async () => {
    const wrapper = mount(ChallengePanel)
    const item = wrapper.find('[data-testid="challenge-item-match-440"]')
    await item.trigger('click')
    const badge = wrapper.find('[data-testid="difficulty-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('easy')
  })

  it('shows play reference button', async () => {
    const wrapper = mount(ChallengePanel)
    const item = wrapper.find('[data-testid="challenge-item-match-440"]')
    await item.trigger('click')
    const playBtn = wrapper.find('[data-testid="play-reference-btn"]')
    expect(playBtn.exists()).toBe(true)
    expect(playBtn.text()).toBe('Play Reference')
  })

  it('shows frequency slider for match-frequency challenge', async () => {
    const wrapper = mount(ChallengePanel)
    const item = wrapper.find('[data-testid="challenge-item-match-440"]')
    await item.trigger('click')
    expect(wrapper.find('[data-testid="match-frequency-input"]').exists()).toBe(true)
  })

  it('shows note options for name-that-note challenge', async () => {
    const wrapper = mount(ChallengePanel)
    const item = wrapper.find('[data-testid="challenge-item-name-a4"]')
    await item.trigger('click')
    expect(wrapper.find('[data-testid="name-note-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="note-option-A4"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="note-option-C4"]').exists()).toBe(true)
  })

  it('shows frequency inputs for find-hidden-frequency challenge', async () => {
    const wrapper = mount(ChallengePanel)
    const item = wrapper.find('[data-testid="challenge-item-find-two-freqs"]')
    await item.trigger('click')
    expect(wrapper.find('[data-testid="find-freq-input"]').exists()).toBe(true)
  })

  it('shows submit and skip buttons for active challenge', async () => {
    const wrapper = mount(ChallengePanel)
    const item = wrapper.find('[data-testid="challenge-item-match-440"]')
    await item.trigger('click')
    expect(wrapper.find('[data-testid="submit-btn"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="skip-btn"]').exists()).toBe(true)
  })

  it('shows attempt counter', async () => {
    const wrapper = mount(ChallengePanel)
    const item = wrapper.find('[data-testid="challenge-item-match-440"]')
    await item.trigger('click')
    const counter = wrapper.find('[data-testid="attempt-counter"]')
    expect(counter.exists()).toBe(true)
    expect(counter.text()).toContain('Attempts: 0')
  })

  it('returns to challenge list on skip', async () => {
    const wrapper = mount(ChallengePanel)
    const item = wrapper.find('[data-testid="challenge-item-match-440"]')
    await item.trigger('click')
    expect(wrapper.find('[data-testid="active-challenge"]').exists()).toBe(true)

    const skipBtn = wrapper.find('[data-testid="skip-btn"]')
    await skipBtn.trigger('click')
    expect(wrapper.find('[data-testid="challenge-list"]').exists()).toBe(true)
  })

  it('displays challenge description', async () => {
    const wrapper = mount(ChallengePanel)
    const item = wrapper.find('[data-testid="challenge-item-match-440"]')
    await item.trigger('click')
    const desc = wrapper.find('[data-testid="challenge-description"]')
    expect(desc.exists()).toBe(true)
    expect(desc.text()).toContain('440 Hz')
  })
})
