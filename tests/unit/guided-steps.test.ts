/**
 * Tests for guided step definitions.
 *
 * Verifies that all 9 steps are properly defined, have valid content,
 * and that their setup functions execute without errors.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GUIDED_STEPS, TOTAL_GUIDED_STEPS, getGuidedStep } from '../../src/utils/guided-steps'
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

describe('guided-steps', () => {
  beforeEach(async () => {
    installMockAudioContext()
    const engine = useAudioEngine()
    await engine.cleanup()
  })

  describe('step definitions', () => {
    it('defines exactly 9 steps', () => {
      expect(GUIDED_STEPS.length).toBe(9)
    })

    it('TOTAL_GUIDED_STEPS equals 9', () => {
      expect(TOTAL_GUIDED_STEPS).toBe(9)
    })

    it('steps are numbered 1 through 9', () => {
      const ids = GUIDED_STEPS.map((s) => s.id)
      expect(ids).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
    })

    it('every step has a non-empty title', () => {
      for (const step of GUIDED_STEPS) {
        expect(step.title.length).toBeGreaterThan(0)
      }
    })

    it('every step has a non-empty explanation', () => {
      for (const step of GUIDED_STEPS) {
        expect(step.explanation.length).toBeGreaterThan(0)
      }
    })

    it('every step has at least one enabled control', () => {
      for (const step of GUIDED_STEPS) {
        expect(step.enabledControls.length).toBeGreaterThanOrEqual(1)
      }
    })

    it('every step has a setupFn that is a function', () => {
      for (const step of GUIDED_STEPS) {
        expect(typeof step.setupFn).toBe('function')
      }
    })

    it('all step IDs are unique', () => {
      const ids = GUIDED_STEPS.map((s) => s.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })
  })

  describe('setup functions', () => {
    it('step 1 setup creates one 440Hz sine track', () => {
      GUIDED_STEPS[0].setupFn()
      const engine = useAudioEngine()
      expect(engine.tracks.value.length).toBe(1)
      expect(engine.tracks.value[0].frequency).toBe(440)
      expect(engine.tracks.value[0].waveformType).toBe('sine')
    })

    it('step 5 setup creates two tracks at 440Hz and 330Hz', () => {
      GUIDED_STEPS[4].setupFn()
      const engine = useAudioEngine()
      expect(engine.tracks.value.length).toBe(2)
      expect(engine.tracks.value[0].frequency).toBe(440)
      expect(engine.tracks.value[1].frequency).toBe(330)
    })

    it('step 6 setup creates two tracks at same frequency (440Hz)', () => {
      GUIDED_STEPS[5].setupFn()
      const engine = useAudioEngine()
      expect(engine.tracks.value.length).toBe(2)
      expect(engine.tracks.value[0].frequency).toBe(440)
      expect(engine.tracks.value[1].frequency).toBe(440)
    })

    it('step 7 setup applies Piano A4 preset (4 tracks)', () => {
      GUIDED_STEPS[6].setupFn()
      const engine = useAudioEngine()
      expect(engine.tracks.value.length).toBe(4)
      expect(engine.tracks.value[0].frequency).toBe(440)
    })

    it('step 9 setup clears all tracks', () => {
      const engine = useAudioEngine()
      engine.createTrack({ frequency: 100 })
      expect(engine.tracks.value.length).toBe(1)
      GUIDED_STEPS[8].setupFn()
      expect(engine.tracks.value.length).toBe(0)
    })

    it('no setup function throws an error', () => {
      for (const step of GUIDED_STEPS) {
        expect(() => step.setupFn()).not.toThrow()
      }
    })
  })

  describe('getGuidedStep', () => {
    it('returns the correct step by ID', () => {
      const step = getGuidedStep(1)
      expect(step).toBeDefined()
      expect(step!.id).toBe(1)
      expect(step!.title).toBe('Single Sine Wave')
    })

    it('returns undefined for an out-of-range ID', () => {
      expect(getGuidedStep(0)).toBeUndefined()
      expect(getGuidedStep(10)).toBeUndefined()
      expect(getGuidedStep(-1)).toBeUndefined()
    })

    it('returns step 9 correctly', () => {
      const step = getGuidedStep(9)
      expect(step).toBeDefined()
      expect(step!.title).toBe('Load Real Audio')
    })
  })
})
