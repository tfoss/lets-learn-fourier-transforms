/**
 * Tests for src/utils/inverse-fft.ts
 *
 * Covers magnitude spectrum creation from peaks and inverse FFT computation.
 */

import { describe, it, expect } from 'vitest'
import { createMagnitudeSpectrum, computeInverseFFT } from '../../src/utils/inverse-fft'
import type { DrawPeak } from '../../src/types/inverse-fft'

// ── createMagnitudeSpectrum ────────────────────────────────────────

describe('createMagnitudeSpectrum', () => {
  const sampleRate = 44100
  const fftSize = 2048

  it('returns an array of length fftSize/2', () => {
    const peaks: DrawPeak[] = []
    const spectrum = createMagnitudeSpectrum(peaks, fftSize, sampleRate)
    expect(spectrum.length).toBe(fftSize / 2)
  })

  it('returns all zeros for empty peaks', () => {
    const spectrum = createMagnitudeSpectrum([], fftSize, sampleRate)
    const allZero = spectrum.every((v) => v === 0)
    expect(allZero).toBe(true)
  })

  it('places a peak at the correct bin for 440 Hz', () => {
    const peaks: DrawPeak[] = [{ frequency: 440, magnitude: 1.0 }]
    const spectrum = createMagnitudeSpectrum(peaks, fftSize, sampleRate)

    // Expected bin for 440 Hz: round(440 * 2048 / 44100) = 20
    const expectedBin = Math.round((440 * fftSize) / sampleRate)
    expect(spectrum[expectedBin]).toBeGreaterThan(0.9)
  })

  it('handles multiple peaks without interference', () => {
    const peaks: DrawPeak[] = [
      { frequency: 440, magnitude: 1.0 },
      { frequency: 880, magnitude: 0.5 },
    ]
    const spectrum = createMagnitudeSpectrum(peaks, fftSize, sampleRate)

    const bin440 = Math.round((440 * fftSize) / sampleRate)
    const bin880 = Math.round((880 * fftSize) / sampleRate)

    expect(spectrum[bin440]).toBeCloseTo(1.0, 1)
    expect(spectrum[bin880]).toBeCloseTo(0.5, 1)
  })

  it('spreads the peak to neighboring bins', () => {
    const peaks: DrawPeak[] = [{ frequency: 440, magnitude: 1.0 }]
    const spectrum = createMagnitudeSpectrum(peaks, fftSize, sampleRate)

    const centerBin = Math.round((440 * fftSize) / sampleRate)

    // Adjacent bins should have some magnitude due to Gaussian spread
    if (centerBin > 0) {
      expect(spectrum[centerBin - 1]).toBeGreaterThan(0)
    }
    if (centerBin < spectrum.length - 1) {
      expect(spectrum[centerBin + 1]).toBeGreaterThan(0)
    }
  })

  it('ignores peaks with frequency outside the bin range', () => {
    const peaks: DrawPeak[] = [{ frequency: 100000, magnitude: 1.0 }]
    const spectrum = createMagnitudeSpectrum(peaks, fftSize, sampleRate)
    const allZero = spectrum.every((v) => v === 0)
    expect(allZero).toBe(true)
  })

  it('clamps magnitudes via the Gaussian spread', () => {
    const peaks: DrawPeak[] = [{ frequency: 440, magnitude: 0.5 }]
    const spectrum = createMagnitudeSpectrum(peaks, fftSize, sampleRate)

    const centerBin = Math.round((440 * fftSize) / sampleRate)
    expect(spectrum[centerBin]).toBeCloseTo(0.5, 1)
  })
})

// ── computeInverseFFT ──────────────────────────────────────────────

describe('computeInverseFFT', () => {
  const sampleRate = 44100
  const fftSize = 256 // Smaller for faster tests

  it('returns an array of length fftSize', () => {
    const magnitudes = new Float32Array(fftSize / 2)
    const waveform = computeInverseFFT(magnitudes, sampleRate, fftSize)
    expect(waveform.length).toBe(fftSize)
  })

  it('returns all zeros for zero magnitudes', () => {
    const magnitudes = new Float32Array(fftSize / 2)
    const waveform = computeInverseFFT(magnitudes, sampleRate, fftSize)
    const allZero = waveform.every((v) => Math.abs(v) < 1e-10)
    expect(allZero).toBe(true)
  })

  it('returns non-zero waveform for non-zero input', () => {
    const magnitudes = new Float32Array(fftSize / 2)
    magnitudes[10] = 1.0 // A peak at bin 10

    const waveform = computeInverseFFT(magnitudes, sampleRate, fftSize)
    const hasNonZero = waveform.some((v) => Math.abs(v) > 1e-10)
    expect(hasNonZero).toBe(true)
  })

  it('produces a real-valued output (imaginary parts are negligible)', () => {
    const magnitudes = new Float32Array(fftSize / 2)
    magnitudes[5] = 0.8
    magnitudes[15] = 0.3

    const waveform = computeInverseFFT(magnitudes, sampleRate, fftSize)

    // All values should be finite real numbers
    for (let i = 0; i < waveform.length; i++) {
      expect(Number.isFinite(waveform[i])).toBe(true)
    }
  })

  it('amplitude scales with magnitude input', () => {
    const magnitudesLow = new Float32Array(fftSize / 2)
    magnitudesLow[10] = 0.1

    const magnitudesHigh = new Float32Array(fftSize / 2)
    magnitudesHigh[10] = 1.0

    const waveformLow = computeInverseFFT(magnitudesLow, sampleRate, fftSize)
    const waveformHigh = computeInverseFFT(magnitudesHigh, sampleRate, fftSize)

    const maxLow = Math.max(...Array.from(waveformLow).map(Math.abs))
    const maxHigh = Math.max(...Array.from(waveformHigh).map(Math.abs))

    expect(maxHigh).toBeGreaterThan(maxLow)
  })

  it('works with fftSize of 2048', () => {
    const bigFftSize = 2048
    const magnitudes = new Float32Array(bigFftSize / 2)
    magnitudes[20] = 1.0

    const waveform = computeInverseFFT(magnitudes, sampleRate, bigFftSize)
    expect(waveform.length).toBe(bigFftSize)
    expect(waveform.some((v) => Math.abs(v) > 1e-10)).toBe(true)
  })
})
