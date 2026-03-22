/**
 * Tests for src/components/InverseFFTDrawer.vue
 *
 * Tests that the component renders canvas elements and control buttons.
 * Mocks useInverseFFT to isolate component rendering logic.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed } from 'vue'

// ── Mock useInverseFFT ─────────────────────────────────────────────

const mockDrawnPeaks = ref<{ frequency: number; magnitude: number }[]>([])
const mockIsPlaying = ref(false)
const mockGeneratedWaveform = computed(() => new Float32Array(0))
const mockAddPeak = vi.fn()
const mockRemovePeak = vi.fn()
const mockFindClosestPeakIndex = vi.fn(() => -1)
const mockClearPeaks = vi.fn()
const mockPlayDrawnSound = vi.fn()
const mockStopDrawnSound = vi.fn()

vi.mock('../../src/composables/useInverseFFT', () => ({
  useInverseFFT: () => ({
    drawnPeaks: mockDrawnPeaks,
    isPlaying: mockIsPlaying,
    generatedWaveform: mockGeneratedWaveform,
    addPeak: mockAddPeak,
    removePeak: mockRemovePeak,
    findClosestPeakIndex: mockFindClosestPeakIndex,
    clearPeaks: mockClearPeaks,
    playDrawnSound: mockPlayDrawnSound,
    stopDrawnSound: mockStopDrawnSound,
  }),
}))

// ── Import after mocks ─────────────────────────────────────────────

import InverseFFTDrawer from '../../src/components/InverseFFTDrawer.vue'

// ── Tests ─────────────────────────────────────────────────────────

describe('InverseFFTDrawer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDrawnPeaks.value = []
    mockIsPlaying.value = false
  })

  it('renders the draw canvas', () => {
    const wrapper = mount(InverseFFTDrawer)
    const canvases = wrapper.findAll('canvas')
    expect(canvases.length).toBeGreaterThanOrEqual(1)
  })

  it('renders the waveform preview canvas', () => {
    const wrapper = mount(InverseFFTDrawer)
    const canvases = wrapper.findAll('canvas')
    expect(canvases.length).toBe(2)
  })

  it('renders a Play button', () => {
    const wrapper = mount(InverseFFTDrawer)
    const playBtn = wrapper.findAll('button').find((b) => b.text() === 'Play')
    expect(playBtn).toBeTruthy()
  })

  it('renders a Clear button', () => {
    const wrapper = mount(InverseFFTDrawer)
    const clearBtn = wrapper.findAll('button').find((b) => b.text() === 'Clear')
    expect(clearBtn).toBeTruthy()
  })

  it('shows Stop button when playing', () => {
    mockIsPlaying.value = true
    const wrapper = mount(InverseFFTDrawer)
    const stopBtn = wrapper.findAll('button').find((b) => b.text() === 'Stop')
    expect(stopBtn).toBeTruthy()
  })

  it('shows peak count', () => {
    mockDrawnPeaks.value = [
      { frequency: 440, magnitude: 0.8 },
      { frequency: 880, magnitude: 0.5 },
    ]
    const wrapper = mount(InverseFFTDrawer)
    expect(wrapper.text()).toContain('2 peaks')
  })

  it('shows singular "peak" for 1 peak', () => {
    mockDrawnPeaks.value = [{ frequency: 440, magnitude: 0.8 }]
    const wrapper = mount(InverseFFTDrawer)
    expect(wrapper.text()).toContain('1 peak')
  })

  it('calls clearPeaks when Clear button is clicked', async () => {
    mockDrawnPeaks.value = [{ frequency: 440, magnitude: 0.8 }]
    const wrapper = mount(InverseFFTDrawer)
    const clearBtn = wrapper.findAll('button').find((b) => b.text() === 'Clear')!
    await clearBtn.trigger('click')
    expect(mockClearPeaks).toHaveBeenCalled()
  })

  it('has the inverse-fft-drawer CSS class', () => {
    const wrapper = mount(InverseFFTDrawer)
    expect(wrapper.classes()).toContain('inverse-fft-drawer')
  })

  it('draw canvas has crosshair cursor', () => {
    const wrapper = mount(InverseFFTDrawer)
    const drawCanvas = wrapper.findAll('canvas')[0]
    expect(drawCanvas.classes()).toContain('cursor-crosshair')
  })
})
