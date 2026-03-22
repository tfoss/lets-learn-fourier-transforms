<!--
  TrackList — Container component that stacks all track waveforms vertically.

  Renders a TrackWaveform for each track and a SuperpositionWaveform at the
  bottom. Handles the empty state when no tracks have been created.
-->
<template>
  <div class="track-list flex flex-col gap-3" data-testid="track-list">
    <div
      v-if="tracks.length === 0"
      class="flex items-center justify-center h-32 text-gray-500 text-sm rounded-lg border border-dashed border-gray-700"
      data-testid="track-list-empty"
    >
      No tracks yet. Add a track to see its waveform.
    </div>

    <template v-else>
      <TrackWaveform
        v-for="(track, index) in tracks"
        :key="track.id"
        :track="track"
        :track-index="index"
      />

      <SuperpositionWaveform />
    </template>
  </div>
</template>

<script setup lang="ts">
/**
 * TrackList component.
 *
 * Gets tracks from the audio engine singleton and renders them
 * as a vertical list with a superposition view at the bottom.
 */

import { useAudioEngine } from '../composables/useAudioEngine'
import TrackWaveform from './TrackWaveform.vue'
import SuperpositionWaveform from './SuperpositionWaveform.vue'

const { tracks } = useAudioEngine()
</script>
