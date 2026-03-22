/**
 * Tests for src/components/MicrophoneButton.vue
 *
 * Mocks the useMicrophone composable to test the component's
 * rendering and interaction behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import MicrophoneButton from '../../src/components/MicrophoneButton.vue'

// ── Mock setup ────────────────────────────────────────────────────

const mockIsListening = ref(false)
const mockPermissionState = ref<string>('unknown')
const mockStartListening = vi.fn()
const mockStopListening = vi.fn()

vi.mock('../../src/composables/useMicrophone', () => ({
  useMicrophone: () => ({
    isSupported: true,
    isListening: mockIsListening,
    permissionState: mockPermissionState,
    startListening: mockStartListening,
    stopListening: mockStopListening,
    getFFTData: vi.fn(),
    cleanup: vi.fn(),
    queryPermission: vi.fn(),
  }),
}))

describe('MicrophoneButton', () => {
  beforeEach(() => {
    mockIsListening.value = false
    mockPermissionState.value = 'unknown'
    mockStartListening.mockReset()
    mockStopListening.mockReset()
    mockStartListening.mockResolvedValue(undefined)
  })

  it('renders the mic toggle button', () => {
    const wrapper = mount(MicrophoneButton)
    const btn = wrapper.find('[data-testid="mic-toggle-btn"]')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toContain('Mic')
  })

  it('shows "Start microphone" aria-label when not listening', () => {
    const wrapper = mount(MicrophoneButton)
    const btn = wrapper.find('[data-testid="mic-toggle-btn"]')
    expect(btn.attributes('aria-label')).toBe('Start microphone')
  })

  it('shows "Stop microphone" aria-label when listening', () => {
    mockIsListening.value = true
    const wrapper = mount(MicrophoneButton)
    const btn = wrapper.find('[data-testid="mic-toggle-btn"]')
    expect(btn.attributes('aria-label')).toBe('Stop microphone')
  })

  it('calls startListening on click when not listening', async () => {
    const wrapper = mount(MicrophoneButton)
    const btn = wrapper.find('[data-testid="mic-toggle-btn"]')
    await btn.trigger('click')
    expect(mockStartListening).toHaveBeenCalledOnce()
  })

  it('calls stopListening on click when listening', async () => {
    mockIsListening.value = true
    const wrapper = mount(MicrophoneButton)
    const btn = wrapper.find('[data-testid="mic-toggle-btn"]')
    await btn.trigger('click')
    expect(mockStopListening).toHaveBeenCalledOnce()
  })

  it('shows listening indicator when mic is active', () => {
    mockIsListening.value = true
    const wrapper = mount(MicrophoneButton)
    const indicator = wrapper.find('[data-testid="mic-listening-indicator"]')
    expect(indicator.exists()).toBe(true)
  })

  it('does not show listening indicator when mic is inactive', () => {
    mockIsListening.value = false
    const wrapper = mount(MicrophoneButton)
    const indicator = wrapper.find('[data-testid="mic-listening-indicator"]')
    expect(indicator.exists()).toBe(false)
  })

  it('shows denied indicator when permission is denied', () => {
    mockPermissionState.value = 'denied'
    const wrapper = mount(MicrophoneButton)
    const denied = wrapper.find('[data-testid="mic-denied-indicator"]')
    expect(denied.exists()).toBe(true)
    expect(denied.text()).toContain('denied')
  })

  it('does not show denied indicator when permission is not denied', () => {
    mockPermissionState.value = 'granted'
    const wrapper = mount(MicrophoneButton)
    const denied = wrapper.find('[data-testid="mic-denied-indicator"]')
    expect(denied.exists()).toBe(false)
  })

  it('applies red styling when listening', () => {
    mockIsListening.value = true
    const wrapper = mount(MicrophoneButton)
    const btn = wrapper.find('[data-testid="mic-toggle-btn"]')
    expect(btn.classes()).toContain('bg-red-600')
  })

  it('applies default styling when not listening', () => {
    mockIsListening.value = false
    const wrapper = mount(MicrophoneButton)
    const btn = wrapper.find('[data-testid="mic-toggle-btn"]')
    expect(btn.classes()).toContain('bg-gray-700')
  })
})

describe('MicrophoneButton — denied state styling', () => {
  beforeEach(() => {
    mockIsListening.value = false
    mockPermissionState.value = 'denied'
  })

  it('applies muted styling when permission is denied', () => {
    const wrapper = mount(MicrophoneButton)
    const btn = wrapper.find('[data-testid="mic-toggle-btn"]')
    expect(btn.classes()).toContain('cursor-not-allowed')
  })
})
