import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import App from '../../src/App.vue'

describe('App', () => {
  it('renders the heading', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain("Let's Learn Fourier Transforms")
  })
})
