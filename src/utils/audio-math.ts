/**
 * Pure mathematical utility functions for audio processing.
 *
 * All functions in this module are pure (no side effects) and operate
 * on primitive values or typed arrays. They cover frequency conversion,
 * waveform generation, and decibel/linear scale transforms.
 */

import type { WaveformType, EnvelopeConfig } from '../types/audio'

// ── Constants ──────────────────────────────────────────────────────

/** Minimum audible frequency in Hz. */
export const MIN_FREQUENCY = 20

/** Maximum frequency in Hz for this application. */
export const MAX_FREQUENCY = 4000

/** Default oscillator frequency in Hz (concert A). */
export const DEFAULT_FREQUENCY = 440

/** Default amplitude (0–1 range). */
export const DEFAULT_AMPLITUDE = 0.5

/** Default sample rate in samples per second. */
export const DEFAULT_SAMPLE_RATE = 44100

// ── Internal lookup tables ─────────────────────────────────────────

/** Note names within a single octave. */
const NOTE_NAMES = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const

/**
 * Semitone offset from A4 for the start of each octave (C).
 * A4 = MIDI 69; C0 = MIDI 12.
 */
const A4_FREQUENCY = 440
const A4_MIDI = 69

// ── Frequency ↔ Note conversion ────────────────────────────────────

/**
 * Converts a frequency in Hz to the nearest musical note name.
 *
 * Uses the equal-temperament tuning system with A4 = 440 Hz.
 *
 * @param hz - Frequency in Hz (must be positive).
 * @returns Note name with octave, e.g. "A4", "C#3".
 * @throws {Error} If hz is not a positive finite number.
 */
export function frequencyToNoteName(hz: number): string {
  if (!isFinite(hz) || hz <= 0) {
    throw new Error(`Frequency must be a positive finite number, got ${hz}`)
  }

  const midiNote = frequencyToMidi(hz)
  const roundedMidi = Math.round(midiNote)

  const noteIndex = ((roundedMidi - 12) % 12 + 12) % 12
  const octave = Math.floor((roundedMidi - 12) / 12)

  return `${NOTE_NAMES[noteIndex]}${octave}`
}

/**
 * Converts a musical note name to its frequency in Hz.
 *
 * Supports sharps (#) and flats (b). Uses equal-temperament with A4 = 440 Hz.
 *
 * @param note - Note name with octave, e.g. "A4", "C#3", "Bb2".
 * @returns Frequency in Hz.
 * @throws {Error} If note format is invalid.
 */
export function noteNameToFrequency(note: string): number {
  const match = note.match(/^([A-Ga-g])(#|b)?(\d+)$/)
  if (!match) {
    throw new Error(`Invalid note name: "${note}"`)
  }

  const [, letter, accidental, octaveStr] = match
  const octave = parseInt(octaveStr, 10)

  const letterIndex = noteLetterToIndex(letter.toUpperCase())
  const accidentalOffset = accidental === '#' ? 1 : accidental === 'b' ? -1 : 0
  const noteIndex = ((letterIndex + accidentalOffset) % 12 + 12) % 12

  const midiNote = noteIndex + 12 + octave * 12
  return midiToFrequency(midiNote)
}

/**
 * Converts a MIDI note number to frequency in Hz.
 *
 * @param midi - MIDI note number (e.g., 69 = A4).
 * @returns Frequency in Hz.
 */
function midiToFrequency(midi: number): number {
  return A4_FREQUENCY * Math.pow(2, (midi - A4_MIDI) / 12)
}

/**
 * Converts a frequency in Hz to a (possibly fractional) MIDI note number.
 *
 * @param hz - Frequency in Hz.
 * @returns MIDI note number.
 */
function frequencyToMidi(hz: number): number {
  return A4_MIDI + 12 * Math.log2(hz / A4_FREQUENCY)
}

/**
 * Maps a note letter (C–B) to its semitone index within an octave.
 *
 * @param letter - Uppercase note letter.
 * @returns Index 0–11.
 */
function noteLetterToIndex(letter: string): number {
  const map: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  }
  const index = map[letter]
  if (index === undefined) {
    throw new Error(`Invalid note letter: "${letter}"`)
  }
  return index
}

// ── Waveform generation ────────────────────────────────────────────

/**
 * Generates waveform samples mathematically for static display.
 *
 * Produces one buffer of samples for the given waveform parameters.
 * This is a pure computation — no Web Audio API involved.
 *
 * @param type - Waveform shape.
 * @param frequency - Frequency in Hz.
 * @param amplitude - Peak amplitude (0–1).
 * @param phase - Phase offset in radians.
 * @param sampleRate - Samples per second.
 * @param numSamples - Total number of samples to generate.
 * @returns Float32Array of sample values in [-amplitude, amplitude].
 */
export function generateWaveformSamples(
  type: WaveformType,
  frequency: number,
  amplitude: number,
  phase: number,
  sampleRate: number,
  numSamples: number,
): Float32Array {
  const samples = new Float32Array(numSamples)
  const sampleFn = getWaveformFunction(type)

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate
    samples[i] = amplitude * sampleFn(frequency, t, phase)
  }

  return samples
}

