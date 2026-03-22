import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../../src/App.vue'

describe('App', () => {
  it('renders the app layout with header', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Fourier Explorer')
  })

  it('renders placeholder text for tracks slot', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Wave tracks will appear here...')
  })

  it('renders placeholder text for fft slot', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('FFT visualization will appear here...')
  })

  it('starts in sandbox mode', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Sandbox Mode')
  })
})
