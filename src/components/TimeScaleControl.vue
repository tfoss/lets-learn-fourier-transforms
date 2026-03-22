<!--
  TimeScaleControl — Compact slider for adjusting the waveform time scale.

  Uses a logarithmic scale so small time windows (sub-millisecond) get more
  slider resolution than large windows (seconds). Displays the current
  time window value and updates all waveform displays via the shared
  useTimeScale composable.
-->
<template>
  <div
    class="flex items-center gap-2"
    data-testid="time-scale-control"
  >
    <label class="text-xs text-gray-400 whitespace-nowrap">Time</label>
    <input
      type="range"
      :min="0"
      :max="1"
      :step="0.001"
      :value="sliderPosition"
      class="w-28 accent-blue-500"
      data-testid="time-scale-slider"
      @input="onSliderInput"
    />
    <span
      class="text-xs text-gray-200 w-16 text-right whitespace-nowrap"
      data-testid="time-scale-display"
    >
      {{ displayValue }}
    </span>
  </div>
</template>

<script setup lang="ts">
/**
 * TimeScaleControl component.
 *
 * Provides a logarithmic slider for adjusting how many milliseconds
 * of waveform are visible. Shares state with all waveform components
 * through the useTimeScale composable.
 */

import { computed } from 'vue'
import {
  useTimeScale,
  formatTimeScale,
  MIN_TIME_SCALE_MS,
  MAX_TIME_SCALE_MS,
} from '../composables/useTimeScale'

const { timeScaleMs, setTimeScale } = useTimeScale()

// ── Logarithmic mapping ────────────────────────────────────────────

/**
 * Converts a time scale in ms to a normalized slider position [0, 1]
 * using logarithmic mapping.
 *
 * @param ms - Time scale in milliseconds.
 * @returns Normalized position in [0, 1].
 */
function msToSliderPosition(ms: number): number {
  const logMin = Math.log(MIN_TIME_SCALE_MS)
  const logMax = Math.log(MAX_TIME_SCALE_MS)
  const logVal = Math.log(ms)
  return (logVal - logMin) / (logMax - logMin)
}

/**
 * Converts a normalized slider position [0, 1] to a time scale in ms
 * using logarithmic mapping.
 *
 * @param position - Normalized position in [0, 1].
 * @returns Time scale in milliseconds.
 */
function sliderPositionToMs(position: number): number {
  const logMin = Math.log(MIN_TIME_SCALE_MS)
  const logMax = Math.log(MAX_TIME_SCALE_MS)
  return Math.exp(logMin + position * (logMax - logMin))
}

// ── Computed ──────────────────────────────────────────────────────

/** Current slider position as a normalized [0, 1] value. */
const sliderPosition = computed(() => msToSliderPosition(timeScaleMs.value))

/** Formatted display value, e.g., "23.2 ms". */
const displayValue = computed(() => formatTimeScale(timeScaleMs.value))

// ── Event handlers ────────────────────────────────────────────────

/**
 * Handles slider input events.
 *
 * @param event - The input event from the range slider.
 */
function onSliderInput(event: Event): void {
  const target = event.target as HTMLInputElement
  const position = parseFloat(target.value)
  const ms = sliderPositionToMs(position)
  setTimeScale(ms)
}
</script>