/**
 * Returns the pure sample-generating function for a given waveform type.
 *
 * @param type - Waveform shape.
 * @returns A function (frequency, time, phase) => sample value in [-1, 1].
 */
function getWaveformFunction(
  type: WaveformType,
): (freq: number, t: number, phase: number) => number {
  switch (type) {
    case 'sine':
      return sineWave
    case 'square':
      return squareWave
    case 'triangle':
      return triangleWave
    case 'sawtooth':
      return sawtoothWave
  }
}

/**
 * Sine wave sample at time t.
 *
 * @param freq - Frequency in Hz.
 * @param t - Time in seconds.
 * @param phase - Phase offset in radians.
 * @returns Sample value in [-1, 1].
 */
function sineWave(freq: number, t: number, phase: number): number {
  return Math.sin(2 * Math.PI * freq * t + phase)
}

/**
 * Square wave sample at time t.
 *
 * @param freq - Frequency in Hz.
 * @param t - Time in seconds.
 * @param phase - Phase offset in radians.
 * @returns Sample value: -1 or 1.
 */
function squareWave(freq: number, t: number, phase: number): number {
  return Math.sin(2 * Math.PI * freq * t + phase) >= 0 ? 1 : -1
}

/**
 * Triangle wave sample at time t.
 *
 * @param freq - Frequency in Hz.
 * @param t - Time in seconds.
 * @param phase - Phase offset in radians.
 * @returns Sample value in [-1, 1].
 */
function triangleWave(freq: number, t: number, phase: number): number {
  const period = 1 / freq
  const shifted = ((t + phase / (2 * Math.PI * freq)) % period + period) % period
  const normalized = shifted / period
  return normalized < 0.5
    ? 4 * normalized - 1
    : 3 - 4 * normalized
}

/**
 * Sawtooth wave sample at time t.
 *
 * @param freq - Frequency in Hz.
 * @param t - Time in seconds.
 * @param phase - Phase offset in radians.
 * @returns Sample value in [-1, 1].
 */
function sawtoothWave(freq: number, t: number, phase: number): number {
  const period = 1 / freq
  const shifted = ((t + phase / (2 * Math.PI * freq)) % period + period) % period
  return 2 * (shifted / period) - 1
}

// ── Waveform superposition ─────────────────────────────────────────

/**
 * Sums multiple waveforms sample-by-sample for superposition display.
 *
 * All input arrays must have the same length. The result is the
 * element-wise sum of all waveforms.
 *
 * @param waveforms - Array of Float32Array waveform buffers.
 * @returns A new Float32Array containing the summed waveform.
 * @throws {Error} If waveforms have mismatched lengths.
 */
export function sumWaveforms(waveforms: Float32Array[]): Float32Array {
  if (waveforms.length === 0) {
    return new Float32Array(0)
  }

  const length = waveforms[0].length
  for (let i = 1; i < waveforms.length; i++) {
    if (waveforms[i].length !== length) {
      throw new Error(
        `Waveform length mismatch: expected ${length}, got ${waveforms[i].length} at index ${i}`,
      )
    }
  }

  const result = new Float32Array(length)
  for (const waveform of waveforms) {
    for (let i = 0; i < length; i++) {
      result[i] += waveform[i]
    }
  }

  return result
}

// ── Perceptual frequency scale (Mel) ───────────────────────────────

/**
 * Converts a frequency in Hz to the Mel perceptual scale.
 *
 * Uses the O'Shaughnessy (1987) formula.
 *
 * @param hz - Frequency in Hz (non-negative).
 * @returns Mel value.
 */
