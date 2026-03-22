<!--
  TrackControlPanel — Controls for a single audio track.

  Provides sliders for frequency (logarithmic scale), amplitude,
  and phase offset, plus a waveform type selector and playback
  controls (play/stop, mute, solo).
-->
<template>
  <div
    class="track-control-panel"
    data-testid="track-control-panel"
  >
    <!-- Track header row -->
    <div class="mb-2 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span
          class="inline-block h-3 w-3 rounded-full"
          :style="{ backgroundColor: track.color }"
          data-testid="track-color-dot"
        />
        <span class="text-sm font-semibold text-gray-100" data-testid="track-label">
          Track {{ trackIndex + 1 }}
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

    <!-- Frequency slider (logarithmic) -->
    <div class="mb-2">
      <div class="mb-1 flex items-center justify-between">
        <label class="text-xs text-gray-400">Frequency</label>
        <EditableValue
          :display-value="`${formattedFrequency} Hz — ${noteName}`"
          :model-value="Math.round(track.frequency)"
          :min="MIN_FREQUENCY"
          :max="MAX_FREQUENCY"
          :step="1"
          test-id="frequency-display"
          @update:model-value="emit('update-param', track.id, 'frequency', $event)"
        />
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
    <div class="mb-2">
      <div class="mb-1 flex items-center justify-between">
        <label class="text-xs text-gray-400">Amplitude</label>
        <EditableValue
          :display-value="`${amplitudePercent}%`"
          :model-value="amplitudePercent"
          :min="0"
          :max="100"
          :step="1"
          test-id="amplitude-display"
          @update:model-value="emit('update-param', track.id, 'amplitude', $event / 100)"
        />
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
    <div class="mb-2">
      <div class="mb-1 flex items-center justify-between">
        <label class="text-xs text-gray-400">Phase</label>
        <EditableValue
          :display-value="`${phaseDegrees}°`"
          :model-value="phaseDegrees"
          :min="0"
          :max="360"
          :step="1"
          test-id="phase-display"
          @update:model-value="emit('update-param', track.id, 'phase', ($event * Math.PI) / 180)"
        />
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
    <div class="mb-2">
      <label class="mb-1 block text-xs text-gray-400">Waveform</label>
      <div class="flex gap-1" data-testid="waveform-selector">
        <button
          v-for="wt in WAVEFORM_TYPES"
          :key="wt"
          class="rounded px-2 py-1 text-xs transition-colors"
          :class="wt === track.waveformType
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
          :data-testid="`waveform-btn-${wt}`"
          @click="emit('update-param', track.id, 'waveformType', wt)"
        >
          {{ waveformLabel(wt) }}
        </button>
      </div>
    </div>

    <!-- Envelope (ADSR) section -->
    <div class="mb-2" data-testid="envelope-section">
      <div class="mb-1 flex items-center justify-between">
        <label class="text-xs text-gray-400">Envelope (ADSR)</label>
        <button
          class="rounded px-2 py-0.5 text-xs transition-colors"
          :class="track.envelope.enabled
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
          data-testid="envelope-toggle-btn"
          @click="onEnvelopeToggle"
        >
          {{ track.envelope.enabled ? 'On' : 'Off' }}
        </button>
      </div>
      <div v-if="track.envelope.enabled" class="grid grid-cols-2 gap-x-3 gap-y-1">
        <!-- Attack -->
        <div>
          <div class="flex items-center justify-between">
            <label class="text-xs text-gray-500">Attack</label>
            <span class="text-xs text-gray-300" data-testid="envelope-attack-display">
              {{ track.envelope.attack.toFixed(2) }}s
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            :value="Math.round(track.envelope.attack * 100)"
            class="w-full accent-blue-500"
            data-testid="envelope-attack-slider"
            @input="onEnvelopeParamInput($event, 'attack', 100)"
          />
        </div>
        <!-- Decay -->
        <div>
          <div class="flex items-center justify-between">
            <label class="text-xs text-gray-500">Decay</label>
            <span class="text-xs text-gray-300" data-testid="envelope-decay-display">
              {{ track.envelope.decay.toFixed(2) }}s
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            :value="Math.round(track.envelope.decay * 100)"
            class="w-full accent-blue-500"
            data-testid="envelope-decay-slider"
            @input="onEnvelopeParamInput($event, 'decay', 100)"
          />
        </div>
        <!-- Sustain -->
        <div>
          <div class="flex items-center justify-between">
            <label class="text-xs text-gray-500">Sustain</label>
            <span class="text-xs text-gray-300" data-testid="envelope-sustain-display">
              {{ Math.round(track.envelope.sustain * 100) }}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            :value="Math.round(track.envelope.sustain * 100)"
            class="w-full accent-blue-500"
            data-testid="envelope-sustain-slider"
            @input="onEnvelopeParamInput($event, 'sustain', 100)"
          />
        </div>
        <!-- Release -->
        <div>
          <div class="flex items-center justify-between">
            <label class="text-xs text-gray-500">Release</label>
            <span class="text-xs text-gray-300" data-testid="envelope-release-display">
              {{ track.envelope.release.toFixed(2) }}s
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="200"
            :value="Math.round(track.envelope.release * 100)"
            class="w-full accent-blue-500"
            data-testid="envelope-release-slider"
            @input="onEnvelopeParamInput($event, 'release', 100)"
          />
        </div>
      </div>
    </div>

    <!-- Playback controls row -->
    <div class="flex items-center gap-2">
      <button
        class="rounded px-3 py-1 text-xs font-medium transition-colors"
        :class="isTrackPlaying
          ? 'bg-red-600 hover:bg-red-500 text-white'
          : 'bg-green-600 hover:bg-green-500 text-white'"
        data-testid="play-stop-btn"
        @click="isTrackPlaying ? emit('stop', track.id) : emit('play', track.id)"
      >
        {{ isTrackPlaying ? 'Stop' : 'Play' }}
      </button>

      <button
        class="rounded px-2 py-1 text-xs transition-colors"
        :class="track.isMuted
          ? 'bg-yellow-600 text-white'
          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
        data-testid="mute-btn"
        @click="emit('update-param', track.id, 'isMuted', !track.isMuted)"
      >
        {{ track.isMuted ? 'Muted' : 'Mute' }}
      </button>

      <button
        class="rounded px-2 py-1 text-xs transition-colors"
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
</template>

