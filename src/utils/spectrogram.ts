/**
 * Pure spectrogram rendering utilities.
 *
 * Provides colormaps, frequency-to-Y mapping, and column drawing
 * for the scrolling spectrogram visualization.
 */

import { binToFrequency } from './fft-analysis'

// ── Types ──────────────────────────────────────────────────────────

/** Maps a normalized magnitude (0-1) to a CSS color string. */
export type SpectrogramColorMap = (value: number) => string

// ── Color interpolation helpers ────────────────────────────────────

/** An RGB color triplet (each channel 0-255). */
type RGB = [number, number, number]

/**
 * Linearly interpolates between two RGB colors.
 *
 * @param a - Start color.
 * @param b - End color.
 * @param t - Interpolation factor (0 = a, 1 = b).
 * @returns Interpolated RGB color.
 */
function lerpRGB(a: RGB, b: RGB, t: number): RGB {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ]
}

/**
 * Converts an RGB triplet to a CSS rgb() string.
 *
 * @param rgb - The RGB color.
 * @returns CSS color string like "rgb(255, 128, 0)".
 */
function rgbToCSS(rgb: RGB): string {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`
}

/**
 * Creates a colormap function from an array of color stops.
 *
 * Stops are evenly distributed across the 0-1 range. Values between
 * stops are linearly interpolated.
 *
 * @param stops - Array of RGB color stops.
 * @returns A SpectrogramColorMap function.
 */
function createColorMap(stops: RGB[]): SpectrogramColorMap {
  return (value: number): string => {
    const clamped = Math.max(0, Math.min(1, value))
    const segmentCount = stops.length - 1
    const scaledValue = clamped * segmentCount
    const index = Math.min(Math.floor(scaledValue), segmentCount - 1)
    const t = scaledValue - index
    const interpolated = lerpRGB(stops[index], stops[index + 1], t)
    return rgbToCSS(interpolated)
  }
}

// ── Colormaps ──────────────────────────────────────────────────────

/**
 * Viridis-inspired colormap: dark purple -> blue -> teal -> green -> yellow.
 *
 * Perceptually uniform, colorblind-friendly.
 */
export const VIRIDIS_COLORMAP: SpectrogramColorMap = createColorMap([
  [68, 1, 84],     // dark purple
  [59, 82, 139],   // blue
  [33, 145, 140],  // teal
  [94, 201, 98],   // green
  [253, 231, 37],  // yellow
])

/**
 * Hot colormap: black -> red -> yellow -> white.
 *
 * Classic thermal visualization.
 */
export const HOT_COLORMAP: SpectrogramColorMap = createColorMap([
  [0, 0, 0],       // black
  [128, 0, 0],     // dark red
  [255, 0, 0],     // red
  [255, 200, 0],   // yellow-orange
  [255, 255, 255], // white
])

/**
 * Returns the colormap for a given name.
 *
 * @param name - The colormap name.
 * @returns The corresponding SpectrogramColorMap.
 */
export function getColorMap(name: 'viridis' | 'hot'): SpectrogramColorMap {
  return name === 'hot' ? HOT_COLORMAP : VIRIDIS_COLORMAP
}

// ── Frequency-to-Y mapping ────────────────────────────────────────

/**
 * Maps a frequency to a Y pixel position on the canvas.
 *
 * Y=0 is the top of the canvas (high frequency), Y=canvasHeight is
 * the bottom (low frequency).
 *
 * @param frequency - Frequency in Hz.
 * @param canvasHeight - Canvas height in pixels.
 * @param minFreq - Minimum displayed frequency in Hz.
 * @param maxFreq - Maximum displayed frequency in Hz.
 * @param useLogScale - If true, uses logarithmic frequency mapping.
 * @returns Y pixel position (0 = top/high freq, canvasHeight = bottom/low freq).
 */
export function frequencyToY(
  frequency: number,
  canvasHeight: number,
  minFreq: number,
  maxFreq: number,
  useLogScale: boolean,
): number {
  if (frequency <= 0 || minFreq <= 0 || maxFreq <= 0) {
    return canvasHeight
  }

  let normalizedPosition: number

  if (useLogScale) {
    const logMin = Math.log10(minFreq)
    const logMax = Math.log10(maxFreq)
    const logFreq = Math.log10(Math.max(frequency, minFreq))
    normalizedPosition = (logFreq - logMin) / (logMax - logMin)
  } else {
    normalizedPosition = (frequency - minFreq) / (maxFreq - minFreq)
  }

  // Invert: high frequency = top (Y=0), low frequency = bottom
  const clamped = Math.max(0, Math.min(1, normalizedPosition))
  return canvasHeight * (1 - clamped)
}

// ── Column drawing ─────────────────────────────────────────────────

/**
 * Draws a single vertical column of the spectrogram.
 *
 * Each frequency bin is mapped to a Y position and filled with a
 * color based on its normalized magnitude.
 *
 * @param ctx - Canvas 2D rendering context.
 * @param columnX - X position to draw the column at.
 * @param columnWidth - Width of the column in pixels.
 * @param frequencyData - Normalized frequency data (0-1 values).
 * @param canvasHeight - Height of the canvas in pixels.
 * @param colorMap - Colormap function to use.
 * @param minFreq - Minimum frequency to display.
 * @param maxFreq - Maximum frequency to display.
 * @param sampleRate - Audio sample rate in Hz.
 * @param fftSize - FFT size used for analysis.
 */
export function drawSpectrogramColumn(
  ctx: CanvasRenderingContext2D,
  columnX: number,
  columnWidth: number,
  frequencyData: Float32Array,
  canvasHeight: number,
  colorMap: SpectrogramColorMap,
  minFreq: number,
  maxFreq: number,
  sampleRate: number,
  fftSize: number,
): void {
  const binCount = frequencyData.length

  for (let i = 0; i < binCount; i++) {
    const freq = binToFrequency(i, sampleRate, fftSize)

    if (freq < minFreq || freq > maxFreq) continue

    const nextFreq = binToFrequency(i + 1, sampleRate, fftSize)

    const y1 = frequencyToY(freq, canvasHeight, minFreq, maxFreq, true)
    const y2 = frequencyToY(
      Math.min(nextFreq, maxFreq),
      canvasHeight,
      minFreq,
      maxFreq,
      true,
    )

    const yTop = Math.min(y1, y2)
    const rectHeight = Math.max(1, Math.abs(y1 - y2))

    ctx.fillStyle = colorMap(frequencyData[i])
    ctx.fillRect(columnX, yTop, columnWidth, rectHeight)
  }
}
