import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AppLayout from '../../src/components/AppLayout.vue'

describe('AppLayout', () => {
  it('renders the header with mode', () => {
    const wrapper = mount(AppLayout, {
      props: { mode: 'sandbox' },
    })
    expect(wrapper.text()).toContain('Fourier Explorer')
  })

  it('renders the tracks slot content', () => {
    const wrapper = mount(AppLayout, {
      props: { mode: 'sandbox' },
      slots: {
        tracks: '<div data-testid="test-tracks">Track content</div>',
      },
    })
    const panel = wrapper.find('[data-testid="tracks-panel"]')
    expect(panel.exists()).toBe(true)
    expect(panel.text()).toContain('Track content')
  })

  it('renders the fft slot content', () => {
    const wrapper = mount(AppLayout, {
      props: { mode: 'sandbox' },
      slots: {
        fft: '<div data-testid="test-fft">FFT content</div>',
      },
    })
    const panel = wrapper.find('[data-testid="fft-panel"]')
    expect(panel.exists()).toBe(true)
    expect(panel.text()).toContain('FFT content')
  })

  it('has a two-panel grid layout', () => {
    const wrapper = mount(AppLayout, {
      props: { mode: 'sandbox' },
    })
    const grid = wrapper.find('[data-testid="layout-grid"]')
    expect(grid.exists()).toBe(true)
  })

  it('forwards update:mode event from header', async () => {
    const wrapper = mount(AppLayout, {
      props: { mode: 'sandbox' },
    })
    const toggle = wrapper.find('[data-testid="mode-toggle"]')
    await toggle.trigger('click')
    const emitted = wrapper.emitted('update:mode')
    expect(emitted).toBeTruthy()
  })

  it('forwards open-glossary event from header', async () => {
    const wrapper = mount(AppLayout, {
      props: { mode: 'sandbox' },
    })
    const helpButton = wrapper.find('[data-testid="help-button"]')
    await helpButton.trigger('click')
    expect(wrapper.emitted('open-glossary')).toBeTruthy()
  })
})
