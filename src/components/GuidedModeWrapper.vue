<script setup lang="ts">
/**
 * GuidedModeWrapper — Conditionally renders guided or sandbox content.
 *
 * When mode is 'guided', shows the GuidedStepView with step-specific
 * controls. When mode is 'sandbox', shows the full sandbox UI with
 * each track's waveform and controls aligned in a unified row.
 */

import { computed } from 'vue'
import type { AppMode } from '../types/ui'
import type { TrackConfig, TrackId } from '../types/audio'
import { useAudioEngine } from '../composables/useAudioEngine'
import GuidedStepView from './GuidedStepView.vue'
import MasterControls from './MasterControls.vue'
import TrackRow from './TrackRow.vue'
import SuperpositionWaveform from './SuperpositionWaveform.vue'

/** Maximum number of tracks allowed. */
const MAX_TRACKS = 8

defineProps<{
  /** Current application mode. */
  mode: AppMode
}>()

const {
  tracks,
  resumeContext,
  createTrack,
  removeTrack,
  updateTrackParam,
  playTrack,
  stopTrack,
  isTrackPlaying,
} = useAudioEngine()

/** Current number of tracks. */
const trackCount = computed(() => tracks.value.length)

/** Whether the maximum track count has been reached. */
const isMaxTracksReached = computed(() => tracks.value.length >= MAX_TRACKS)

/**
 * Adds a new track with default settings.
 * Resumes the audio context first (browser autoplay policy).
 */
async function onAddTrack(): Promise<void> {
  if (isMaxTracksReached.value) return
  await resumeContext()
  createTrack()
}

/**
 * Updates a track parameter via the audio engine.
 *
 * @param id - The track to update.
 * @param param - The parameter name.
 * @param value - The new value.
 */
function onUpdateParam(
  id: TrackId,
  param: keyof TrackConfig,
  value: TrackConfig[keyof TrackConfig],
): void {
  updateTrackParam(id, param, value)
}

/**
 * Starts playback on a single track.
 *
 * @param id - The track to play.
 */
async function onPlay(id: TrackId): Promise<void> {
  await resumeContext()
  playTrack(id)
}

/**
 * Stops playback on a single track.
 *
 * @param id - The track to stop.
 */
function onStop(id: TrackId): void {
  stopTrack(id)
}

/**
 * Removes a track.
 *
 * @param id - The track to remove.
 */
function onRemove(id: TrackId): void {
  removeTrack(id)
}
</script>

<template>
  <div data-testid="guided-mode-wrapper">
    <!-- Guided mode: step-by-step tutorial -->
    <GuidedStepView v-if="mode === 'guided'" />

    <!-- Sandbox mode: unified track rows -->
    <div v-else class="flex flex-col gap-4 p-4" data-testid="sandbox-content">
      <MasterControls />

      <!-- Add Track bar -->
      <div class="flex items-center justify-between" data-testid="track-control-list">
        <button
          class="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="isMaxTracksReached"
          data-testid="add-track-btn"
          @click="onAddTrack"
        >
          Add Track
        </button>
        <span class="text-xs text-gray-400" data-testid="track-count">
          {{ trackCount }}/{{ MAX_TRACKS }}
        </span>
      </div>

      <!-- Empty state -->
      <div
        v-if="tracks.length === 0"
        class="flex items-center justify-center h-32 text-gray-500 text-sm rounded-lg border border-dashed border-gray-700"
      >
        Click 'Add Track' to get started
      </div>

      <!-- Unified track rows: waveform + controls aligned -->
      <TrackRow
        v-for="(track, index) in tracks"
        :key="track.id"
        :track="track"
        :track-index="index"
        :is-track-playing="isTrackPlaying(track.id)"
        @update-param="onUpdateParam"
        @play="onPlay"
        @stop="onStop"
        @remove="onRemove"
      />

      <!-- Superposition waveform at bottom -->
      <SuperpositionWaveform v-if="tracks.length > 0" />
    </div>
  </div>
</template>
