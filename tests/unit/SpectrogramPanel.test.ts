/**
 * Tests for src/components/SpectrogramPanel.vue
 *
 * Verifies the panel renders the SpectrogramView, explanation text,
 * and colormap toggle buttons.
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

const mockColorMapName = ref<'viridis' | 'hot'>('viridis')

vi.mock('../../src/composables/useSpectrogram', () => ({
  useSpectrogram: () => ({
    isSpectrogramActive: ref(false),
    colorMapName: mockColorMapName,
    scrollSpeed: ref(2),
    startCapture: vi.fn(),
    stopCapture: vi.fn(),
    clearSpectrogram: vi.fn(),
  }),
}))

// ── Import component after mocks ──────────────────────────────────

import SpectrogramPanel from '../../src/components/SpectrogramPanel.vue'

// ── Tests ─────────────────────────────────────────────────────────

describe('SpectrogramPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockColorMapName.value = 'viridis'
  })

  it('renders with data-testid="spectrogram-panel"', () => {
    const wrapper = mount(SpectrogramPanel)
    expect(wrapper.find('[data-testid="spectrogram-panel"]').exists()).toBe(true)
  })

  it('renders the title "Spectrogram"', () => {
    const wrapper = mount(SpectrogramPanel)
    expect(wrapper.text()).toContain('Spectrogram')
  })

  it('renders the explanation text', () => {
    const wrapper = mount(SpectrogramPanel)
    expect(wrapper.text()).toContain('heatmap shows frequency content over time')
  })

  it('renders the SpectrogramView child component', () => {
    const wrapper = mount(SpectrogramPanel)
    const view = wrapper.findComponent({ name: 'SpectrogramView' })
    expect(view.exists()).toBe(true)
  })

  it('renders Viridis colormap button', () => {
    const wrapper = mount(SpectrogramPanel)
    const btn = wrapper.find('[data-testid="colormap-viridis"]')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('Viridis')
  })

  it('renders Hot colormap button', () => {
    const wrapper = mount(SpectrogramPanel)
    const btn = wrapper.find('[data-testid="colormap-hot"]')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('Hot')
  })

  it('sets colormap to hot when Hot button is clicked', async () => {
    const wrapper = mount(SpectrogramPanel)
    const btn = wrapper.find('[data-testid="colormap-hot"]')
    await btn.trigger('click')
    expect(mockColorMapName.value).toBe('hot')
  })

  it('sets colormap to viridis when Viridis button is clicked', async () => {
    mockColorMapName.value = 'hot'
    const wrapper = mount(SpectrogramPanel)
    const btn = wrapper.find('[data-testid="colormap-viridis"]')
    await btn.trigger('click')
    expect(mockColorMapName.value).toBe('viridis')
  })
})
