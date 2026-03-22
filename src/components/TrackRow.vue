<!--
  TrackRow — A single track displayed as waveform + controls side by side.

  Pairs the TrackWaveform visualization with the TrackControlPanel so
  each track's visual output and its parameter controls are aligned
  in a single cohesive row.
-->
<template>
  <div
    class="track-row rounded-lg bg-gray-800 overflow-hidden"
    :style="{ borderLeft: `3px solid ${track.color}` }"
    data-testid="track-row"
  >
    <!-- Track header -->
    <div class="flex items-center justify-between px-3 pt-2 pb-1">
      <div class="flex items-center gap-2">
        <span
          class="inline-block h-3 w-3 rounded-full"
          :style="{ backgroundColor: track.color }"
        />
        <span class="text-sm font-semibold text-gray-100">
          Track {{ trackIndex + 1 }}
        </span>
        <span class="text-xs text-gray-400">
          {{ formattedFrequency }} Hz — {{ noteName }}
        </span>
      </div>
      <button
        class="rounded px-2 py-0.5 text-xs text-gray-400 hover:bg-red-900 hover:text-red-300 transition-colors"
        data-testid="remove-track-btn"
        @click="emit('remove', track.id)"
      >
        Remove
      </button>
    </div>

    <!-- Waveform + Controls side by side -->
    <div class="grid grid-cols-[1fr_auto] gap-3 p-3 pt-1">
      <!-- Waveform visualization -->
      <div class="min-w-0" data-testid="track-row-waveform">
        <TrackWaveform
          :track="track"
          :track-index="trackIndex"
        />
      </div>

      <!-- Parameter controls (compact vertical stack) -->
      <div class="flex flex-col gap-1.5 w-56 shrink-0" data-testid="track-row-controls">
        <!-- Frequency slider -->
        <div>
          <div class="flex items-center justify-between">
            <label class="text-xs text-gray-400">Freq</label>
            <span class="text-xs text-gray-200" data-testid="frequency-display">
              {{ formattedFrequency }} Hz
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1000"
            :value="frequencySliderValue"
            class="w-full accent-blue-500"
            data-testid="frequency-slider"
            @input="onFrequencyInput"
          />
        </div>

        <!-- Amplitude slider -->
        <div>
          <div class="flex items-center justify-between">
            <label class="text-xs text-gray-400">Amp</label>
            <span class="text-xs text-gray-200" data-testid="amplitude-display">
              {{ amplitudePercent }}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            :value="amplitudeSliderValue"
            class="w-full accent-blue-500"
            data-testid="amplitude-slider"
            @input="onAmplitudeInput"
          />
        </div>

        <!-- Phase slider -->
        <div>
          <div class="flex items-center justify-between">
            <label class="text-xs text-gray-400">Phase</label>
            <span class="text-xs text-gray-200" data-testid="phase-display">
              {{ phaseDegrees }}°
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="360"
            :value="phaseSliderValue"
            class="w-full accent-blue-500"
            data-testid="phase-slider"
            @input="onPhaseInput"
          />
        </div>

        <!-- Waveform type selector -->
        <div class="flex gap-1" data-testid="waveform-selector">
          <button
            v-for="wt in WAVEFORM_TYPES"
            :key="wt"
            class="rounded px-1.5 py-0.5 text-xs transition-colors"
            :class="wt === track.waveformType
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
            :data-testid="`waveform-btn-${wt}`"
            @click="emit('update-param', track.id, 'waveformType', wt)"
          >
            {{ waveformLabel(wt) }}
          </button>
        </div>

        <!-- Playback controls -->
        <div class="flex items-center gap-1.5 pt-0.5">
          <button
            class="rounded px-2 py-0.5 text-xs font-medium transition-colors"
            :class="isTrackPlaying
              ? 'bg-red-600 hover:bg-red-500 text-white'
              : 'bg-green-600 hover:bg-green-500 text-white'"
            data-testid="play-stop-btn"
            @click="isTrackPlaying ? emit('stop', track.id) : emit('play', track.id)"
          >
            {{ isTrackPlaying ? 'Stop' : 'Play' }}
          </button>
          <button
            class="rounded px-1.5 py-0.5 text-xs transition-colors"
            :class="track.isMuted
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
            data-testid="mute-btn"
            @click="emit('update-param', track.id, 'isMuted', !track.isMuted)"
          >
            {{ track.isMuted ? 'Muted' : 'Mute' }}
          </button>
          <button
            class="rounded px-1.5 py-0.5 text-xs transition-colors"
            :class="track.isSolo
              ? 'bg-purple-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
            data-testid="solo-btn"
            @click="emit('update-param', track.id, 'isSolo', !track.isSolo)"
          >
            Solo
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * TrackRow component.
 *
 * Combines a waveform visualization and parameter controls into a
 * single row so that a track's visual output and its controls are
 * always visually aligned and co-located.
 */

