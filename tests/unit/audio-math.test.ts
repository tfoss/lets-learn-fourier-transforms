/**
 * Tests for src/utils/audio-math.ts
 *
 * Covers frequency/note conversion, waveform generation, superposition,
 * Mel scale, and dB/linear conversions.
 */

import { describe, it, expect } from 'vitest'
import {
  frequencyToNoteName,
  noteNameToFrequency,
  generateWaveformSamples,
  sumWaveforms,
  hzToMel,
  melToHz,
  dbToLinear,
  linearToDb,
  applyEnvelopeToSamples,
  generateEnvelopeCurve,
  computeEnvelopeValue,
  MIN_FREQUENCY,
  MAX_FREQUENCY,
  DEFAULT_FREQUENCY,
  DEFAULT_AMPLITUDE,
  DEFAULT_SAMPLE_RATE,
} from '../../src/utils/audio-math'
import type { EnvelopeConfig } from '../../src/types/audio'
import { DEFAULT_ENVELOPE } from '../../src/types/audio'

// ── Constants ──────────────────────────────────────────────────────

describe('audio-math constants', () => {
  it('has expected default values', () => {
    expect(MIN_FREQUENCY).toBe(20)
    expect(MAX_FREQUENCY).toBe(4000)
    expect(DEFAULT_FREQUENCY).toBe(440)
    expect(DEFAULT_AMPLITUDE).toBe(0.5)
    expect(DEFAULT_SAMPLE_RATE).toBe(44100)
  })
})

// ── frequencyToNoteName ────────────────────────────────────────────

describe('frequencyToNoteName', () => {
  it('converts 440 Hz to A4', () => {
    expect(frequencyToNoteName(440)).toBe('A4')
  })

  it('converts 261.63 Hz to C4 (middle C)', () => {
    expect(frequencyToNoteName(261.63)).toBe('C4')
  })

  it('converts 880 Hz to A5', () => {
    expect(frequencyToNoteName(880)).toBe('A5')
  })

  it('converts 220 Hz to A3', () => {
    expect(frequencyToNoteName(220)).toBe('A3')
  })

  it('converts 329.63 Hz to E4', () => {
    expect(frequencyToNoteName(329.63)).toBe('E4')
  })

  it('converts very low frequency (27.5 Hz = A0)', () => {
    expect(frequencyToNoteName(27.5)).toBe('A0')
  })

  it('throws for zero frequency', () => {
    expect(() => frequencyToNoteName(0)).toThrow()
  })

  it('throws for negative frequency', () => {
    expect(() => frequencyToNoteName(-100)).toThrow()
  })

  it('throws for NaN', () => {
    expect(() => frequencyToNoteName(NaN)).toThrow()
  })

  it('throws for Infinity', () => {
    expect(() => frequencyToNoteName(Infinity)).toThrow()
  })
})

// ── noteNameToFrequency ────────────────────────────────────────────

describe('noteNameToFrequency', () => {
  it('converts A4 to 440 Hz', () => {
    expect(noteNameToFrequency('A4')).toBeCloseTo(440, 1)
  })

  it('converts C4 to ~261.63 Hz', () => {
    expect(noteNameToFrequency('C4')).toBeCloseTo(261.63, 0)
  })

  it('converts A5 to 880 Hz', () => {
    expect(noteNameToFrequency('A5')).toBeCloseTo(880, 1)
  })

  it('handles sharps (C#4)', () => {
    expect(noteNameToFrequency('C#4')).toBeCloseTo(277.18, 0)
  })

  it('handles flats (Bb3)', () => {
    expect(noteNameToFrequency('Bb3')).toBeCloseTo(233.08, 0)
  })

  it('handles lowercase note letters', () => {
    expect(noteNameToFrequency('a4')).toBeCloseTo(440, 1)
  })

  it('round-trips: note -> freq -> note preserves the name', () => {
    const notes = ['A4', 'C4', 'G3', 'E5', 'B2']
    for (const note of notes) {
      const freq = noteNameToFrequency(note)
      const result = frequencyToNoteName(freq)
      expect(result).toBe(note)
    }
  })

  it('throws for invalid note format', () => {
    expect(() => noteNameToFrequency('X4')).toThrow()
    expect(() => noteNameToFrequency('')).toThrow()
    expect(() => noteNameToFrequency('A')).toThrow()
    expect(() => noteNameToFrequency('4A')).toThrow()
  })
})

