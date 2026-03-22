/**
 * Tests for the useGuidedMode composable.
 *
 * Verifies step navigation, localStorage persistence,
 * start/skip behavior, and completion state.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGuidedMode } from '../../src/composables/useGuidedMode'
import { useAudioEngine } from '../../src/composables/useAudioEngine'
import { TOTAL_GUIDED_STEPS } from '../../src/utils/guided-steps'

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

// ── Tests ──────────────────────────────────────────────────────────

describe('useGuidedMode', () => {
  beforeEach(async () => {
    installMockAudioContext()
    installMockLocalStorage()
    clearMockStorage()
    const engine = useAudioEngine()
    await engine.cleanup()
    const guided = useGuidedMode()
    guided.resetProgress()
    guided.isGuidedMode.value = false
    guided.isComplete.value = false
  })

  describe('startGuidedMode', () => {
    it('sets isGuidedMode to true', () => {
      const guided = useGuidedMode()
      guided.startGuidedMode()
      expect(guided.isGuidedMode.value).toBe(true)
    })

    it('starts at step 1 by default', () => {
      const guided = useGuidedMode()
      guided.startGuidedMode()
      expect(guided.currentStep.value).toBe(1)
    })

    it('resumes from saved progress', () => {
      mockStorage['guided-mode-progress'] = '5'
      const guided = useGuidedMode()
      guided.startGuidedMode()
      expect(guided.currentStep.value).toBe(5)
    })

    it('runs the setup function for the starting step', () => {
      const guided = useGuidedMode()
      guided.startGuidedMode()
      const engine = useAudioEngine()
      expect(engine.tracks.value.length).toBe(1)
      expect(engine.tracks.value[0].frequency).toBe(440)
    })
  })

  describe('nextStep', () => {
    it('advances the step by 1', () => {
      const guided = useGuidedMode()
      guided.startGuidedMode()
      expect(guided.currentStep.value).toBe(1)
      guided.nextStep()
      expect(guided.currentStep.value).toBe(2)
    })

    it('saves progress to localStorage', () => {
      const guided = useGuidedMode()
      guided.startGuidedMode()
      guided.nextStep()
      expect(mockStorage['guided-mode-progress']).toBe('2')
    })

    it('marks as complete on the last step', () => {
      const guided = useGuidedMode()
      guided.startGuidedMode()
      for (let i = 1; i < TOTAL_GUIDED_STEPS; i++) {
        guided.nextStep()
      }
      expect(guided.currentStep.value).toBe(TOTAL_GUIDED_STEPS)
      guided.nextStep()
      expect(guided.isComplete.value).toBe(true)
    })

    it('does not advance past the last step', () => {
      const guided = useGuidedMode()
      guided.startGuidedMode()
      for (let i = 1; i < TOTAL_GUIDED_STEPS; i++) {
        guided.nextStep()
      }
      expect(guided.currentStep.value).toBe(TOTAL_GUIDED_STEPS)
      guided.nextStep()
      expect(guided.currentStep.value).toBe(TOTAL_GUIDED_STEPS)
    })
  })

  describe('prevStep', () => {
    it('goes back one step', () => {
      const guided = useGuidedMode()
      guided.startGuidedMode()
      guided.nextStep()
      guided.nextStep()
      expect(guided.currentStep.value).toBe(3)
      guided.prevStep()
      expect(guided.currentStep.value).toBe(2)
    })

    it('does not go below step 1', () => {
      const guided = useGuidedMode()
      guided.startGuidedMode()
      expect(guided.currentStep.value).toBe(1)
      guided.prevStep()
      expect(guided.currentStep.value).toBe(1)
    })

    it('saves progress to localStorage', () => {
      const guided = useGuidedMode()
      guided.startGuidedMode()
      guided.nextStep()
      guided.prevStep()
      expect(mockStorage['guided-mode-progress']).toBe('1')
    })
  })

  describe('skipToSandbox', () => {
    it('sets isGuidedMode to false', () => {
      const guided = useGuidedMode()
      guided.startGuidedMode()
      guided.skipToSandbox()
      expect(guided.isGuidedMode.value).toBe(false)
    })

    it('clears persisted progress', () => {
      const guided = useGuidedMode()
      guided.startGuidedMode()
      guided.nextStep()
      guided.skipToSandbox()
      expect(mockStorage['guided-mode-progress']).toBeUndefined()
    })

    it('resets isComplete', () => {
      const guided = useGuidedMode()
      guided.startGuidedMode()
      guided.isComplete.value = true
      guided.skipToSandbox()
      expect(guided.isComplete.value).toBe(false)
    })
  })

  describe('currentStepConfig', () => {
    it('returns the config for the current step', () => {
      const guided = useGuidedMode()
      guided.startGuidedMode()
      expect(guided.currentStepConfig.value.id).toBe(1)
      expect(guided.currentStepConfig.value.title).toBe('Single Sine Wave')
    })

    it('updates when step changes', () => {
      const guided = useGuidedMode()
      guided.startGuidedMode()
      guided.nextStep()
      expect(guided.currentStepConfig.value.id).toBe(2)
      expect(guided.currentStepConfig.value.title).toBe('Change Frequency')
    })
  })

  describe('totalSteps', () => {
    it('equals 10', () => {
      const guided = useGuidedMode()
      expect(guided.totalSteps).toBe(10)
    })
  })

  describe('resetProgress', () => {
    it('resets to step 1', () => {
      const guided = useGuidedMode()
      guided.startGuidedMode()
      guided.nextStep()
      guided.nextStep()
      guided.resetProgress()
      expect(guided.currentStep.value).toBe(1)
    })

    it('clears localStorage', () => {
      const guided = useGuidedMode()
      guided.startGuidedMode()
      guided.nextStep()
      guided.resetProgress()
      expect(mockStorage['guided-mode-progress']).toBeUndefined()
    })
  })
})
