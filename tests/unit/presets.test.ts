/**
 * Tests for the presets utility module.
 *
 * Verifies preset data validity, findPresetByName lookup,
 * and the applyPreset function.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PRESETS, findPresetByName, applyPreset } from '../../src/utils/presets'
import type { Preset } from '../../src/utils/presets'
import { WAVEFORM_TYPES } from '../../src/types/audio'
import { MIN_FREQUENCY, MAX_FREQUENCY } from '../../src/utils/audio-math'
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

describe('presets', () => {
  beforeEach(async () => {
    installMockAudioContext()
    const engine = useAudioEngine()
    await engine.cleanup()
  })

  describe('PRESETS data validity', () => {
    it('has at least 5 presets', () => {
      expect(PRESETS.length).toBeGreaterThanOrEqual(5)
    })

    it('every preset has a non-empty name', () => {
      for (const preset of PRESETS) {
        expect(preset.name.length).toBeGreaterThan(0)
      }
    })

    it('every preset has a non-empty description', () => {
      for (const preset of PRESETS) {
        expect(preset.description.length).toBeGreaterThan(0)
      }
    })

    it('every preset has at least one track', () => {
      for (const preset of PRESETS) {
        expect(preset.tracks.length).toBeGreaterThanOrEqual(1)
      }
    })

    it('all preset track frequencies are within valid range', () => {
      for (const preset of PRESETS) {
        for (const track of preset.tracks) {
          expect(track.frequency).toBeGreaterThanOrEqual(MIN_FREQUENCY)
          expect(track.frequency).toBeLessThanOrEqual(MAX_FREQUENCY)
        }
      }
    })

    it('all preset track amplitudes are between 0 and 1', () => {
      for (const preset of PRESETS) {
        for (const track of preset.tracks) {
          expect(track.amplitude).toBeGreaterThanOrEqual(0)
          expect(track.amplitude).toBeLessThanOrEqual(1)
        }
      }
    })

    it('all preset track waveform types are valid', () => {
      const validTypes: readonly string[] = WAVEFORM_TYPES
      for (const preset of PRESETS) {
        for (const track of preset.tracks) {
          expect(validTypes).toContain(track.waveformType)
        }
      }
    })

    it('no preset has more than 8 tracks', () => {
      for (const preset of PRESETS) {
        expect(preset.tracks.length).toBeLessThanOrEqual(8)
      }
    })

    it('all preset names are unique', () => {
      const names = PRESETS.map((p) => p.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })
  })

  describe('findPresetByName', () => {
    it('finds an existing preset by name', () => {
      const result = findPresetByName('Tuning Fork')
      expect(result).toBeDefined()
      expect(result!.name).toBe('Tuning Fork')
    })

    it('returns undefined for a non-existent name', () => {
      const result = findPresetByName('Nonexistent Preset')
      expect(result).toBeUndefined()
    })

    it('is case-sensitive', () => {
      const result = findPresetByName('tuning fork')
      expect(result).toBeUndefined()
    })
  })

  describe('applyPreset', () => {
    it('creates the correct number of tracks', () => {
      const preset = findPresetByName('Piano A4')!
      applyPreset(preset)

      const engine = useAudioEngine()
      expect(engine.tracks.value.length).toBe(4)
    })

    it('sets correct frequencies from the preset', () => {
      const preset = findPresetByName('Perfect Fifth')!
      applyPreset(preset)

      const engine = useAudioEngine()
      expect(engine.tracks.value[0].frequency).toBe(440)
      expect(engine.tracks.value[1].frequency).toBe(660)
    })

    it('clears existing tracks before applying', () => {
      const engine = useAudioEngine()
      engine.createTrack({ frequency: 100 })
      engine.createTrack({ frequency: 200 })
      expect(engine.tracks.value.length).toBe(2)

      const preset = findPresetByName('Tuning Fork')!
      applyPreset(preset)
      expect(engine.tracks.value.length).toBe(1)
      expect(engine.tracks.value[0].frequency).toBe(440)
    })

    it('sets correct waveform types', () => {
      const preset = findPresetByName('Tuning Fork')!
      applyPreset(preset)

      const engine = useAudioEngine()
      expect(engine.tracks.value[0].waveformType).toBe('sine')
    })

    it('sets correct amplitudes from preset', () => {
      const preset = findPresetByName('Piano A4')!
      applyPreset(preset)

      const engine = useAudioEngine()
      expect(engine.tracks.value[0].amplitude).toBe(0.5)
      expect(engine.tracks.value[1].amplitude).toBe(0.25)
      expect(engine.tracks.value[2].amplitude).toBe(0.15)
      expect(engine.tracks.value[3].amplitude).toBe(0.1)
    })
  })
})
