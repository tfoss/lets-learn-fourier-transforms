/**
 * useTimeScale — Singleton composable for shared waveform time scale state.
 *
 * Provides a reactive time window (in milliseconds) that controls how many
 * samples are generated for waveform previews. All waveform components share
 * the same time scale so zooming in/out affects every display uniformly.
 */

import { ref, computed } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import { DEFAULT_SAMPLE_RATE } from '../utils/audio-math'

// ── Types ──────────────────────────────────────────────────────────

/** A named time scale preset. */
export interface TimeScalePreset {
  /** Human-readable label, e.g., "23 ms". */
  label: string
  /** Time window in milliseconds. */
  ms: number
}

// ── Constants ──────────────────────────────────────────────────────

/** Minimum allowed time scale in milliseconds. */
export const MIN_TIME_SCALE_MS = 0.5

/** Maximum allowed time scale in milliseconds. */
export const MAX_TIME_SCALE_MS = 2000

/** Minimum sample count to avoid degenerate waveforms. */
export const MIN_SAMPLE_COUNT = 16

/** Maximum sample count to avoid performance issues. */
export const MAX_SAMPLE_COUNT = 131072

/** Default time scale matching the original 1024 samples at 44100 Hz. */
export const DEFAULT_TIME_SCALE_MS = (1024 / DEFAULT_SAMPLE_RATE) * 1000

/** Preset time scales for the slider. */
export const TIME_SCALE_PRESETS: TimeScalePreset[] = [
  { label: '0.5 ms', ms: 0.5 },
  { label: '2 ms', ms: 2 },
  { label: '5 ms', ms: 5 },
  { label: '10 ms', ms: 10 },
  { label: '23 ms', ms: 23.2 },
  { label: '50 ms', ms: 50 },
  { label: '100 ms', ms: 100 },
  { label: '250 ms', ms: 250 },
  { label: '500 ms', ms: 500 },
  { label: '1000 ms', ms: 1000 },
  { label: '2000 ms', ms: 2000 },
]

// ── Return type ────────────────────────────────────────────────────

export interface UseTimeScaleReturn {
  /** The visible time window in milliseconds. */
  timeScaleMs: Ref<number>
  /** Number of samples computed from the time scale, clamped to a safe range. */
  sampleCount: ComputedRef<number>
  /** Update the time scale. Clamps to [MIN_TIME_SCALE_MS, MAX_TIME_SCALE_MS]. */
  setTimeScale: (ms: number) => void
}

// ── Singleton state ────────────────────────────────────────────────

const timeScaleMs = ref(DEFAULT_TIME_SCALE_MS)

// ── Pure helpers ───────────────────────────────────────────────────

/**
 * Clamps a value to the range [min, max].
 *
 * @param value - Value to clamp.
 * @param min - Lower bound.
 * @param max - Upper bound.
 * @returns Clamped value.
 */
export function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Computes the sample count from a time scale in milliseconds.
 *
 * @param ms - Time window in milliseconds.
 * @param sampleRate - Audio sample rate in Hz.
 * @returns Sample count, clamped to [MIN_SAMPLE_COUNT, MAX_SAMPLE_COUNT].
 */
export function computeSampleCount(ms: number, sampleRate: number = DEFAULT_SAMPLE_RATE): number {
  const raw = Math.round((ms / 1000) * sampleRate)
  return clampValue(raw, MIN_SAMPLE_COUNT, MAX_SAMPLE_COUNT)
}

/**
 * Formats a time value in milliseconds for display.
 *
 * @param ms - Time in milliseconds.
 * @returns Formatted string, e.g., "23.2 ms" or "1.0 s".
 */
export function formatTimeScale(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)} s`
  }
  if (ms >= 1) {
    return `${ms.toFixed(1)} ms`
  }
  const us = ms * 1000
  return `${us.toFixed(0)} \u00B5s`
}

// ── Composable ─────────────────────────────────────────────────────

/**
 * Returns the shared time scale state for waveform displays.
 *
 * This is a singleton — all callers share the same reactive state.
 *
 * @returns Object with timeScaleMs ref, computed sampleCount, and setTimeScale function.
 */
export function useTimeScale(): UseTimeScaleReturn {
  const sampleCount = computed(() => computeSampleCount(timeScaleMs.value))

  function setTimeScale(ms: number): void {
    timeScaleMs.value = clampValue(ms, MIN_TIME_SCALE_MS, MAX_TIME_SCALE_MS)
  }

  return {
    timeScaleMs,
    sampleCount,
    setTimeScale,
  }
}