// ── generateWaveformSamples ────────────────────────────────────────

describe('generateWaveformSamples', () => {
  const sampleRate = 44100
  const numSamples = 1000

  it('generates the correct number of samples', () => {
    const samples = generateWaveformSamples(
      'sine', 440, 1, 0, sampleRate, numSamples,
    )
    expect(samples).toBeInstanceOf(Float32Array)
    expect(samples.length).toBe(numSamples)
  })

  it('sine wave starts at 0 with zero phase', () => {
    const samples = generateWaveformSamples(
      'sine', 440, 1, 0, sampleRate, numSamples,
    )
    expect(samples[0]).toBeCloseTo(0, 5)
  })

  it('amplitude scales the output', () => {
    const full = generateWaveformSamples(
      'sine', 440, 1, 0, sampleRate, numSamples,
    )
    const half = generateWaveformSamples(
      'sine', 440, 0.5, 0, sampleRate, numSamples,
    )
    // Each sample in half should be ~0.5 * corresponding full sample
    for (let i = 0; i < 100; i++) {
      expect(half[i]).toBeCloseTo(full[i] * 0.5, 5)
    }
  })

  it('zero amplitude produces silence', () => {
    const samples = generateWaveformSamples(
      'sine', 440, 0, 0, sampleRate, numSamples,
    )
    for (let i = 0; i < samples.length; i++) {
      expect(Math.abs(samples[i])).toBe(0)
    }
  })

  it('square wave produces values of +1 or -1 at full amplitude', () => {
    const samples = generateWaveformSamples(
      'square', 440, 1, 0, sampleRate, numSamples,
    )
    for (let i = 0; i < samples.length; i++) {
      expect(Math.abs(samples[i])).toBeCloseTo(1, 5)
    }
  })

  it('triangle wave stays within [-amplitude, amplitude]', () => {
    const amplitude = 0.7
    const samples = generateWaveformSamples(
      'triangle', 440, amplitude, 0, sampleRate, numSamples,
    )
    for (let i = 0; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(-amplitude - 0.001)
      expect(samples[i]).toBeLessThanOrEqual(amplitude + 0.001)
    }
  })

  it('sawtooth wave stays within [-amplitude, amplitude]', () => {
    const amplitude = 0.8
    const samples = generateWaveformSamples(
      'sawtooth', 440, amplitude, 0, sampleRate, numSamples,
    )
    for (let i = 0; i < samples.length; i++) {
      expect(samples[i]).toBeGreaterThanOrEqual(-amplitude - 0.001)
      expect(samples[i]).toBeLessThanOrEqual(amplitude + 0.001)
    }
  })

  it('returns empty array for numSamples = 0', () => {
    const samples = generateWaveformSamples(
      'sine', 440, 1, 0, sampleRate, 0,
    )
    expect(samples.length).toBe(0)
  })
})

// ── sumWaveforms ───────────────────────────────────────────────────

describe('sumWaveforms', () => {
  it('sums two waveforms element-wise', () => {
    const a = new Float32Array([1, 2, 3])
    const b = new Float32Array([4, 5, 6])
    const result = sumWaveforms([a, b])
    expect(Array.from(result)).toEqual([5, 7, 9])
  })

  it('returns a copy when given a single waveform', () => {
    const a = new Float32Array([1, 2, 3])
    const result = sumWaveforms([a])
    expect(Array.from(result)).toEqual([1, 2, 3])
    // Should be a new array, not the same reference
    a[0] = 99
    expect(result[0]).toBe(1)
  })

  it('returns empty array for empty input', () => {
    const result = sumWaveforms([])
    expect(result.length).toBe(0)
  })

  it('throws for mismatched lengths', () => {
    const a = new Float32Array([1, 2, 3])
    const b = new Float32Array([4, 5])
    expect(() => sumWaveforms([a, b])).toThrow('length mismatch')
  })

  it('handles three or more waveforms', () => {
    const a = new Float32Array([1, 0])
    const b = new Float32Array([2, 0])
    const c = new Float32Array([3, 0])
    const result = sumWaveforms([a, b, c])
    expect(Array.from(result)).toEqual([6, 0])
  })
})

