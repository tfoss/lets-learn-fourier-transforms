import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import AppHeader from '../../src/components/AppHeader.vue'

// Provide build-time constants
vi.stubGlobal('__APP_VERSION__', '0.1.0')
vi.stubGlobal('__GIT_HASH__', 'abc1234')

// Mock the composable used by AudioFilePanel so it doesn't need real AudioContext
vi.mock('../../src/composables/useAudioFilePlayer', () => ({
  useAudioFilePlayer: () => ({
    loadAudioFile: vi.fn(),
  }),
}))

describe('AppHeader', () => {
  it('renders the app title', () => {
    const wrapper = mount(AppHeader, {
      props: { mode: 'sandbox' },
    })
    expect(wrapper.text()).toContain('Fourier Explorer')
  })

  it('displays Sandbox Mode label when mode is sandbox', () => {
    const wrapper = mount(AppHeader, {
      props: { mode: 'sandbox' },
    })
    const label = wrapper.find('[data-testid="mode-label"]')
    expect(label.text()).toBe('Sandbox Mode')
  })

  it('displays Guided Mode label when mode is guided', () => {
    const wrapper = mount(AppHeader, {
      props: { mode: 'guided' },
    })
    const label = wrapper.find('[data-testid="mode-label"]')
    expect(label.text()).toBe('Guided Mode')
  })

  it('emits update:mode with guided when toggle is clicked in sandbox mode', async () => {
    const wrapper = mount(AppHeader, {
      props: { mode: 'sandbox' },
    })
    const toggle = wrapper.find('[data-testid="mode-toggle"]')
    await toggle.trigger('click')
    const emitted = wrapper.emitted('update:mode')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual(['guided'])
  })

  it('emits open-glossary when help button is clicked', async () => {
    const wrapper = mount(AppHeader, {
      props: { mode: 'sandbox' },
    })
    const helpButton = wrapper.find('[data-testid="help-button"]')
    await helpButton.trigger('click')
    expect(wrapper.emitted('open-glossary')).toBeTruthy()
  })

  it('shows progress indicator in guided mode with step info', () => {
    const wrapper = mount(AppHeader, {
      props: { mode: 'guided', guidedStep: 3, totalSteps: 9 },
    })
    const progress = wrapper.find('[data-testid="progress-indicator"]')
    expect(progress.exists()).toBe(true)
    expect(progress.text()).toBe('Step 3 of 9')
  })

  it('does not show progress indicator in sandbox mode', () => {
    const wrapper = mount(AppHeader, {
      props: { mode: 'sandbox' },
    })
    const progress = wrapper.find('[data-testid="progress-indicator"]')
    expect(progress.exists()).toBe(false)
  })

  it('does not show progress indicator in guided mode without step info', () => {
    const wrapper = mount(AppHeader, {
      props: { mode: 'guided' },
    })
    const progress = wrapper.find('[data-testid="progress-indicator"]')
    expect(progress.exists()).toBe(false)
  })

  it('renders the audio menu button', () => {
    const wrapper = mount(AppHeader, {
      props: { mode: 'sandbox' },
    })
    const audioBtn = wrapper.find('[data-testid="audio-menu-btn"]')
    expect(audioBtn.exists()).toBe(true)
    expect(audioBtn.text()).toBe('Load Audio')
  })

  it('audio menu button is present in guided mode too', () => {
    const wrapper = mount(AppHeader, {
      props: { mode: 'guided' },
    })
    const audioBtn = wrapper.find('[data-testid="audio-menu-btn"]')
    expect(audioBtn.exists()).toBe(true)
  })

  it('displays version and git hash', () => {
    const wrapper = mount(AppHeader, {
      props: { mode: 'sandbox' },
    })
    const versionInfo = wrapper.find('[data-testid="version-info"]')
    expect(versionInfo.exists()).toBe(true)
    expect(versionInfo.text()).toBe('v0.1.0/abc1234')
  })
})
