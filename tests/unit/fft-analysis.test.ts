/**
 * Tests for src/utils/fft-analysis.ts
 *
 * Covers bin/frequency conversion, normalization, and peak detection.
 */

import { describe, it, expect } from 'vitest'
import {
  binToFrequency,
  frequencyToBin,
  normalizeFFTData,
  findPeaks,
} from '../../src/utils/fft-analysis'

// ── binToFrequency ────────────────────────────────────────────────

describe('binToFrequency', () => {
  const sampleRate = 44100
  const fftSize = 2048

  it('returns 0 Hz for bin 0', () => {
    expect(binToFrequency(0, sampleRate, fftSize)).toBe(0)
  })

  it('returns correct frequency for bin 1', () => {
    const expected = sampleRate / fftSize
    expect(binToFrequency(1, sampleRate, fftSize)).toBeCloseTo(expected, 2)
  })

  it('returns Nyquist frequency for the last bin', () => {
    const binCount = fftSize / 2
    const expected = (binCount * sampleRate) / fftSize
    expect(binToFrequency(binCount, sampleRate, fftSize)).toBeCloseTo(
      expected,
      2,
    )
  })

  it('handles different sample rates', () => {
    const freq = binToFrequency(10, 48000, 1024)
    const expected = (10 * 48000) / 1024
    expect(freq).toBeCloseTo(expected, 2)
  })
})

// ── frequencyToBin ────────────────────────────────────────────────

describe('frequencyToBin', () => {
  const sampleRate = 44100
  const fftSize = 2048

  it('returns 0 for 0 Hz', () => {
    expect(frequencyToBin(0, sampleRate, fftSize)).toBe(0)
  })

  it('returns the correct bin for a known frequency', () => {
    const freq = sampleRate / fftSize // bin 1 frequency
    expect(frequencyToBin(freq, sampleRate, fftSize)).toBe(1)
  })

  it('rounds to the nearest bin', () => {
    // A frequency between bin 10 and bin 11
    const bin10Freq = binToFrequency(10, sampleRate, fftSize)
    const bin11Freq = binToFrequency(11, sampleRate, fftSize)
    const midFreq = (bin10Freq + bin11Freq) / 2

    const result = frequencyToBin(midFreq, sampleRate, fftSize)
    expect(result === 10 || result === 11).toBe(true)
  })

  it('round-trips with binToFrequency', () => {
    const originalBin = 42
    const freq = binToFrequency(originalBin, sampleRate, fftSize)
    const recoveredBin = frequencyToBin(freq, sampleRate, fftSize)
    expect(recoveredBin).toBe(originalBin)
  })
})

// ── normalizeFFTData ──────────────────────────────────────────────

describe('normalizeFFTData', () => {
  it('normalizes values within the default range', () => {
    const data = new Float32Array([-100, -65, -30])
    const result = normalizeFFTData(data)

    expect(result[0]).toBeCloseTo(0, 5)
    expect(result[1]).toBeCloseTo(0.5, 5)
    expect(result[2]).toBeCloseTo(1, 5)
  })

  it('clamps values below minDb to 0', () => {
    const data = new Float32Array([-150])
    const result = normalizeFFTData(data)
    expect(result[0]).toBe(0)
  })

  it('clamps values above maxDb to 1', () => {
    const data = new Float32Array([0])
    const result = normalizeFFTData(data)
    expect(result[0]).toBe(1)
  })

  it('uses custom min/max dB values', () => {
    const data = new Float32Array([-80, -40, 0])
    const result = normalizeFFTData(data, -80, 0)

    expect(result[0]).toBeCloseTo(0, 5)
    expect(result[1]).toBeCloseTo(0.5, 5)
    expect(result[2]).toBeCloseTo(1, 5)
  })

  it('returns a new Float32Array of the same length', () => {
    const data = new Float32Array(256)
    const result = normalizeFFTData(data)

    expect(result).toBeInstanceOf(Float32Array)
    expect(result.length).toBe(256)
    expect(result).not.toBe(data) // new array, not mutated
  })

  it('handles empty input', () => {
    const data = new Float32Array(0)
    const result = normalizeFFTData(data)
    expect(result.length).toBe(0)
  })
})

// ── findPeaks ─────────────────────────────────────────────────────

describe('findPeaks', () => {
  const sampleRate = 44100
  const fftSize = 2048

  /**
   * Creates a Float32Array with a peak at the given bin index.
   */
  function createDataWithPeak(
    binIndex: number,
    peakMagnitude: number,
    length: number = 1024,
    baseMagnitude: number = -100,
  ): Float32Array {
    const data = new Float32Array(length)
    data.fill(baseMagnitude)
    data[binIndex] = peakMagnitude
    // Ensure neighbors are lower
    if (binIndex > 0) data[binIndex - 1] = baseMagnitude
    if (binIndex < length - 1) data[binIndex + 1] = baseMagnitude
    return data
  }

  it('detects a single peak above threshold', () => {
    const data = createDataWithPeak(100, -40)
    const peaks = findPeaks(data, sampleRate, fftSize, -60)

    expect(peaks.length).toBe(1)
    expect(peaks[0].binIndex).toBe(100)
    expect(peaks[0].magnitude).toBe(-40)
  })

  it('returns peaks sorted by magnitude descending', () => {
    const data = new Float32Array(1024)
    data.fill(-100)

    // Peak at bin 50 with magnitude -50
    data[50] = -50
    // Peak at bin 200 with magnitude -30 (stronger)
    data[200] = -30

    const peaks = findPeaks(data, sampleRate, fftSize, -60)

    expect(peaks.length).toBe(2)
    expect(peaks[0].magnitude).toBe(-30)
    expect(peaks[1].magnitude).toBe(-50)
  })

  it('ignores peaks below threshold', () => {
    const data = createDataWithPeak(100, -70)
    const peaks = findPeaks(data, sampleRate, fftSize, -60)
    expect(peaks.length).toBe(0)
  })

  it('includes noteName in each peak', () => {
    // Bin for ~440 Hz: 440 * 2048 / 44100 = ~20.4 -> bin 20
    const bin440 = Math.round((440 * fftSize) / sampleRate)
    const data = createDataWithPeak(bin440, -30)

    const peaks = findPeaks(data, sampleRate, fftSize, -60)
    expect(peaks.length).toBe(1)
    expect(peaks[0].noteName).toBe('A4')
  })

  it('returns empty array when no peaks exist', () => {
    const data = new Float32Array(1024)
    data.fill(-100)

    const peaks = findPeaks(data, sampleRate, fftSize, -60)
    expect(peaks.length).toBe(0)
  })

  it('includes correct frequency based on bin index', () => {
    const binIndex = 50
    const data = createDataWithPeak(binIndex, -40)
    const peaks = findPeaks(data, sampleRate, fftSize, -60)

    const expectedFreq = (binIndex * sampleRate) / fftSize
    expect(peaks[0].frequency).toBeCloseTo(expectedFreq, 2)
  })

  it('does not detect edges (bin 0 or last bin) as peaks', () => {
    const data = new Float32Array(1024)
    data.fill(-100)
    data[0] = -30 // first bin
    data[1023] = -30 // last bin

    const peaks = findPeaks(data, sampleRate, fftSize, -60)
    // Bin 0 is skipped (starts at i=1), last bin is skipped (ends at length-2)
    expect(peaks.length).toBe(0)
  })

  it('uses default threshold of -60 when not provided', () => {
    const data = createDataWithPeak(100, -55)
    const peaks = findPeaks(data, sampleRate, fftSize)

    expect(peaks.length).toBe(1)
  })
})
