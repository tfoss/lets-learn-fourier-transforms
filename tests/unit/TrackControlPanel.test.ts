/**
 * Tests for the TrackControlPanel component.
 *
 * Verifies correct rendering of track information, slider displays,
 * and event emissions for parameter changes and playback controls.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TrackControlPanel from '../../src/components/TrackControlPanel.vue'
import type { TrackConfig } from '../../src/types/audio'
import { createTrackId } from '../../src/types/audio'

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

// ── Test fixtures ──────────────────────────────────────────────────

/**
 * Creates a test track configuration.
 *
 * @param overrides - Partial config to merge.
 * @returns A complete TrackConfig.
 */
function createTestTrack(overrides?: Partial<TrackConfig>): TrackConfig {
  return {
    id: createTrackId('test-track-0'),
    frequency: 440,
    amplitude: 0.5,
    waveformType: 'sine',
    phase: 0,
    duration: 0,
    color: '#3b82f6',
    isMuted: false,
    isSolo: false,
    ...overrides,
  }
}

// ── Tests ──────────────────────────────────────────────────────────

describe('TrackControlPanel', () => {
  beforeEach(() => {
    installMockAudioContext()
  })

  it('renders track label with correct index', () => {
    const wrapper = mount(TrackControlPanel, {
      props: { track: createTestTrack(), trackIndex: 2 },
    })
    const label = wrapper.find('[data-testid="track-label"]')
    expect(label.text()).toBe('Track 3')
  })

  it('renders track color dot', () => {
    const color = '#ef4444'
    const wrapper = mount(TrackControlPanel, {
      props: { track: createTestTrack({ color }), trackIndex: 0 },
    })
    const dot = wrapper.find('[data-testid="track-color-dot"]')
    expect(dot.attributes('style')).toContain(color)
  })

  it('displays frequency in Hz with note name', () => {
    const wrapper = mount(TrackControlPanel, {
      props: { track: createTestTrack({ frequency: 440 }), trackIndex: 0 },
    })
    const display = wrapper.find('[data-testid="frequency-display"]')
    expect(display.text()).toContain('440')
    expect(display.text()).toContain('A4')
  })

  it('displays amplitude as percentage', () => {
    const wrapper = mount(TrackControlPanel, {
      props: { track: createTestTrack({ amplitude: 0.75 }), trackIndex: 0 },
    })
    const display = wrapper.find('[data-testid="amplitude-display"]')
    expect(display.text()).toContain('75%')
  })

  it('displays phase in degrees', () => {
    const wrapper = mount(TrackControlPanel, {
      props: { track: createTestTrack({ phase: Math.PI }), trackIndex: 0 },
    })
    const display = wrapper.find('[data-testid="phase-display"]')
    expect(display.text()).toContain('180°')
  })

  it('highlights the active waveform type button', () => {
    const wrapper = mount(TrackControlPanel, {
      props: { track: createTestTrack({ waveformType: 'square' }), trackIndex: 0 },
    })
    const squareBtn = wrapper.find('[data-testid="waveform-btn-square"]')
    expect(squareBtn.classes()).toContain('bg-blue-600')

    const sineBtn = wrapper.find('[data-testid="waveform-btn-sine"]')
    expect(sineBtn.classes()).toContain('bg-gray-700')
  })

  it('renders all four waveform type buttons', () => {
    const wrapper = mount(TrackControlPanel, {
      props: { track: createTestTrack(), trackIndex: 0 },
    })
    expect(wrapper.find('[data-testid="waveform-btn-sine"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="waveform-btn-square"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="waveform-btn-triangle"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="waveform-btn-sawtooth"]').exists()).toBe(true)
  })

  it('emits update-param when waveform button clicked', async () => {
    const track = createTestTrack()
    const wrapper = mount(TrackControlPanel, {
      props: { track, trackIndex: 0 },
    })
    await wrapper.find('[data-testid="waveform-btn-square"]').trigger('click')
    const emitted = wrapper.emitted('update-param')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual([track.id, 'waveformType', 'square'])
  })

  it('emits play event when Play button clicked', async () => {
    const track = createTestTrack()
    const wrapper = mount(TrackControlPanel, {
      props: { track, trackIndex: 0, isTrackPlaying: false },
    })
    await wrapper.find('[data-testid="play-stop-btn"]').trigger('click')
    const emitted = wrapper.emitted('play')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual([track.id])
  })

  it('emits stop event when Stop button clicked', async () => {
    const track = createTestTrack()
    const wrapper = mount(TrackControlPanel, {
      props: { track, trackIndex: 0, isTrackPlaying: true },
    })
    await wrapper.find('[data-testid="play-stop-btn"]').trigger('click')
    const emitted = wrapper.emitted('stop')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual([track.id])
  })

  it('emits remove event when Remove button clicked', async () => {
    const track = createTestTrack()
    const wrapper = mount(TrackControlPanel, {
      props: { track, trackIndex: 0 },
    })
    await wrapper.find('[data-testid="remove-track-btn"]').trigger('click')
    const emitted = wrapper.emitted('remove')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual([track.id])
  })

  it('emits update-param for mute toggle', async () => {
    const track = createTestTrack({ isMuted: false })
    const wrapper = mount(TrackControlPanel, {
      props: { track, trackIndex: 0 },
    })
    await wrapper.find('[data-testid="mute-btn"]').trigger('click')
    const emitted = wrapper.emitted('update-param')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual([track.id, 'isMuted', true])
  })

  it('emits update-param for solo toggle', async () => {
    const track = createTestTrack({ isSolo: false })
    const wrapper = mount(TrackControlPanel, {
      props: { track, trackIndex: 0 },
    })
    await wrapper.find('[data-testid="solo-btn"]').trigger('click')
    const emitted = wrapper.emitted('update-param')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual([track.id, 'isSolo', true])
  })

  it('shows "Play" text when not playing', () => {
    const wrapper = mount(TrackControlPanel, {
      props: { track: createTestTrack(), trackIndex: 0, isTrackPlaying: false },
    })
    expect(wrapper.find('[data-testid="play-stop-btn"]').text()).toBe('Play')
  })

  it('shows "Stop" text when playing', () => {
    const wrapper = mount(TrackControlPanel, {
      props: { track: createTestTrack(), trackIndex: 0, isTrackPlaying: true },
    })
    expect(wrapper.find('[data-testid="play-stop-btn"]').text()).toBe('Stop')
  })

  it('shows "Muted" text when muted', () => {
    const wrapper = mount(TrackControlPanel, {
      props: { track: createTestTrack({ isMuted: true }), trackIndex: 0 },
    })
    expect(wrapper.find('[data-testid="mute-btn"]').text()).toBe('Muted')
  })
})
