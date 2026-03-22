/**
 * Composable for canvas-based FFT frequency-domain rendering.
 *
 * Manages drawing FFT data onto an HTML canvas element with
 * requestAnimationFrame for smooth animation. Supports logarithmic
 * and linear frequency scales, gridlines, and Hz labels.
 */

import { ref, onUnmounted, type Ref } from 'vue'
import type { FFTDrawOptions } from '../types/fft'
import { DEFAULT_FFT_DRAW_OPTIONS } from '../types/fft'
import { normalizeFFTData, binToFrequency } from '../utils/fft-analysis'

// ── Types ─────────────────────────────────────────────────────────

/** Data source for continuous FFT rendering. */
export interface FFTDataSource {
  frequencyData: Float32Array
  sampleRate: number
  fftSize: number
}

// ── Pure drawing functions ────────────────────────────────────────

/**
 * Maps a frequency to an x-pixel coordinate on the canvas.
 *
 * @param frequency - Frequency in Hz.
 * @param width - Canvas width in pixels.
 * @param minFreq - Minimum displayed frequency.
 * @param maxFreq - Maximum displayed frequency.
 * @param useLogScale - Whether to use logarithmic mapping.
 * @returns X coordinate in pixels.
 */
export function frequencyToX(
  frequency: number,
  width: number,
  minFreq: number,
  maxFreq: number,
  useLogScale: boolean,
): number {
  if (useLogScale) {
    const logMin = Math.log10(Math.max(1, minFreq))
    const logMax = Math.log10(maxFreq)
    const logFreq = Math.log10(Math.max(1, frequency))
    return ((logFreq - logMin) / (logMax - logMin)) * width
  }
  return ((frequency - minFreq) / (maxFreq - minFreq)) * width
}

/**
 * Draws gridlines and Hz labels on the canvas.
 *
 * @param ctx - Canvas 2D rendering context.
 * @param width - Canvas width in pixels.
 * @param height - Canvas height in pixels.
 * @param options - Draw options containing colors, scale, and frequency range.
 */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: FFTDrawOptions,
): void {
  const gridFrequencies = selectGridFrequencies(
    options.minFrequency,
    options.maxFrequency,
  )

  ctx.strokeStyle = options.gridColor
  ctx.lineWidth = 1
  ctx.fillStyle = options.labelColor
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'center'

  for (const freq of gridFrequencies) {
    const x = frequencyToX(
      freq,
      width,
      options.minFrequency,
      options.maxFrequency,
      options.useLogScale,
    )

    if (x < 0 || x > width) continue

    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()

    const label = formatFrequencyLabel(freq)
    ctx.fillText(label, x, height - 4)
  }
}

/**
 * Selects a set of round frequencies for gridlines within a range.
 *
 * @param minFreq - Minimum frequency in Hz.
 * @param maxFreq - Maximum frequency in Hz.
 * @returns Array of frequencies to draw gridlines at.
 */
export function selectGridFrequencies(
  minFreq: number,
  maxFreq: number,
): number[] {
  const candidates = [
    20, 50, 100, 200, 300, 400, 500, 600, 800, 1000, 1500, 2000, 3000, 4000,
    5000, 8000, 10000, 15000, 20000,
  ]

  return candidates.filter((f) => f >= minFreq && f <= maxFreq)
}

/**
 * Formats a frequency value as a human-readable label.
 *
 * Frequencies >= 1000 are shown as "1k", "2k", etc.
 *
 * @param freq - Frequency in Hz.
 * @returns Formatted label string.
 */
