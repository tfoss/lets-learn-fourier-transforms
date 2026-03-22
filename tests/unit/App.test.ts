/**
 * Tests for the App root component.
 *
 * Verifies the app layout renders with header, guided mode wrapper,
 * and FFT panel. Tests mode switching between sandbox and guided.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../../src/App.vue'
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

describe('App', () => {
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

  it('renders the app layout with header', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Fourier Explorer')
  })

  it('starts in sandbox mode', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Sandbox Mode')
  })

  it('renders master controls in sandbox mode', () => {
    const wrapper = mount(App)
    const masterControls = wrapper.find('[data-testid="master-controls"]')
    expect(masterControls.exists()).toBe(true)
  })

  it('renders track control list in sandbox mode', () => {
    const wrapper = mount(App)
    const trackControlList = wrapper.find('[data-testid="track-control-list"]')
    expect(trackControlList.exists()).toBe(true)
  })

  it('creates a default track on mount in sandbox mode', () => {
    mount(App)
    const engine = useAudioEngine()
    expect(engine.tracks.value.length).toBe(1)
    expect(engine.tracks.value[0].frequency).toBe(440)
  })

  it('renders the guided mode wrapper', () => {
    const wrapper = mount(App)
    expect(wrapper.find('[data-testid="guided-mode-wrapper"]').exists()).toBe(true)
  })

  it('shows master controls in sandbox mode by default', () => {
    const wrapper = mount(App)
    expect(wrapper.find('[data-testid="master-controls"]').exists()).toBe(true)
  })
})
