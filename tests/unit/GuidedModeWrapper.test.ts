/**
 * Tests for the GuidedModeWrapper component.
 *
 * Verifies that the correct content is shown for guided vs sandbox mode.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import GuidedModeWrapper from '../../src/components/GuidedModeWrapper.vue'
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

describe('GuidedModeWrapper', () => {
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

  it('renders the wrapper container', () => {
    const wrapper = mount(GuidedModeWrapper, {
      props: { mode: 'sandbox' },
    })
    expect(wrapper.find('[data-testid="guided-mode-wrapper"]').exists()).toBe(true)
  })

  it('shows sandbox content when mode is sandbox', () => {
    const wrapper = mount(GuidedModeWrapper, {
      props: { mode: 'sandbox' },
    })
    expect(wrapper.find('[data-testid="sandbox-content"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="guided-step-view"]').exists()).toBe(false)
  })

  it('shows guided step view when mode is guided', () => {
    const guided = useGuidedMode()
    guided.startGuidedMode()
    const wrapper = mount(GuidedModeWrapper, {
      props: { mode: 'guided' },
    })
    expect(wrapper.find('[data-testid="guided-step-view"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="sandbox-content"]').exists()).toBe(false)
  })

  it('sandbox content includes master controls', () => {
    const wrapper = mount(GuidedModeWrapper, {
      props: { mode: 'sandbox' },
    })
    expect(wrapper.find('[data-testid="master-controls"]').exists()).toBe(true)
  })

  it('sandbox content includes track control list', () => {
    const wrapper = mount(GuidedModeWrapper, {
      props: { mode: 'sandbox' },
    })
    expect(wrapper.find('[data-testid="track-control-list"]').exists()).toBe(true)
  })
})
