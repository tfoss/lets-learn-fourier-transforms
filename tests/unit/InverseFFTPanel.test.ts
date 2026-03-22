/**
 * Tests for src/components/InverseFFTPanel.vue
 *
 * Tests that the panel renders its title, explanation text,
 * and contains the InverseFFTDrawer component.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, computed } from 'vue'

// ── Mock useInverseFFT (used by child InverseFFTDrawer) ───────────

vi.mock('../../src/composables/useInverseFFT', () => ({
  useInverseFFT: () => ({
    drawnPeaks: ref([]),
    isPlaying: ref(false),
    generatedWaveform: computed(() => new Float32Array(0)),
    addPeak: vi.fn(),
    removePeak: vi.fn(),
    findClosestPeakIndex: vi.fn(() => -1),
    clearPeaks: vi.fn(),
    playDrawnSound: vi.fn(),
    stopDrawnSound: vi.fn(),
  }),
}))

// ── Import after mocks ─────────────────────────────────────────────

import InverseFFTPanel from '../../src/components/InverseFFTPanel.vue'

// ── Tests ─────────────────────────────────────────────────────────

describe('InverseFFTPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the panel title', () => {
    const wrapper = mount(InverseFFTPanel)
    expect(wrapper.text()).toContain('Draw Frequencies')
    expect(wrapper.text()).toContain('Hear Sound')
  })

  it('renders the explanation text', () => {
    const wrapper = mount(InverseFFTPanel)
    expect(wrapper.text()).toContain('Click on the chart to place frequency peaks')
    expect(wrapper.text()).toContain('press Play')
  })

  it('has the inverse-fft-panel CSS class', () => {
    const wrapper = mount(InverseFFTPanel)
    expect(wrapper.classes()).toContain('inverse-fft-panel')
  })

  it('has a dark background', () => {
    const wrapper = mount(InverseFFTPanel)
    expect(wrapper.classes()).toContain('bg-gray-900')
  })

  it('contains an InverseFFTDrawer child component', () => {
    const wrapper = mount(InverseFFTPanel)
    const drawer = wrapper.findComponent({ name: 'InverseFFTDrawer' })
    expect(drawer.exists()).toBe(true)
  })

  it('renders the title with a border', () => {
    const wrapper = mount(InverseFFTPanel)
    const titleDiv = wrapper.find('.border-b')
    expect(titleDiv.exists()).toBe(true)
  })
})
