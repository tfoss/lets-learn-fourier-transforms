<script setup lang="ts">
/**
 * GuidedModeWrapper — Renders the shared track UI for both modes.
 *
 * In guided mode, adds the GuidedStepView overlay (progress, explanation,
 * navigation) above the same track components used in sandbox mode.
 * This ensures both modes share identical UI components — no duplication.
 */

import { computed } from 'vue'
import { PopoverRoot, PopoverTrigger, PopoverContent, PopoverPortal } from 'radix-vue'
import type { AppMode } from '../types/ui'
import type { TrackConfig, TrackId } from '../types/audio'
import { useAudioEngine } from '../composables/useAudioEngine'
import { useGuidedMode } from '../composables/useGuidedMode'
import GuidedStepView from './GuidedStepView.vue'
import MasterControls from './MasterControls.vue'
import TimeScaleControl from './TimeScaleControl.vue'
import TrackRow from './TrackRow.vue'
import SuperpositionWaveform from './SuperpositionWaveform.vue'
import SaveLoadPanel from './SaveLoadPanel.vue'

/** Maximum number of tracks allowed. */
const MAX_TRACKS = 8

const props = defineProps<{
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

const { isComplete } = useGuidedMode()

/** Current number of tracks. */
const trackCount = computed(() => tracks.value.length)

/** Whether the maximum track count has been reached. */
const isMaxTracksReached = computed(() => tracks.value.length >= MAX_TRACKS)

/** Whether to show the add track bar. Always in sandbox, never in guided. */
const showAddTrack = computed(() => props.mode === 'sandbox')

/**
 * Adds a new track with default settings.
 */
async function onAddTrack(): Promise<void> {
  if (isMaxTracksReached.value) return
  await resumeContext()
  createTrack()
}

/**
 * Updates a track parameter via the audio engine.
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
 */
async function onPlay(id: TrackId): Promise<void> {
  await resumeContext()
  playTrack(id)
}

/**
 * Stops playback on a single track.
 */
function onStop(id: TrackId): void {
  stopTrack(id)
}

/**
 * Removes a track.
 */
function onRemove(id: TrackId): void {
  removeTrack(id)
}
</script>

<template>
  <div class="flex flex-col gap-4 p-4" data-testid="guided-mode-wrapper">
    <!-- Guided mode overlay: progress, explanation, navigation -->
    <GuidedStepView v-if="mode === 'guided'" />

    <!-- Shared track UI (used by both modes) -->
    <template v-if="mode === 'sandbox' || (mode === 'guided' && !isComplete)">
      <div class="flex items-center gap-4">
        <MasterControls class="flex-1" />
        <TimeScaleControl />
        <PopoverRoot>
          <PopoverTrigger
            class="rounded bg-gray-700 px-3 py-1.5 text-sm font-medium text-gray-300 hover:bg-gray-600 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
            data-testid="save-load-btn"
          >
            Save/Load
          </PopoverTrigger>
          <PopoverPortal>
            <PopoverContent
              class="w-80 max-h-96 overflow-y-auto rounded-lg border border-gray-700 bg-gray-800 p-4 shadow-xl"
              :side-offset="8"
              side="bottom"
              align="end"
              data-testid="save-load-popover"
            >
              <SaveLoadPanel />
            </PopoverContent>
          </PopoverPortal>
        </PopoverRoot>
      </div>

      <!-- Add Track bar (sandbox only) -->
      <div
        v-if="showAddTrack"
        class="flex items-center justify-between"
        data-testid="track-control-list"
      >
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
        v-if="tracks.length === 0 && mode === 'sandbox'"
        class="flex items-center justify-center h-32 text-gray-500 text-sm rounded-lg border border-dashed border-gray-700"
      >
        Click 'Add Track' to get started
      </div>

      <!-- Track rows -->
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

      <!-- Superposition waveform -->
      <SuperpositionWaveform v-if="tracks.length > 0" />
    </template>
  </div>
</template>
