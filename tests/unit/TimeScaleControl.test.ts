/**
 * Tests for the TimeScaleControl component.
 *
 * Verifies rendering of the slider, display value, and interaction behavior.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import TimeScaleControl from '../../src/components/TimeScaleControl.vue'
import { useTimeScale, DEFAULT_TIME_SCALE_MS } from '../../src/composables/useTimeScale'

describe('TimeScaleControl', () => {
  beforeEach(() => {
    // Reset time scale to default before each test
    const { setTimeScale } = useTimeScale()
    setTimeScale(DEFAULT_TIME_SCALE_MS)
  })

  it('renders the control wrapper', () => {
    const wrapper = mount(TimeScaleControl)
    expect(wrapper.find('[data-testid="time-scale-control"]').exists()).toBe(true)
  })

  it('renders the slider', () => {
    const wrapper = mount(TimeScaleControl)
    const slider = wrapper.find('[data-testid="time-scale-slider"]')
    expect(slider.exists()).toBe(true)
    expect(slider.attributes('type')).toBe('range')
  })

  it('renders the display value', () => {
    const wrapper = mount(TimeScaleControl)
    const display = wrapper.find('[data-testid="time-scale-display"]')
    expect(display.exists()).toBe(true)
    expect(display.text()).toContain('ms')
  })

  it('shows the default time scale value', () => {
    const wrapper = mount(TimeScaleControl)
    const display = wrapper.find('[data-testid="time-scale-display"]')
    // Default is ~23.2ms
    expect(display.text()).toContain('23.2')
  })

  it('renders the Time label', () => {
    const wrapper = mount(TimeScaleControl)
    const label = wrapper.find('label')
    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('Time')
  })

  it('slider has min 0 and max 1 for logarithmic mapping', () => {
    const wrapper = mount(TimeScaleControl)
    const slider = wrapper.find('[data-testid="time-scale-slider"]')
    expect(slider.attributes('min')).toBe('0')
    expect(slider.attributes('max')).toBe('1')
  })

  it('updates display when time scale changes externally', async () => {
    const wrapper = mount(TimeScaleControl)
    const { setTimeScale } = useTimeScale()

    setTimeScale(100)
    await wrapper.vm.$nextTick()

    const display = wrapper.find('[data-testid="time-scale-display"]')
    expect(display.text()).toContain('100.0 ms')
  })

  it('updates display to seconds for large values', async () => {
    const wrapper = mount(TimeScaleControl)
    const { setTimeScale } = useTimeScale()

    setTimeScale(2000)
    await wrapper.vm.$nextTick()

    const display = wrapper.find('[data-testid="time-scale-display"]')
    expect(display.text()).toContain('2.0 s')
  })
})