// ── Mel scale ──────────────────────────────────────────────────────

describe('hzToMel / melToHz', () => {
  it('0 Hz -> 0 Mel', () => {
    expect(hzToMel(0)).toBeCloseTo(0, 5)
  })

  it('round-trips Hz -> Mel -> Hz', () => {
    const frequencies = [100, 440, 1000, 4000]
    for (const hz of frequencies) {
      const mel = hzToMel(hz)
      const roundTrip = melToHz(mel)
      expect(roundTrip).toBeCloseTo(hz, 1)
    }
  })

  it('higher Hz produces higher Mel', () => {
    expect(hzToMel(1000)).toBeGreaterThan(hzToMel(500))
  })

  it('1000 Hz is approximately 1000 Mel (by design of the scale)', () => {
    // The standard Mel formula gives ~1000 Mel ≈ 999.9 for 1000 Hz
    expect(hzToMel(1000)).toBeCloseTo(1000, -1)
  })
})

// ── dB / linear ────────────────────────────────────────────────────

describe('dbToLinear / linearToDb', () => {
  it('0 dB = 1.0 linear', () => {
    expect(dbToLinear(0)).toBeCloseTo(1, 5)
  })

  it('-20 dB = 0.1 linear', () => {
    expect(dbToLinear(-20)).toBeCloseTo(0.1, 5)
  })

  it('+20 dB = 10 linear', () => {
    expect(dbToLinear(20)).toBeCloseTo(10, 5)
  })

  it('linearToDb(1) = 0 dB', () => {
    expect(linearToDb(1)).toBeCloseTo(0, 5)
  })

  it('round-trips dB -> linear -> dB', () => {
    const values = [-40, -20, -6, 0, 6, 20]
    for (const db of values) {
      const linear = dbToLinear(db)
      const roundTrip = linearToDb(linear)
      expect(roundTrip).toBeCloseTo(db, 3)
    }
  })

  it('linearToDb throws for zero', () => {
    expect(() => linearToDb(0)).toThrow()
  })

  it('linearToDb throws for negative', () => {
    expect(() => linearToDb(-1)).toThrow()
  })
})

// ── ADSR Envelope ──────────────────────────────────────────────────

describe('computeEnvelopeValue', () => {
  const env: EnvelopeConfig = {
    enabled: true,
    attack: 0.1,
    decay: 0.2,
    sustain: 0.5,
    release: 0.1,
  }
  const totalDuration = 1.0

  it('starts at 0 at time 0', () => {
    expect(computeEnvelopeValue(0, env, totalDuration)).toBeCloseTo(0, 5)
  })

  it('reaches 1 at end of attack', () => {
    expect(computeEnvelopeValue(0.1, env, totalDuration)).toBeCloseTo(1, 5)
  })

  it('ramps linearly during attack', () => {
    expect(computeEnvelopeValue(0.05, env, totalDuration)).toBeCloseTo(0.5, 5)
  })

  it('reaches sustain level at end of decay', () => {
    expect(computeEnvelopeValue(0.3, env, totalDuration)).toBeCloseTo(0.5, 5)
  })

  it('holds at sustain level during sustain phase', () => {
    expect(computeEnvelopeValue(0.5, env, totalDuration)).toBeCloseTo(0.5, 5)
    expect(computeEnvelopeValue(0.7, env, totalDuration)).toBeCloseTo(0.5, 5)
  })

  it('reaches 0 at end of release (end of duration)', () => {
    expect(computeEnvelopeValue(1.0, env, totalDuration)).toBeCloseTo(0, 5)
  })

  it('returns 0 for negative time', () => {
    expect(computeEnvelopeValue(-0.1, env, totalDuration)).toBe(0)
  })
})