<script setup lang="ts">
/**
 * TrackControlPanel component.
 *
 * Displays and controls all parameters for a single audio track.
 * Uses logarithmic scaling for the frequency slider so that
 * musical intervals feel evenly spaced.
 */

import { computed } from 'vue'
import type { TrackConfig, TrackId, WaveformType, EnvelopeConfig } from '../types/audio'
import { WAVEFORM_TYPES } from '../types/audio'
import { frequencyToNoteName, MIN_FREQUENCY, MAX_FREQUENCY } from '../utils/audio-math'
import {
  frequencyToSliderPosition,
  sliderPositionToFrequency,
  formatFrequency,
} from '../utils/frequency-scale'
import EditableValue from './EditableValue.vue'

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

/** Frequency slider position (0–1000 for fine granularity). */
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

/** Amplitude slider value (0–100). */
const amplitudeSliderValue = computed(() => Math.round(props.track.amplitude * 100))

/** Amplitude as a percentage string. */
const amplitudePercent = computed(() => Math.round(props.track.amplitude * 100))

/** Phase in degrees for display. */
const phaseDegrees = computed(() => Math.round((props.track.phase * 180) / Math.PI))

/** Phase slider value (0–360). */
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

// ── Envelope handlers ─────────────────────────────────────────────

/**
 * Toggles the envelope enabled state and emits the updated config.
 */
function onEnvelopeToggle(): void {
  const updated: EnvelopeConfig = {
    ...props.track.envelope,
    enabled: !props.track.envelope.enabled,
  }
  emit('update-param', props.track.id, 'envelope', updated)
}

/**
 * Handles an envelope parameter slider input.
 *
 * @param event - The input event from the range slider.
 * @param param - Which envelope parameter to update.
 * @param divisor - Divisor to convert integer slider value to float.
 */
function onEnvelopeParamInput(
  event: Event,
  param: keyof Omit<EnvelopeConfig, 'enabled'>,
  divisor: number,
): void {
  const target = event.target as HTMLInputElement
  const value = parseInt(target.value, 10) / divisor
  const updated: EnvelopeConfig = {
    ...props.track.envelope,
    [param]: value,
  }
  emit('update-param', props.track.id, 'envelope', updated)
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
