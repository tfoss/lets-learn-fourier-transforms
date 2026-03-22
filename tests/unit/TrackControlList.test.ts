/**
 * Tests for the TrackControlList component.
 *
 * Verifies add/remove track UI, max track limit, and empty state display.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TrackControlList from '../../src/components/TrackControlList.vue'
import { useAudioEngine } from '../../src/composables/useAudioEngine'

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

// ── Tests ──────────────────────────────────────────────────────────

describe('TrackControlList', () => {
  beforeEach(async () => {
    installMockAudioContext()
    const engine = useAudioEngine()
    await engine.cleanup()
  })

  it('shows empty state when there are no tracks', () => {
    const wrapper = mount(TrackControlList)
    const empty = wrapper.find('[data-testid="track-control-list-empty"]')
    expect(empty.exists()).toBe(true)
    expect(empty.text()).toContain("Click 'Add Track' to get started")
  })

  it('renders an Add Track button', () => {
    const wrapper = mount(TrackControlList)
    const btn = wrapper.find('[data-testid="add-track-btn"]')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('Add Track')
  })

  it('shows track count as 0/8 initially', () => {
    const wrapper = mount(TrackControlList)
    const count = wrapper.find('[data-testid="track-count"]')
    expect(count.text()).toBe('0/8')
  })

  it('renders track control panels when tracks exist', () => {
    const engine = useAudioEngine()
    engine.createTrack({ frequency: 440 })

    const wrapper = mount(TrackControlList)
    const panels = wrapper.findAll('[data-testid="track-control-panel"]')
    expect(panels.length).toBe(1)
  })

  it('does not show empty state when tracks exist', () => {
    const engine = useAudioEngine()
    engine.createTrack({ frequency: 440 })

    const wrapper = mount(TrackControlList)
    const empty = wrapper.find('[data-testid="track-control-list-empty"]')
    expect(empty.exists()).toBe(false)
  })

  it('updates track count when tracks are added', () => {
    const engine = useAudioEngine()
    engine.createTrack({ frequency: 440 })
    engine.createTrack({ frequency: 880 })

    const wrapper = mount(TrackControlList)
    const count = wrapper.find('[data-testid="track-count"]')
    expect(count.text()).toBe('2/8')
  })

  it('disables Add Track button at max tracks', () => {
    const engine = useAudioEngine()
    for (let i = 0; i < 8; i++) {
      engine.createTrack({ frequency: 440 + i * 100 })
    }

    const wrapper = mount(TrackControlList)
    const btn = wrapper.find('[data-testid="add-track-btn"]')
    expect((btn.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('shows 8/8 at max tracks', () => {
    const engine = useAudioEngine()
    for (let i = 0; i < 8; i++) {
      engine.createTrack({ frequency: 440 + i * 100 })
    }

    const wrapper = mount(TrackControlList)
    const count = wrapper.find('[data-testid="track-count"]')
    expect(count.text()).toBe('8/8')
  })

  it('renders correct number of panels for multiple tracks', () => {
    const engine = useAudioEngine()
    engine.createTrack({ frequency: 440 })
    engine.createTrack({ frequency: 880 })
    engine.createTrack({ frequency: 330 })

    const wrapper = mount(TrackControlList)
    const panels = wrapper.findAll('[data-testid="track-control-panel"]')
    expect(panels.length).toBe(3)
  })
})
