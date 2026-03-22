/**
 * Tests for src/components/FFTPanel.vue
 *
 * Tests the panel renders correctly with title, controls, and chart.
 * Verifies toggle buttons work and peak hover info is displayed.
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
  },
])

vi.mock('../../src/composables/useAudioEngine', () => ({
  useAudioEngine: () => ({
    tracks: mockTracks,
    isPlaying: ref(false),
    getFFTData: vi.fn(() => ({
      frequencyData: new Float32Array(1024).fill(-100),
      timeDomainData: new Float32Array(1024).fill(0),
      sampleRate: 44100,
      fftSize: 2048,
    })),
  }),
}))

// ── Mock useFFTRenderer ───────────────────────────────────────────

vi.mock('../../src/composables/useFFTRenderer', () => ({
  useFFTRenderer: () => ({
    drawFFT: vi.fn(),
    startAnimation: vi.fn(),
    stopAnimation: vi.fn(),
    clear: vi.fn(),
    updateOptions: vi.fn(),
    dispose: vi.fn(),
    isAnimating: ref(false),
  }),
  frequencyToX: (freq: number, width: number) => {
    return (freq / 4000) * width
  },
}))

// ── Import components after mocks ─────────────────────────────────

import FFTPanel from '../../src/components/FFTPanel.vue'

// ── Tests ─────────────────────────────────────────────────────────

describe('FFTPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the panel title', () => {
    const wrapper = mount(FFTPanel)
    expect(wrapper.text()).toContain('Frequency Domain (FFT)')
  })

  it('has the fft-panel CSS class on root', () => {
    const wrapper = mount(FFTPanel)
    expect(wrapper.classes()).toContain('fft-panel')
  })

  it('has a dark background', () => {
    const wrapper = mount(FFTPanel)
    expect(wrapper.classes()).toContain('bg-gray-900')
  })

  it('renders three control buttons', () => {
    const wrapper = mount(FFTPanel)
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(3)
  })

  it('has a Log/Linear toggle button', () => {
    const wrapper = mount(FFTPanel)
    const buttons = wrapper.findAll('button')
    const logBtn = buttons.find((b) => b.text() === 'Log')
    expect(logBtn).toBeTruthy()
  })

  it('has a Peaks toggle button', () => {
    const wrapper = mount(FFTPanel)
    const buttons = wrapper.findAll('button')
    const peaksBtn = buttons.find((b) => b.text() === 'Peaks')
    expect(peaksBtn).toBeTruthy()
  })

  it('has a Notes toggle button', () => {
    const wrapper = mount(FFTPanel)
    const buttons = wrapper.findAll('button')
    const notesBtn = buttons.find((b) => b.text() === 'Notes')
    expect(notesBtn).toBeTruthy()
  })

  it('toggles scale button label from Log to Linear on click', async () => {
    const wrapper = mount(FFTPanel)
    const buttons = wrapper.findAll('button')
    const logBtn = buttons.find((b) => b.text() === 'Log')!

    await logBtn.trigger('click')

    const updatedButtons = wrapper.findAll('button')
    const linearBtn = updatedButtons.find((b) => b.text() === 'Linear')
    expect(linearBtn).toBeTruthy()
  })

  it('shows default hover text when no peak is hovered', () => {
    const wrapper = mount(FFTPanel)
    expect(wrapper.text()).toContain('Hover a peak for details')
  })

  it('renders an FFTChart child component', () => {
    const wrapper = mount(FFTPanel)
    // The FFTChart is rendered inside the panel
    const chart = wrapper.findComponent({ name: 'FFTChart' })
    expect(chart.exists()).toBe(true)
  })
})
