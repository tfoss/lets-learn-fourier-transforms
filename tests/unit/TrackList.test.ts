/**
 * Tests for the TrackList component.
 *
 * Verifies correct rendering of track waveforms, superposition waveform,
 * and the empty state. Uses a mock AudioContext since TrackList interacts
 * with useAudioEngine which requires Web Audio API.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TrackList from '../../src/components/TrackList.vue'
import { useAudioEngine } from '../../src/composables/useAudioEngine'

// ── Web Audio API mocks ────────────────────────────────────────────

/**
 * Creates a mock AudioParam with spy methods.
 *
 * @param initialValue - Starting value for the param.
 * @returns Mock AudioParam.
 */
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

/**
 * Creates a mock GainNode.
 *
 * @returns Mock GainNode.
 */
function createMockGainNode() {
  return {
    gain: createMockAudioParam(1),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }
}

/**
 * Creates a mock AnalyserNode.
 *
 * @returns Mock AnalyserNode.
 */
function createMockAnalyserNode() {
  return {
    fftSize: 2048,
    frequencyBinCount: 1024,
    connect: vi.fn(),
    disconnect: vi.fn(),
    getFloatFrequencyData: vi.fn((arr: Float32Array) => {
      arr.fill(-100)
    }),
    getFloatTimeDomainData: vi.fn((arr: Float32Array) => {
      arr.fill(0)
    }),
  }
}

/**
 * Installs a mock AudioContext on the global object.
 */
function installMockAudioContext(): void {
  const mockCtx = {
    state: 'running' as AudioContextState,
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    createOscillator: vi.fn(() => ({
      type: 'sine',
      frequency: createMockAudioParam(440),
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
    })),
    createGain: vi.fn(() => createMockGainNode()),
    createAnalyser: vi.fn(() => createMockAnalyserNode()),
  }

  class MockAudioContext {
    state = mockCtx.state
    currentTime = mockCtx.currentTime
    sampleRate = mockCtx.sampleRate
    destination = mockCtx.destination
    resume = mockCtx.resume
    close = mockCtx.close
    createOscillator = mockCtx.createOscillator
    createGain = mockCtx.createGain
    createAnalyser = mockCtx.createAnalyser
  }

  vi.stubGlobal('AudioContext', MockAudioContext)
}

// ── Tests ──────────────────────────────────────────────────────────

describe('TrackList', () => {
  beforeEach(async () => {
    installMockAudioContext()
    const engine = useAudioEngine()
    await engine.cleanup()
  })

  it('shows empty state when there are no tracks', () => {
    const wrapper = mount(TrackList)
    const empty = wrapper.find('[data-testid="track-list-empty"]')
    expect(empty.exists()).toBe(true)
    expect(empty.text()).toContain('No tracks yet')
  })

  it('does not show superposition waveform when there are no tracks', () => {
    const wrapper = mount(TrackList)
    const superposition = wrapper.find('[data-testid="superposition-waveform"]')
    expect(superposition.exists()).toBe(false)
  })

  it('renders track waveforms when tracks exist', () => {
    const engine = useAudioEngine()
    engine.createTrack({ frequency: 440 })

    const wrapper = mount(TrackList)
    const trackWaveforms = wrapper.findAll('[data-testid="track-waveform"]')
    expect(trackWaveforms.length).toBe(1)
  })

  it('renders superposition waveform when tracks exist', () => {
    const engine = useAudioEngine()
    engine.createTrack({ frequency: 440 })

    const wrapper = mount(TrackList)
    const superposition = wrapper.find('[data-testid="superposition-waveform"]')
    expect(superposition.exists()).toBe(true)
  })

  it('renders correct number of track waveforms for multiple tracks', () => {
    const engine = useAudioEngine()
    engine.createTrack({ frequency: 440 })
    engine.createTrack({ frequency: 880 })
    engine.createTrack({ frequency: 330 })

    const wrapper = mount(TrackList)
    const trackWaveforms = wrapper.findAll('[data-testid="track-waveform"]')
    expect(trackWaveforms.length).toBe(3)
  })

  it('does not show empty state when tracks exist', () => {
    const engine = useAudioEngine()
    engine.createTrack({ frequency: 440 })

    const wrapper = mount(TrackList)
    const empty = wrapper.find('[data-testid="track-list-empty"]')
    expect(empty.exists()).toBe(false)
  })
})