export function formatFrequencyLabel(freq: number): string {
  if (freq >= 1000) {
    const k = freq / 1000
    return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`
  }
  return `${freq}`
}

/**
 * Draws the FFT frequency data as vertical bars on a canvas.
 *
 * @param ctx - Canvas 2D rendering context.
 * @param frequencyData - Raw FFT magnitude data in dB.
 * @param sampleRate - The audio sample rate in Hz.
 * @param fftSize - The FFT size used for analysis.
 * @param width - Canvas width in pixels.
 * @param height - Canvas height in pixels.
 * @param options - Draw options.
 */
export function drawFFTBars(
  ctx: CanvasRenderingContext2D,
  frequencyData: Float32Array,
  sampleRate: number,
  fftSize: number,
  width: number,
  height: number,
  options: FFTDrawOptions,
): void {
  const normalized = normalizeFFTData(frequencyData)
  const reservedBottom = 20 // space for Hz labels
  const drawHeight = height - reservedBottom

  ctx.fillStyle = options.color

  for (let i = 0; i < frequencyData.length; i++) {
    const freq = binToFrequency(i, sampleRate, fftSize)

    if (freq < options.minFrequency || freq > options.maxFrequency) continue

    const x = frequencyToX(
      freq,
      width,
      options.minFrequency,
      options.maxFrequency,
      options.useLogScale,
    )

    const barHeight = normalized[i] * drawHeight

    if (barHeight < 0.5) continue

    ctx.fillRect(x, drawHeight - barHeight, options.barWidth, barHeight)
  }
}

/**
 * Draws a complete FFT frame: background clear, optional grid, and bars.
 *
 * @param ctx - Canvas 2D rendering context.
 * @param frequencyData - Raw FFT magnitude data in dB.
 * @param sampleRate - The audio sample rate in Hz.
 * @param fftSize - The FFT size used for analysis.
 * @param width - Canvas width in pixels.
 * @param height - Canvas height in pixels.
 * @param options - Draw options.
 */
export function drawFFTFrame(
  ctx: CanvasRenderingContext2D,
  frequencyData: Float32Array,
  sampleRate: number,
  fftSize: number,
  width: number,
  height: number,
  options: FFTDrawOptions,
): void {
  ctx.clearRect(0, 0, width, height)

  if (options.showGrid) {
    drawGrid(ctx, width, height, options)
  }

  drawFFTBars(ctx, frequencyData, sampleRate, fftSize, width, height, options)
}

// ── Composable ────────────────────────────────────────────────────

/**
 * Composable that manages canvas-based FFT rendering.
 *
 * Takes a canvas ref and optional draw options, provides methods for
 * drawing single frames or running a continuous animation loop.
 * Handles canvas resize via ResizeObserver.
 *
 * @param canvasRef - Ref to the HTMLCanvasElement.
 * @param options - Partial draw options (defaults applied).
 * @returns Object with drawFFT, animation, and clear methods.
 */
export function useFFTRenderer(
  canvasRef: Ref<HTMLCanvasElement | null>,
  options: Partial<FFTDrawOptions> = {},
) {
  const mergedOptions: FFTDrawOptions = {
    ...DEFAULT_FFT_DRAW_OPTIONS,
    ...options,
  }

  const isAnimating = ref(false)
  let animationFrameId: number | null = null
  let resizeObserver: ResizeObserver | null = null

  /**
   * Synchronizes the canvas internal resolution with its display size.
   *
   * @param canvas - The canvas element to resize.
   */
  function syncCanvasSize(canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    const displayWidth = Math.floor(rect.width * dpr)
    const displayHeight = Math.floor(rect.height * dpr)

    if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
      canvas.width = displayWidth
      canvas.height = displayHeight
    }
  }

  /**
   * Sets up a ResizeObserver on the canvas to handle size changes.
   *
   * @param canvas - The canvas element to observe.
   */
  function setupResizeObserver(canvas: HTMLCanvasElement): void {
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
    resizeObserver = new ResizeObserver(() => {
      syncCanvasSize(canvas)
    })
    resizeObserver.observe(canvas)
  }

  /**
   * Draws a single FFT frame on the canvas.
   *
   * @param frequencyData - Raw FFT magnitude data in dB.
   * @param sampleRate - Audio sample rate in Hz.
   * @param fftSize - FFT size used for analysis.
   * @param drawOptions - Optional overrides for draw options.
   */
  function drawFFT(
    frequencyData: Float32Array,
    sampleRate: number,
    fftSize: number,
    drawOptions?: Partial<FFTDrawOptions>,
  ): void {
    const canvas = canvasRef.value
    if (!canvas) return

    syncCanvasSize(canvas)
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const finalOptions = drawOptions
      ? { ...mergedOptions, ...drawOptions }
      : mergedOptions

    drawFFTFrame(
      ctx,
      frequencyData,
      sampleRate,
      fftSize,
      canvas.width,
      canvas.height,
      finalOptions,
    )
  }

  /**
   * Starts a continuous animation loop that calls dataSource each frame.
   *
   * @param dataSource - Function returning the current FFT data.
   */
  function startAnimation(dataSource: () => FFTDataSource): void {
    const canvas = canvasRef.value
    if (!canvas) return

    setupResizeObserver(canvas)
    isAnimating.value = true

    function loop(): void {
      if (!isAnimating.value) return
      const data = dataSource()
      drawFFT(data.frequencyData, data.sampleRate, data.fftSize)
      animationFrameId = requestAnimationFrame(loop)
    }

    loop()
  }

  /**
   * Stops the animation loop.
   */
  function stopAnimation(): void {
    isAnimating.value = false
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }

  /**
   * Clears the canvas.
   */
  function clear(): void {
    const canvas = canvasRef.value
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  /**
   * Updates the merged draw options at runtime.
   *
   * @param newOptions - Partial options to merge.
   */
  function updateOptions(newOptions: Partial<FFTDrawOptions>): void {
    Object.assign(mergedOptions, newOptions)
  }

  /**
   * Cleans up the resize observer and stops animation.
   */
  function dispose(): void {
    stopAnimation()
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  }

  onUnmounted(dispose)

  return {
    drawFFT,
    startAnimation,
    stopAnimation,
    clear,
    updateOptions,
    dispose,
    isAnimating,
  }
}
