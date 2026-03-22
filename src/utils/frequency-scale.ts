/**
 * Logarithmic frequency scale utilities.
 *
 * Converts between linear slider positions (0–1) and frequencies
 * on a logarithmic scale, so that musical intervals (which are
 * multiplicative) feel evenly spaced on the slider.
 */

import { MIN_FREQUENCY, MAX_FREQUENCY } from './audio-math'

/** Natural log of the minimum frequency. */
const LOG_MIN = Math.log(MIN_FREQUENCY)

/** Natural log of the maximum frequency. */
const LOG_MAX = Math.log(MAX_FREQUENCY)

/** Range of log values. */
const LOG_RANGE = LOG_MAX - LOG_MIN

/**
 * Converts a frequency in Hz to a linear slider position (0–1)
 * on a logarithmic scale.
 *
 * @param hz - Frequency in Hz, clamped to [MIN_FREQUENCY, MAX_FREQUENCY].
 * @returns Slider position in [0, 1].
 */
export function frequencyToSliderPosition(hz: number): number {
  const clamped = Math.max(MIN_FREQUENCY, Math.min(MAX_FREQUENCY, hz))
  return (Math.log(clamped) - LOG_MIN) / LOG_RANGE
}

/**
 * Converts a linear slider position (0–1) to a frequency in Hz
 * on a logarithmic scale.
 *
 * @param position - Slider position in [0, 1].
 * @returns Frequency in Hz.
 */
export function sliderPositionToFrequency(position: number): number {
  const clamped = Math.max(0, Math.min(1, position))
  return Math.exp(LOG_MIN + clamped * LOG_RANGE)
}

/**
 * Rounds a frequency to a reasonable display precision.
 *
 * Frequencies below 100 Hz get 2 decimal places, below 1000 get 1,
 * and above 1000 get none.
 *
 * @param hz - Frequency in Hz.
 * @returns Rounded frequency string.
 */
export function formatFrequency(hz: number): string {
  if (hz < 100) return hz.toFixed(2)
  if (hz < 1000) return hz.toFixed(1)
  return Math.round(hz).toString()
}
