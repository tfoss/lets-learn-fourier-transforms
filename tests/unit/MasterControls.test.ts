/**
 * Tests for the MasterControls component.
 *
 * Verifies play/stop toggle, master volume slider, and preset selector.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import MasterControls from '../../src/components/MasterControls.vue'
import { useAudioEngine } from '../../src/composables/useAudioEngine'

// ── Web Audio API mocks ────────────────────────────────────────────

function createMockAudioParam(initialValue = 0) {
  return {
    value: initialValue,
    cancelScheduledValues: vi.fn(),
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

// ── Tests ──────────────────────────────────────────────────────────

describe('MasterControls', () => {
  beforeEach(async () => {
    installMockAudioContext()
    const engine = useAudioEngine()
    await engine.cleanup()
  })

  it('renders the Play All button when not playing', () => {
    const wrapper = mount(MasterControls)
    const btn = wrapper.find('[data-testid="play-all-btn"]')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('Play All')
  })

  it('shows Stop All after playAll is called', () => {
    const engine = useAudioEngine()
    engine.createTrack({ frequency: 440 })
    engine.playAll()

    const wrapper = mount(MasterControls)
    const btn = wrapper.find('[data-testid="play-all-btn"]')
    expect(btn.text()).toContain('Stop All')
  })

  it('shows playing indicator when playing', () => {
    const engine = useAudioEngine()
    engine.createTrack({ frequency: 440 })
    engine.playAll()

    const wrapper = mount(MasterControls)
    const indicator = wrapper.find('[data-testid="playing-indicator"]')
    expect(indicator.exists()).toBe(true)
  })

  it('does not show playing indicator when stopped', () => {
    const wrapper = mount(MasterControls)
    const indicator = wrapper.find('[data-testid="playing-indicator"]')
    expect(indicator.exists()).toBe(false)
  })

  it('renders the master volume slider', () => {
    const wrapper = mount(MasterControls)
    const slider = wrapper.find('[data-testid="master-volume-slider"]')
    expect(slider.exists()).toBe(true)
  })

  it('displays the master volume percentage', () => {
    const wrapper = mount(MasterControls)
    const display = wrapper.find('[data-testid="master-volume-display"]')
    expect(display.text()).toContain('100%')
  })

  it('renders the preset selector', () => {
    const wrapper = mount(MasterControls)
    const selector = wrapper.find('[data-testid="preset-selector"]')
    expect(selector.exists()).toBe(true)
  })

  it('has preset options in the selector', () => {
    const wrapper = mount(MasterControls)
    const options = wrapper.findAll('[data-testid="preset-selector"] option')
    // At least the "— Select —" placeholder + some presets
    expect(options.length).toBeGreaterThan(1)
  })

  it('includes Tuning Fork in presets', () => {
    const wrapper = mount(MasterControls)
    const selector = wrapper.find('[data-testid="preset-selector"]')
    expect(selector.text()).toContain('Tuning Fork')
  })

  it('includes Piano A4 in presets', () => {
    const wrapper = mount(MasterControls)
    const selector = wrapper.find('[data-testid="preset-selector"]')
    expect(selector.text()).toContain('Piano A4')
  })
})
