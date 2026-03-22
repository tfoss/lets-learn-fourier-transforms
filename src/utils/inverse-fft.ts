/**
 * Pure inverse FFT computation utilities.
 *
 * Converts user-drawn frequency peaks into a magnitude spectrum,
 * then computes the inverse FFT to produce a playable time-domain
 * waveform. Uses a radix-2 FFT algorithm with the conjugate trick:
 * IFFT(X) = conj(FFT(conj(X))) / N.
 */

import type { DrawPeak } from '../types/inverse-fft'
import { frequencyToBin } from './fft-analysis'

// ── Constants ──────────────────────────────────────────────────────

/** Number of bins to spread each peak across (Gaussian width). */
const PEAK_SPREAD_BINS = 3

// ── Magnitude spectrum creation ────────────────────────────────────

/**
 * Converts an array of user-drawn peaks into a full magnitude spectrum.
 *
 * Each peak is placed at the corresponding FFT bin with a small Gaussian
 * spread to neighboring bins for a more natural sound.
 *
 * @param peaks - Array of DrawPeak objects with frequency and magnitude.
 * @param fftSize - The FFT size (determines spectrum length).
 * @param sampleRate - Audio sample rate in Hz.
 * @returns Float32Array of length fftSize/2 containing magnitude values.
 */
export function createMagnitudeSpectrum(
  peaks: DrawPeak[],
  fftSize: number,
  sampleRate: number,
): Float32Array {
  const binCount = fftSize / 2
  const spectrum = new Float32Array(binCount)

  for (const peak of peaks) {
    const centerBin = frequencyToBin(peak.frequency, sampleRate, fftSize)

    if (centerBin < 0 || centerBin >= binCount) continue

    applyGaussianPeak(spectrum, centerBin, peak.magnitude, PEAK_SPREAD_BINS)
  }

  return spectrum
}

/**
 * Applies a Gaussian-shaped peak to a spectrum at the given center bin.
 *
 * @param spectrum - The spectrum array to modify in place.
 * @param centerBin - The bin index for the peak center.
 * @param magnitude - The peak magnitude (0-1).
 * @param spreadBins - Number of bins for the Gaussian spread.
 */
function applyGaussianPeak(
  spectrum: Float32Array,
  centerBin: number,
  magnitude: number,
  spreadBins: number,
): void {
  const sigma = spreadBins / 2
  const startBin = Math.max(0, centerBin - spreadBins)
  const endBin = Math.min(spectrum.length - 1, centerBin + spreadBins)

  for (let bin = startBin; bin <= endBin; bin++) {
    const distance = bin - centerBin
    const gaussianWeight = computeGaussianWeight(distance, sigma)
    const value = magnitude * gaussianWeight

    spectrum[bin] = Math.max(spectrum[bin], value)
  }
}

/**
 * Computes a Gaussian weight for a given distance from center.
 *
 * @param distance - Distance from the center in bins.
 * @param sigma - Standard deviation of the Gaussian.
 * @returns Weight value between 0 and 1.
 */
function computeGaussianWeight(distance: number, sigma: number): number {
  return Math.exp(-(distance * distance) / (2 * sigma * sigma))
}

// ── Inverse FFT ────────────────────────────────────────────────────

/**
 * Computes the inverse FFT from a magnitude spectrum to produce
 * a time-domain waveform.
 *
 * Uses random phases for each bin to create a natural-sounding
 * result. The algorithm uses the conjugate trick:
 * IFFT(X) = conj(FFT(conj(X))) / N.
 *
 * @param magnitudes - Magnitude spectrum (length fftSize/2).
 * @param sampleRate - Audio sample rate in Hz (for documentation; unused in computation).
 * @param fftSize - The FFT size (must be a power of 2).
 * @returns Float32Array of length fftSize containing the time-domain waveform.
 */
export function computeInverseFFT(
  magnitudes: Float32Array,
  sampleRate: number,
  fftSize: number,
): Float32Array {
  const real = new Float32Array(fftSize)
  const imag = new Float32Array(fftSize)

  buildComplexSpectrum(magnitudes, fftSize, real, imag)

  // Conjugate the input: negate imaginary parts
  conjugateInPlace(imag)

  // Perform forward FFT on the conjugated input
  fftRadix2(real, imag)

  // Conjugate the result and divide by N
  conjugateInPlace(imag)
  scaleArray(real, 1 / fftSize)
  scaleArray(imag, 1 / fftSize)

  return real
}