describe('applyEnvelopeToSamples', () => {
  const sampleRate = 1000 // 1000 samples/sec for easy math
  const numSamples = 1000 // 1 second of audio

  it('returns a new array of same length', () => {
    const samples = new Float32Array(numSamples).fill(1)
    const result = applyEnvelopeToSamples(samples, DEFAULT_ENVELOPE, sampleRate)
    expect(result.length).toBe(numSamples)
    expect(result).not.toBe(samples)
  })

  it('disabled envelope still applies when called directly', () => {
    // applyEnvelopeToSamples does not check enabled flag — that is the caller's job
    const env: EnvelopeConfig = { ...DEFAULT_ENVELOPE, enabled: false }
    const samples = new Float32Array(numSamples).fill(1)
    const result = applyEnvelopeToSamples(samples, env, sampleRate)
    // Should still apply ADSR shape (function is pure, doesn't check enabled)
    expect(result[0]).toBeCloseTo(0, 1)
  })

  it('attack ramps from 0 to peak', () => {
    const env: EnvelopeConfig = {
      enabled: true,
      attack: 0.1,
      decay: 0,
      sustain: 1,
      release: 0,
    }
    const samples = new Float32Array(numSamples).fill(1)
    const result = applyEnvelopeToSamples(samples, env, sampleRate)
    // At sample 0, should be 0
    expect(result[0]).toBeCloseTo(0, 3)
    // At sample 50 (0.05s), should be ~0.5
    expect(result[50]).toBeCloseTo(0.5, 1)
    // At sample 100 (0.1s), should be ~1.0
    expect(result[100]).toBeCloseTo(1, 1)
    // After attack, sustain at 1 so should stay at 1
    expect(result[500]).toBeCloseTo(1, 1)
  })

  it('sustain holds at the sustain level', () => {
    const env: EnvelopeConfig = {
      enabled: true,
      attack: 0.05,
      decay: 0.05,
      sustain: 0.6,
      release: 0.05,
    }
    const samples = new Float32Array(numSamples).fill(1)
    const result = applyEnvelopeToSamples(samples, env, sampleRate)
    // After attack+decay (0.1s = sample 100), should be at sustain level
    expect(result[200]).toBeCloseTo(0.6, 1)
    expect(result[500]).toBeCloseTo(0.6, 1)
  })

  it('scales samples by envelope multiplier', () => {
    const env: EnvelopeConfig = {
      enabled: true,
      attack: 0,
      decay: 0,
      sustain: 0.5,
      release: 0,
    }
    const samples = new Float32Array(numSamples).fill(2)
    const result = applyEnvelopeToSamples(samples, env, sampleRate)
    // All samples should be 2 * 0.5 = 1 (except possibly first sample)
    expect(result[500]).toBeCloseTo(1, 1)
  })
})

describe('generateEnvelopeCurve', () => {
  const sampleRate = 1000
  const numSamples = 1000

  it('returns correct number of samples', () => {
    const result = generateEnvelopeCurve(DEFAULT_ENVELOPE, sampleRate, numSamples)
    expect(result.length).toBe(numSamples)
  })

  it('values stay within [0, 1]', () => {
    const env: EnvelopeConfig = {
      enabled: true,
      attack: 0.1,
      decay: 0.2,
      sustain: 0.5,
      release: 0.3,
    }
    const result = generateEnvelopeCurve(env, sampleRate, numSamples)
    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toBeGreaterThanOrEqual(0)
      expect(result[i]).toBeLessThanOrEqual(1)
    }
  })

  it('starts at 0 and peaks at 1 during attack', () => {
    const env: EnvelopeConfig = {
      enabled: true,
      attack: 0.1,
      decay: 0.2,
      sustain: 0.5,
      release: 0.1,
    }
    const result = generateEnvelopeCurve(env, sampleRate, numSamples)
    expect(result[0]).toBeCloseTo(0, 3)
    expect(result[100]).toBeCloseTo(1, 1)
  })
})
