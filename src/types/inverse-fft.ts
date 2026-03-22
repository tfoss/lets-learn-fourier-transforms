/**
 * Type definitions for the inverse FFT drawing feature.
 *
 * Provides the DrawPeak interface used to represent user-drawn
 * frequency peaks that are converted to sound via inverse FFT.
 */

/**
 * A user-drawn frequency peak for inverse FFT synthesis.
 */
export interface DrawPeak {
  /** Frequency in Hz. */
  frequency: number
  /** Magnitude normalized to [0, 1]. */
  magnitude: number
}
