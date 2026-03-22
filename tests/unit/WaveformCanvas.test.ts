/**
 * Tests for the WaveformCanvas component.
 *
 * Verifies canvas rendering, label display, dimension handling,
 * and prop behavior.
 */

import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WaveformCanvas from '../../src/components/WaveformCanvas.vue'

describe('WaveformCanvas', () => {
  it('renders a canvas element', () => {
    const wrapper = mount(WaveformCanvas, {
      props: { data: null },
    })
    const canvas = wrapper.find('[data-testid="waveform-canvas"]')
    expect(canvas.exists()).toBe(true)
    expect(canvas.element.tagName).toBe('CANVAS')
  })

  it('applies the height prop to the wrapper', () => {
    const wrapper = mount(WaveformCanvas, {
      props: { data: null, height: 200 },
    })
    const wrapperEl = wrapper.find('[data-testid="waveform-canvas-wrapper"]')
    expect(wrapperEl.attributes('style')).toContain('height: 200px')
  })

  it('uses default height of 120px', () => {
    const wrapper = mount(WaveformCanvas, {
      props: { data: null },
    })
    const wrapperEl = wrapper.find('[data-testid="waveform-canvas-wrapper"]')
    expect(wrapperEl.attributes('style')).toContain('height: 120px')
  })

  it('renders the label when provided', () => {
    const wrapper = mount(WaveformCanvas, {
      props: { data: null, label: 'Test Label' },
    })
    const label = wrapper.find('[data-testid="waveform-label"]')
    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('Test Label')
  })

  it('does not render a label when not provided', () => {
    const wrapper = mount(WaveformCanvas, {
      props: { data: null },
    })
    const label = wrapper.find('[data-testid="waveform-label"]')
    expect(label.exists()).toBe(false)
  })

  it('applies the color prop to the label', () => {
    const wrapper = mount(WaveformCanvas, {
      props: { data: null, label: 'Colored', color: '#ef4444' },
    })
    const label = wrapper.find('[data-testid="waveform-label"]')
    expect(label.attributes('style')).toContain('color:')
    expect(label.attributes('style')).toContain('ef4444')
  })

  it('accepts Float32Array data prop without error', () => {
    const data = new Float32Array([0, 0.5, 1, 0.5, 0, -0.5, -1, -0.5])
    const wrapper = mount(WaveformCanvas, {
      props: { data },
    })
    expect(wrapper.find('[data-testid="waveform-canvas"]').exists()).toBe(true)
  })

  it('accepts null data prop without error', () => {
    const wrapper = mount(WaveformCanvas, {
      props: { data: null },
    })
    expect(wrapper.find('[data-testid="waveform-canvas"]').exists()).toBe(true)
  })
})
