/**
 * Composable for the draw-to-sound inverse FFT feature.
 *
 * Manages drawn frequency peaks, computes the inverse FFT waveform,
 * and handles playback via the Web Audio API. Provides reactive state
 * for UI binding.
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { DrawPeak } from '../types/inverse-fft'
import { createMagnitudeSpectrum, computeInverseFFT } from '../utils/inverse-fft'

// ── Constants ──────────────────────────────────────────────────────

/** Default FFT size for inverse FFT computation. */
const DEFAULT_FFT_SIZE = 2048

/** Default sample rate in Hz. */
const DEFAULT_SAMPLE_RATE = 44100

/** Peak proximity threshold in Hz for removal. */
const PEAK_REMOVAL_THRESHOLD = 20

/** Target peak amplitude for normalized playback waveforms. */
const TARGET_AMPLITUDE = 0.8

// ── Composable ─────────────────────────────────────────────────────

/**
 * Composable for managing drawn peaks, inverse FFT computation, and playback.
 *
 * @param options - Optional configuration overrides.
 * @returns Reactive state and methods for the inverse FFT feature.
 */
export function useInverseFFT(options?: {
  fftSize?: number
  sampleRate?: number
}) {
  const fftSize = options?.fftSize ?? DEFAULT_FFT_SIZE
  const sampleRate = options?.sampleRate ?? DEFAULT_SAMPLE_RATE

  // ── Reactive state ─────────────────────────────────────────────

  const drawnPeaks: Ref<DrawPeak[]> = ref([])
  const isPlaying: Ref<boolean> = ref(false)

  /** Reference to the currently playing AudioBufferSourceNode. */
  let sourceNode: AudioBufferSourceNode | null = null
  let audioContext: AudioContext | null = null

  // ── Computed waveform ──────────────────────────────────────────

  /**
   * The inverse FFT waveform, recomputed whenever drawnPeaks changes.
   */
  const generatedWaveform: ComputedRef<Float32Array> = computed(() => {
    if (drawnPeaks.value.length === 0) {
      return new Float32Array(0)
    }

    const spectrum = createMagnitudeSpectrum(
      drawnPeaks.value,
      fftSize,
      sampleRate,
    )

    return computeInverseFFT(spectrum, sampleRate, fftSize)
  })

  // ── Peak management ────────────────────────────────────────────

  /**
   * Adds a new peak at the specified frequency and magnitude.
   *
   * @param frequency - Frequency in Hz.
   * @param magnitude - Magnitude normalized to [0, 1].
   */
  function addPeak(frequency: number, magnitude: number): void {
    const clampedMagnitude = clampValue(magnitude, 0, 1)
    const clampedFrequency = Math.max(0, frequency)

    drawnPeaks.value = [
      ...drawnPeaks.value,
      { frequency: clampedFrequency, magnitude: clampedMagnitude },
    ]
  }

  /**
   * Removes the peak at the given index.
   *
   * @param index - Zero-based index of the peak to remove.
   */
  function removePeak(index: number): void {
    if (index < 0 || index >= drawnPeaks.value.length) return

    const updated = [...drawnPeaks.value]
    updated.splice(index, 1)
    drawnPeaks.value = updated
  }

  /**
   * Finds the index of the peak closest to a given frequency,
   * within the removal threshold.
   *
   * @param frequency - Target frequency in Hz.
   * @returns Index of the closest peak, or -1 if none within threshold.
   */
  function findClosestPeakIndex(frequency: number): number {
    let closestIndex = -1
    let closestDistance = Infinity

    for (let i = 0; i < drawnPeaks.value.length; i++) {
      const distance = Math.abs(drawnPeaks.value[i].frequency - frequency)
      if (distance < closestDistance && distance < PEAK_REMOVAL_THRESHOLD) {
        closestDistance = distance
        closestIndex = i
      }
    }

    return closestIndex
  }

  /**
   * Clears all drawn peaks.
   */
  function clearPeaks(): void {
    drawnPeaks.value = []
  }

  // ── Playback ───────────────────────────────────────────────────

  /**
   * Lazily creates and returns an AudioContext.
   *
   * @returns The AudioContext instance.
   */
  function getOrCreateAudioContext(): AudioContext {
    if (!audioContext) {
      audioContext = new AudioContext()
    }
    return audioContext
  }

  /**
   * Creates an AudioBuffer from a time-domain waveform.
   *
   * @param waveform - Float32Array of samples.
   * @param ctx - The AudioContext.
   * @returns An AudioBuffer containing the waveform.
   */
  function createAudioBuffer(
    waveform: Float32Array,
    ctx: AudioContext,
  ): AudioBuffer {
    const buffer = ctx.createBuffer(1, waveform.length, sampleRate)
    buffer.getChannelData(0).set(waveform)
    return buffer
  }

  /**
   * Plays the generated waveform as looping audio.
   */
  async function playDrawnSound(): Promise<void> {
    const waveform = generatedWaveform.value

    if (waveform.length === 0) return

    // Stop any existing playback first
    stopDrawnSound()

    const ctx = getOrCreateAudioContext()

    if (ctx.state === 'suspended') {
      await ctx.resume()
    }

    const normalized = normalizeWaveform(waveform, TARGET_AMPLITUDE)
    const buffer = createAudioBuffer(normalized, ctx)

    sourceNode = ctx.createBufferSource()
    sourceNode.buffer = buffer
    sourceNode.loop = true
    sourceNode.connect(ctx.destination)
    sourceNode.start()

    isPlaying.value = true

    sourceNode.onended = () => {
      isPlaying.value = false
      sourceNode = null
    }
  }

  /**
   * Stops the currently playing drawn sound.
   */
  function stopDrawnSound(): void {
    if (sourceNode) {
      try {
        sourceNode.stop()
      } catch {
        // Already stopped — ignore
      }
      sourceNode = null
    }
    isPlaying.value = false
  }

  /**
   * Cleans up audio resources.
   */
  async function cleanup(): Promise<void> {
    stopDrawnSound()
    if (audioContext) {
      await audioContext.close()
      audioContext = null
    }
  }

  return {
    // State
    drawnPeaks,
    isPlaying,
    generatedWaveform,

    // Peak management
    addPeak,
    removePeak,
    findClosestPeakIndex,
    clearPeaks,

    // Playback
    playDrawnSound,
    stopDrawnSound,

    // Cleanup
    cleanup,
  }
}

// ── Pure helpers ──────────────────────────────────────────────────

/**
 * Clamps a value to the range [min, max].
 *
 * @param value - The value to clamp.
 * @param min - Minimum allowed value.
 * @param max - Maximum allowed value.
 * @returns The clamped value.
 */
function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Normalizes a waveform so its peak amplitude matches the target level.
 *
 * The IFFT output has very small amplitudes (on the order of 1/N) which
 * are effectively inaudible. This scales the waveform to a listenable level.
 *
 * @param waveform - The raw time-domain samples.
 * @param targetAmplitude - Desired peak amplitude (0-1).
 * @returns A new Float32Array scaled to the target amplitude.
 */
function normalizeWaveform(
  waveform: Float32Array,
  targetAmplitude: number,
): Float32Array {
  let maxAmp = 0
  for (let i = 0; i < waveform.length; i++) {
    const abs = Math.abs(waveform[i])
    if (abs > maxAmp) maxAmp = abs
  }

  if (maxAmp === 0) return new Float32Array(waveform.length)

  const scale = targetAmplitude / maxAmp
  const normalized = new Float32Array(waveform.length)
  for (let i = 0; i < waveform.length; i++) {
    normalized[i] = waveform[i] * scale
  }

  return normalized
}
