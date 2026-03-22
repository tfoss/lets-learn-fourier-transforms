/**
 * Pure FFT analysis utility functions.
 *
 * Provides bin-to-frequency conversion, peak detection, and data
 * normalization for FFT visualization. All functions are pure with
 * no side effects.
 */

import type { Peak } from '../types/fft'
import { frequencyToNoteName } from './audio-math'

// ── Bin / frequency conversion ────────────────────────────────────

/**
 * Converts an FFT bin index to its corresponding frequency in Hz.
 *
 * @param binIndex - The zero-based bin index.
 * @param sampleRate - The audio sample rate in Hz.
 * @param fftSize - The FFT size used for analysis.
 * @returns The frequency in Hz that the bin represents.
 */
export function binToFrequency(
  binIndex: number,
  sampleRate: number,
  fftSize: number,
): number {
  return (binIndex * sampleRate) / fftSize
}

/**
 * Converts a frequency in Hz to the nearest FFT bin index.
 *
 * @param frequency - The frequency in Hz.
 * @param sampleRate - The audio sample rate in Hz.
 * @param fftSize - The FFT size used for analysis.
 * @returns The nearest integer bin index.
 */
export function frequencyToBin(
  frequency: number,
  sampleRate: number,
  fftSize: number,
): number {
  return Math.round((frequency * fftSize) / sampleRate)
}

// ── Normalization ─────────────────────────────────────────────────

/**
 * Normalizes FFT dB magnitude data to a 0-1 range for display.
 *
 * Values at or below minDb map to 0, values at or above maxDb map to 1.
 * Values in between are linearly interpolated.
 *
 * @param data - Raw FFT magnitude data in dB (Float32Array).
 * @param minDb - The dB value that maps to 0. Defaults to -100.
 * @param maxDb - The dB value that maps to 1. Defaults to -30.
 * @returns A new Float32Array with values clamped to [0, 1].
 */
export function normalizeFFTData(
  data: Float32Array,
  minDb: number = -100,
  maxDb: number = -30,
): Float32Array {
  const range = maxDb - minDb
  const normalized = new Float32Array(data.length)

  for (let i = 0; i < data.length; i++) {
    const clamped = Math.max(minDb, Math.min(maxDb, data[i]))
    normalized[i] = (clamped - minDb) / range
  }

  return normalized
}

// ── Peak detection ────────────────────────────────────────────────

/**
 * Detects dominant frequency peaks in FFT magnitude data.
 *
 * A peak is a bin whose magnitude is greater than both its neighbors
 * and above the given dB threshold. Peaks are returned sorted by
 * magnitude (highest first).
 *
 * @param frequencyData - Raw FFT magnitude data in dB (Float32Array).
 * @param sampleRate - The audio sample rate in Hz.
 * @param fftSize - The FFT size used for analysis.
 * @param threshold - Minimum dB level to consider a peak. Defaults to -60.
 * @returns Array of Peak objects sorted by magnitude descending.
 */
export function findPeaks(
  frequencyData: Float32Array,
  sampleRate: number,
  fftSize: number,
  threshold: number = -60,
): Peak[] {
  const peaks: Peak[] = []

  for (let i = 1; i < frequencyData.length - 1; i++) {
    const magnitude = frequencyData[i]

    if (magnitude < threshold) continue

    const isLocalMax =
      magnitude > frequencyData[i - 1] && magnitude > frequencyData[i + 1]

    if (!isLocalMax) continue

    const frequency = binToFrequency(i, sampleRate, fftSize)

    if (frequency <= 0) continue

    peaks.push({
      frequency,
      magnitude,
      binIndex: i,
      noteName: frequencyToNoteName(frequency),
    })
  }

  return sortPeaksByMagnitude(peaks)
}

/**
 * Sorts peaks by magnitude in descending order.
 *
 * @param peaks - Array of Peak objects.
 * @returns A new array sorted by magnitude descending.
 */
function sortPeaksByMagnitude(peaks: Peak[]): Peak[] {
  return [...peaks].sort((a, b) => b.magnitude - a.magnitude)
}