/**
 * Builds a full complex spectrum from magnitudes with random phases.
 *
 * Creates a conjugate-symmetric spectrum so the IFFT result is real-valued.
 * Bins 0 and N/2 have zero phase; other bins get random phases with
 * conjugate symmetry enforced.
 *
 * @param magnitudes - Magnitude spectrum (length fftSize/2).
 * @param fftSize - The FFT size.
 * @param real - Output real part array (length fftSize), modified in place.
 * @param imag - Output imaginary part array (length fftSize), modified in place.
 */
function buildComplexSpectrum(
  magnitudes: Float32Array,
  fftSize: number,
  real: Float32Array,
  imag: Float32Array,
): void {
  const halfN = fftSize / 2

  // DC component (bin 0) — real only
  real[0] = magnitudes.length > 0 ? magnitudes[0] : 0
  imag[0] = 0

  // Nyquist component (bin N/2) — real only
  real[halfN] = magnitudes.length > halfN ? magnitudes[halfN] : 0
  imag[halfN] = 0

  // Bins 1 to N/2-1 with random phases and conjugate symmetry
  for (let k = 1; k < halfN; k++) {
    const mag = k < magnitudes.length ? magnitudes[k] : 0
    const phase = Math.random() * 2 * Math.PI

    real[k] = mag * Math.cos(phase)
    imag[k] = mag * Math.sin(phase)

    // Conjugate symmetric counterpart
    real[fftSize - k] = real[k]
    imag[fftSize - k] = -imag[k]
  }
}

/**
 * Negates all elements of an array in place (complex conjugation of imaginary part).
 *
 * @param arr - The array to negate.
 */
function conjugateInPlace(arr: Float32Array): void {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = -arr[i]
  }
}

/**
 * Scales all elements of an array by a constant factor in place.
 *
 * @param arr - The array to scale.
 * @param factor - The scale factor.
 */
function scaleArray(arr: Float32Array, factor: number): void {
  for (let i = 0; i < arr.length; i++) {
    arr[i] *= factor
  }
}

// ── Radix-2 FFT ───────────────────────────────────────────────────

/**
 * In-place radix-2 Cooley-Tukey FFT.
 *
 * Operates on interleaved real and imaginary arrays of length N
 * (must be a power of 2). Modifies both arrays in place.
 *
 * @param real - Real parts (length N).
 * @param imag - Imaginary parts (length N).
 */
function fftRadix2(real: Float32Array, imag: Float32Array): void {
  const n = real.length

  // Bit-reversal permutation
  bitReversePermute(real, imag, n)

  // Butterfly stages
  for (let size = 2; size <= n; size *= 2) {
    const halfSize = size / 2
    const angleStep = (-2 * Math.PI) / size

    for (let i = 0; i < n; i += size) {
      for (let j = 0; j < halfSize; j++) {
        const angle = angleStep * j
        const twiddleReal = Math.cos(angle)
        const twiddleImag = Math.sin(angle)

        const evenIdx = i + j
        const oddIdx = i + j + halfSize

        const tReal = twiddleReal * real[oddIdx] - twiddleImag * imag[oddIdx]
        const tImag = twiddleReal * imag[oddIdx] + twiddleImag * real[oddIdx]

        real[oddIdx] = real[evenIdx] - tReal
        imag[oddIdx] = imag[evenIdx] - tImag
        real[evenIdx] = real[evenIdx] + tReal
        imag[evenIdx] = imag[evenIdx] + tImag
      }
    }
  }
}

/**
 * Performs bit-reversal permutation on real and imaginary arrays.
 *
 * @param real - Real parts array.
 * @param imag - Imaginary parts array.
 * @param n - Array length (must be power of 2).
 */
function bitReversePermute(
  real: Float32Array,
  imag: Float32Array,
  n: number,
): void {
  let j = 0

  for (let i = 0; i < n - 1; i++) {
    if (i < j) {
      // Swap real parts
      const tempReal = real[i]
      real[i] = real[j]
      real[j] = tempReal

      // Swap imaginary parts
      const tempImag = imag[i]
      imag[i] = imag[j]
      imag[j] = tempImag
    }

    let k = n / 2
    while (k <= j) {
      j -= k
      k /= 2
    }
    j += k
  }
}
