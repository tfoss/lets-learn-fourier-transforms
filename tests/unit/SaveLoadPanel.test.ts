/**
 * Tests for the SaveLoadPanel component.
 *
 * Verifies that the panel renders the title, save button, and config list.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import SaveLoadPanel from '../../src/components/SaveLoadPanel.vue'

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
    cancelScheduledValues: vi.fn(),
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

// ── Mock localStorage ──────────────────────────────────────────────

const mockStorage: Record<string, string> = {}

function installMockLocalStorage(): void {
  const mockLocalStorage = {
    getItem: vi.fn((key: string) => mockStorage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { mockStorage[key] = value }),
    removeItem: vi.fn((key: string) => { delete mockStorage[key] }),
  }
  vi.stubGlobal('localStorage', mockLocalStorage)
}

function clearMockStorage(): void {
  for (const key of Object.keys(mockStorage)) {
    delete mockStorage[key]
  }
}

// ── Tests ───────────────────────────────────────────────────────────

describe('SaveLoadPanel', () => {
  beforeEach(async () => {
    installMockLocalStorage()
    clearMockStorage()
    installMockAudioContext()
    const { useAudioEngine } = await import('../../src/composables/useAudioEngine')
    const engine = useAudioEngine()
    await engine.cleanup()
  })

  it('renders the panel container', () => {
    const wrapper = mount(SaveLoadPanel)
    expect(wrapper.find('[data-testid="save-load-panel"]').exists()).toBe(true)
  })

  it('displays the "Saved Configurations" title', () => {
    const wrapper = mount(SaveLoadPanel)
    expect(wrapper.text()).toContain('Saved Configurations')
  })

  it('renders the "Save Current" button', () => {
    const wrapper = mount(SaveLoadPanel)
    const btn = wrapper.find('[data-testid="save-current-btn"]')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('Save Current')
  })

  it('renders the config list component', () => {
    const wrapper = mount(SaveLoadPanel)
    expect(wrapper.find('[data-testid="config-list"]').exists()).toBe(true)
  })

  it('shows the empty state when no configs are saved', () => {
    const wrapper = mount(SaveLoadPanel)
    expect(wrapper.find('[data-testid="config-list-empty"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('No saved configurations yet')
  })
})
