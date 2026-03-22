/**
 * Spectrogram state composable.
 *
 * Manages the animation loop that reads FFT data and draws scrolling
 * spectrogram columns onto a canvas. Automatically starts/stops
 * based on audio playback state.
 *
 * Usage:
 *   const { isSpectrogramActive, colorMapName, startCapture, stopCapture } = useSpectrogram()
 */

import { ref, type Ref } from 'vue'
import { useAudioEngine } from './useAudioEngine'
import { useAudioFilePlayer } from './useAudioFilePlayer'
import { useMicrophone } from './useMicrophone'
import { normalizeFFTData } from '../utils/fft-analysis'
import {
  drawSpectrogramColumn,
  getColorMap,
} from '../utils/spectrogram'

// ── Singleton state ────────────────────────────────────────────────

const isSpectrogramActive: Ref<boolean> = ref(false)
const colorMapName: Ref<'viridis' | 'hot'> = ref('viridis')
const scrollSpeed: Ref<number> = ref(2)

let animationFrameId: number | null = null
let canvasRef: Ref<HTMLCanvasElement | null> | null = null
let minFreq = 20
let maxFreq = 4000

// ── Internal helpers ───────────────────────────────────────────────

/**
 * Scrolls the existing canvas content left by the scroll speed amount
 * and draws a new FFT data column on the right edge.
 */
function renderFrame(): void {
  if (!canvasRef || !canvasRef.value) {
    stopCapture()
    return
  }

  const canvas = canvasRef.value
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    stopCapture()
    return
  }

  const engine = useAudioEngine()
  const filePlayer = useAudioFilePlayer()
  const mic = useMicrophone()

  // Only draw new data if any audio source is active
  const audioPlaying = engine.isPlaying.value || filePlayer.isPlaying.value || mic.isListening.value

  if (audioPlaying) {
    const fftData = engine.getFFTData()
    const normalized = normalizeFFTData(fftData.frequencyData)
    const speed = scrollSpeed.value
    const colorMap = getColorMap(colorMapName.value)

    // Scroll existing content left
    const imageData = ctx.getImageData(speed, 0, canvas.width - speed, canvas.height)
    ctx.putImageData(imageData, 0, 0)

    // Clear the right edge
    ctx.clearRect(canvas.width - speed, 0, speed, canvas.height)

    // Draw new column on the right edge
    drawSpectrogramColumn(
      ctx,
      canvas.width - speed,
      speed,
      normalized,
      canvas.height,
      colorMap,
      minFreq,
      maxFreq,
      fftData.sampleRate,
      fftData.fftSize,
    )
  }

  animationFrameId = requestAnimationFrame(renderFrame)
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Begins the spectrogram capture loop.
 *
 * Reads FFT data each frame and draws scrolling columns on the canvas.
 *
 * @param canvas - Ref to the canvas element.
 * @param minFrequency - Minimum frequency to display (Hz).
 * @param maxFrequency - Maximum frequency to display (Hz).
 */
function startCapture(
  canvas: Ref<HTMLCanvasElement | null>,
  minFrequency: number = 20,
  maxFrequency: number = 4000,
): void {
  if (isSpectrogramActive.value) return

  canvasRef = canvas
  minFreq = minFrequency
  maxFreq = maxFrequency
  isSpectrogramActive.value = true

  animationFrameId = requestAnimationFrame(renderFrame)
}

/**
 * Stops the spectrogram capture loop.
 *
 * The canvas content is preserved (frozen in place).
 */
function stopCapture(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  isSpectrogramActive.value = false
  canvasRef = null
}

/**
 * Clears all spectrogram content from the canvas.
 *
 * @param canvas - Ref to the canvas element to clear.
 */
function clearSpectrogram(canvas: Ref<HTMLCanvasElement | null>): void {
  if (!canvas.value) return
  const ctx = canvas.value.getContext('2d')
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.value.width, canvas.value.height)
}

// ── Composable export ──────────────────────────────────────────────

/**
 * Spectrogram composable (singleton).
 *
 * Manages the animation loop, colormap selection, and scroll speed
 * for the scrolling spectrogram visualization.
 *
 * @returns Spectrogram API and reactive state.
 */
export function useSpectrogram() {
  return {
    // Reactive state
    isSpectrogramActive,
    colorMapName,
    scrollSpeed,

    // Methods
    startCapture,
    stopCapture,
    clearSpectrogram,
  }
}
