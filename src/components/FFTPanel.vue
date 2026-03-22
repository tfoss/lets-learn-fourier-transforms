<script setup lang="ts">
/**
 * FFT Panel — right-sidebar wrapper for the FFT visualization.
 *
 * Contains an FFTChart with controls for scale mode, peak labels,
 * and note labels. Shows info about the currently hovered peak.
 */

import { ref, computed } from 'vue'
import type { TrackId } from '../types/audio'
import type { Peak } from '../types/fft'
import { useAudioEngine } from '../composables/useAudioEngine'
import FFTChart from './FFTChart.vue'

// ── Emits ─────────────────────────────────────────────────────────

const emit = defineEmits<{
  'highlight-track': [trackId: TrackId | null]
}>()

// ── Audio engine (for track matching) ─────────────────────────────

const { tracks } = useAudioEngine()

// ── Controls state ────────────────────────────────────────────────

const useLogScale = ref(true)
const showPeaks = ref(true)
const showNoteLabels = ref(true)

// ── Hovered peak info ─────────────────────────────────────────────

const hoveredPeak = ref<Peak | null>(null)

/** Frequency tolerance for matching a peak to a track (in Hz). */
const FREQUENCY_MATCH_TOLERANCE = 5

/**
 * Finds the track ID that matches a given frequency, if any.
 *
 * @param frequency - The frequency to match against tracks.
 * @returns The matching TrackId or null.
 */
function findMatchingTrackId(frequency: number): TrackId | null {
  for (const track of tracks.value) {
    if (Math.abs(track.frequency - frequency) <= FREQUENCY_MATCH_TOLERANCE) {
      return track.id
    }
  }
  return null
}

/**
 * Handles the peak-hover event from FFTChart.
 *
 * @param peak - The hovered peak, or null when hover ends.
 */
function onPeakHover(peak: Peak | null): void {
  hoveredPeak.value = peak

  if (peak) {
    const trackId = findMatchingTrackId(peak.frequency)
    emit('highlight-track', trackId)
  } else {
    emit('highlight-track', null)
  }
}

/**
 * Toggles the frequency scale between logarithmic and linear.
 */
function toggleScale(): void {
  useLogScale.value = !useLogScale.value
}

/**
 * Toggles peak label visibility.
 */
function togglePeaks(): void {
  showPeaks.value = !showPeaks.value
}

/**
 * Toggles note label visibility.
 */
function toggleNoteLabels(): void {
  showNoteLabels.value = !showNoteLabels.value
}

/** Display label for the current scale mode. */
const scaleLabel = computed(() => (useLogScale.value ? 'Log' : 'Linear'))
</script>

<template>
  <div class="fft-panel flex flex-col h-full bg-gray-900 text-gray-200">
    <!-- Title -->
    <div class="px-4 py-3 border-b border-gray-700">
      <h2 class="text-sm font-semibold text-gray-100">
        Frequency Domain (FFT)
      </h2>
    </div>

    <!-- Controls -->
    <div class="flex items-center gap-2 px-4 py-2 border-b border-gray-700">
      <button
        class="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 transition-colors"
        :class="{ 'bg-blue-600 hover:bg-blue-500': useLogScale }"
        @click="toggleScale"
      >
        {{ scaleLabel }}
      </button>
      <button
        class="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 transition-colors"
        :class="{ 'bg-blue-600 hover:bg-blue-500': showPeaks }"
        @click="togglePeaks"
      >
        Peaks
      </button>
      <button
        class="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600 transition-colors"
        :class="{ 'bg-blue-600 hover:bg-blue-500': showNoteLabels }"
        @click="toggleNoteLabels"
      >
        Notes
      </button>
    </div>

    <!-- Chart -->
    <div class="flex-1 px-2 py-2">
      <FFTChart
        :height="300"
        :use-log-scale="useLogScale"
        :show-peaks="showPeaks"
        :show-note-labels="showNoteLabels"
        @peak-hover="onPeakHover"
      />
    </div>

    <!-- Hovered peak info -->
    <div class="px-4 py-2 border-t border-gray-700 min-h-[48px]">
      <template v-if="hoveredPeak">
        <p class="text-xs text-gray-300">
          <span class="font-semibold text-gray-100">
            {{ hoveredPeak.noteName }}
          </span>
          &mdash;
          {{ hoveredPeak.frequency.toFixed(1) }} Hz
          ({{ hoveredPeak.magnitude.toFixed(1) }} dB)
        </p>
      </template>
      <template v-else>
        <p class="text-xs text-gray-500">Hover a peak for details</p>
      </template>
    </div>
  </div>
</template>
