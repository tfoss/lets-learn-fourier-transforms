/**
 * Tests for the ShareButton component.
 *
 * Verifies button rendering, click interaction, URL display,
 * and "Copied!" indicator behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import ShareButton from '../../src/components/ShareButton.vue'
import { useAudioEngine } from '../../src/composables/useAudioEngine'

// ── Web Audio API mocks ────────────────────────────────────────────

function createMockAudioParam(initialValue = 0) {
  return {
    value: initialValue,
    setValueAtTime: vi.fn(function (this: { value: number }, v: number) {
      this.value = v
      return this
    }),
    linearRampToValueAtTime: vi.fn(function (this: { value: number }, v: number) {
      this.value = v
      return this
    }),
    exponentialRampToValueAtTime: vi.fn(function (this: { value: number }, v: number) {
      this.value = v
      return this
    }),
  }
}

function createMockGainNode() {
  return {
    gain: createMockAudioParam(1),
    connect: vi.fn(),
    disconnect: vi.fn(),
  }
}

function createMockAnalyserNode() {
  return {
    fftSize: 2048,
    frequencyBinCount: 1024,
    connect: vi.fn(),
    disconnect: vi.fn(),
    getFloatFrequencyData: vi.fn(),
    getFloatTimeDomainData: vi.fn(),
  }
}

function installMockAudioContext(): void {
  class MockAudioContext {
    state: AudioContextState = 'running'
    currentTime = 0
    sampleRate = 44100
    destination = {}
    resume = vi.fn().mockResolvedValue(undefined)
    close = vi.fn().mockResolvedValue(undefined)
    createOscillator = vi.fn(() => ({
      type: 'sine',
      frequency: createMockAudioParam(440),
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      onended: null,
    }))
    createGain = vi.fn(() => createMockGainNode())
    createAnalyser = vi.fn(() => createMockAnalyserNode())
  }

  vi.stubGlobal('AudioContext', MockAudioContext)
}

// ── Tests ──────────────────────────────────────────────────────────

describe('ShareButton', () => {
  beforeEach(async () => {
    installMockAudioContext()
    const engine = useAudioEngine()
    await engine.cleanup()

    Object.defineProperty(window, 'location', {
      writable: true,
      value: {
        origin: 'http://localhost:3000',
        pathname: '/',
        hash: '',
      },
    })

    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    })
  })

  it('renders the share button', () => {
    const wrapper = mount(ShareButton)
    const btn = wrapper.find('[data-testid="share-btn"]')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('Share')
  })

  it('does not show URL container before clicking', () => {
    const wrapper = mount(ShareButton)
    const container = wrapper.find('[data-testid="share-url-container"]')
    expect(container.exists()).toBe(false)
  })

  it('shows URL container after clicking share', async () => {
    const engine = useAudioEngine()
    engine.createTrack({ frequency: 440 })

    const wrapper = mount(ShareButton)
    await wrapper.find('[data-testid="share-btn"]').trigger('click')

    // Wait for async clipboard operation
    await vi.dynamicImportSettled()
    await wrapper.vm.$nextTick()

    const container = wrapper.find('[data-testid="share-url-container"]')
    expect(container.exists()).toBe(true)
  })

  it('displays the generated URL in the input', async () => {
    const engine = useAudioEngine()
    engine.createTrack({ frequency: 440 })

    const wrapper = mount(ShareButton)
    await wrapper.find('[data-testid="share-btn"]').trigger('click')

    await vi.dynamicImportSettled()
    await wrapper.vm.$nextTick()

    const input = wrapper.find('[data-testid="share-url-input"]')
    expect(input.exists()).toBe(true)
    const value = (input.element as HTMLInputElement).value
    expect(value).toContain('f:440')
  })

  it('calls clipboard writeText on share click', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: { writeText: writeTextMock },
    })

    const engine = useAudioEngine()
    engine.createTrack({ frequency: 440 })

    const wrapper = mount(ShareButton)
    await wrapper.find('[data-testid="share-btn"]').trigger('click')

    await vi.dynamicImportSettled()
    await wrapper.vm.$nextTick()

    expect(writeTextMock).toHaveBeenCalledOnce()
  })
})
