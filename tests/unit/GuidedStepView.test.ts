/**
 * Tests for the GuidedStepView component.
 *
 * Verifies that step info, navigation buttons, and progress
 * indicators render correctly.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import GuidedStepView from '../../src/components/GuidedStepView.vue'
import { useAudioEngine } from '../../src/composables/useAudioEngine'
import { useGuidedMode } from '../../src/composables/useGuidedMode'

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
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
  })
}

// ── Tests ──────────────────────────────────────────────────────────

describe('GuidedStepView', () => {
  beforeEach(async () => {
    installMockAudioContext()
    installMockLocalStorage()
    const engine = useAudioEngine()
    await engine.cleanup()
    const guided = useGuidedMode()
    guided.resetProgress()
    guided.isGuidedMode.value = false
    guided.isComplete.value = false
  })

  it('renders the step view container', () => {
    const guided = useGuidedMode()
    guided.startGuidedMode()
    const wrapper = mount(GuidedStepView)
    expect(wrapper.find('[data-testid="guided-step-view"]').exists()).toBe(true)
  })

  it('displays the current step title', () => {
    const guided = useGuidedMode()
    guided.startGuidedMode()
    const wrapper = mount(GuidedStepView)
    const title = wrapper.find('[data-testid="step-title"]')
    expect(title.exists()).toBe(true)
    expect(title.text()).toBe('Single Sine Wave')
  })

  it('displays the step explanation', () => {
    const guided = useGuidedMode()
    guided.startGuidedMode()
    const wrapper = mount(GuidedStepView)
    const explanation = wrapper.find('[data-testid="step-explanation"]')
    expect(explanation.exists()).toBe(true)
    expect(explanation.text().length).toBeGreaterThan(0)
  })

  it('shows progress indicator', () => {
    const guided = useGuidedMode()
    guided.startGuidedMode()
    const wrapper = mount(GuidedStepView)
    const progress = wrapper.find('[data-testid="guided-progress"]')
    expect(progress.exists()).toBe(true)
    expect(progress.text()).toContain('Step 1 of 10')
  })

  it('shows navigation buttons', () => {
    const guided = useGuidedMode()
    guided.startGuidedMode()
    const wrapper = mount(GuidedStepView)
    const nav = wrapper.find('[data-testid="step-navigation"]')
    expect(nav.exists()).toBe(true)
  })

  it('hides the Back button on step 1', () => {
    const guided = useGuidedMode()
    guided.startGuidedMode()
    const wrapper = mount(GuidedStepView)
    expect(wrapper.find('[data-testid="prev-step-btn"]').exists()).toBe(false)
  })

  it('shows the Back button on step 2', () => {
    const guided = useGuidedMode()
    guided.startGuidedMode()
    guided.nextStep()
    const wrapper = mount(GuidedStepView)
    expect(wrapper.find('[data-testid="prev-step-btn"]').exists()).toBe(true)
  })

  it('shows a Skip Tutorial button', () => {
    const guided = useGuidedMode()
    guided.startGuidedMode()
    const wrapper = mount(GuidedStepView)
    expect(wrapper.find('[data-testid="skip-tutorial-btn"]').exists()).toBe(true)
  })

  it('shows the Next button', () => {
    const guided = useGuidedMode()
    guided.startGuidedMode()
    const wrapper = mount(GuidedStepView)
    const nextBtn = wrapper.find('[data-testid="next-step-btn"]')
    expect(nextBtn.exists()).toBe(true)
    expect(nextBtn.text()).toBe('Next')
  })

  it('shows Finish on the last step', () => {
    const guided = useGuidedMode()
    guided.startGuidedMode()
    for (let i = 1; i < 10; i++) {
      guided.nextStep()
    }
    const wrapper = mount(GuidedStepView)
    const nextBtn = wrapper.find('[data-testid="next-step-btn"]')
    expect(nextBtn.text()).toBe('Finish')
  })

  it('shows completion message when tutorial is done', () => {
    const guided = useGuidedMode()
    guided.startGuidedMode()
    guided.isComplete.value = true
    const wrapper = mount(GuidedStepView)
    expect(wrapper.find('[data-testid="guided-complete"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Tutorial Complete')
  })

  it('shows step dots for all 9 steps', () => {
    const guided = useGuidedMode()
    guided.startGuidedMode()
    const wrapper = mount(GuidedStepView)
    for (let i = 1; i <= 9; i++) {
      expect(wrapper.find(`[data-testid="step-dot-${i}"]`).exists()).toBe(true)
    }
  })
})
