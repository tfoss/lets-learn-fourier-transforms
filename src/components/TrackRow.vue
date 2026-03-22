<!--
  TrackRow — A single track displayed as waveform + controls side by side.

  Pairs the TrackWaveform visualization with the TrackControlPanel so
  each track's visual output and its parameter controls are aligned
  in a single cohesive row. Uses TrackControlPanel directly to avoid
  duplicating control logic.
-->
<template>
  <div
    class="track-row rounded-lg bg-gray-800 overflow-hidden"
    :style="{ borderLeft: `3px solid ${track.color}` }"
    data-testid="track-row"
  >
    <!-- Waveform + Controls side by side -->
    <div class="grid grid-cols-[1fr_auto] gap-3 p-3">
      <!-- Waveform visualization -->
      <div class="min-w-0" data-testid="track-row-waveform">
        <TrackWaveform
          :track="track"
          :track-index="trackIndex"
        />
      </div>

      <!-- Parameter controls via shared TrackControlPanel -->
      <div class="w-64 shrink-0" data-testid="track-row-controls">
        <TrackControlPanel
          :track="track"
          :track-index="trackIndex"
          :is-track-playing="isTrackPlaying"
          @update-param="(id, param, value) => emit('update-param', id, param, value)"
          @play="(id) => emit('play', id)"
          @stop="(id) => emit('stop', id)"
          @remove="(id) => emit('remove', id)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * TrackRow component.
 *
 * Combines a waveform visualization and parameter controls into a
 * single row. Delegates all control rendering to TrackControlPanel
 * to ensure a single source of truth for track UI.
 */

import type { TrackConfig, TrackId } from '../types/audio'
import TrackWaveform from './TrackWaveform.vue'
import TrackControlPanel from './TrackControlPanel.vue'

defineProps<{
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
</script>
