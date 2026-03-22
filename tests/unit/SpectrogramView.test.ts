/**
 * Tests for src/components/SpectrogramView.vue
 *
 * Verifies the component renders a canvas and clear button.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

// ── Mock useAudioEngine ───────────────────────────────────────────

vi.mock('../../src/composables/useAudioEngine', () => ({
  useAudioEngine: () => ({
    isPlaying: ref(false),
    tracks: ref([]),
    getFFTData: vi.fn(() => ({
      frequencyData: new Float32Array(1024).fill(-100),
      timeDomainData: new Float32Array(1024).fill(0),
      sampleRate: 44100,
      fftSize: 2048,
    })),
  }),
}))

// ── Mock useAudioFilePlayer ───────────────────────────────────────

vi.mock('../../src/composables/useAudioFilePlayer', () => ({
  useAudioFilePlayer: () => ({
    isPlaying: ref(false),
  }),
}))

// ── Mock useSpectrogram ───────────────────────────────────────────

const mockStartCapture = vi.fn()
const mockStopCapture = vi.fn()
const mockClearSpectrogram = vi.fn()

vi.mock('../../src/composables/useSpectrogram', () => ({
  useSpectrogram: () => ({
    isSpectrogramActive: ref(false),
    colorMapName: ref('viridis'),
    scrollSpeed: ref(2),
    startCapture: mockStartCapture,
    stopCapture: mockStopCapture,
    clearSpectrogram: mockClearSpectrogram,
  }),
}))

// ── Import component after mocks ──────────────────────────────────

import SpectrogramView from '../../src/components/SpectrogramView.vue'

// ── Tests ─────────────────────────────────────────────────────────

describe('SpectrogramView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders with data-testid="spectrogram-view"', () => {
    const wrapper = mount(SpectrogramView)
    expect(wrapper.find('[data-testid="spectrogram-view"]').exists()).toBe(true)
  })

  it('renders a canvas element', () => {
    const wrapper = mount(SpectrogramView)
    expect(wrapper.find('[data-testid="spectrogram-canvas"]').exists()).toBe(true)
  })

  it('renders a clear button', () => {
    const wrapper = mount(SpectrogramView)
    const btn = wrapper.find('[data-testid="spectrogram-clear"]')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('Clear')
  })

  it('calls startCapture on mount', () => {
    mount(SpectrogramView)
    expect(mockStartCapture).toHaveBeenCalledTimes(1)
  })

  it('calls stopCapture on unmount', () => {
    const wrapper = mount(SpectrogramView)
    wrapper.unmount()
    expect(mockStopCapture).toHaveBeenCalledTimes(1)
  })

  it('calls clearSpectrogram when clear button is clicked', async () => {
    const wrapper = mount(SpectrogramView)
    const btn = wrapper.find('[data-testid="spectrogram-clear"]')
    await btn.trigger('click')
    expect(mockClearSpectrogram).toHaveBeenCalledTimes(1)
  })

  it('renders frequency labels', () => {
    const wrapper = mount(SpectrogramView)
    const text = wrapper.text()
    expect(text).toContain('100')
    expect(text).toContain('500')
    expect(text).toContain('1k')
  })

  it('sets canvas height from prop', () => {
    const wrapper = mount(SpectrogramView, {
      props: { height: 300 },
    })
    const canvas = wrapper.find('[data-testid="spectrogram-canvas"]')
    expect(canvas.attributes('height')).toBe('300')
  })
})
