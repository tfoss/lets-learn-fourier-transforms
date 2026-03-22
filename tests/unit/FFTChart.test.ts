/**
 * Tests for src/components/FFTChart.vue
 *
 * Tests component structure, props, and event emission.
 * Mocks the audio engine and canvas to focus on component logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

// ── Mock useAudioEngine ───────────────────────────────────────────

const mockTracks = ref([
  {
    id: 'track-0',
    frequency: 440,
    amplitude: 0.5,
    waveformType: 'sine',
    phase: 0,
    duration: 0,
    color: '#3b82f6',
    isMuted: false,
    isSolo: false,
    envelope: { enabled: false, attack: 0.01, decay: 0.3, sustain: 0.5, release: 0.3 },
  },
])

const mockIsPlaying = ref(false)

const mockGetFFTData = vi.fn(() => ({
  frequencyData: new Float32Array(1024).fill(-100),
  timeDomainData: new Float32Array(1024).fill(0),
  sampleRate: 44100,
  fftSize: 2048,
}))

vi.mock('../../src/composables/useAudioEngine', () => ({
  useAudioEngine: () => ({
    tracks: mockTracks,
    isPlaying: mockIsPlaying,
    getFFTData: mockGetFFTData,
  }),
}))

// ── Mock useFFTRenderer ───────────────────────────────────────────

const mockDrawFFT = vi.fn()
const mockStartAnimation = vi.fn()
const mockStopAnimation = vi.fn()
const mockClear = vi.fn()
const mockUpdateOptions = vi.fn()
const mockDispose = vi.fn()

vi.mock('../../src/composables/useFFTRenderer', () => ({
  useFFTRenderer: () => ({
    drawFFT: mockDrawFFT,
    startAnimation: mockStartAnimation,
    stopAnimation: mockStopAnimation,
    clear: mockClear,
    updateOptions: mockUpdateOptions,
    dispose: mockDispose,
    isAnimating: ref(false),
  }),
  frequencyToX: (freq: number, width: number) => {
    // Simple linear mapping for tests
    return (freq / 4000) * width
  },
}))

// ── Import component after mocks ──────────────────────────────────

import FFTChart from '../../src/components/FFTChart.vue'

// ── Tests ─────────────────────────────────────────────────────────

describe('FFTChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsPlaying.value = false
  })

  it('renders a canvas element', () => {
    const wrapper = mount(FFTChart)
    const canvas = wrapper.find('canvas')
    expect(canvas.exists()).toBe(true)
  })

  it('applies default height to canvas style', () => {
    const wrapper = mount(FFTChart)
    const canvas = wrapper.find('canvas')
    expect(canvas.attributes('style')).toContain('height: 400px')
  })

  it('applies custom height prop to canvas style', () => {
    const wrapper = mount(FFTChart, {
      props: { height: 300 },
    })
    const canvas = wrapper.find('canvas')
    expect(canvas.attributes('style')).toContain('height: 300px')
  })

  it('has the fft-chart CSS class on the root', () => {
    const wrapper = mount(FFTChart)
    expect(wrapper.classes()).toContain('fft-chart')
  })

  it('has a dark background class', () => {
    const wrapper = mount(FFTChart)
    expect(wrapper.classes()).toContain('bg-gray-800')
  })

  it('accepts useLogScale prop', () => {
    const wrapper = mount(FFTChart, {
      props: { useLogScale: false },
    })
    expect(wrapper.props('useLogScale')).toBe(false)
  })

  it('accepts showPeaks prop', () => {
    const wrapper = mount(FFTChart, {
      props: { showPeaks: false },
    })
    expect(wrapper.props('showPeaks')).toBe(false)
  })

  it('accepts showNoteLabels prop', () => {
    const wrapper = mount(FFTChart, {
      props: { showNoteLabels: false },
    })
    expect(wrapper.props('showNoteLabels')).toBe(false)
  })

  it('emits peak-hover with null on mouseleave', async () => {
    const wrapper = mount(FFTChart)
    const canvas = wrapper.find('canvas')
    await canvas.trigger('mouseleave')

    expect(wrapper.emitted('peak-hover')).toBeTruthy()
    const emitted = wrapper.emitted('peak-hover')!
    expect(emitted[emitted.length - 1][0]).toBeNull()
  })

  it('calls renderFrame on mount', () => {
    mount(FFTChart)
    // getFFTData should be called during mount to render initial frame
    expect(mockGetFFTData).toHaveBeenCalled()
  })
})
