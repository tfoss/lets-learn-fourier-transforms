<!--
  TrackControlList — Container managing all track control panels.

  Renders a TrackControlPanel for each track, an "Add Track" button,
  and handles wiring events to the audio engine.
-->
<template>
  <div class="track-control-list flex flex-col gap-3" data-testid="track-control-list">
    <!-- Add Track button -->
    <div class="flex items-center justify-between">
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
      data-testid="track-control-list-empty"
    >
      Click 'Add Track' to get started
    </div>

    <!-- Track control panels -->
    <TrackControlPanel
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
  </div>
</template>

<script setup lang="ts">
/**
 * TrackControlList component.
 *
 * Manages the full list of track controls. Wires all user
 * interactions to the audio engine singleton.
 */

import { computed } from 'vue'
import type { TrackConfig, TrackId } from '../types/audio'
import { useAudioEngine } from '../composables/useAudioEngine'
import TrackControlPanel from './TrackControlPanel.vue'

// ── Constants ─────────────────────────────────────────────────────

/** Maximum number of tracks allowed. */
const MAX_TRACKS = 8

// ── Audio engine ──────────────────────────────────────────────────

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

// ── Computed ──────────────────────────────────────────────────────

/** Current number of tracks. */
const trackCount = computed(() => tracks.value.length)

/** Whether the maximum track count has been reached. */
const isMaxTracksReached = computed(() => tracks.value.length >= MAX_TRACKS)

// ── Event handlers ────────────────────────────────────────────────

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
 * Removes a track after confirmation.
 *
 * @param id - The track to remove.
 */
function onRemove(id: TrackId): void {
  removeTrack(id)
}
</script>
