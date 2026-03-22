/**
 * Type definitions for FFT visualization.
 *
 * Provides interfaces for peak detection results, draw options,
 * and default configuration for the FFT chart renderer.
 */

/**
 * A detected frequency peak from FFT analysis.
 */
export interface Peak {
  /** Frequency in Hz. */
  frequency: number
  /** Magnitude (normalized 0-1 or raw dB depending on context). */
  magnitude: number
  /** FFT bin index where the peak was found. */
  binIndex: number
  /** Musical note name closest to this frequency (e.g., "A4"). */
  noteName: string
}

/**
 * Options controlling how the FFT chart is drawn on canvas.
 */
export interface FFTDrawOptions {
  /** CSS color string for the bars/line. */
  color: string
  /** Width of each frequency bar in pixels. */
  barWidth: number
  /** Whether to use a logarithmic frequency scale on the x-axis. */
  useLogScale: boolean
  /** Minimum frequency in Hz to display. */
  minFrequency: number
  /** Maximum frequency in Hz to display. */
  maxFrequency: number
  /** Whether to draw background gridlines. */
  showGrid: boolean
  /** CSS color string for gridlines. */
  gridColor: string
  /** CSS color string for axis labels. */
  labelColor: string
}

/** Sensible defaults for FFT chart rendering. */
export const DEFAULT_FFT_DRAW_OPTIONS: FFTDrawOptions = {
  color: '#3b82f6',
  barWidth: 2,
  useLogScale: true,
  minFrequency: 20,
  maxFrequency: 4000,
  showGrid: true,
  gridColor: '#374151',
  labelColor: '#9ca3af',
}