import { computed } from 'vue'
import type { TrackConfig, TrackId, WaveformType } from '../types/audio'
import { WAVEFORM_TYPES } from '../types/audio'
import { frequencyToNoteName } from '../utils/audio-math'
import {
  frequencyToSliderPosition,
  sliderPositionToFrequency,
  formatFrequency,
} from '../utils/frequency-scale'
import TrackWaveform from './TrackWaveform.vue'

// ── Props & Emits ─────────────────────────────────────────────────

const props = defineProps<{
  /** The track configuration to display and control. */
  track: TrackConfig
  /** Zero-based index for display labeling. */
  trackIndex: number
  /** Whether this track is currently playing audio. */
  isTrackPlaying?: boolean
}>()

const emit = defineEmits<{
  'update-param': [id: TrackId, param: keyof TrackConfig, value: TrackConfig[keyof TrackConfig]]
  'play': [id: TrackId]
  'stop': [id: TrackId]
  'remove': [id: TrackId]
}>()

// ── Computed display values ───────────────────────────────────────

/** Frequency slider position (0-1000 for fine granularity). */
const frequencySliderValue = computed(() =>
  Math.round(frequencyToSliderPosition(props.track.frequency) * 1000),
)

/** Formatted frequency for display. */
const formattedFrequency = computed(() => formatFrequency(props.track.frequency))

/** Musical note name for the current frequency. */
const noteName = computed(() => {
  try {
    return frequencyToNoteName(props.track.frequency)
  } catch {
    return '—'
  }
})

/** Amplitude slider value (0-100). */
const amplitudeSliderValue = computed(() => Math.round(props.track.amplitude * 100))

/** Amplitude as a percentage string. */
const amplitudePercent = computed(() => Math.round(props.track.amplitude * 100))

/** Phase in degrees for display. */
const phaseDegrees = computed(() => Math.round((props.track.phase * 180) / Math.PI))

/** Phase slider value (0-360). */
const phaseSliderValue = computed(() => Math.round((props.track.phase * 180) / Math.PI))

// ── Event handlers ────────────────────────────────────────────────

/**
 * Handles frequency slider input by converting the linear position
 * back to a logarithmic frequency value.
 *
 * @param event - The input event from the range slider.
 */
function onFrequencyInput(event: Event): void {
  const target = event.target as HTMLInputElement
  const position = parseInt(target.value, 10) / 1000
  const hz = sliderPositionToFrequency(position)
  emit('update-param', props.track.id, 'frequency', hz)
}

/**
 * Handles amplitude slider input.
 *
 * @param event - The input event from the range slider.
 */
function onAmplitudeInput(event: Event): void {
  const target = event.target as HTMLInputElement
  const value = parseInt(target.value, 10) / 100
  emit('update-param', props.track.id, 'amplitude', value)
}

/**
 * Handles phase slider input, converting degrees to radians.
 *
 * @param event - The input event from the range slider.
 */
function onPhaseInput(event: Event): void {
  const target = event.target as HTMLInputElement
  const degrees = parseInt(target.value, 10)
  const radians = (degrees * Math.PI) / 180
  emit('update-param', props.track.id, 'phase', radians)
}

// ── Display helpers ───────────────────────────────────────────────

/**
 * Returns a capitalized label for a waveform type.
 *
 * @param wt - The waveform type.
 * @returns Display label string.
 */
function waveformLabel(wt: WaveformType): string {
  return wt.charAt(0).toUpperCase() + wt.slice(1)
}
</script>