export function hzToMel(hz: number): number {
  return 2595 * Math.log10(1 + hz / 700)
}

/**
 * Converts a Mel-scale value back to Hz.
 *
 * Inverse of hzToMel.
 *
 * @param mel - Mel value.
 * @returns Frequency in Hz.
 */
export function melToHz(mel: number): number {
  return 700 * (Math.pow(10, mel / 2595) - 1)
}

// ── Decibel / linear conversion ────────────────────────────────────

/**
 * Converts a decibel value to a linear amplitude multiplier.
 *
 * @param db - Decibel value (can be negative).
 * @returns Linear amplitude (always non-negative).
 */
export function dbToLinear(db: number): number {
  return Math.pow(10, db / 20)
}

/**
 * Converts a linear amplitude multiplier to decibels.
 *
 * @param linear - Linear amplitude (must be positive).
 * @returns Decibel value.
 * @throws {Error} If linear is not positive.
 */
export function linearToDb(linear: number): number {
  if (linear <= 0) {
    throw new Error(`Linear amplitude must be positive, got ${linear}`)
  }
  return 20 * Math.log10(linear)
}

// ── ADSR Envelope ──────────────────────────────────────────────────

/**
 * Computes the envelope multiplier at a given time position.
 *
 * The envelope has four phases:
 *  - Attack: linear ramp from 0 to 1
 *  - Decay: linear ramp from 1 to sustain level
 *  - Sustain: constant at sustain level
 *  - Release: linear ramp from sustain to 0 (at end of total duration)
 *
 * @param time - Current time in seconds from the start.
 * @param envelope - ADSR envelope parameters.
 * @param totalDuration - Total duration of the sound in seconds.
 * @returns Envelope multiplier in [0, 1].
 */
export function computeEnvelopeValue(
  time: number,
  envelope: EnvelopeConfig,
  totalDuration: number,
): number {
  const { attack, decay, sustain, release } = envelope

  if (time < 0) return 0

  // Release begins at (totalDuration - release)
  const releaseStart = Math.max(0, totalDuration - release)

  // Attack phase
  if (time < attack) {
    return attack > 0 ? time / attack : 1
  }

  // Decay phase
  const decayStart = attack
  if (time < decayStart + decay) {
    const decayProgress = decay > 0 ? (time - decayStart) / decay : 1
    return 1 - (1 - sustain) * decayProgress
  }

  // Release phase
  if (time >= releaseStart && release > 0) {
    const releaseProgress = (time - releaseStart) / release
    const clampedProgress = Math.min(1, releaseProgress)
    return sustain * (1 - clampedProgress)
  }

  // Sustain phase
  return sustain
}

/**
 * Applies an ADSR envelope to waveform samples.
 *
 * Multiplies each sample by the envelope value at that point in time.
 * Returns a new Float32Array; the original is not modified.
 *
 * @param samples - Input waveform samples.
 * @param envelope - ADSR envelope configuration.
 * @param sampleRate - Sample rate in Hz.
 * @returns New Float32Array with envelope applied.
 */
export function applyEnvelopeToSamples(
  samples: Float32Array,
  envelope: EnvelopeConfig,
  sampleRate: number,
): Float32Array {
  const result = new Float32Array(samples.length)
  const totalDuration = samples.length / sampleRate

  for (let i = 0; i < samples.length; i++) {
    const time = i / sampleRate
    const multiplier = computeEnvelopeValue(time, envelope, totalDuration)
    result[i] = samples[i] * multiplier
  }

  return result
}

/**
 * Generates the envelope curve itself as a Float32Array for visualization.
 *
 * Each sample represents the envelope multiplier (0-1) at that time point.
 *
 * @param envelope - ADSR envelope configuration.
 * @param sampleRate - Sample rate in Hz.
 * @param numSamples - Number of samples to generate.
 * @returns Float32Array of envelope values in [0, 1].
 */
export function generateEnvelopeCurve(
  envelope: EnvelopeConfig,
  sampleRate: number,
  numSamples: number,
): Float32Array {
  const result = new Float32Array(numSamples)
  const totalDuration = numSamples / sampleRate

  for (let i = 0; i < numSamples; i++) {
    const time = i / sampleRate
    result[i] = computeEnvelopeValue(time, envelope, totalDuration)
  }

  return result
}
